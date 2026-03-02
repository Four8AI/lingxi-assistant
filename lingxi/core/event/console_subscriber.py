import logging
from typing import Dict, Any
from lingxi.core.event import global_event_publisher


class ConsoleSubscriber:
    """控制台事件订阅者 - 统一处理控制台输出"""

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._final_result: str = ""
        self._subscribe_to_events()

    def _subscribe_to_events(self):
        global_event_publisher.subscribe('think_start', self.handle_think_start)
        global_event_publisher.subscribe('think_final', self.handle_think_final)
        global_event_publisher.subscribe('think_stream', self.handle_think_stream)
        global_event_publisher.subscribe('plan_start', self.handle_plan_start)
        global_event_publisher.subscribe('plan_final', self.handle_plan_final)
        global_event_publisher.subscribe('step_start', self.handle_step_start)
        global_event_publisher.subscribe('step_end', self.handle_step_end)
        global_event_publisher.subscribe('task_start', self.handle_task_start)
        global_event_publisher.subscribe('task_end', self.handle_task_end)

        self.logger.debug("控制台订阅者已初始化")

    def _unsubscribe_from_events(self):
        global_event_publisher.unsubscribe('think_start', self.handle_think_start)
        global_event_publisher.unsubscribe('think_final', self.handle_think_final)
        global_event_publisher.unsubscribe('think_stream', self.handle_think_stream)
        global_event_publisher.unsubscribe('plan_start', self.handle_plan_start)
        global_event_publisher.unsubscribe('plan_final', self.handle_plan_final)
        global_event_publisher.unsubscribe('step_start', self.handle_step_start)
        global_event_publisher.unsubscribe('step_end', self.handle_step_end)
        global_event_publisher.unsubscribe('task_start', self.handle_task_start)
        global_event_publisher.unsubscribe('task_end', self.handle_task_end)

    def handle_task_start(self, session_id: str, execution_id: str, **kwargs):
        print("\n🚀 任务开始处理...")

    def handle_think_start(self, session_id: str, execution_id: str, **kwargs):
        print("💭 思考中...")

    def handle_think_stream(self, session_id: str, execution_id: str, content: str, **kwargs):
        print(f"{content}", end="", flush=True)

    def handle_think_final(self, session_id: str, execution_id: str, content: str, **kwargs):
        print()

    def handle_plan_start(self, session_id: str, execution_id: str, **kwargs):
        pass

    def handle_plan_final(self, session_id: str, execution_id: str, plan: list, **kwargs):
        print("\n📋 任务规划:")
        for i, step in enumerate(plan, 1):
            desc = step if isinstance(step, str) else step.get('description', str(step))
            print(f"   {i}. {desc}")

    def handle_step_start(self, session_id: str, execution_id: str, step_index: int, **kwargs):
        print(f"\n📍 执行步骤 {step_index + 1}...")

    def handle_step_end(self, session_id: str, execution_id: str, step_index: int, result: str, **kwargs):
        # result 是字符串类型，直接使用
        if result:
            preview = result[:200] + '...' if len(result) > 200 else result
            print(f"   ✅ 完成: {preview}")

    def handle_task_end(self, session_id: str, execution_id: str, result: str, **kwargs):
        self._final_result = result
        print(f"\n✨ 最终结果: {result}")

    def get_final_result(self) -> str:
        return self._final_result

    def __del__(self):
        try:
            self._unsubscribe_from_events()
        except Exception:
            pass
