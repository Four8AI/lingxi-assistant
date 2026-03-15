/**
 * 聊天相关 API
 */
import apiClient from './client'

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  session_id: string
  created_at: string
  tokens?: number
}

export interface SendMessageRequest {
  content: string
  session_id: string
  model?: string
  stream?: boolean
}

export interface SendMessageResponse {
  id: string
  content: string
  role: string
  created_at: string
  tokens?: number
}

/**
 * 发送消息
 */
export async function sendMessage(data: SendMessageRequest): Promise<SendMessageResponse> {
  const response = await apiClient.post('/api/chat', data)
  return response
}

/**
 * 获取历史消息
 */
export async function getHistoryMessages(
  sessionId: string, 
  limit: number = 50
): Promise<Message[]> {
  try {
    // 调用会话详情接口获取消息历史
    const response = await apiClient.get(`/api/sessions/${sessionId}`)
    
    // 从 task_list 中提取消息历史
    if (response.task_list && Array.isArray(response.task_list)) {
      return response.task_list.slice(0, limit).map((task: any) => ({
        id: `${sessionId}_${task.task_id || Math.random()}`,
        content: task.user_input || task.result || '',
        role: task.user_input ? 'user' : 'assistant',
        session_id: sessionId,
        created_at: task.created_at || new Date().toISOString()
      }))
    }
    return []
  } catch (error) {
    console.error('Failed to get messages:', error)
    return []
  }
}

/**
 * 停止生成
 */
export async function stopGeneration(sessionId: string): Promise<void> {
  try {
    await apiClient.post(`/api/sessions/${sessionId}/stop`)
  } catch (error) {
    // 如果 stop 接口不存在，忽略错误
    console.warn('Stop generation endpoint not available:', error)
  }
}

/**
 * 清除对话历史
 */
export async function clearHistory(sessionId: string): Promise<void> {
  try {
    await apiClient.delete(`/api/sessions/${sessionId}/messages`)
  } catch (error) {
    // 如果 messages 接口不存在，尝试使用 history 接口
    try {
      await apiClient.delete(`/api/sessions/${sessionId}/history`)
    } catch (historyError) {
      // 如果两个接口都失败，忽略错误
      console.warn('Clear history endpoint not available:', historyError)
    }
  }
}
