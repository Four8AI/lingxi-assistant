import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HistoryChat from '@/components/HistoryChat.vue'
import { useAppStore } from '@/stores/app'
import { useWorkspaceStore } from '@/stores/workspace'

// Mock ElMessageBox
vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElMessageBox: {
      prompt: vi.fn().mockResolvedValue({ value: 'New Name' }),
      confirm: vi.fn().mockResolvedValue(true)
    }
  }
})

describe('HistoryChat Component', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  const mockSessions = [
    {
      id: 'session-1',
      name: 'First Session',
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 1800000
    },
    {
      id: 'session-2',
      name: 'Second Session',
      createdAt: Date.now() - 7200000,
      updatedAt: Date.now() - 3600000
    }
  ]

  it('should render correctly', () => {
    const wrapper = mount(HistoryChat, {
      global: {
        plugins: [pinia]
      }
    })
    
    expect(wrapper.find('.history-chat').exists()).toBe(true)
    expect(wrapper.find('.history-chat-workspace').exists()).toBe(true)
    expect(wrapper.find('.history-chat-list').exists()).toBe(true)
  })

  it('should display workspace section', () => {
    const wrapper = mount(HistoryChat, {
      global: {
        plugins: [pinia]
      }
    })
    
    expect(wrapper.text()).toContain('当前工作区')
  })

  it('should display new session button', () => {
    const wrapper = mount(HistoryChat, {
      global: {
        plugins: [pinia]
      }
    })
    
    expect(wrapper.text()).toContain('新建会话')
  })

  it('should display session list header', () => {
    const wrapper = mount(HistoryChat, {
      global: {
        plugins: [pinia]
      }
    })
    
    expect(wrapper.text()).toContain('会话历史')
  })

  it('should show empty state when no sessions', () => {
    const wrapper = mount(HistoryChat, {
      global: {
        plugins: [pinia]
      }
    })
    
    expect(wrapper.text()).toContain('暂无会话历史')
    expect(wrapper.text()).toContain('点击上方"新建会话"开始对话')
  })

  it('should display sessions when available', async () => {
    const appStore = useAppStore()
    appStore.setSessions(mockSessions)
    
    const wrapper = mount(HistoryChat, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const items = wrapper.findAll('.history-chat-item')
    expect(items.length).toBe(2)
    expect(wrapper.text()).toContain('First Session')
    expect(wrapper.text()).toContain('Second Session')
  })

  it('should display session count', async () => {
    const appStore = useAppStore()
    appStore.setSessions(mockSessions)
    
    const wrapper = mount(HistoryChat, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('2')
  })

  it('should highlight active session', async () => {
    const appStore = useAppStore()
    appStore.setSessions(mockSessions)
    appStore.setCurrentSession('session-1')
    
    const wrapper = mount(HistoryChat, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const activeItem = wrapper.find('.history-chat-item.active')
    expect(activeItem.text()).toContain('First Session')
  })

  it('should call handleSelectSession when session is clicked', async () => {
    const appStore = useAppStore()
    appStore.setSessions(mockSessions)
    window.electronAPI.api.getSessionInfo = vi.fn().mockResolvedValue({ task_list: [] })
    
    const wrapper = mount(HistoryChat, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const firstItem = wrapper.find('.history-chat-item')
    await firstItem.trigger('click')
    
    expect(appStore.currentSessionId).toBe('session-1')
  })

  it('should call handleNewSession when new session button is clicked', async () => {
    window.electronAPI.api.createSession = vi.fn().mockResolvedValue({
      session_id: 'new-session',
      first_message: 'New Session'
    })
    
    const wrapper = mount(HistoryChat, {
      global: {
        plugins: [pinia]
      }
    })
    
    const newSessionButton = wrapper.findAll('button').find(btn => btn.text().includes('新建会话'))
    await newSessionButton?.trigger('click')
    await wrapper.vm.$nextTick()
    
    expect(window.electronAPI.api.createSession).toHaveBeenCalled()
  })

  it('should add new session to list after creation', async () => {
    window.electronAPI.api.createSession = vi.fn().mockResolvedValue({
      session_id: 'new-session',
      first_message: 'New Session'
    })
    window.electronAPI.api.getSessionInfo = vi.fn().mockResolvedValue({ task_list: [] })
    
    const appStore = useAppStore()
    
    const wrapper = mount(HistoryChat, {
      global: {
        plugins: [pinia]
      }
    })
    
    const newSessionButton = wrapper.findAll('button').find(btn => btn.text().includes('新建会话'))
    await newSessionButton?.trigger('click')
    await wrapper.vm.$nextTick()
    
    expect(appStore.sessions.length).toBe(1)
    expect(appStore.sessions[0].id).toBe('new-session')
  })

  it('should show rename option in dropdown', async () => {
    const appStore = useAppStore()
    appStore.setSessions(mockSessions)
    
    const wrapper = mount(HistoryChat, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    // Hover to show actions
    const firstItem = wrapper.find('.history-chat-item')
    await firstItem.trigger('mouseenter')
    
    expect(wrapper.text()).toContain('重命名')
  })

  it('should show delete option in dropdown', async () => {
    const appStore = useAppStore()
    appStore.setSessions(mockSessions)
    
    const wrapper = mount(HistoryChat, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const firstItem = wrapper.find('.history-chat-item')
    await firstItem.trigger('mouseenter')
    
    expect(wrapper.text()).toContain('删除会话')
  })

  it('should call handleSelectWorkspace when workspace icon is clicked', async () => {
    window.electronAPI.file.selectDirectory = vi.fn().mockResolvedValue('/test/workspace')
    window.electronAPI.workspace.validate = vi.fn().mockResolvedValue({ valid: true, message: 'Valid' })
    window.electronAPI.workspace.switch = vi.fn().mockResolvedValue({ success: true })
    window.electronAPI.api.getWorkspaceSessions = vi.fn().mockResolvedValue({ sessions: [] })
    
    const wrapper = mount(HistoryChat, {
      global: {
        plugins: [pinia]
      }
    })
    
    const workspaceIcon = wrapper.find('.workspace-icon')
    await workspaceIcon.trigger('click')
    
    expect(window.electronAPI.file.selectDirectory).toHaveBeenCalled()
  })

  it('should format recent time correctly', () => {
    const wrapper = mount(HistoryChat, {
      global: {
        plugins: [pinia]
      }
    })
    
    const vm = wrapper.vm as any
    const recentTime = vm.formatSessionTime(Date.now() - 30000)
    expect(recentTime).toBe('刚刚')
  })

  it('should format minutes ago correctly', () => {
    const wrapper = mount(HistoryChat, {
      global: {
        plugins: [pinia]
      }
    })
    
    const vm = wrapper.vm as any
    const minutesAgo = vm.formatSessionTime(Date.now() - 120000)
    expect(minutesAgo).toContain('分钟前')
  })

  it('should format hours ago correctly', () => {
    const wrapper = mount(HistoryChat, {
      global: {
        plugins: [pinia]
      }
    })
    
    const vm = wrapper.vm as any
    const hoursAgo = vm.formatSessionTime(Date.now() - 7200000)
    expect(hoursAgo).toContain('小时前')
  })

  it('should format days ago correctly', () => {
    const wrapper = mount(HistoryChat, {
      global: {
        plugins: [pinia]
      }
    })
    
    const vm = wrapper.vm as any
    const daysAgo = vm.formatSessionTime(Date.now() - 172800000)
    expect(daysAgo).toContain('天前')
  })

  it('should handle rename command', async () => {
    const appStore = useAppStore()
    appStore.setSessions(mockSessions)
    window.electronAPI.api.updateSessionName = vi.fn().mockResolvedValue(undefined)
    
    const wrapper = mount(HistoryChat, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const vm = wrapper.vm as any
    await vm.handleCommand('rename', mockSessions[0])
    
    // Should not throw error
    expect(wrapper.vm).toBeDefined()
  })

  it('should handle delete command', async () => {
    const appStore = useAppStore()
    appStore.setSessions(mockSessions)
    window.electronAPI.api.deleteSession = vi.fn().mockResolvedValue(undefined)
    
    const wrapper = mount(HistoryChat, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const vm = wrapper.vm as any
    await vm.handleCommand('delete', mockSessions[1])
    
    expect(appStore.sessions.length).toBe(1)
  })

  it('should filter out sessions without id', async () => {
    const appStore = useAppStore()
    appStore.setSessions([
      { id: 'session-1', name: 'Valid', createdAt: Date.now(), updatedAt: Date.now() },
      { id: null as any, name: 'Invalid', createdAt: Date.now(), updatedAt: Date.now() }
    ])
    
    const wrapper = mount(HistoryChat, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const items = wrapper.findAll('.history-chat-item')
    expect(items.length).toBe(1)
  })

  it('should display workspace path from store', async () => {
    const workspaceStore = useWorkspaceStore()
    workspaceStore.workspacePath = '/test/workspace'
    
    const wrapper = mount(HistoryChat, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('/test/workspace')
  })

  it('should display default message when no workspace path', () => {
    const workspaceStore = useWorkspaceStore()
    workspaceStore.workspacePath = null
    
    const wrapper = mount(HistoryChat, {
      global: {
        plugins: [pinia]
      }
    })
    
    expect(wrapper.text()).toContain('未设置工作区路径')
  })

  it('should handle session info loading error', async () => {
    const appStore = useAppStore()
    appStore.setSessions(mockSessions)
    window.electronAPI.api.getSessionInfo = vi.fn().mockRejectedValue(new Error('Not found'))
    
    const wrapper = mount(HistoryChat, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const vm = wrapper.vm as any
    await vm.handleSelectSession('session-1')
    
    expect(appStore.turns).toEqual([])
  })

  it('should remove session from list if it does not exist', async () => {
    const appStore = useAppStore()
    appStore.setSessions(mockSessions)
    window.electronAPI.api.getSessionInfo = vi.fn().mockRejectedValue({
      response: { status: 404 },
      message: 'Session does not exist'
    })
    
    const wrapper = mount(HistoryChat, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const vm = wrapper.vm as any
    await vm.handleSelectSession('session-1')
    
    expect(appStore.sessions.length).toBe(1)
  })

  it('should switch to another session after deleting current', async () => {
    const appStore = useAppStore()
    appStore.setSessions(mockSessions)
    appStore.setCurrentSession('session-1')
    window.electronAPI.api.deleteSession = vi.fn().mockResolvedValue(undefined)
    
    const wrapper = mount(HistoryChat, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const vm = wrapper.vm as any
    await vm.handleCommand('delete', mockSessions[0])
    
    expect(appStore.currentSessionId).toBe('session-2')
  })

  it('should clear current session if all sessions deleted', async () => {
    const appStore = useAppStore()
    appStore.setSessions([mockSessions[0]])
    appStore.setCurrentSession('session-1')
    window.electronAPI.api.deleteSession = vi.fn().mockResolvedValue(undefined)
    
    const wrapper = mount(HistoryChat, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const vm = wrapper.vm as any
    await vm.handleCommand('delete', mockSessions[0])
    
    expect(appStore.currentSessionId).toBe(null)
  })
})
