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
  const response = await apiClient.get(`/api/sessions/${sessionId}/messages`, {
    params: { limit }
  })
  return response
}

/**
 * 停止生成
 */
export async function stopGeneration(sessionId: string): Promise<void> {
  await apiClient.post(`/api/sessions/${sessionId}/stop`)
}

/**
 * 清除对话历史
 */
export async function clearHistory(sessionId: string): Promise<void> {
  await apiClient.delete(`/api/sessions/${sessionId}/messages`)
}
