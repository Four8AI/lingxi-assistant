import logging
import time
from typing import Dict, List, Optional, Any, Union, Generator
from lingxi.core.engine.base import BaseEngine
from lingxi.core.engine.utils import parse_plan
from lingxi.core.prompts import PromptTemplates
from lingxi.core.event import global_event_publisher


class PlanReActCore(BaseEngine):
    """PlanReAct 引擎核心逻辑"""

    def __init__(self, config: Dict[str, Any], skill_caller=None, session_manager=None, websocket_manager=None):
        """初始化 PlanReAct 核心

        Args:
            config: 系统配置
            skill_caller: 技能调用器
            session_manager: 会话管理器
            websocket_manager: WebSocket管理器（已弃用）
        """
        super().__init__(config, skill_caller, session_manager, websocket_manager)

        complex_config = config.get("execution_mode", {}).get("complex", {})
        self.max_plan_steps = int(complex_config.get("max_plan_steps", 8))
        self.max_replan_count = int(complex_config.get("max_replan_count", 2))
        self.max_step_retries = int(complex_config.get("max_step_retries", 3))
        self.max_loop_per_step = int(complex_config.get("max_loop_per_step", 5))

        self.logger.debug("初始化Plan+ReAct执行引擎核心")

    def _create_initial_checkpoint(self, task: str, plan: List[str]) -> Dict[str, Any]:
        """创建初始检查点

        Args:
            task: 任务文本
            plan: 计划步骤列表

        Returns:
            初始检查点
        """
        return {
            "task": task,
            "plan": plan,
            "current_step_idx": 0,
            "completed_steps": [],
            "step_results": [],
            "replan_count": 0,
            "execution_status": "running",
            "error_info": None,
            "timestamp": time.time()
        }

    def _save_plan_checkpoint(self, session_id: str, checkpoint: Dict[str, Any]):
        """保存计划检查点

        Args:
            session_id: 会话ID
            checkpoint: 检查点
        """
        if self.session_manager:
            self.session_manager.save_checkpoint(session_id, checkpoint)

    def _add_plan_turn(self, session_id: str, plan: List[str], task_level: str):
        """添加计划到会话历史

        Args:
            session_id: 会话ID
            plan: 计划步骤列表
            task_level: 任务级别
        """
        if self.session_manager:
            self.session_manager.add_turn(
                session_id=session_id,
                role="assistant",
                content=f"生成任务计划，共{len(plan)}个步骤",
                thought="根据任务需求和历史上下文，生成了详细的执行计划",
                steps=[{"step_idx": i+1, "description": step} for i, step in enumerate(plan)],
                metadata={"task_level": task_level, "plan_count": len(plan)}
            )

    def _publish_plan_events(self, session_id: str, execution_id: str, plan: List[str]):
        """发布计划相关事件

        Args:
            session_id: 会话ID
            execution_id: 执行ID
            plan: 计划步骤列表
        """
        import threading
        from lingxi.core.event import global_event_publisher
        
        # 获取 task_id
        local_context = threading.local()
        task_id = getattr(local_context, 'task_id', None)
        
        # 发布 thought_chain 事件
        global_event_publisher.publish(
            'thought_chain',
            session_id=session_id,
            execution_id=execution_id,
            task_id=task_id,
            thoughts=[{"step": i+1, "description": step} for i, step in enumerate(plan)]
        )
        
        # 发布 plan_final 事件
        global_event_publisher.publish(
            'plan_final',
            session_id=session_id,
            execution_id=execution_id,
            task_id=task_id,
            plan=[{"step": i+1, "description": step} for i, step in enumerate(plan)]
        )

    def _generate_plan_stream(self, task: str, task_info: Dict[str, Any], history_context: str,
                           task_level: str, session_id: str, execution_id: str) -> Generator[Dict[str, Any], None, None]:
        """生成计划（流式）

        Args:
            task: 任务文本
            task_info: 任务信息
            history_context: 历史上下文
            task_level: 任务级别
            session_id: 会话ID
            execution_id: 执行ID

        Returns:
            流式响应生成器
        """
        stream_plan = self._generate_plan_with_stream(task, task_info, history_context, task_level, session_id, execution_id)
        for chunk in stream_plan:
            yield chunk

    def _generate_plan(self, task: str, task_info: Dict[str, Any], history_context: str, task_level: str) -> List[str]:
        """生成计划

        Args:
            task: 任务文本
            task_info: 任务信息
            history_context: 历史上下文
            task_level: 任务级别

        Returns:
            计划步骤列表
        """
        prompt = f"""
请为以下任务生成执行步骤清单（JSON数组格式）：
任务：{task}

历史上下文：
{history_context}


请严格按照西门JSON格式输出：
[
  {{"step": 1, "description": "步骤1描述"}},
  {{"step": 2, "description": "步骤2描述"}}
]

步骤数量不超过{self.max_plan_steps}步。
"""
        response = self.llm_client.complete(prompt, task_level=task_level)
        plan_steps = parse_plan(response)
        self.logger.debug(f"生成Plan，共{len(plan_steps)}个步骤, 步骤详情: {plan_steps}")
        return plan_steps

    def _generate_plan_with_stream(self, task: str, task_info: Dict[str, Any], history_context: str, 
                                 task_level: str, session_id: str, execution_id: str) -> Generator[Dict[str, Any], None, None]:
        """流式生成计划

        Args:
            task: 任务文本
            task_info: 任务信息
            history_context: 历史上下文
            task_level: 任务级别
            session_id: 会话ID
            execution_id: 执行ID

        Returns:
            流式响应生成器
        """
        prompt = f"""
请为以下任务生成执行步骤清单（JSON数组格式）：
任务：{task}

历史上下文：
{history_context}

请严格按照JSON格式输出：
[
  {{"step": 1, "description": "步骤1描述", "expected_tool": "工具ID或null"}},
  {{"step": 2, "description": "步骤2描述", "expected_tool": "工具ID或null"}}
]

步骤数量不超过{self.max_plan_steps}步。
"""
        stream_response = self.llm_client.stream_complete(prompt, task_level=task_level)
        full_response = ""
        for chunk in stream_response:
            if hasattr(chunk, 'choices') and chunk.choices:
                delta = chunk.choices[0].delta
                if hasattr(delta, 'content') and delta.content:
                    full_response += delta.content
                    yield {
                        "type": "stream",
                        "content": delta.content,
                        "is_partial": True
                    }
        
        plan_steps = parse_plan(full_response)
        yield {
            "type": "plan",
            "plan": plan_steps
        }

    def _generate_plan_sync(self, task: str, task_info: Dict[str, Any], history_context: str,
                          task_level: str) -> List[str]:
        """生成计划（同步）

        Args:
            task: 任务文本
            task_info: 任务信息
            history_context: 历史上下文
            task_level: 任务级别

        Returns:
            计划步骤列表
        """
        plan = self._generate_plan(task, task_info, history_context, task_level)
        self.logger.debug(f"生成Plan，共{len(plan)}个步骤, 步骤详情: {plan}")
        return plan

    def _execute_step_with_stream(self, step: str, step_idx: int, session_id: str, history: List[Dict[str, str]],
                                task: str, task_info: Dict[str, Any], all_results: List[Dict[str, Any]],
                                task_level: str, execution_id: str) -> Generator[Dict[str, Any], None, None]:
        """执行单个步骤（流式）

        Args:
            step: 步骤描述
            step_idx: 步骤索引
            session_id: 会话ID
            history: 会话历史
            task: 任务文本
            task_info: 任务信息
            all_results: 所有结果
            task_level: 任务级别
            execution_id: 执行ID

        Returns:
            流式响应生成器
        """
        history_context = self._build_history_context(history)
        
        # 获取可用技能列表
        available_skills = self.skill_caller.list_available_skills(enabled_only=True) if self.skill_caller else []
        skills_list = PromptTemplates.format_skills_list(available_skills)
        
        # 获取系统信息
        system_info = PromptTemplates.get_system_info()
        
        # 构建消息列表（支持缓存）
        messages = PromptTemplates.build_plan_react_messages_with_cache(
            task=task,
            task_info=task_info,
            history_context=history_context,
            current_step=f"{step_idx + 1}. {step}",
            skills_list=skills_list,
            previous_results=all_results,
            system_info=system_info
        )
        
        self.logger.debug(f"执行步骤 {step_idx + 1}: {step} (stream=True)")

        full_response = ""
        for response_chunk in self._process_llm_response(messages, task_level, stream=True):
            if response_chunk.get("type") == "thought_chunk":
                content = response_chunk.get("content", "")
                full_response += content
                yield {
                    "type": "stream",
                    "step": step_idx,
                    "content": content,
                    "is_partial": True
                }
            elif response_chunk.get("type") == "complete":
                full_response = response_chunk.get("response", "")
                break

        parsed = self._parse_response(full_response)

        if not parsed:
            self.logger.warning("无法解析响应，结束循环")
            global_event_publisher.publish(
                'task_failed',
                session_id=session_id,
                execution_id=execution_id,
                error="无法解析LLM响应"
            )
            yield {
                "type": "error",
                "message": "无法解析LLM响应"
            }
            return

        if parsed.get("action") == "finish":
            # 不要在这里发布 task_end 事件，因为 _execute_steps 会处理
            # 只需要生成 step_complete 事件，让 _execute_steps 处理任务完成
            yield {
                "type": "step_complete",
                "step": step_idx,
                "thought": parsed.get('thought'),
                "action": parsed.get('action'),
                "action_input": parsed.get('action_input'),
                "observation": parsed.get('observation', ''),
                "success": True
            }
            # 不需要调用 _handle_finish_action，因为 _execute_steps 会调用 _handle_task_completion
            return

        for chunk in self._handle_step_complete(parsed, step_idx):
            observation = chunk.get("observation", "")
            self._publish_step_end(session_id, execution_id, step_idx, "completed", None, observation)
            yield chunk

    def _execute_plan_stream(self, task: str, task_info: Dict[str, Any], history_context: str,
                           task_level: str, session_id: str, execution_id: str) -> Generator[Dict[str, Any], None, None]:
        """执行计划（流式）

        Args:
            task: 任务文本
            task_info: 任务信息
            history_context: 历史上下文
            task_level: 任务级别
            session_id: 会话ID
            execution_id: 执行ID

        Returns:
            流式响应生成器
        """
        plan_chunk = None
        for chunk in self._generate_plan_stream(task, task_info, history_context, task_level, session_id, execution_id):
            if chunk.get("type") == "plan":
                plan_chunk = chunk
            yield chunk

        if plan_chunk and "plan" in plan_chunk:
            plan = plan_chunk.get("plan", [])
            if not plan:
                yield {"type": "error", "message": "Plan生成失败，无法继续执行任务"}
                return
        else:
            yield {"type": "error", "message": "Plan生成失败，无法继续执行任务"}
            return

        self._publish_plan_events(session_id, execution_id, plan)
        self._add_plan_turn(session_id, plan, task_level)

        initial_checkpoint = self._create_initial_checkpoint(task, plan)
        self._save_plan_checkpoint(session_id, initial_checkpoint)

        steps_executor = self._execute_steps(plan, session_id, None, initial_checkpoint, task, task_info,
                                           task_level=task_level, stream=True, execution_id=execution_id)
        for step_chunk in steps_executor:
            yield step_chunk

    def _execute_plan_sync(self, task: str, task_info: Dict[str, Any], history_context: str,
                         task_level: str, session_id: str, execution_id: str) -> Generator[Dict[str, Any], None, None]:
        """执行计划（同步）

        Args:
            task: 任务文本
            task_info: 任务信息
            history_context: 历史上下文
            task_level: 任务级别
            session_id: 会话ID
            execution_id: 执行ID

        Returns:
            流式响应生成器
        """
        plan = self._generate_plan_sync(task, task_info, history_context, task_level)
        if not plan:
            yield {"type": "error", "message": "Plan生成失败，无法继续执行任务"}
            return

        self._publish_plan_events(session_id, execution_id, plan)
        self._add_plan_turn(session_id, plan, task_level)

        initial_checkpoint = self._create_initial_checkpoint(task, plan)
        self._save_plan_checkpoint(session_id, initial_checkpoint)

        result = self._execute_steps(plan, session_id, None, initial_checkpoint, task, task_info,
                                   task_level=task_level, stream=False, execution_id=execution_id)
        
        # 检查返回值类型
        if isinstance(result, str):
            # 如果是字符串，说明任务已完成或出错
            yield {
                "type": "finish",
                "result": result
            }
        else:
            # 如果是生成器，逐个yield
            for step_chunk in result:
                yield step_chunk

    def _execute_task_stream(self, task: str, task_info: Dict[str, Any], history: List[Dict[str, str]],
                           session_id: str, execution_id: str, stream: bool) -> Generator[Dict[str, Any], None, None]:
        """执行任务（流式）

        Args:
            task: 任务文本
            task_info: 任务信息
            history: 会话历史
            session_id: 会话ID
            execution_id: 执行ID
            stream: 是否启用流式输出

        Returns:
            流式响应生成器
        """
        task_level = task_info.get("level", "complex")
        history_context = self._build_history_context(history)

        # 直接调用 _execute_plan_stream，它已经包含了完整的执行逻辑
        # 不需要重复执行计划相关的步骤
        for chunk in self._execute_plan_stream(task, task_info, history_context, task_level, session_id, execution_id):
            yield chunk

    def _execute_task_sync(self, task: str, task_info: Dict[str, Any], history: List[Dict[str, str]],
                          session_id: str, execution_id: str) -> Generator[Dict[str, Any], None, None]:
        """执行任务（同步）

        Args:
            task: 任务文本
            task_info: 任务信息
            history: 会话历史
            session_id: 会话ID
            execution_id: 执行ID

        Returns:
            流式响应生成器
        """
        task_level = task_info.get("level", "complex")
        history_context = self._build_history_context(history)

        plan = self._generate_plan_sync(task, task_info, history_context, task_level)
        if not plan:
            yield {"type": "error", "message": "Plan生成失败，无法继续执行任务"}
            return

        self._publish_plan_events(session_id, execution_id, plan)
        self._add_plan_turn(session_id, plan, task_level)

        initial_checkpoint = self._create_initial_checkpoint(task, plan)
        self._save_plan_checkpoint(session_id, initial_checkpoint)

        result = self._execute_steps(plan, session_id, None, initial_checkpoint, task, task_info,
                                   task_level=task_level, stream=False, execution_id=execution_id)
        
        # 检查返回值类型
        if isinstance(result, str):
            # 如果是字符串，说明任务已完成或出错
            yield {
                "type": "finish",
                "result": result
            }
        else:
            # 如果是生成器，逐个yield
            for step_chunk in result:
                yield step_chunk

    def _add_resume_turn(self, session_id: str, current_step_idx: int, total_steps: int, completed_steps: int):
        """添加恢复执行记录

        Args:
            session_id: 会话ID
            current_step_idx: 当前步骤索引
            total_steps: 总步骤数
            completed_steps: 已完成步骤数
        """
        if self.session_manager:
            self.session_manager.add_turn(
                session_id=session_id,
                role="assistant",
                content=f"从检查点恢复执行，当前步骤：{current_step_idx + 1}/{total_steps}",
                thought="检测到存在未完成的任务，从上次中断的地方恢复执行",
                metadata={
                    "action": "resume_from_checkpoint",
                    "current_step": current_step_idx,
                    "total_steps": total_steps,
                    "completed_steps": completed_steps
                }
            )

    def _resume_from_checkpoint(self, checkpoint: Dict[str, Any], history: List[Dict[str, str]] = None,
                               session_id: str = "default", stream: bool = False) -> Union[str, Generator[Dict[str, Any], None, None]]:
        """从检查点恢复执行

        Args:
            checkpoint: 检查点状态
            history: 会话历史
            session_id: 会话ID
            stream: 是否启用流式输出

        Returns:
            执行结果（非流式）或流式响应生成器（流式）
        """
        self.logger.debug(f"从检查点恢复执行，当前步骤：{checkpoint['current_step_idx']} (stream={stream})")

        plan = checkpoint["plan"]
        current_step_idx = checkpoint["current_step_idx"]
        completed_steps = checkpoint.get("completed_steps", [])
        step_results = checkpoint.get("step_results", [])
        replan_count = checkpoint.get("replan_count", 0)

        execution_id = f"plan_{int(time.time())}"

        self._add_resume_turn(session_id, current_step_idx, len(plan), len(completed_steps))

        updated_checkpoint = checkpoint.copy()
        updated_checkpoint["execution_status"] = "running"
        self._save_plan_checkpoint(session_id, updated_checkpoint)

        task_info = {"level": "complex", "reason": "从检查点恢复"}

        def stream_generator():
            steps_executor = self._execute_steps(
                plan,
                session_id,
                history,
                updated_checkpoint,
                checkpoint["task"],
                task_info,
                start_idx=int(current_step_idx),
                completed_steps=completed_steps,
                step_results=step_results,
                replan_count=replan_count,
                stream=stream,
                execution_id=execution_id
            )
            for step_chunk in steps_executor:
                yield step_chunk

        if stream:
            return stream_generator()
        else:
            result_parts = []
            for chunk in stream_generator():
                if chunk.get("type") == "stream":
                    result_parts.append(chunk.get("content", ""))
                elif chunk.get("type") == "finish":
                    return chunk.get("result", "")
                elif chunk.get("type") == "error":
                    return chunk.get("message", "错误")
            return "".join(result_parts)

    def _handle_step_success(self, step_result: Dict[str, Any], checkpoint: Dict[str, Any], session_id: str, execution_id: str, step_idx: int) -> Generator[Dict[str, Any], None, None]:
        """处理步骤成功

        Args:
            step_result: 步骤结果
            checkpoint: 检查点
            session_id: 会话ID
            execution_id: 执行ID
            step_idx: 步骤索引

        Returns:
            流式响应生成器
        """
        observation = step_result.get("result", "")
        self._publish_step_end(session_id, execution_id, step_idx, "completed", None, observation)

        if step_result.get("action") == "finish":
            self.logger.debug(f"任务在步骤{step_idx + 1}提前结束")
            checkpoint["execution_status"] = "completed"
            checkpoint["error_info"] = None
            if hasattr(self, "_save_plan_checkpoint"):
                self._save_plan_checkpoint(session_id, checkpoint)

            final_answer = step_result.get("content", "")
            self._publish_task_end(session_id, execution_id, final_answer)
            yield {
                "type": "finish",
                "result": final_answer
            }
            return

    def _handle_step_failure(self, step_result: Dict[str, Any], checkpoint: Dict[str, Any], session_id: str, execution_id: str, step_idx: int, task: str) -> Generator[Dict[str, Any], None, None]:
        """处理步骤失败

        Args:
            step_result: 步骤结果
            checkpoint: 检查点
            session_id: 会话ID
            execution_id: 执行ID
            step_idx: 步骤索引
            task: 任务文本

        Returns:
            流式响应生成器
        """
        import traceback
        error_trace = traceback.format_exc()
        self.logger.error(f"步骤{step_idx + 1}执行失败: {step_result.get('error')}\n堆栈信息:\n{error_trace}")

        checkpoint["execution_status"] = "failed"
        checkpoint["error_info"] = step_result.get("error")
        self._save_plan_checkpoint(session_id, checkpoint)

        if self.session_manager:
            error_response = self._generate_error_response(task, step_idx, step_result.get("error"))
            self.session_manager.add_turn(
                session_id=session_id,
                role="assistant",
                content=error_response,
                metadata={
                    "action": "task_failed",
                    "failed_step": step_idx + 1,
                    "error": step_result.get("error")
                }
            )

        yield {
            "type": "error",
            "message": error_response
        }

    def _execute_steps(self, plan: List[str], session_id: str, history: List[Dict[str, str]],
                      checkpoint: Dict[str, Any], task: str, task_info: Dict[str, Any],
                      start_idx: int = 0, completed_steps: List[str] = None,
                      step_results: List[Dict[str, Any]] = None, replan_count: int = 0,
                      task_level: str = "complex", stream: bool = False, execution_id: str = None) -> Union[str, Generator[Dict[str, Any], None, None]]:
        """执行步骤序列（统一使用流式处理逻辑）

        Args:
            plan: 计划步骤列表
            session_id: 会话ID
            history: 会话历史
            checkpoint: 检查点状态
            task: 任务文本
            task_info: 任务信息
            start_idx: 起始步骤索引
            completed_steps: 已完成步骤
            step_results: 步骤结果
            replan_count: 重规划次数
            task_level: 任务级别
            stream: 是否启用流式输出
            execution_id: 执行ID

        Returns:
            执行结果（非流式）或流式响应生成器（流式）
        """
        if completed_steps is None:
            completed_steps = []
        if step_results is None:
            step_results = []

        all_results = step_results
        start_idx = int(start_idx) if isinstance(start_idx, str) else start_idx

        if execution_id is None:
            execution_id = f"plan_{int(time.time())}"

        def stream_generator():
            try:
                for step_idx in range(start_idx, len(plan)):
                    step = plan[step_idx]

                    if replan_count >= self.max_replan_count:
                        self.logger.warning("达到最大重规划次数，继续执行原Plan")

                    self._publish_step_start(session_id, execution_id, step_idx, len(plan))
                    yield {
                        "type": "step_start",
                        "step": step_idx,
                        "description": step,
                        "execution_id": execution_id
                    }

                    step_executor = self._execute_step_with_stream(
                        step, step_idx, session_id, history, task, task_info, all_results, task_level, execution_id
                    )

                    step_result = {}
                    for chunk in step_executor:
                        yield chunk
                        if chunk.get("type") == "step_complete":
                            step_result = chunk

                    completed_steps.append(step)
                    all_results.append(step_result)

                    checkpoint["current_step_idx"] = step_idx + 1
                    checkpoint["completed_steps"] = completed_steps
                    checkpoint["step_results"] = all_results
                    checkpoint["timestamp"] = time.time()
                    self._save_plan_checkpoint(session_id, checkpoint)

                    status = "completed" if step_result.get("success", False) else "failed"
                    error = step_result.get("error", None)
                    self._publish_step_end(session_id, execution_id, step_idx, status, error, step_result.get("result", ""))

                    if step_result.get("action") == "finish":
                        for chunk in self._handle_task_completion(checkpoint, session_id, execution_id, task, all_results, task_level):
                            yield chunk
                        return

                    if not step_result.get("success", False):
                        for chunk in self._handle_step_failure(step_result, checkpoint, session_id, execution_id, step_idx, task):
                            yield chunk
                        return

                for chunk in self._handle_task_completion(checkpoint, session_id, execution_id, task, all_results, task_level):
                    yield chunk

            except Exception as e:
                import traceback
                error_trace = traceback.format_exc()
                self.logger.error(f"执行步骤时发生异常: {e}\n{error_trace}")
                yield {
                    "type": "error",
                    "message": f"{str(e)}\n堆栈信息:\n{error_trace}"
                }

        if stream:
            return stream_generator()
        else:
            result_parts = []
            for chunk in stream_generator():
                if chunk.get("type") == "stream":
                    result_parts.append(chunk.get("content", ""))
                elif chunk.get("type") == "finish":
                    return chunk.get("result", "")
                elif chunk.get("type") == "error":
                    return chunk.get("message", "错误")
            return "".join(result_parts)