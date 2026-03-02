import time
from typing import Dict, List, Any, Union, Generator

from lingxi.core.engine.plan_react_core import PlanReActCore


class PlanReActEngine(PlanReActCore):
    """支持断点重试的Plan+ReAct执行引擎
    
    继承自 PlanReActCore，复用其智能路由和执行逻辑，
    额外支持从检查点恢复执行的功能。
    """

    def process(self, user_input: str, task_info: Dict[str, Any], session_history: List[Dict[str, str]] = None, 
                session_id: str = "default", stream: bool = False) -> Union[str, Generator[Dict[str, Any], None, None]]:
        """处理用户输入，支持断点恢复

        Args:
            user_input: 用户输入
            task_info: 任务信息
            session_history: 会话历史
            session_id: 会话ID
            stream: 是否启用流式输出

        Returns:
            系统响应（非流式）或流式响应生成器（流式）
        """
        self.logger.debug(f"Plan+ReAct处理任务: {task_info.get('level')} (stream={stream})")

        if self.session_manager:
            existing_checkpoint = self.session_manager.restore_checkpoint(session_id)

            if existing_checkpoint and existing_checkpoint.get("task") == user_input:
                self.logger.debug("从检查点恢复执行")
                return self._resume_from_checkpoint(existing_checkpoint, session_history, session_id, stream=stream)

        return self._execute_new_task(user_input, task_info, session_history, session_id, stream=stream)
