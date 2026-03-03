import logging
import asyncio
from typing import Dict, Any, List, Callable, Optional, Coroutine
from collections import deque


class EventPublisher:
    """事件发布者"""

    def __init__(self):
        """初始化事件发布者"""
        self._subscribers: Dict[str, List[Callable]] = {}
        self._event_queue: asyncio.Queue = None
        self._worker_task: asyncio.Task = None
        self.logger = logging.getLogger(__name__)

    def _ensure_worker(self):
        """确保后台任务已启动"""
        if self._worker_task is None or self._worker_task.done():
            try:
                loop = asyncio.get_running_loop()
                self._event_queue = asyncio.Queue()
                self._worker_task = asyncio.create_task(self._process_events())
                self.logger.debug("事件处理后台任务已启动")
            except RuntimeError:
                pass

    async def _process_events(self):
        """后台任务：处理队列中的事件"""
        while True:
            try:
                event_type, kwargs = await self._event_queue.get()
                if event_type in self._subscribers:
                    for callback in self._subscribers[event_type]:
                        try:
                            result = callback(**kwargs)
                            if asyncio.iscoroutine(result):
                                await result
                        except Exception as e:
                            import traceback
                            self.logger.error(f"处理事件 {event_type} 时发生错误: {e}")
                            traceback.print_exc()
            except asyncio.CancelledError:
                self.logger.debug("事件处理后台任务被取消")
                break
            except Exception as e:
                self.logger.error(f"事件处理后台任务出错: {e}", exc_info=True)

    def subscribe(self, event_type: str, callback: Callable):
        """订阅事件

        Args:
            event_type: 事件类型
            callback: 回调函数
        """
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(callback)
        self.logger.debug(f"订阅事件: {event_type}")

    def unsubscribe(self, event_type: str, callback: Callable):
        """取消订阅

        Args:
            event_type: 事件类型
            callback: 回调函数
        """
        if event_type in self._subscribers:
            try:
                self._subscribers[event_type].remove(callback)
                self.logger.debug(f"取消订阅事件: {event_type}")
            except ValueError:
                pass

    def publish(self, event_type: str, **kwargs):
        """发布事件

        Args:
            event_type: 事件类型
            **kwargs: 事件参数
        """
        # 记录事件发布日志，无论是否有订阅者
        if(event_type !="think_stream"):
            self.logger.debug(f"发布事件: {event_type}，参数: {kwargs}")
        
        # 对于 think_stream 事件，放入队列异步处理
        if event_type == "think_stream":
            self._ensure_worker()
            if self._event_queue:
                try:
                    self._event_queue.put_nowait((event_type, kwargs))
                except asyncio.QueueFull:
                    self.logger.warning("事件队列已满，丢弃事件")
            return
        
        # 其他事件直接处理
        if event_type in self._subscribers:
            for callback in self._subscribers[event_type]:
                try:
                    result = callback(**kwargs)
                    # 如果回调返回协程对象，则在事件循环中调度执行
                    if asyncio.iscoroutine(result):
                        try:
                            loop = asyncio.get_running_loop()
                            asyncio.create_task(result)
                        except RuntimeError:
                            # 如果没有运行中的事件循环，尝试获取事件循环
                            try:
                                loop = asyncio.get_event_loop()
                                if loop.is_running():
                                    asyncio.run_coroutine_threadsafe(result, loop)
                                else:
                                    self.logger.warning(f"事件循环未运行，无法执行异步回调: {event_type}")
                            except Exception as e:
                                self.logger.warning(f"无法获取事件循环，跳过异步回调: {event_type}, 错误: {e}")
                except Exception as e:
                    import traceback
                    self.logger.error(f"处理事件 {event_type} 时发生错误: {e}")
                    traceback.print_exc()

    def get_subscriber_count(self, event_type: Optional[str] = None) -> int:
        """获取订阅者数量

        Args:
            event_type: 事件类型，None表示所有事件

        Returns:
            订阅者数量
        """
        if event_type:
            return len(self._subscribers.get(event_type, []))
        return sum(len(subscribers) for subscribers in self._subscribers.values())


# 全局事件发布者实例
global_event_publisher = EventPublisher()
