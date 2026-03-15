import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAppStore } from '@/stores/app'

describe('App Store', () => {
  let pinia: ReturnType<typeof createPinia>
  let store: ReturnType<typeof useAppStore>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    store = useAppStore()
  })

  it('should initialize with default state', () => {
    expect(store.currentWorkspace).toBe('')
    expect(store.currentSessionId).toBeNull()
    expect(store.sessions).toEqual([])
    expect(store.selectedSessions).toEqual([])
    expect(store.turns).toEqual([])
    expect(store.checkpoints).toEqual([])
    expect(store.activeCheckpoints).toEqual([])
    expect(store.wsConnected).toBe(false)
    expect(store.thoughtChain).toBeNull()
    expect(store.modelRoute).toBeNull()
    expect(store.resourceUsage).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('should set current workspace', () => {
    const workspacePath = '/home/user/project'
    store.setCurrentWorkspace(workspacePath)
    expect(store.currentWorkspace).toBe(workspacePath)
  })

  it('should set current session', () => {
    const sessionId = 'session-123'
    store.setCurrentSession(sessionId)
    expect(store.currentSessionId).toBe(sessionId)
  })

  it('should set sessions', () => {
    const sessions = [
      { id: '1', name: 'Session 1' },
      { id: '2', name: 'Session 2' }
    ]
    store.setSessions(sessions)
    expect(store.sessions).toEqual(sessions)
  })

  it('should set turns', () => {
    const turns = [
      { id: '1', role: 'user', content: 'Hello' },
      { id: '2', role: 'assistant', content: 'Hi there' }
    ]
    store.setTurns(turns)
    expect(store.turns).toEqual(turns)
  })

  it('should set checkpoints', () => {
    const checkpoints = [
      { id: '1', name: 'Checkpoint 1', timestamp: Date.now() }
    ]
    store.setCheckpoints(checkpoints)
    expect(store.checkpoints).toEqual(checkpoints)
    expect(store.activeCheckpoints).toEqual(checkpoints)
  })

  it('should set WebSocket connection status', () => {
    store.setWsConnected(true)
    expect(store.wsConnected).toBe(true)
    
    store.setWsConnected(false)
    expect(store.wsConnected).toBe(false)
  })

  it('should set thought chain', () => {
    const thoughtChain = {
      taskId: 'task-1',
      steps: [{ description: 'Step 1' }],
      status: 'running'
    }
    store.setThoughtChain(thoughtChain)
    expect(store.thoughtChain).toEqual(thoughtChain)
  })

  it('should set model route', () => {
    const modelRoute = { provider: 'openai', model: 'gpt-4' }
    store.setModelRoute(modelRoute)
    expect(store.modelRoute).toEqual(modelRoute)
  })

  it('should set resource usage', () => {
    const resourceUsage = { cpu: 50, memory: 60, disk: 30 }
    store.setResourceUsage(resourceUsage)
    expect(store.resourceUsage).toEqual(resourceUsage)
  })

  it('should set loading state', () => {
    store.setLoading(true)
    expect(store.loading).toBe(true)
    
    store.setLoading(false)
    expect(store.loading).toBe(false)
  })

  it('should add a new session', () => {
    const sessionName = 'New Session'
    const sessionId = store.addSession(sessionName)
    
    expect(sessionId).toBeDefined()
    expect(store.sessions).toHaveLength(1)
    expect(store.sessions[0]).toEqual({
      id: sessionId,
      name: sessionName
    })
  })

  it('should delete a session', () => {
    const sessions = [
      { id: '1', name: 'Session 1' },
      { id: '2', name: 'Session 2' }
    ]
    store.setSessions(sessions)
    
    store.deleteSession('1')
    expect(store.sessions).toHaveLength(1)
    expect(store.sessions[0].id).toBe('2')
  })

  it('should toggle session selection', () => {
    store.toggleSessionSelection('session-1')
    expect(store.selectedSessions).toContain('session-1')
    
    store.toggleSessionSelection('session-1')
    expect(store.selectedSessions).not.toContain('session-1')
  })
})
