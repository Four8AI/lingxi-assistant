/**
 * 断点管理 API
 */
import apiClient from './client'

export interface Checkpoint {
  session_id: string
  task: string
  current_step: number
  total_steps: number
  execution_status: string
  updated_at: number
}

/**
 * 获取断点列表
 */
export async function getCheckpoints(): Promise<Checkpoint[]> {
  const response = await apiClient.get('/checkpoints')
  return response.checkpoints
}

/**
 * 恢复断点
 */
export async function resumeCheckpoint(sessionId: string): Promise<{ execution_id: string; task: string; status: string; message: string }> {
  const response = await apiClient.post(`/checkpoints/${sessionId}/resume`)
  return response
}

/**
 * 删除断点
 */
export async function deleteCheckpoint(sessionId: string): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.delete(`/checkpoints/${sessionId}`)
  return response
}

/**
 * 获取断点状态
 */
export async function getCheckpointStatus(sessionId: string): Promise<{ session_id: string; checkpoint_status: any }> {
  const response = await apiClient.get(`/checkpoints/${sessionId}/status`)
  return response
}
