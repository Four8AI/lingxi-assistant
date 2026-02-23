import logging
import time
import json
import re
from typing import Dict, List, Optional, Any
from lingxi.core.llm_client import LLMClient
from lingxi.core.skill_caller import SkillCaller
from lingxi.core.prompts import PromptTemplates


class PlanReActEngine:
    """支持断点重试的Plan+ReAct执行引擎"""

    def __init__(self, config: Dict[str, Any], session_manager=None, skill_caller: SkillCaller = None):
        """初始化Plan+ReAct引擎

        Args:
            config: 系统配置
            session_manager: 会话管理器（用于检查点）
            skill_caller: 技能调用器（用于调用技能）
        """
        self.config = config
        self.session_manager = session_manager
        self.skill_caller = skill_caller
        self.llm_client = LLMClient(config)
        self.logger = logging.getLogger(__name__)

        complex_config = config.get("execution_mode", {}).get("complex", {})
        self.max_plan_steps = int(complex_config.get("max_plan_steps", 8))
        self.max_replan_count = int(complex_config.get("max_replan_count", 2))
        self.max_step_retries = int(complex_config.get("max_step_retries", 3))
        self.max_loop_per_step = int(complex_config.get("max_loop_per_step", 5))

        self.logger.debug("初始化Plan+ReAct执行引擎")

    def process(self, user_input: str, task_info: Dict[str, Any], session_history: List[Dict[str, str]] = None, session_id: str = "default") -> str:
        """处理用户输入，支持断点恢复

        Args:
            user_input: 用户输入
            task_info: 任务信息
            session_history: 会话历史
            session_id: 会话ID

        Returns:
            系统响应
        """
        self.logger.debug(f"Plan+ReAct处理任务: {task_info.get('level')}")

        if self.session_manager:
            existing_checkpoint = self.session_manager.restore_checkpoint(session_id)

            if existing_checkpoint and existing_checkpoint.get("task") == user_input:
                self.logger.debug("从检查点恢复执行")
                return self._resume_from_checkpoint(existing_checkpoint, session_history, session_id)

        return self._execute_new_task(user_input, task_info, session_history, session_id)

    def _execute_new_task(self, task: str, task_info: Dict[str, Any], history: List[Dict[str, str]] = None, session_id: str = "default") -> str:
        """执行新任务

        Args:
            task: 任务文本
            task_info: 任务信息
            history: 会话历史
            session_id: 会话ID

        Returns:
            执行结果
        """
        try:
            self.logger.debug(f"开始执行新任务：{task}")

            task_level = task_info.get("level", "complex")

            history_context = self._build_history_context(history)

            plan = self._generate_plan(task, task_info, history_context, task_level)
            if not plan:
                return "Plan生成失败，无法继续执行任务"

            self.logger.debug(f"生成Plan，共{len(plan)}个步骤, 步骤详情: {plan}")

            initial_checkpoint = {
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

            if self.session_manager:
                self.session_manager.save_checkpoint(session_id, initial_checkpoint)

            return self._execute_steps(plan, session_id, history, initial_checkpoint, task, task_info, task_level=task_level)
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            self.logger.error(f"执行新任务时发生异常: {e}\n{error_trace}")
            return self._generate_error_response(task, -1, f"{str(e)}\n堆栈信息:\n{error_trace}")

    def _resume_from_checkpoint(self, checkpoint: Dict[str, Any], history: List[Dict[str, str]] = None, session_id: str = "default") -> str:
        """从检查点恢复执行

        Args:
            checkpoint: 检查点状态
            history: 会话历史
            session_id: 会话ID

        Returns:
            执行结果
        """
        self.logger.debug(f"从检查点恢复执行，当前步骤：{checkpoint['current_step_idx']}")

        plan = checkpoint["plan"]
        current_step_idx = checkpoint["current_step_idx"]
        completed_steps = checkpoint.get("completed_steps", [])
        step_results = checkpoint.get("step_results", [])
        replan_count = checkpoint.get("replan_count", 0)

        updated_checkpoint = checkpoint.copy()
        updated_checkpoint["execution_status"] = "running"

        if self.session_manager:
            self.session_manager.save_checkpoint(session_id, updated_checkpoint)

        task_info = {"level": "complex", "reason": "从检查点恢复"}

        return self._execute_steps(
            plan,
            session_id,
            history,
            updated_checkpoint,
            checkpoint["task"],
            task_info,
            start_idx=int(current_step_idx),
            completed_steps=completed_steps,
            step_results=step_results,
            replan_count=replan_count
        )

    def _execute_steps(self, plan: List[str], session_id: str, history: List[Dict[str, str]],
                       checkpoint: Dict[str, Any], task: str, task_info: Dict[str, Any],
                       start_idx: int = 0, completed_steps: List[str] = None,
                       step_results: List[Dict[str, Any]] = None, replan_count: int = 0,
                       task_level: str = "complex") -> str:
        """执行步骤序列

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

        Returns:
            执行结果
        """
        try:
            if completed_steps is None:
                completed_steps = []
            if step_results is None:
                step_results = []

            all_results = step_results

            start_idx = int(start_idx) if isinstance(start_idx, str) else start_idx

            for step_idx in range(start_idx, len(plan)):
                step = plan[step_idx]

                if replan_count >= self.max_replan_count:
                    self.logger.warning("达到最大重规划次数，继续执行原Plan")

                step_result = self._execute_step_with_retry(
                    step, step_idx, session_id, history, task, task_info, all_results, task_level
                )

                completed_steps.append(step)
                all_results.append(step_result)

                checkpoint["current_step_idx"] = step_idx + 1
                checkpoint["completed_steps"] = completed_steps
                checkpoint["step_results"] = all_results
                checkpoint["timestamp"] = time.time()

                if self.session_manager:
                    self.session_manager.save_checkpoint(session_id, checkpoint)

                # 检查是否提前结束任务
                if step_result.get("action") == "finish":
                    self.logger.debug(f"任务在步骤{step_idx + 1}提前结束")
                    checkpoint["execution_status"] = "completed"
                    checkpoint["error_info"] = None
                    if self.session_manager:
                        self.session_manager.save_checkpoint(session_id, checkpoint)
                    return step_result.get("content", "")

                if not step_result.get("success", False):
                    self.logger.error(f"步骤{step_idx + 1}执行失败: {step_result.get('error')}")

                    checkpoint["execution_status"] = "failed"
                    checkpoint["error_info"] = step_result.get("error")

                    if self.session_manager:
                        self.session_manager.save_checkpoint(session_id, checkpoint)

                    return self._generate_error_response(task, step_idx, step_result.get("error"))

            checkpoint["execution_status"] = "completed"
            checkpoint["error_info"] = None

            if self.session_manager:
                self.session_manager.save_checkpoint(session_id, checkpoint)

            return self._generate_final_response(task, all_results, task_level)
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            self.logger.error(f"执行步骤序列时发生异常: {e}\n{error_trace}")
            return self._generate_error_response(task, -1, f"{str(e)}\n堆栈信息:\n{error_trace}")

    def _execute_step_with_retry(self, step: str, step_idx: int, session_id: str,
                                history: List[Dict[str, str]], task: str,
                                task_info: Dict[str, Any], previous_results: List[Dict[str, Any]],
                                task_level: str = "complex") -> Dict[str, Any]:
        """执行步骤（支持重试）

        Args:
            step: 步骤描述
            step_idx: 步骤索引
            session_id: 会话ID
            history: 会话历史
            task: 任务文本
            task_info: 任务信息
            previous_results: 之前步骤的结果
            task_level: 任务级别

        Returns:
            步骤执行结果
        """
        for retry in range(self.max_step_retries):
            self.logger.debug(f"执行步骤{step_idx + 1}/{len(previous_results) + 1}: {step} (重试{retry + 1}/{self.max_step_retries})")

            try:
                result = self._execute_single_step(step, step_idx, history, task, task_info, previous_results, task_level)

                if result.get("success", False):
                    return result

                self.logger.warning(f"步骤{step_idx + 1}执行失败: {result.get('error')}")
            except Exception as e:
                self.logger.error(f"步骤{step_idx + 1}执行异常: {e}")
                result = {"success": False, "error": str(e)}

        return {"success": False, "error": f"步骤{step_idx + 1}重试{self.max_step_retries}次后仍失败"}

    def _execute_single_step(self, step: str, step_idx: int, history: List[Dict[str, str]],
                            task: str, task_info: Dict[str, Any], previous_results: List[Dict[str, Any]],
                            task_level: str = "complex") -> Dict[str, Any]:
        """执行单个步骤

        Args:
            step: 步骤描述
            step_idx: 步骤索引
            history: 会话历史
            task: 任务文本
            task_info: 任务信息
            previous_results: 之前步骤的结果
            task_level: 任务级别

        Returns:
            步骤执行结果
        """
        try:
            history_context = self._build_history_context(history)

            prompt = self._build_step_prompt(
                task=task,
                task_info=task_info,
                history_context=history_context,
                current_step=step,
                step_idx=step_idx,
                previous_results=previous_results
            )
            self.logger.debug(f"执行步骤{step_idx + 1}")
            self.logger.debug(f"步骤{step_idx + 1}提示词: {prompt}")
            response = self.llm_client.complete(prompt, task_level=task_level)
            self.logger.debug(f"步骤{step_idx + 1}LLM响应: {response}")
            parsed = self._parse_response(response)

            if not parsed:
                self.logger.error(f"步骤{step_idx + 1}解析LLM响应失败: {response}")
                return {"success": False, "error": "无法解析LLM响应"}

            if parsed.get("action") == "finish":
                return {"success": True, "action": "finish", "content": parsed.get("content", "")}

            observation = self._execute_action(parsed.get("action"), parsed.get("action_input"))

            return {
                "success": True,
                "action": parsed.get("action"),
                "action_input": parsed.get("action_input"),
                "observation": observation,
                "thought": parsed.get("thought", "")
            }
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            self.logger.error(f"执行步骤{step_idx + 1}时发生异常: {e}\n{error_trace}")
            return {"success": False, "error": f"{str(e)}\n堆栈信息:\n{error_trace}"}

    def _generate_plan(self, task: str, task_info: Dict[str, Any], history_context: str, task_level: str = "complex") -> List[str]:
        """生成任务规划

        Args:
            task: 任务文本
            task_info: 任务信息
            history_context: 历史上下文
            task_level: 任务级别

        Returns:
            规划步骤列表

        Raises:
            Exception: 当LLM API调用失败时
        """
        prompt = PromptTemplates.build_task_planning_prompt(
            task=task,
            task_info=task_info,
            history_context=history_context
        )

        self.logger.debug("生成任务规划提示词: %s", prompt)
        
        try:
            response = self.llm_client.complete(prompt, task_level=task_level)
            self.logger.debug("任务规划LLM响应: %s", response)
            
            if not response or response.strip() == "":
                self.logger.error("LLM API返回空响应")
                raise ValueError("LLM API返回空响应，请检查网络连接或API配置")
            
            return self._parse_plan(response)
        except Exception as e:
            self.logger.error(f"生成任务规划时发生错误: {e}")
            # 直接抛出异常，让调用者处理
            raise

    def _parse_plan(self, plan: str) -> List[str]:
        """解析任务规划

        Args:
            plan: 任务规划文本

        Returns:
            规划步骤列表
        """
        steps = []
        lines = plan.split("\n")

        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # 匹配多种格式的步骤行：
            # 1. 纯数字格式: "1. 步骤内容"
            # 2. Markdown格式: "1. **步骤1：步骤内容**"
            # 3. 带括号格式: "1) 步骤内容"
            # 4. 其他变体格式
            if re.match(r'^\d+[.)\s]', line):
                # 提取数字后面的内容
                step_match = re.search(r'^\d+[.)\s]+(.*)', line)
                if step_match:
                    step_content = step_match.group(1).strip()
                    # 去除Markdown粗体格式 **内容**
                    step_content = re.sub(r'\*\*(.*?)\*\*', r'\1', step_content)
                    # 去除可能的步骤编号前缀，如 "步骤1：" 或 "步骤1: "
                    step_content = re.sub(r'^步骤\d+[:：]\s*', '', step_content).strip()
                    # 去除可能的标题格式，如 "### 标题"
                    step_content = re.sub(r'^#+\s*', '', step_content).strip()
                    
                    if step_content:
                        steps.append(step_content)

        if not steps:
            # 尝试备用解析方案：提取所有以数字开头的行
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                if re.match(r'^\d+[.)\s]', line):
                    step_match = re.search(r'^\d+[.)\s]+(.*)', line)
                    if step_match:
                        step_content = step_match.group(1).strip()
                        # 去除Markdown格式
                        step_content = re.sub(r'\*\*(.*?)\*\*', r'\1', step_content)
                        step_content = re.sub(r'^#+\s*', '', step_content).strip()
                        
                        if step_content:
                            steps.append(step_content)

        if not steps:
            self.logger.warning(f"无法解析任务规划，原始内容: {plan[:500]}...")
            raise ValueError("任务规划为空")

        self.logger.info(f"成功解析任务规划，共 {len(steps)} 个步骤")
        for idx, step in enumerate(steps):
            self.logger.info(f"步骤 {idx + 1}: {step}")
        return steps[:self.max_plan_steps]

    def _build_step_prompt(self, task: str, task_info: Dict[str, Any], history_context: str,
                          current_step: str, step_idx: int, previous_results: List[Dict[str, Any]]) -> str:
        """构建步骤提示

        Args:
            task: 任务文本
            task_info: 任务信息
            history_context: 历史上下文
            current_step: 当前步骤
            step_idx: 步骤索引
            previous_results: 之前步骤的结果

        Returns:
            提示字符串
        """
        available_skills = self.skill_caller.list_available_skills(enabled_only=True) if self.skill_caller else []
        skills_list = PromptTemplates.format_skills_list(available_skills)

        return PromptTemplates.build_plan_react_prompt(
            task=task,
            task_info=task_info,
            history_context=history_context,
            current_step=current_step,
            skills_list=skills_list,
            previous_results=previous_results
        )

    def _parse_response(self, response: str) -> Optional[Dict[str, str]]:
        """解析LLM响应

        Args:
            response: LLM响应

        Returns:
            解析后的字典
        """
        self.logger.debug(f"开始解析LLM响应: {repr(response)}")
        
        # 优先尝试 JSON 格式解析
        try:
            import json
            # 查找 JSON 对象（支持嵌套和换行）
            # 使用更精确的方法：找到第一个 { 和对应的 }
            start_idx = response.find('{')
            if start_idx != -1:
                # 从第一个 { 开始，寻找匹配的 }
                brace_count = 0
                in_string = False
                escape_next = False
                for i in range(start_idx, len(response)):
                    char = response[i]
                    
                    if escape_next:
                        escape_next = False
                        continue
                    
                    if char == '\\':
                        escape_next = True
                        continue
                    
                    if char == '"':
                        in_string = not in_string
                        continue
                    
                    if not in_string:
                        if char == '{':
                            brace_count += 1
                        elif char == '}':
                            brace_count -= 1
                            if brace_count == 0:
                                json_str = response[start_idx:i+1]
                                result = json.loads(json_str)
                                
                                # 验证必需字段
                                if all(key in result for key in ["thought", "action", "action_input"]):
                                    self.logger.debug(f"JSON解析成功: thought={result['thought'][:30]}..., action={result['action']}")
                                    # action_input 可以是对象或字符串
                                    action_input = result["action_input"]
                                    content = action_input if result["action"] == "finish" else ""
                                    return {
                                        "thought": result["thought"],
                                        "action": result["action"],
                                        "action_input": action_input,
                                        "content": content
                                    }
                                break
        except (json.JSONDecodeError, KeyError, AttributeError, IndexError) as e:
            self.logger.debug(f"JSON解析失败: {e}，尝试文本格式解析")
        
        # 回退到文本格式解析（支持中英文冒号）
        thought_match = re.search(r'思考[：:]\s*(.*?)\n行动[：:]', response, re.DOTALL)
        thought = thought_match.group(1).strip() if thought_match else ""
        
        self.logger.debug(f"思考内容匹配结果: {thought_match is not None}, 思考长度: {len(thought)}")

        action_match = re.search(r'行动[：:]\s*(\w+)(?:\s*-\s*|\()(.*?)(?:\)|$)', response, re.DOTALL)
        if action_match:
            action = action_match.group(1).strip()
            action_input = action_match.group(2).strip()
            action_input = action_input.strip(' \t\n\r')
        else:
            action = ""
            action_input = ""
        
        self.logger.debug(f"行动匹配结果: {action_match is not None}, 行动: {action}, 输入: {action_input}")

        if not thought or not action:
            self.logger.warning(f"解析失败 - 思考为空: {not thought}, 行动为空: {not action}")
            return None

        return {
            "thought": thought,
            "action": action,
            "action_input": action_input,
            "content": action_input if action == "finish" else ""
        }

    def _execute_action(self, action: str, action_input: Any) -> str:
        """执行行动

        Args:
            action: 行动名称
            action_input: 行动输入（可以是字符串或字典）

        Returns:
            观察结果
        """
        if action == "finish":
            return action_input

        if not self.skill_caller:
            return f"错误: 技能调用器未初始化"

        try:
            # 如果 action_input 是字符串，尝试解析为参数字典
            if isinstance(action_input, str):
                parameters = self._parse_action_parameters(action_input)
                parameters = self._process_parameters(parameters)
            else:
                # action_input 已经是字典（对象）
                parameters = action_input if isinstance(action_input, dict) else {}
            
            result = self.skill_caller.call(action, parameters)

            if result.get("success"):
                return result.get("result", "执行成功")
            else:
                return f"执行失败: {result.get('error', '未知错误')}"
        except Exception as e:
            self.logger.error(f"执行行动失败: {e}")
            return f"执行失败: {str(e)}"

    def _parse_action_parameters(self, action_input: str) -> Dict[str, Any]:
        """解析行动参数

        Args:
            action_input: 行动输入字符串

        Returns:
            参数字典
        """
        import re

        parameters = {}

        if not action_input:
            return parameters

        self.logger.debug(f"开始解析 action_input，长度: {len(action_input)}")

        # 使用更健壮的正则表达式，支持多行内容
        # 匹配 key="value" 格式，其中 value 可以包含换行符和转义字符
        # 使用 [\s\S] 匹配包括换行符在内的所有字符
        pattern = r'(\w+)="((?:[\s\S]|\\")*?)"'
        matches = re.findall(pattern, action_input)

        self.logger.debug(f"正则匹配结果: {len(matches)} 个参数")

        for match in matches:
            key = match[0]
            value = match[1]
            self.logger.debug(f"解析参数: {key}，值长度: {len(value)}")
            parameters[key] = value

        return parameters

    def _process_parameters(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """处理参数，转换转义字符

        Args:
            parameters: 原始参数字典

        Returns:
            处理后的参数字典
        """
        processed = {}
        for key, value in parameters.items():
            if isinstance(value, str):
                value = value.replace('\\n', '\n')
                value = value.replace('\\t', '\t')
                value = value.replace('\\r', '\r')
                value = value.replace('\\"', '"')
                value = value.replace('\\\\', '\\')
            processed[key] = value
        return processed

    def _calculate(self, expression: str) -> str:
        """计算表达式

        Args:
            expression: 数学表达式

        Returns:
            计算结果
        """
        try:
            import ast
            import operator

            allowed_operators = {
                ast.Add: operator.add,
                ast.Sub: operator.sub,
                ast.Mult: operator.mul,
                ast.Div: operator.truediv,
                ast.Pow: operator.pow,
                ast.Mod: operator.mod,
            }

            def _eval(node):
                if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
                    return node.value
                elif isinstance(node, ast.BinOp):
                    left = _eval(node.left)
                    right = _eval(node.right)
                    if type(node.op) in allowed_operators:
                        return allowed_operators[type(node.op)](left, right)
                    else:
                        raise ValueError(f"不支持的操作: {type(node.op).__name__}")
                else:
                    raise ValueError(f"不支持的表达式: {type(node).__name__}")

            tree = ast.parse(expression, mode='eval')
            result = _eval(tree.body)
            return f"计算结果: {result}"

        except Exception as e:
            return f"计算错误: {str(e)}"

    def _build_history_context(self, session_history: List[Dict[str, str]]) -> str:
        """构建历史上下文

        Args:
            session_history: 会话历史

        Returns:
            历史上下文字符串
        """
        return PromptTemplates.format_history_context(session_history, max_count=5)

    def _generate_final_response(self, task: str, results: List[Dict[str, Any]], task_level: str = "complex") -> str:
        """生成最终响应

        Args:
            task: 任务文本
            results: 执行结果
            task_level: 任务级别

        Returns:
            最终响应
        """
        prompt = PromptTemplates.build_final_response_prompt(
            user_input=task,
            steps=results,
            include_thought=False
        )

        self.logger.debug("生成最终响应提示词: %s", prompt)
        response = self.llm_client.complete(prompt, task_level=task_level)
        self.logger.debug("最终响应LLM响应: %s", response)
        return response

    def _generate_error_response(self, task: str, failed_step: int, error: str) -> str:
        """生成错误响应

        Args:
            task: 任务文本
            failed_step: 失败的步骤
            error: 错误信息

        Returns:
            错误响应
        """
        return f"任务执行失败：在步骤{failed_step + 1}时遇到错误\n\n错误信息：{error}\n\n您可以使用相同的会话ID重新尝试，系统将从失败的步骤继续执行。"
