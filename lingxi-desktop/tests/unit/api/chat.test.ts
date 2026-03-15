/**
 * Chat API 单元测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the apiClient before importing
vi.mock('@/api/client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn()
  }
}))

import { sendMessage, getHistoryMessages, stopGeneration, clearHistory } from '@/api/chat'
import apiClient from '@/api/client'

describe('Chat API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should send message successfully', async () => {
    const mockResponse = {
      id: '1',
      content: 'Hello',
      role: 'assistant',
      created_at: new Date().toISOString()
    }
    
    vi.mocked(apiClient.post).mockResolvedValue(mockResponse)
    
    const result = await sendMessage({
      content: 'Test message',
      session_id: 'session-1'
    })
    
    expect(apiClient.post).toHaveBeenCalledWith('/api/chat', {
      content: 'Test message',
      session_id: 'session-1'
    })
    expect(result).toEqual(mockResponse)
  })

  it('should get history messages', async () => {
    const mockMessages = [
      { id: '1', content: 'Hello', role: 'user', session_id: 'session-1', created_at: new Date().toISOString() },
      { id: '2', content: 'Hi', role: 'assistant', session_id: 'session-1', created_at: new Date().toISOString() }
    ]
    
    vi.mocked(apiClient.get).mockResolvedValue(mockMessages)
    
    const result = await getHistoryMessages('session-1', 50)
    
    expect(apiClient.get).toHaveBeenCalledWith('/api/sessions/session-1/messages', {
      params: { limit: 50 }
    })
    expect(result).toEqual(mockMessages)
  })

  it('should use default limit for history messages', async () => {
    const mockMessages: any[] = []
    vi.mocked(apiClient.get).mockResolvedValue(mockMessages)
    
    await getHistoryMessages('session-1')
    
    expect(apiClient.get).toHaveBeenCalledWith('/api/sessions/session-1/messages', {
      params: { limit: 50 }
    })
  })

  it('should stop generation', async () => {
    vi.mocked(apiClient.post).mockResolvedValue(undefined)
    
    await stopGeneration('session-1')
    
    expect(apiClient.post).toHaveBeenCalledWith('/api/sessions/session-1/stop')
  })

  it('should clear history', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(undefined)
    
    await clearHistory('session-1')
    
    expect(apiClient.delete).toHaveBeenCalledWith('/api/sessions/session-1/messages')
  })

  it('should handle send message error', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Network error'))
    
    await expect(sendMessage({
      content: 'Test',
      session_id: 'session-1'
    })).rejects.toThrow('Network error')
  })

  it('should handle get history error', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Not found'))
    
    await expect(getHistoryMessages('session-1')).rejects.toThrow('Not found')
  })
})
