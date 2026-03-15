import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useWorkspaceStore } from '@/stores/workspace'
import * as workspaceApi from '@/api/workspace'
import * as skillsApi from '@/api/skills'

describe('Workspace Store', () => {
  let pinia: ReturnType<typeof createPinia>
  let store: ReturnType<typeof useWorkspaceStore>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    store = useWorkspaceStore()
    vi.clearAllMocks()
  })

  it('should initialize with default state', () => {
    expect(store.currentWorkspace).toBeNull()
    expect(store.switchDialogVisible).toBe(false)
    expect(store.initializerVisible).toBe(false)
    expect(store.workspaceSkillsCount).toBe(0)
    expect(store.fileWatcherEnabled).toBe(false)
    expect(store.isInitialized).toBe(false)
    expect(store.workspacePath).toBeNull()
    expect(store.lingxiDir).toBeNull()
  })

  it('should open and close switch dialog', () => {
    store.openSwitchDialog()
    expect(store.switchDialogVisible).toBe(true)
    
    store.closeSwitchDialog()
    expect(store.switchDialogVisible).toBe(false)
  })

  it('should open and close initializer', () => {
    store.openInitializer()
    expect(store.initializerVisible).toBe(true)
    
    store.closeInitializer()
    expect(store.initializerVisible).toBe(false)
  })

  it('should compute isInitialized correctly', async () => {
    expect(store.isInitialized).toBe(false)
    
    store.currentWorkspace = {
      workspace: '/home/user/project',
      lingxi_dir: '/home/user/project/.lingxi',
      is_initialized: true
    }
    
    expect(store.isInitialized).toBe(true)
  })

  it('should compute workspacePath correctly', async () => {
    expect(store.workspacePath).toBeNull()
    
    store.currentWorkspace = {
      workspace: '/home/user/project',
      lingxi_dir: '/home/user/project/.lingxi',
      is_initialized: true
    }
    
    expect(store.workspacePath).toBe('/home/user/project')
  })

  it('should compute lingxiDir correctly', async () => {
    expect(store.lingxiDir).toBeNull()
    
    store.currentWorkspace = {
      workspace: '/home/user/project',
      lingxi_dir: '/home/user/project/.lingxi',
      is_initialized: true
    }
    
    expect(store.lingxiDir).toBe('/home/user/project/.lingxi')
  })

  it('should load current workspace', async () => {
    const mockWorkspace = {
      workspace: '/home/user/project',
      lingxi_dir: '/home/user/project/.lingxi',
      is_initialized: true
    }
    
    const getCurrentWorkspaceMock = vi.spyOn(workspaceApi, 'getCurrentWorkspace').mockResolvedValue(mockWorkspace)
    const getSkillsMock = vi.spyOn(skillsApi, 'getSkills').mockResolvedValue([])
    
    await store.loadCurrentWorkspace()
    
    expect(getCurrentWorkspaceMock).toHaveBeenCalled()
    expect(store.currentWorkspace).toEqual(mockWorkspace)
  })

  it('should load workspace skills', async () => {
    const mockSkills = [
      { name: 'Skill 1', source: 'workspace' },
      { name: 'Skill 2', source: 'workspace' },
      { name: 'Skill 3', source: 'system' }
    ]
    
    const getSkillsMock = vi.spyOn(skillsApi, 'getSkills').mockResolvedValue(mockSkills)
    
    await store.loadWorkspaceSkills()
    
    expect(getSkillsMock).toHaveBeenCalled()
    expect(store.workspaceSkillsCount).toBe(2)
  })

  it('should handle load workspace skills error', async () => {
    const getSkillsMock = vi.spyOn(skillsApi, 'getSkills').mockRejectedValue(new Error('Failed to load skills'))
    
    await store.loadWorkspaceSkills()
    
    expect(store.workspaceSkillsCount).toBe(0)
  })

  it('should switch workspace', async () => {
    const mockResult = { success: true }
    const switchWorkspaceMock = vi.spyOn(workspaceApi, 'switchWorkspace').mockResolvedValue(mockResult)
    const getCurrentWorkspaceMock = vi.spyOn(workspaceApi, 'getCurrentWorkspace').mockResolvedValue(null)
    const getSkillsMock = vi.spyOn(skillsApi, 'getSkills').mockResolvedValue([])
    
    // Mock the dynamic imports
    vi.mock('@/stores/session', () => ({
      useSessionStore: vi.fn().mockReturnValue({
        loadSessions: vi.fn().mockResolvedValue({ sessions: [] }),
        sessions: []
      })
    }))
    
    vi.mock('@/stores/app', () => ({
      useAppStore: vi.fn().mockReturnValue({
        setSessions: vi.fn(),
        setCurrentSession: vi.fn(),
        setTurns: vi.fn()
      })
    }))
    
    await store.switchWorkspace('/home/user/new-project')
    
    expect(switchWorkspaceMock).toHaveBeenCalledWith('/home/user/new-project', false)
  })

  it('should initialize workspace', async () => {
    const mockResult = { success: true }
    const initializeWorkspaceMock = vi.spyOn(workspaceApi, 'initializeWorkspace').mockResolvedValue(mockResult)
    const getCurrentWorkspaceMock = vi.spyOn(workspaceApi, 'getCurrentWorkspace').mockResolvedValue(null)
    
    await store.initializeWorkspace('/home/user/project')
    
    expect(initializeWorkspaceMock).toHaveBeenCalledWith('/home/user/project')
  })

  it('should set directory tree refresh callback', () => {
    const mockCallback = vi.fn()
    store.setDirectoryTreeRefreshCallback(mockCallback)
    // 验证回调被设置（通过调用它来验证）
    store.refreshDirectoryTree([])
    // 如果 callback 被设置，refreshDirectoryTree 会调用它
  })

  it('should handle workspace files changed event', () => {
    const mockEvent = {
      source: 'manual',
      changes: [{ path: '/file.txt', type: 'added' }]
    }
    
    store.handleWorkspaceFilesChanged(mockEvent)
    // Should not throw
  })
})
