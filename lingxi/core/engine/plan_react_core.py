import logging
import time
import json
import re
from typing import Dict, List, Optional, Any, Union, Generator
from lingxi.core.engine.react_core import ReActCore
from lingxi.core.engine.utils import parse_plan
from lingxi.core.prompts import PromptTemplates
from lingxi.core.event import global_event_publisher
from lingxi.core.context import local_context
from lingxi.core.session import SessionManager
from lingxi.utils.json_parser import extract_partial_json_field


class PlanReActCore(ReActCore):
    """Plan+ReAct 引擎 - 统一入口，智能路由
    
    继承自 ReActCore，复用其执行逻辑：
    - 简单任务：直接调用父类 _execute_task_stream
    - 复杂任务：生成计划后，逐个子任务调用父类方法执行
    """

    def __init__(self, config: Dict[str, Any], skill_caller=None, session_manager: SessionManager = None, websocket_manager=None):
        super().__init__(config, skill_caller, session_manager, websocket_manager)

        complex_config = config.get("execution_mode", {}).get("complex", {})
        self.max_plan_steps = int(complex_config.get("max_plan_steps", 8))
        self.max_replan_count = int(complex_config.get("max_replan_count", 2))
        self.max_step_retries = int(complex_config.get("max_step_retries", 3))
        self.max_loop_per_step = int(complex_config.get("max_loop_per_step", 5))

        self.logger.debug("初始化Plan+ReAct执行引擎核心（继承ReActCore）")

    def _parse_analysis_response(self, response: str) -> Dict[str, Any]:
        """解析任务分析响应

        Args:
            response: LLM响应

        Returns:
            解析后的字典
        """
        try:
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                result = json.loads(json_match.group(0))
                
                level = result.get("level", "simple")
                if level not in ["simple", "complex"]:
                    level = "simple"
                
                return {
                    "level": level,
                    "confidence": float(result.get("confidence", 0.5)),
                    "reason": result.get("reason", ""),
                    "direct_answer": result.get("direct_answer", ""),
                    "next_action": result.get("next_action"),
                    "plan": result.get("plan", [])
                }
        except Exception as e:
            self.logger.error(f"解析任务分析响应失败: {e}")

        return {
            "level": "simple",
            "confidence": 0.5,
            "reason": "解析失败，默认simple",
            "direct_answer": "",
            "next_action": None,
            "plan": []
        }

    def _analyze_task_and_plan(self, task: str, task_info: Dict[str, Any],
                                history_context: str, session_id: str,
                                execution_id: str) -> Optional[Dict[str, Any]]:
        """分析任务并生成计划

        Args:
            task: 任务文本
            task_info: 任务信息
            history_context: 历史上下文
            session_id: 会话ID
            execution_id: 执行ID

        Returns:
            分析结果字典，失败返回None
        """
        available_skills = self.skill_caller.list_available_skills(enabled_only=True) if self.skill_caller else []
        skills_list = PromptTemplates.format_skills_list(available_skills)
        system_info = PromptTemplates.get_system_info()

        messages = PromptTemplates.build_task_analysis_messages_with_cache(
            task=task,
            history_context=history_context,
            skills_list=skills_list,
            system_info=system_info,
            max_plan_steps=self.max_plan_steps
        )

        stream_response = self.llm_client.stream_chat_complete_with_cache(messages, task_level="simple")
        full_response = ""
        last_thought = ""

        for chunk in stream_response:
            if hasattr(chunk, 'choices') and chunk.choices:
                delta = chunk.choices[0].delta
                if hasattr(delta, 'content') and delta.content:
                    full_response += delta.content
                    thought = extract_partial_json_field(full_response, "thought", nested_path="next_action")
                    if thought and thought != last_thought:
                        incremental_thought = thought[len(last_thought):] if last_thought else thought
                        self._publish_think_stream(session_id, execution_id, 0, incremental_thought)
                        last_thought = thought

        return self._parse_analysis_response(full_response)

    def _publish_plan_start(self, session_id: str, execution_id: str):
        """发布计划开始事件

        Args:
            session_id: 会话ID
            execution_id: 执行ID
        """
        task_id = getattr(local_context, 'task_id', None)

        global_event_publisher.publish(
            'plan_start',
            session_id=session_id,
            execution_id=execution_id,
            task_id=task_id
        )

    def _publish_plan_events(self, session_id: str, execution_id: str, plan: List[str]):
        """发布计划相关事件

        Args:
            session_id: 会话ID
            execution_id: 执行ID
            plan: 计划步骤列表
        """
        task_id = getattr(local_context, 'task_id', None)

        global_event_publisher.publish(
            'plan_final',
            session_id=session_id,
            execution_id=execution_id,
            task_id=task_id,
            plan=[{"step": i+1, "description": step} for i, step in enumerate(plan)]
        )

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

    def _execute_plan_steps(self, plan: List[str], task: str, task_info: Dict[str, Any],
                           history: List[Dict[str, str]], session_id: str, 
                           execution_id: str, stream: bool):
        """执行计划中的步骤（每个步骤作为简单任务调用父类方法）

        Args:
            plan: 计划步骤列表
            task: 原始任务文本
            task_info: 任务信息
            history: 会话历史
            session_id: 会话ID
            execution_id: 执行ID
            stream: 是否流式输出
        """
        checkpoint = self._create_initial_checkpoint(task, plan)
        self._save_plan_checkpoint(session_id, checkpoint)

        all_results = []
        step_results = []

        history = self.session_manager.get_history(session_id)
        
        for step_idx, step_description in enumerate(plan):
            self.logger.debug(f"执行步骤 {step_idx + 1}/{len(plan)}: {step_description}")

            self._publish_step_start(session_id, execution_id, step_idx, len(plan))

            sub_task_info = {
                "level": "simple",
                "description": step_description,
                "parent_task": task,
                "step_index": step_idx
            }

            current_step_results = []
            step_success = True
            step_error = None

            try:
                # 构建包含之前步骤执行结果的历史信息
                step_history = history.copy()
                
                # 构建完整的任务上下文信息
                task_context = f"""原始任务: {task}

完整计划:
"""
                for i, step in enumerate(plan):
                    status = "✓" if i < step_idx else "▶" if i == step_idx else " "
                    task_context += f"{status} 步骤 {i + 1}: {step}\n"
                
                # 添加已执行步骤结果
                if step_results:
                    task_context += "\n已执行步骤:\n"
                    executed_steps = PromptTemplates.format_executed_steps(step_results, include_thought=False, max_prev_length=5000)
                    task_context += executed_steps
                    task_context += "\n现在请执行当前步骤:\n"
                else:
                    task_context += "\n请开始执行第一个步骤:\n"
                
                # 添加任务上下文到历史
                step_history.append({
                    "role": "user",
                    "content": task_context
                })
                
                for chunk in super()._execute_task_stream(
                    task, plan, sub_task_info, step_history, session_id, execution_id, stream
                ):
                    if chunk.get("type") == "finish":
                        current_step_results.append({
                            "thought": chunk.get("thought", ""),
                            "action": "finish",
                            "action_input": chunk.get("result", ""),
                            "observation": chunk.get("result", ""),
                            "success": True
                        })
                        all_results.append(chunk.get("result", ""))
                    elif chunk.get("type") == "error":
                        step_success = False
                        step_error = chunk.get("message", "")
                    elif chunk.get("type") == "step_complete":
                        current_step_results.append(chunk)

            except Exception as e:
                import traceback
                step_success = False
                step_error = str(e)
                self.logger.error(f"步骤 {step_idx + 1} 执行失败: {e}\n{traceback.format_exc()}")

            step_results.extend(current_step_results)
            checkpoint["current_step_idx"] = step_idx + 1
            checkpoint["step_results"] = step_results
            checkpoint["timestamp"] = time.time()
            self._save_plan_checkpoint(session_id, checkpoint)

            last_result = current_step_results[-1] if current_step_results else {}
            observation = last_result.get("observation", last_result.get("result", ""))
            self._publish_step_end(
                session_id, execution_id, step_idx,
                "completed" if step_success else "failed",
                step_error, observation,
                last_result.get("thought", ""),
                step_description
            )

            if not step_success:
                final_result = self._generate_final_response(task, step_results, "complex")
                self._publish_task_end(session_id, execution_id, final_result)
                return    

        final_result = self._summarize_results(task, all_results)
        self._publish_task_end(session_id, execution_id, final_result)

    def _summarize_results(self, task: str, results: List[str]) -> str:
        """汇总所有步骤的结果

        Args:
            task: 原始任务
            results: 各步骤结果列表

        Returns:
            汇总后的最终结果
        """
        if not results:
            return "任务执行完成，但未产生结果"

        if len(results) == 1:
            return results[0]

        prompt = f"""请汇总以下任务执行结果，生成简洁的最终回答。

原始任务：{task}

各步骤执行结果：
{chr(10).join(f'{i+1}. {r}' for i, r in enumerate(results))}

请直接输出汇总结果，不要包含其他说明："""

        return self.llm_client.complete(prompt, task_level="simple")

    def _execute_task_stream(self, task: str, task_info: Dict[str, Any], history: List[Dict[str, str]],
                           session_id: str, execution_id: str, stream: bool) -> Generator[Dict[str, Any], None, None]:
        """执行任务（流式）- 统一入口，智能路由

        Args:
            task: 任务文本
            task_info: 任务信息
            history: 会话历史
            session_id: 会话ID
            execution_id: 执行ID
            stream: 是否启用流式输出

        Yields:
            流式响应块
        """
        task_level = task_info.get("level", "simple")
        history_context = self._build_history_context(history)

        self.logger.debug(f"PlanReActCore处理任务: level={task_level}, task={task}")
        #self._publish_task_start(session_id, execution_id, task, task_info)
    
        analysis = self._analyze_task_and_plan(task, task_info, history_context, session_id, execution_id)
        
        if not analysis:
            self.logger.warning("任务分析失败，降级为父类执行")
            for chunk in super()._execute_task_stream(task, task_info, history, session_id, execution_id, stream):
                yield chunk
            return
        analyzed_level = analysis.get("level", "simple")
        next_action = analysis.get("next_action")
        plan = analysis.get("plan", [])

        self.logger.debug(f"分析结果: level={analyzed_level}, has_next_action={next_action is not None}, plan_steps={len(plan)}")

        if analyzed_level == "simple" and next_action:
            self.logger.debug("简单任务，直接执行next_action")
            
            self._execute_direct_action(next_action, session_id, execution_id, task, stream)
        elif plan:
            self.logger.debug("复杂任务，执行计划")
            
            self._publish_plan_start(session_id, execution_id)

            plan_descriptions = [step.get("description", str(step)) for step in plan]

            self._publish_plan_events(session_id, execution_id, plan_descriptions)


            self._execute_plan_steps(plan_descriptions, task, task_info, history, session_id, execution_id, stream)
        else:
            self.logger.warning("无法处理任务，降级为父类执行")
            for chunk in super()._execute_task_stream(task, task_info, history, session_id, execution_id, stream):
                yield chunk

        # 确保生成器有返回值，避免 NoneType 错误
        yield {"type": "stream", "content": ""}

    def _execute_direct_action(self, action_data: Dict[str, Any], session_id: str, 
                               execution_id: str, task: str, stream: bool):
        """直接执行分析结果中的行动（减少简单任务的LLM调用）

        Args:
            action_data: 行动数据（包含 thought, action, action_input）
            session_id: 会话ID
            execution_id: 执行ID
            task: 原始任务
            stream: 是否流式输出
        """
        thought = action_data.get("thought", "")
        action = action_data.get("action", "")
        action_input = action_data.get("action_input")

        self.logger.debug(f"直接执行行动: action={action}, thought={thought[:50]}...")
        self._publish_step_start(session_id, execution_id, 0, 1)
        if thought:
            self._publish_think_stream(session_id, execution_id, 0, thought)

        if action == "finish":
            result = action_input if isinstance(action_input, str) else str(action_input)
            self._publish_task_end(session_id, execution_id, result)
        else:
            observation = self._execute_action(action, action_input)
            self._publish_step_end(
                session_id, execution_id, 0,
                "completed", None, observation, thought, action
            )
            final_result = self._generate_final_response(task, [{"thought": thought, "action": action, "observation": observation}], "simple")
            self._publish_task_end(session_id, execution_id, final_result)

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
        self.logger.debug(f"从检查点恢复执行，当前步骤：{checkpoint['current_step_idx']}")

        plan = checkpoint["plan"]
        current_step_idx = int(checkpoint["current_step_idx"])
        #step_results = checkpoint.get("step_results", [])

        execution_id = f"plan_{int(time.time())}"
        task = checkpoint["task"]
        task_info = {"level": "complex", "reason": "从检查点恢复"}

        self._execute_plan_steps(
            plan[current_step_idx:], task, task_info, history,
            session_id, execution_id, stream
        )
