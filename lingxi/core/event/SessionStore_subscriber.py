import asyncio
import logging
import json
from typing import Dict, Any

from starlette.middleware import P
from lingxi.core.event import global_event_publisher
from lingxi.core.session import SessionManager


class SessionStoreSubscriber:
    """会话存储事件订阅者"""

    def __init__(self, sessionManage: SessionManager):
        """初始化会话存储订阅者

        Args:
            sessionManage: 会话管理实例
        """
        self.sessionManage = sessionManage
        self.logger = logging.getLogger(__name__)
        self._subscribe_to_events()

    def _subscribe_to_events(self):
        """订阅事件"""
        global_event_publisher.subscribe('plan_start', self.handle_plan_start)
        global_event_publisher.subscribe('plan_final', self.handle_plan_final)
        global_event_publisher.subscribe('step_end', self.handle_step_end)
        global_event_publisher.subscribe('task_failed', self.handle_task_failed)
        global_event_publisher.subscribe('task_end', self.handle_task_end)

        self.logger.info("会话存储订阅者已初始化，开始监听事件")

    def _unsubscribe_from_events(self):
        """取消订阅事件"""
        global_event_publisher.unsubscribe('plan_start', self.handle_plan_start)
        global_event_publisher.unsubscribe('plan_final', self.handle_plan_final)
        global_event_publisher.unsubscribe('step_end', self.handle_step_end)
        global_event_publisher.unsubscribe('task_end', self.handle_task_end)
        global_event_publisher.unsubscribe('task_failed', self.handle_task_failed)

        self.logger.info("会话存储订阅者已停止监听事件")



    def handle_plan_start(self, session_id: str, execution_id: str, **kwargs):
        """处理任务规划开始事件

        Args:
            session_id: 会话ID
            execution_id: 执行ID
            **kwargs: 其他参数
        """
    def handle_task_failed(self, session_id: str, execution_id: str, **kwargs):
        task_id = kwargs.get('task_id')
        self.logger.debug(f"当前任务ID：{task_id}")
        if not task_id:
            self.logger.warning(f"处理 task_end 事件时缺少 task_id: {session_id}")
            return
            
        if self.sessionManage:
            self.sessionManage.set_task_result(
                session_id=session_id,
                task_id=task_id,
                result=kwargs.get('error', ''),
                user_input=kwargs.get('task_input', '')
            )

    def handle_plan_final(self, session_id: str, execution_id: str, plan: list, **kwargs):
        """处理任务规划完成事件

        Args:
            session_id: 会话ID
            execution_id: 执行ID
            plan: 任务计划（包含每个步骤）
            **kwargs: 其他参数
        """
        task_id = kwargs.get('task_id')
        self.logger.debug(f"当前任务ID：{task_id}")
        if not task_id:
            self.logger.warning(f"处理 plan_final 事件时缺少 task_id: {session_id}")
            return
            
        if self.sessionManage:
            self.sessionManage.save_plan(
                session_id=session_id,
                task_id=task_id,
                plan=json.dumps(plan)
            )


    def handle_step_end(self, session_id: str, execution_id: str, step_index: int, result: str, **kwargs):
        """处理步骤执行结束事件

        Args:
            session_id: 会话ID
            execution_id: 执行ID
            step_index: 步骤索引
            result: 步骤执行结果（字符串格式）
            **kwargs: 其他参数
        """
        task_id = kwargs.get('task_id')
        self.logger.debug(f"当前任务ID：{task_id}")
        if not task_id:
            self.logger.warning(f"处理 step_end 事件时缺少 task_id: {session_id}")
            return
            
        if self.sessionManage:
            self.sessionManage.add_step(
                session_id=session_id,
                task_id=task_id,
                step_index=step_index,
                result=result,
                status=kwargs.get('status', ''),
                thought=kwargs.get('thought', ''),
                action=kwargs.get('action', ''),
                action_input=kwargs.get('action_input', ''),
                description=kwargs.get('description', '')
            )

    def handle_task_end(self, session_id: str, execution_id: str, result: str, **kwargs):
        """处理任务处理最终结果输出事件

        Args:
            session_id: 会话ID
            execution_id: 执行ID
            result: 最终结果
            **kwargs: 其他参数
        """
        task_id = kwargs.get('task_id')
        self.logger.debug(f"当前任务ID：{task_id}")
        if not task_id:
            self.logger.warning(f"处理 task_end 事件时缺少 task_id: {session_id}")
            return
            
        if self.sessionManage:
            self.sessionManage.set_task_result(
                session_id=session_id,
                task_id=task_id,
                result=result,
                user_input=kwargs.get('task_input', '')
            )

    def __del__(self):
        """析构函数，清理订阅"""
        try:
            self._unsubscribe_from_events()
        except Exception:
            pass
