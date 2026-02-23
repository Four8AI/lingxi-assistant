import logging
from typing import Dict, List, Optional, Any
from lingxi.core.llm_client import LLMClient
from lingxi.core.skill_caller import SkillCaller
from lingxi.core.prompts import PromptTemplates


class ReActEngine:
    """ReAct推理引擎，结合推理和行动"""

    def __init__(self, config: Dict[str, Any], skill_caller: SkillCaller = None):
        """初始化ReAct引擎

        Args:
            config: 系统配置
            skill_caller: 技能调用器（用于获取可用技能列表）
        """
        self.config = config
        self.llm_client = LLMClient(config)
        self.skill_caller = skill_caller
        self.logger = logging.getLogger(__name__)

        self.max_steps = int(config.get("engine", {}).get("max_steps", 10))
        self.timeout = int(config.get("engine", {}).get("timeout", 60))

        self.logger.debug("初始化ReAct推理引擎")
    
    def process(self, user_input: str, task_info: Dict[str, Any], session_history: List[Dict[str, str]] = None, session_id: str = "default") -> str:
        """处理用户输入

        Args:
            user_input: 用户输入
            task_info: 任务信息
            session_history: 会话历史
            session_id: 会话ID

        Returns:
            系统响应
        """
        self.logger.debug(f"ReAct处理任务: {task_info.get('task_type')}")
        self.logger.debug(f"用户输入: {user_input}")

        task_level = task_info.get("level", "simple")

        history_context = self._build_history_context(session_history)
        
        # 初始化思考-行动-观察循环
        steps = []
        
        for step in range(self.max_steps):
            self.logger.debug(f"步骤 {step + 1}/{self.max_steps}")
            
            # 构建提示
            prompt = self._build_prompt(
                user_input=user_input,
                task_info=task_info,
                history_context=history_context,
                steps=steps
            )

            # 生成思考和行动
            self.logger.debug("生成思考和行动提示词: %s", prompt)
            response = self.llm_client.complete(prompt, task_level=task_level)
            self.logger.debug("LLM响应: %s", response)
            
            # 解析响应
            parsed = self._parse_response(response)
            
            if not parsed:
                self.logger.warning("无法解析响应，结束循环")
                break
            
            # 添加步骤
            steps.append(parsed)
            
            # 检查是否完成
            if parsed.get("action") == "finish":
                self.logger.debug("任务完成")
                return parsed.get("thought", "") + " " + parsed.get("observation", "")
            
            # 执行行动
            observation = self._execute_action(parsed.get("action"), parsed.get("action_input"))
            parsed["observation"] = observation
            
            self.logger.debug(f"思考: {parsed.get('thought')}")
            self.logger.debug(f"行动: {parsed.get('action')} - {parsed.get('action_input')}")
            self.logger.debug(f"观察: {observation.replace('\n', '\\n')}")

        # 生成最终响应
        final_response = self._generate_final_response(steps, user_input, task_level)
        return final_response
    
    def _build_history_context(self, session_history: List[Dict[str, str]]) -> str:
        """构建历史上下文
        
        Args:
            session_history: 会话历史
            
        Returns:
            历史上下文字符串
        """
        return PromptTemplates.format_history_context(session_history, max_count=5)
    
    def _build_prompt(self, user_input: str, task_info: Dict[str, Any], history_context: str, steps: List[Dict[str, str]]) -> str:
        """构建ReAct提示

        Args:
            user_input: 用户输入
            task_info: 任务信息
            history_context: 历史上下文
            steps: 已执行的步骤

        Returns:
            提示字符串
        """
        available_skills = self.skill_caller.list_available_skills(enabled_only=True) if self.skill_caller else []
        skills_list = PromptTemplates.format_skills_list(available_skills)

        return PromptTemplates.build_react_prompt(
            user_input=user_input,
            task_info=task_info,
            history_context=history_context,
            skills_list=skills_list,
            steps=steps
        )
    
    def _parse_response(self, response: str) -> Dict[str, str]:
        """解析LLM响应

        Args:
            response: LLM响应

        Returns:
            解析后的字典
        """
        import re
        import json

        # 优先尝试 JSON 格式解析
        try:
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
                                    return {
                                        "thought": result["thought"],
                                        "action": result["action"],
                                        "action_input": result["action_input"],
                                        "content": result["action_input"] if result["action"] == "finish" else ""
                                    }
                                break
        except (json.JSONDecodeError, KeyError, AttributeError, IndexError):
            pass

        # 回退到文本格式解析（支持中英文冒号）
        thought_match = re.search(r'思考[：:]\s*(.*?)\n行动[：:]', response, re.DOTALL)
        thought = thought_match.group(1).strip() if thought_match else ""

        action_match = re.search(r'行动[：:]\s*(\w+)(?:\s*-\s*|\()(.*?)(?:\)|$)', response, re.DOTALL)
        if action_match:
            action = action_match.group(1).strip()
            action_input = action_match.group(2).strip()
            action_input = action_input.strip(' \t\n\r')
        else:
            action = ""
            action_input = ""

        if not thought or not action:
            return {}

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

        # 使用更健壮的正则表达式，支持多行内容
        # 匹配 key="value" 格式，其中 value 可以包含换行符和转义字符
        pattern = r'(\w+)="((?:[^"\\]|\\.)*)"'
        matches = re.findall(pattern, action_input, re.DOTALL)

        for match in matches:
            key = match[0]
            value = match[1]
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
            # 安全计算
            import ast
            import operator
            
            # 定义允许的操作
            allowed_operators = {
                ast.Add: operator.add,
                ast.Sub: operator.sub,
                ast.Mult: operator.mul,
                ast.Div: operator.truediv,
                ast.Pow: operator.pow,
                ast.Mod: operator.mod,
            }
            
            # 定义计算函数
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
            
            # 解析和计算
            tree = ast.parse(expression, mode='eval')
            result = _eval(tree.body)
            return f"计算结果: {result}"
            
        except Exception as e:
            return f"计算错误: {str(e)}"
    
    def _generate_final_response(self, steps: List[Dict[str, str]], user_input: str, task_level: str = "simple") -> str:
        """生成最终响应

        Args:
            steps: 执行步骤
            user_input: 用户输入
            task_level: 任务级别

        Returns:
            最终响应
        """
        prompt = PromptTemplates.build_final_response_prompt(
            user_input=user_input,
            steps=steps,
            include_thought=True
        )

        response = self.llm_client.complete(prompt, task_level=task_level)
        return response