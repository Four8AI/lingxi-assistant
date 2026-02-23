# 灵犀智能助手 WebSocket API 文档

## 概述

灵犀智能助手支持WebSocket通讯，允许前端通过WebSocket实时调用助手的所有功能。

## 连接信息

- **WebSocket端点**: `ws://localhost:5000/ws`
- **协议**: JSON格式
- **消息类型**: 单向请求-响应模式

## 消息协议

所有消息遵循统一的JSON格式：

```json
{
  "type": "消息类型",
  "success": true/false,
  "data": {},
  "timestamp": 时间戳
}
```

## 消息类型

### 1. 聊天消息 (chat)

发送普通聊天消息。

**请求**:
```json
{
  "type": "chat",
  "content": "你好",
  "session_id": "default"
}
```

**响应**:
```json
{
  "type": "chat",
  "success": true,
  "data": {
    "content": "你好！我是灵犀智能助手...",
    "session_id": "default"
  },
  "timestamp": 1234567890.123
}
```

### 2. 流式聊天 (stream_chat)

发送流式聊天消息，响应会分块返回。

**请求**:
```json
{
  "type": "stream_chat",
  "content": "帮我写一段代码",
  "session_id": "default"
}
```

**响应序列**:
```json
// 流式开始
{
  "type": "stream_start",
  "success": true,
  "data": {"session_id": "default"},
  "timestamp": 1234567890.123
}

// 流式数据块
{
  "type": "stream_chunk",
  "stream": true,
  "chunk_index": 0,
  "is_last": false,
  "content": "这是一段代码...",
  "metadata": {},
  "timestamp": 1234567890.123
}

// 流式结束
{
  "type": "stream_end",
  "success": true,
  "data": {"session_id": "default"},
  "timestamp": 1234567890.123
}
```

### 3. 命令消息 (command)

执行助手命令。

**请求**:
```json
{
  "type": "command",
  "command": "help",
  "args": {},
  "session_id": "default"
}
```

**响应**:
```json
{
  "type": "command",
  "success": true,
  "data": {
    "command": "help",
    "result": {
      "available_commands": [...]
    }
  },
  "timestamp": 1234567890.123
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

### 4. 会话管理 (session)

管理会话。

**切换会话**:
```json
{
  "type": "session",
  "action": "switch",
  "new_session_id": "session_123",
  "session_id": "default"
}
```

**清空会话**:
```json
{
  "type": "session",
  "action": "clear",
  "session_id": "default"
}
```

**列出会话**:
```json
{
  "type": "session",
  "action": "list"
}
```

### 5. 检查点管理 (checkpoint)

管理执行检查点。

**获取检查点状态**:
```json
{
  "type": "checkpoint",
  "action": "status",
  "session_id": "default"
}
```

**清除检查点**:
```json
{
  "type": "checkpoint",
  "action": "clear",
  "session_id": "default"
}
```

**列出所有检查点**:
```json
{
  "type": "checkpoint",
  "action": "list"
}
```

**清理过期检查点**:
```json
{
  "type": "checkpoint",
  "action": "cleanup",
  "ttl_hours": 24
}
```

### 6. 技能管理 (skill)

管理技能。

**列出技能**:
```json
{
  "type": "skill",
  "action": "list"
}
```

**安装技能**:
```json
{
  "type": "skill",
  "action": "install",
  "skill_source": "/path/to/skill",
  "skill_name": "my_skill",
  "overwrite": false
}
```

### 7. 上下文管理 (context)

管理上下文。

**获取上下文统计**:
```json
{
  "type": "context",
  "action": "stats",
  "session_id": "default"
}
```

**压缩上下文**:
```json
{
  "type": "context",
  "action": "compress",
  "strategy": "hybrid",
  "session_id": "default"
}
```

**搜索历史**:
```json
{
  "type": "context",
  "action": "search",
  "query": "搜索关键词",
  "top_k": 5,
  "session_id": "default"
}
```

### 8. 心跳检测 (ping)

保持连接活跃。

**请求**:
```json
{
  "type": "ping"
}
```

**响应**:
```json
{
  "type": "success",
  "success": true,
  "data": {"pong": true},
  "timestamp": 1234567890.123
}
```

## 错误处理

错误消息格式：

```json
{
  "type": "error",
  "success": false,
  "error": "错误描述",
  "details": "详细错误信息",
  "timestamp": 1234567890.123
}
```

## 连接流程

1. 客户端连接到 `ws://localhost:5000/ws`
2. 服务器发送欢迎消息
3. 客户端发送请求消息
4. 服务器返回响应消息
5. 重复步骤3-4
6. 客户端断开连接

## 配置

WebSocket配置在 `config.yaml` 中：

```yaml
web:
  host: "localhost"
  port: 5000
  websocket:
    enabled: true
    path: "/ws"
    ping_interval: 20
    ping_timeout: 30
    max_connections: 100
```

## 使用示例

### Python客户端示例

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

### JavaScript客户端示例

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

## 注意事项

1. 所有消息必须是有效的JSON格式
2. `session_id` 默认为 "default"，可以自定义
3. 流式聊天会返回多个消息，需要按顺序处理
4. 建议定期发送ping消息保持连接活跃
5. 错误消息的 `success` 字段为 `false`

## API端点

除了WebSocket，还提供HTTP API：

- `POST /api/chat` - 聊天接口
- `GET /api/sessions/{session_id}/history` - 获取会话历史
- `DELETE /api/sessions/{session_id}` - 清空会话
- `GET /api/status` - 获取服务器状态

详细API文档请访问: `http://localhost:5000/docs`
