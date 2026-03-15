/**
 * 会话管理 API
 */
import apiClient from './client'

export interface Session {
  id: string
  name: string
  created_at: string
  updated_at: string
  message_count?: number
}

/**
 * 获取会话列表
 */
export async function getSessions(): Promise<Session[]> {
  const response = await apiClient.get('/api/sessions')
  return response
}

/**
 * 创建新会话
 */
export async function createSession(name?: string): Promise<Session> {
  const response = await apiClient.post('/api/sessions', { name })
  return response
}

/**
 * 删除会话
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await apiClient.delete(`/api/sessions/${sessionId}`)
}

/**
 * 重命名会话
 */
export async function renameSession(
  sessionId: string, 
  name: string
): Promise<Session> {
  const response = await apiClient.put(`/api/sessions/${sessionId}`, { name })
  return response
}

/**
 * 获取当前会话
 */
export async function getCurrentSession(sessionId: string): Promise<Session> {
  const response = await apiClient.get(`/api/sessions/${sessionId}`)
  return response
}

/**
 * 导出会话
 */
export async function exportSession(
  sessionId: string,
  format: 'json' | 'markdown' = 'json'
): Promise<Blob> {
  const response = await apiClient.get(
    `/api/sessions/${sessionId}/export`,
    {
      params: { format },
      responseType: 'blob'
    }
  )
  return response
}
