/**
 * Session Store 单元测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSessionStore } from '@/stores/session'
import * as sessionApi from '@/api/session'

describe('Session Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const store = useSessionStore()
    expect(store.sessions).toEqual([])
    expect(store.currentSessionId).toBe(null)
    expect(store.isLoading).toBe(false)
    expect(store.error).toBe(null)
  })

  it('should load sessions successfully', async () => {
    const mockSessions = [
      { id: '1', name: 'Session 1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '2', name: 'Session 2', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ]
    
    vi.spyOn(sessionApi, 'getSessions').mockResolvedValue(mockSessions)
    
    const store = useSessionStore()
    await store.loadSessions()
    
    expect(store.sessions).toEqual(mockSessions)
    expect(store.isLoading).toBe(false)
    expect(store.hasSessions).toBe(true)
    expect(store.sessionCount).toBe(2)
  })

  it('should handle load sessions error', async () => {
    vi.spyOn(sessionApi, 'getSessions').mockRejectedValue(new Error('Failed to load'))
    
    const store = useSessionStore()
    await expect(store.loadSessions()).rejects.toThrow('Failed to load')
    expect(store.isLoading).toBe(false)
    expect(store.error).toBe('Failed to load')
  })

  it('should create new session', async () => {
    const mockSession = {
      id: '1',
      name: 'New Session',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    vi.spyOn(sessionApi, 'createSession').mockResolvedValue(mockSession)
    
    const store = useSessionStore()
    await store.createNewSession('New Session')
    
    expect(store.sessions.length).toBe(1)
    expect(store.currentSessionId).toBe('1')
    expect(store.sessions[0]).toEqual(mockSession)
  })

  it('should delete session', async () => {
    const mockSessions = [
      { id: '1', name: 'Session 1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '2', name: 'Session 2', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ]
    
    vi.spyOn(sessionApi, 'deleteSession').mockResolvedValue(undefined)
    
    const store = useSessionStore()
    store.sessions = mockSessions
    store.currentSessionId = '2'
    
    await store.deleteSession('2')
    
    expect(store.sessions.length).toBe(1)
    expect(store.sessions[0].id).toBe('1')
    expect(store.currentSessionId).toBe('1')
  })

  it('should rename session', async () => {
    const mockSession = {
      id: '1',
      name: 'Renamed Session',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    vi.spyOn(sessionApi, 'renameSession').mockResolvedValue(mockSession)
    
    const store = useSessionStore()
    store.sessions = [{ id: '1', name: 'Old Name', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]
    
    await store.renameSession('1', 'Renamed Session')
    
    expect(store.sessions[0].name).toBe('Renamed Session')
  })

  it('should set current session', () => {
    const store = useSessionStore()
    store.sessions = [
      { id: '1', name: 'Session 1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ]
    
    store.setCurrentSession('1')
    expect(store.currentSessionId).toBe('1')
    expect(store.currentSession?.name).toBe('Session 1')
  })

  it('should add session to list', () => {
    const store = useSessionStore()
    const session = {
      id: '1',
      name: 'New Session',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    store.addSession(session)
    
    expect(store.sessions.length).toBe(1)
    expect(store.currentSessionId).toBe('1')
  })

  it('should update session', () => {
    const store = useSessionStore()
    store.sessions = [
      { id: '1', name: 'Session 1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ]
    
    store.updateSession('1', { name: 'Updated Session' })
    
    expect(store.sessions[0].name).toBe('Updated Session')
  })

  it('should set sessions batch', () => {
    const store = useSessionStore()
    const sessions = [
      { id: '1', name: 'Session 1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '2', name: 'Session 2', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ]
    
    store.setSessions(sessions)
    
    expect(store.sessions).toEqual(sessions)
    expect(store.sessionCount).toBe(2)
  })

  it('should have correct getters', () => {
    const store = useSessionStore()
    
    expect(store.hasSessions).toBe(false)
    expect(store.currentSession).toBe(null)
    expect(store.sessionCount).toBe(0)
    
    store.sessions = [
      { id: '1', name: 'Session 1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ]
    store.currentSessionId = '1'
    
    expect(store.hasSessions).toBe(true)
    expect(store.currentSession?.name).toBe('Session 1')
    expect(store.sessionCount).toBe(1)
  })
})
