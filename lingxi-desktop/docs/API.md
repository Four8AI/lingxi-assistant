# API 文档

## API 客户端使用指南

灵犀助手使用 Axios 作为 HTTP 客户端，所有 API 调用都通过统一的客户端实例进行。

### 基础配置

```typescript
// src/api/client.ts
import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})
```

### 环境变量

通过 `VITE_API_URL` 环境变量配置 API 地址：

```bash
# .env
VITE_API_URL=http://localhost:5000
```

### 拦截器

#### 请求拦截器

自动添加认证 Token：

```typescript
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

#### 响应拦截器

统一错误处理：

```typescript
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data)
    } else if (error.request) {
      console.error('Network Error:', error.request)
    } else {
      console.error('Error:', error.message)
    }
    return Promise.reject(error)
  }
)
```

## 可用 API 列表

### 会话管理 API (`src/api/session.ts`)

#### 获取会话列表

```typescript
import { getSessions } from '@/api/session'

const sessions = await getSessions()
// 返回：Session[]
```

#### 创建会话

```typescript
import { createSession } from '@/api/session'

const session = await createSession('新会话名称')
// 返回：Session
```

#### 删除会话

```typescript
import { deleteSession } from '@/api/session'

await deleteSession('session-id')
// 返回：void
```

#### 重命名会话

```typescript
import { renameSession } from '@/api/session'

const session = await renameSession('session-id', '新名称')
// 返回：Session
```

#### 获取会话详情

```typescript
import { getCurrentSession } from '@/api/session'

const session = await getCurrentSession('session-id')
// 返回：Session
```

#### 导出会话

```typescript
import { exportSession } from '@/api/session'

const blob = await exportSession('session-id', 'json')
// 返回：Blob
// format: 'json' | 'markdown'
```

### 聊天 API (`src/api/chat.ts`)

#### 发送消息

```typescript
import { sendMessage } from '@/api/chat'

const message = await sendMessage({
  content: '你好',
  session_id: 'session-id',
  model: 'qwen-max',
  stream: true
})
// 返回：Message
```

#### 获取历史消息

```typescript
import { getHistoryMessages } from '@/api/chat'

const messages = await getHistoryMessages('session-id', 50)
// 返回：Message[]
// limit: 默认 50
```

#### 停止生成

```typescript
import { stopGeneration } from '@/api/chat'

await stopGeneration('session-id')
// 返回：void
```

#### 清除历史

```typescript
import { clearHistory } from '@/api/chat'

await clearHistory('session-id')
// 返回：void
```

### 文件 API (`src/api/file.ts`)

#### 读取文件

```typescript
import { readFile } from '@/api/file'

const content = await readFile('/path/to/file.txt')
// 返回：string
```

#### 写入文件

```typescript
import { writeFile } from '@/api/file'

await writeFile('/path/to/file.txt', 'content')
// 返回：void
```

#### 读取目录树

```typescript
import { readDirectoryTree } from '@/api/file'

const tree = await readDirectoryTree('/path/to/dir', 3)
// 返回：FileTreeNode[]
// maxDepth: 默认 3
```

## 类型定义

### Session

```typescript
interface Session {
  id: string
  name: string
  created_at: string
  updated_at: string
  message_count?: number
}
```

### Message

```typescript
interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  session_id: string
  created_at: string
  tokens?: number
}
```

### FileTreeNode

```typescript
interface FileTreeNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileTreeNode[]
}
```

## 错误处理

### 统一错误处理

所有 API 调用都应该使用 try-catch 处理错误：

```typescript
try {
  const sessions = await getSessions()
} catch (error) {
  console.error('Failed to load sessions:', error)
  // 显示错误提示给用户
}
```

### 错误类型

| 错误类型 | HTTP 状态码 | 处理方式 |
|---------|------------|---------|
| 网络错误 | - | 检查网络连接，重试 |
| 400 Bad Request | 400 | 检查请求参数 |
| 401 Unauthorized | 401 | 重新登录 |
| 403 Forbidden | 403 | 检查权限 |
| 404 Not Found | 404 | 资源不存在 |
| 500 Server Error | 500 | 联系后端，稍后重试 |

### 错误提示

使用 Element Plus 的 Message 组件显示错误：

```typescript
import { ElMessage } from 'element-plus'

try {
  await deleteSession(id)
} catch (error) {
  ElMessage.error('删除会话失败：' + (error as Error).message)
}
```

## 示例代码

### 完整的会话管理示例

```typescript
import { useSessionStore } from '@/stores/session'
import { ElMessage, ElMessageBox } from 'element-plus'

// 在组件中使用
const sessionStore = useSessionStore()

// 加载会话列表
const loadSessions = async () => {
  try {
    await sessionStore.loadSessions()
    ElMessage.success('会话加载成功')
  } catch (error) {
    ElMessage.error('加载失败：' + (error as Error).message)
  }
}

// 创建新会话
const createNewSession = async () => {
  try {
    const session = await sessionStore.createNewSession('新会话')
    ElMessage.success('会话创建成功')
  } catch (error) {
    ElMessage.error('创建失败：' + (error as Error).message)
  }
}

// 删除会话（带确认）
const deleteSessionConfirm = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除此会话吗？', '确认删除')
    await sessionStore.deleteSession(id)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + (error as Error).message)
    }
  }
}
```

### 消息发送示例

```typescript
import { useChatStore } from '@/stores/chat'

const chatStore = useChatStore()

// 发送消息
const sendMessage = async (content: string) => {
  try {
    await chatStore.sendMessage(content, currentSessionId.value)
  } catch (error) {
    ElMessage.error('发送失败：' + (error as Error).message)
  }
}

// 加载历史消息
const loadHistory = async () => {
  try {
    await chatStore.loadHistory(currentSessionId.value, 50)
  } catch (error) {
    ElMessage.error('加载历史失败：' + (error as Error).message)
  }
}
```

## WebSocket 使用

### 连接 WebSocket

```typescript
import { useWebSocketStore } from '@/stores/websocket'

const wsStore = useWebSocketStore()

// 连接到会话
wsStore.connect(sessionId)

// 监听事件
wsStore.on('thought_chain', handleThoughtChain)
wsStore.on('step_start', handleStepStart)
wsStore.on('step_end', handleStepEnd)
wsStore.on('task_end', handleTaskEnd)
```

### WebSocket 事件类型

| 事件 | 说明 |
|------|------|
| `thought_chain` | 思考链更新 |
| `step_start` | 步骤开始 |
| `step_end` | 步骤结束 |
| `task_start` | 任务开始 |
| `task_end` | 任务结束 |
| `task_failed` | 任务失败 |
| `heartbeat` | 心跳包 |

## 最佳实践

1. **统一使用 API 模块**：不要直接调用 axios，使用封装好的 API 函数
2. **类型安全**：使用 TypeScript 类型定义，避免类型错误
3. **错误处理**：所有 API 调用都要处理错误
4. **加载状态**：使用 Store 的 isLoading 状态显示加载指示器
5. **取消请求**：组件卸载时取消未完成的请求
