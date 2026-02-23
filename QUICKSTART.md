# 灵犀智能助手 - WebSocket服务快速开始

## 启动服务器

```bash
python start_web_server.py
```

服务器将在以下地址启动：
- HTTP服务: http://localhost:5000
- WebSocket端点: ws://localhost:5000/ws
- Web界面: http://localhost:5000/static/index.html
- API文档: http://localhost:5000/docs

## 访问方式

### 1. Web界面（推荐）

直接在浏览器中打开: http://localhost:5000/static/index.html

### 2. Python客户端

```bash
python examples/websocket_client.py
```

### 3. 自定义客户端

```python
import asyncio
import json
import websockets

async def chat():
    uri = "ws://localhost:5000/ws"
    async with websockets.connect(uri) as ws:
        # 接收欢迎消息
        welcome = await ws.recv()
        print(welcome)

        # 发送聊天消息
        request = {
            "type": "chat",
            "content": "你好",
            "session_id": "default"
        }
        await ws.send(json.dumps(request))

        # 接收响应
        response = await ws.recv()
        print(response)

asyncio.run(chat())
```

### 4. JavaScript客户端

```javascript
const ws = new WebSocket('ws://localhost:5000/ws');

ws.onopen = () => {
    console.log('已连接');
};

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('收到消息:', message);
};

function sendChat(content) {
    ws.send(JSON.stringify({
        type: 'chat',
        content: content,
        session_id: 'default'
    }));
}

sendChat('你好');
```

## 测试功能

运行测试脚本验证所有功能：

```bash
python test_websocket.py
```

## 支持的消息类型

| 类型 | 说明 | 示例 |
|------|------|------|
| chat | 普通聊天 | `{"type": "chat", "content": "你好"}` |
| stream_chat | 流式聊天 | `{"type": "stream_chat", "content": "写代码"}` |
| command | 执行命令 | `{"type": "command", "command": "help"}` |
| session | 会话管理 | `{"type": "session", "action": "clear"}` |
| checkpoint | 检查点管理 | `{"type": "checkpoint", "action": "status"}` |
| skill | 技能管理 | `{"type": "skill", "action": "list"}` |
| context | 上下文管理 | `{"type": "context", "action": "stats"}` |
| ping | 心跳检测 | `{"type": "ping"}` |

## 可用命令

- `help` - 显示帮助
- `clear` - 清空当前会话
- `status` - 显示检查点状态
- `skills` - 列出可用技能
- `context-stats` - 显示上下文统计
- `compress` - 手动触发上下文压缩
- `search` - 检索相关历史
- `session` - 创建或切换会话

## 配置

在 `config.yaml` 中修改配置：

```yaml
web:
  host: "localhost"
  port: 5000
  debug: false
  websocket:
    enabled: true
    path: "/ws"
    max_connections: 100
```

## 文档

- [WebSocket API文档](docs/WebSocket_API.md)
- [Web服务使用说明](README_WEB.md)
- [系统设计文档](docs/灵犀个人智能助手详细设计.md)

## 故障排查

### 连接失败
- 确认服务器已启动
- 检查端口5000是否被占用
- 查看防火墙设置

### 消息无响应
- 检查消息格式是否为有效JSON
- 查看服务器日志
- 确认网络连接正常

## 技术支持

如有问题，请查看服务器日志或联系技术支持。
