"""自定义日志过滤器"""
import logging


class WebSocketDisconnectFilter(logging.Filter):
    """WebSocket断开连接过滤器"""

    def filter(self, record):
        """过滤日志记录

        Args:
            record: 日志记录

        Returns:
            是否应该记录该日志
        """
        # 如果是WebSocket断开的INFO级别日志，不显示堆栈
        if record.getMessage().startswith("WebSocket连接断开"):
            record.exc_info = None
            record.exc_text = None
        return True


class QuietExceptionFilter(logging.Filter):
    """安静异常过滤器"""

    def filter(self, record):
        """过滤日志记录

        Args:
            record: 日志记录

        Returns:
            是否应该记录该日志
        """
        # 对于某些已知的正常异常，降低日志级别
        message = record.getMessage()
        
        # WebSocket正常断开
        if "WebSocketDisconnect" in message and record.levelno >= logging.ERROR:
            record.levelno = logging.INFO
            record.levelname = "INFO"
            record.exc_info = None
            record.exc_text = None
        
        return True
