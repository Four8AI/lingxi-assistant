# WebSocket异常处理优化说明

## 问题描述

在WebSocket连接正常断开时，Starlette框架会抛出`WebSocketDisconnect`异常，导致控制台输出完整的错误堆栈，影响日志可读性。

## 解决方案

### 1. 优化FastAPI端点异常处理

**文件**: [web/fastapi_server.py](file:///d:\resource\python\lingxi\web\fastapi_server.py)

```python
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket端点"""
    websocket_manager = get_websocket_manager()
    if not websocket_manager:
        await websocket.close(code=1011, reason="服务器未初始化")
        return

    connection_id = await websocket_manager.connect(websocket)
    logger.info(f"WebSocket连接建立: {connection_id}")

    try:
        while True:
            try:
                data = await websocket.receive_json()
                await websocket_manager.handle_message(connection_id, data)
            except WebSocketDisconnect as e:
                logger.info(f"WebSocket连接断开: {connection_id}, code: {e.code}")
                break
            except Exception as e:
                logger.error(f"处理消息时出错: {e}", exc_info=True)
                try:
                    error_msg = {
                        "type": "error",
                        "success": False,
                        "error": str(e)
                    }
                    await websocket.send_json(error_msg)
                except:
                    break
    except Exception as e:
        logger.error(f"WebSocket连接异常: {e}", exc_info=True)
    finally:
        await websocket_manager.disconnect(connection_id)
```

**改进点**:
- 将`WebSocketDisconnect`异常处理移到内层循环中
- 捕获断开码并记录
- 在消息处理失败时尝试发送错误消息给客户端
- 使用`break`优雅退出循环

### 2. 增强WebSocketConnection类

**文件**: [web/websocket.py](file:///d:\resource\python\lingxi\web\websocket.py)

```python
async def send_json(self, data: Dict[str, Any]) -> bool:
    """发送JSON消息

    Returns:
        是否发送成功
    """
    if not self.is_connected:
        return False
    try:
        await self.websocket.send_json(data)
        self.last_activity = asyncio.get_event_loop().time()
        return True
    except Exception as e:
        logger.debug(f"发送JSON消息失败: {e}")
        self.is_connected = False
        return False
```

**改进点**:
- 所有发送方法返回`bool`表示是否成功
- 捕获发送异常并标记连接为断开
- 使用DEBUG级别记录发送失败

### 3. 自定义日志过滤器

**文件**: [lingxi/utils/log_filters.py](file:///d:\resource\python\lingxi\lingxi\utils\log_filters.py)

```python
class QuietExceptionFilter(logging.Filter):
    """安静异常过滤器"""

    def filter(self, record):
        """过滤日志记录"""
        message = record.getMessage()
        
        # WebSocket正常断开
        if "WebSocketDisconnect" in message and record.levelno >= logging.ERROR:
            record.levelno = logging.INFO
            record.levelname = "INFO"
            record.exc_info = None
            record.exc_text = None
        
        return True
```

**改进点**:
- 自动降低WebSocket断开异常的日志级别
- 移除异常堆栈信息
- 保持日志简洁

### 4. 集成日志过滤器

**文件**: [lingxi/utils/logging.py](file:///d:\resource\python\lingxi\lingxi\utils\logging.py)

```python
# 创建自定义过滤器
quiet_exception_filter = QuietExceptionFilter()

# 添加到控制台和文件处理器
console_handler.addFilter(quiet_exception_filter)
file_handler.addFilter(quiet_exception_filter)
```

## 优化效果

### 优化前
```
ERROR:    Exception in ASGI application
Traceback (most recent call last):
  File "D:\resource\python\lingxi\web\fastapi_server.py", line 71, in websocket_endpoint
    data = await websocket.receive_json()
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\resource\python\lingxi\.venv\Lib\site-packages\starlette\websockets.py", line 136, in receive_json
    self._raise_on_disconnect(message)
  ...
starlette.websockets.WebSocketDisconnect: (1000, '')
```

### 优化后
```
2026-02-23 16:57:16,760 - INFO - WebSocket连接断开: conn_1, code: 1005
```

## 测试验证

运行测试脚本验证所有功能：

```bash
python test_websocket.py
```

测试结果：
- ✅ WebSocket连接成功
- ✅ 欢迎消息接收正常
- ✅ 聊天消息响应正常
- ✅ Ping/Pong心跳正常
- ✅ 命令执行正常
- ✅ 技能列表获取正常
- ✅ 检查点状态查询正常
- ✅ 上下文统计正常
- ✅ 连接断开日志优雅

## 使用建议

1. **正常断开**: 客户端主动关闭连接时，只记录INFO级别日志
2. **异常断开**: 连接异常断开时，记录错误但避免堆栈信息
3. **发送失败**: 消息发送失败时，使用DEBUG级别记录
4. **消息处理错误**: 处理消息时出错，记录完整错误信息

## 相关文件

- [web/fastapi_server.py](file:///d:\resource\python\lingxi\web\fastapi_server.py) - FastAPI服务器
- [web/websocket.py](file:///d:\resource\python\lingxi\web\websocket.py) - WebSocket管理器
- [lingxi/utils/log_filters.py](file:///d:\resource\python\lingxi\lingxi\utils\log_filters.py) - 日志过滤器
- [lingxi/utils/logging.py](file:///d:\resource\python\lingxi\lingxi\utils\logging.py) - 日志配置
