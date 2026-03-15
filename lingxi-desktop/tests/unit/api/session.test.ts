/**
 * Session API 单元测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the apiClient before importing
vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

import { 
  getSessions, 
  createSession, 
  deleteSession,
  renameSession,
  getCurrentSession,
  exportSession 
} from '@/api/session'
import apiClient from '@/api/client'

describe('Session API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should get sessions list', async () => {
    const mockSessions = [
      { id: '1', name: 'Session 1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '2', name: 'Session 2', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ]
    
    vi.mocked(apiClient.get).mockResolvedValue(mockSessions)
    
    const result = await getSessions()
    
    expect(apiClient.get).toHaveBeenCalledWith('/api/sessions')
    expect(result).toEqual(mockSessions)
  })

  it('should create session with name', async () => {
    const mockSession = {
      id: '1',
      name: 'New Session',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    vi.mocked(apiClient.post).mockResolvedValue(mockSession)
    
    const result = await createSession('New Session')
    
    expect(apiClient.post).toHaveBeenCalledWith('/api/sessions', { name: 'New Session' })
    expect(result).toEqual(mockSession)
  })

  it('should create session without name', async () => {
    const mockSession = {
      id: '1',
      name: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    vi.mocked(apiClient.post).mockResolvedValue(mockSession)
    
    const result = await createSession()
    
    expect(apiClient.post).toHaveBeenCalledWith('/api/sessions', { name: undefined })
    expect(result).toEqual(mockSession)
  })

  it('should delete session', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(undefined)
    
    await deleteSession('session-1')
    
    expect(apiClient.delete).toHaveBeenCalledWith('/api/sessions/session-1')
  })

  it('should rename session', async () => {
    const mockSession = {
      id: '1',
      name: 'Renamed Session',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    vi.mocked(apiClient.put).mockResolvedValue(mockSession)
    
    const result = await renameSession('session-1', 'Renamed Session')
    
    expect(apiClient.put).toHaveBeenCalledWith('/api/sessions/session-1', { name: 'Renamed Session' })
    expect(result).toEqual(mockSession)
  })

  it('should get current session', async () => {
    const mockSession = {
      id: '1',
      name: 'Session 1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    vi.mocked(apiClient.get).mockResolvedValue(mockSession)
    
    const result = await getCurrentSession('session-1')
    
    expect(apiClient.get).toHaveBeenCalledWith('/api/sessions/session-1')
    expect(result).toEqual(mockSession)
  })

  it('should handle get sessions error', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'))
    
    await expect(getSessions()).rejects.toThrow('Network error')
  })

  it('should handle create session error', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Failed to create'))
    
    await expect(createSession('Test')).rejects.toThrow('Failed to create')
  })
})
