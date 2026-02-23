# 灵犀智能助手 - WebSocket服务

## 概述

灵犀智能助手现在支持WebSocket通讯，可以通过WebSocket实时调用助手的所有功能，包括任务分析、执行引擎、会话管理、技能调用等。

## 快速开始

### 1. 启动WebSocket服务器

```bash
python start_web_server.py
```

服务器将在 `http://localhost:5000` 启动，WebSocket端点为 `ws://localhost:5000/ws`

### 2. 访问Web界面

在浏览器中打开: `http://localhost:5000/static/index.html`

### 3. 使用Python客户端

```bash
python examples/websocket_client.py
```

## 配置

在 `config.yaml` 中配置WebSocket服务：

```yaml
web:
  host: "localhost"
  port: 5000
  debug: false
  websocket:
    enabled: true
    path: "/ws"
    ping_interval: 20
    ping_timeout: 30
    max_connections: 100
```

## WebSocket API

### 消息类型

#### 1. 聊天消息 (chat)

```json
{
  "type": "chat",
  "content": "你好",
  "session_id": "default"
}
```

#### 2. 流式聊天 (stream_chat)

```json
{
  "type": "stream_chat",
  "content": "帮我写一段代码",
  "session_id": "default"
}
```

#### 3. 命令消息 (command)

```json
{
  "type": "command",
  "command": "help",
  "args": {},
  "session_id": "default"
}
```

**可用命令**:
- `help` - 显示帮助
- `clear` - 清空当前会话
- `status` - 显示检查点状态
- `skills` - 列出可用技能
- `context-stats` - 显示上下文统计
- `compress` - 手动触发上下文压缩
- `search` - 检索相关历史
- `session` - 创建或切换会话

#### 4. 会话管理 (session)

```json
{
  "type": "session",
  "action": "switch",
  "new_session_id": "session_123",
  "session_id": "default"
}
```

#### 5. 检查点管理 (checkpoint)

```json
{
  "type": "checkpoint",
  "action": "status",
  "session_id": "default"
}
```

#### 6. 技能管理 (skill)

```json
{
  "type": "skill",
  "action": "list"
}
```

#### 7. 上下文管理 (context)

```json
{
  "type": "context",
  "action": "stats",
  "session_id": "default"
}
```

## 客户端示例

### Python客户端

```python
import asyncio
import json
import websockets

async def chat_example():
    uri = "ws://localhost:5000/ws"
    async with websockets.connect(uri) as websocket:
        # 接收欢迎消息
        welcome = await websocket.recv()
        print(f"欢迎: {welcome}")

        # 发送聊天消息
        request = {
            "type": "chat",
            "content": "你好",
            "session_id": "default"
        }
        await websocket.send(json.dumps(request))

        # 接收响应
        response = await websocket.recv()
        print(f"响应: {response}")

asyncio.run(chat_example())
```

### JavaScript客户端

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

## HTTP API

除了WebSocket，还提供HTTP API：

- `POST /api/chat` - 聊天接口
- `GET /api/sessions/{session_id}/history` - 获取会话历史
- `DELETE /api/sessions/{session_id}` - 清空会话
- `GET /api/status` - 获取服务器状态

详细API文档请访问: `http://localhost:5000/docs`

## 功能特性

### 1. 实时通讯
- WebSocket双向通讯
- 支持流式输出
- 心跳检测保持连接

### 2. 会话管理
- 多会话支持
- 会话切换
- 会话历史查询
- 会话清空

### 3. 检查点管理
- 查看检查点状态
- 清除检查点
- 列出所有检查点
- 清理过期检查点

### 4. 技能管理
- 列出可用技能
- 安装新技能

### 5. 上下文管理
- 查看上下文统计
- 手动压缩上下文
- 搜索历史记录

## 文件结构

```
lingxi/
├── web/
│   ├── fastapi_server.py      # FastAPI服务器
│   ├── websocket.py           # WebSocket管理器
│   ├── routes/
│   │   ├── chat.py            # 聊天路由
│   │   └── health.py          # 健康检查路由
│   └── static/
│       └── index.html         # Web界面
├── examples/
│   └── websocket_client.py    # Python客户端示例
├── docs/
│   └── WebSocket_API.md       # WebSocket API文档
├── config.yaml                # 配置文件
└── start_web_server.py        # 启动脚本
```

## 注意事项

1. 所有消息必须是有效的JSON格式
2. `session_id` 默认为 "default"，可以自定义
3. 流式聊天会返回多个消息，需要按顺序处理
4. 建议定期发送ping消息保持连接活跃
5. 错误消息的 `success` 字段为 `false`

## 故障排查

### 连接失败
- 检查服务器是否启动
- 检查防火墙设置
- 确认端口号正确

### 消息无响应
- 检查消息格式是否正确
- 查看服务器日志
- 确认网络连接正常

### 流式输出异常
- 确保客户端支持流式消息处理
- 检查网络稳定性
- 查看服务器日志

## 技术支持

详细API文档请参考: [WebSocket_API.md](docs/WebSocket_API.md)

设计文档请参考: [灵犀个人智能助手详细设计.md](docs/灵犀个人智能助手详细设计.md)
