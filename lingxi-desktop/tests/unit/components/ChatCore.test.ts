import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ChatCore from '@/components/ChatCore.vue'
import { useAppStore } from '@/stores/app'
import { useSessionStore } from '@/stores/session'
import { useChatStore } from '@/stores/chat'
import { sendMessage } from '@/api/chat'
import { createSession } from '@/api/session'
import { uploadFile } from '@/api/file'
import { electronAPI } from '@/utils/electron'

describe('ChatCore Component', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  it('should render correctly', () => {
    const wrapper = mount(ChatCore, {
      global: {
        plugins: [pinia]
      }
    })
    
    expect(wrapper.find('.chat-core').exists()).toBe(true)
    expect(wrapper.find('.chat-core-header').exists()).toBe(true)
    expect(wrapper.find('.chat-core-content').exists()).toBe(true)
    expect(wrapper.find('.chat-core-input').exists()).toBe(true)
  })

  it('should display current session name', async () => {
    const appStore = useAppStore()
    appStore.setSessions([{ id: 'session-1', name: 'Test Session' }])
    appStore.setCurrentSession('session-1')
    
    const wrapper = mount(ChatCore, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.chat-core-title').text()).toContain('Test Session')
  })

  it('should display default session name when no session', () => {
    const wrapper = mount(ChatCore, {
      global: {
        plugins: [pinia]
      }
    })
    
    expect(wrapper.find('.chat-core-title').text()).toBe('新会话')
  })

  it('should have a textarea for input', () => {
    const wrapper = mount(ChatCore, {
      global: {
        plugins: [pinia]
      }
    })
    
    const textarea = wrapper.find('textarea')
    expect(textarea.exists()).toBe(true)
    expect(textarea.attributes('placeholder')).toBe('随便问点什么...')
  })

  it('should have send button', () => {
    const wrapper = mount(ChatCore, {
      global: {
        plugins: [pinia]
      }
    })
    
    expect(wrapper.text()).toContain('发送')
  })

  it('should have thinking mode switch', () => {
    const wrapper = mount(ChatCore, {
      global: {
        plugins: [pinia]
      }
    })
    
    expect(wrapper.text()).toContain('思考模式')
  })

  it('should have upload button', () => {
    const wrapper = mount(ChatCore, {
      global: {
        plugins: [pinia]
      }
    })
    
    expect(wrapper.text()).toContain('上传文件')
  })

  it('should handle send with valid input', async () => {
    const appStore = useAppStore()
    appStore.setCurrentSession('session-123')
    
    // Mock API functions
    vi.mock('@/api/chat', () => ({
      sendMessage: vi.fn().mockResolvedValue(undefined)
    }))
    
    const wrapper = mount(ChatCore, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const vm = wrapper.vm as any
    vm.inputText = 'Test message'
    await vm.handleSend()
    
    expect(sendMessage).toHaveBeenCalledWith({
      content: 'Test message',
      session_id: 'session-123',
      stream: true
    })
  })

  it('should create new session if none exists when sending', async () => {
    const appStore = useAppStore()
    const sessionStore = useSessionStore()
    appStore.setCurrentSession(null)
    
    // Mock session store methods
    vi.spyOn(sessionStore, 'createNewSession').mockResolvedValue({
      id: 'new-session',
      name: '新会话',
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
    
    vi.spyOn(sessionStore, 'sessions', 'get').mockReturnValue([{
      id: 'new-session',
      name: '新会话',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }])
    
    // Mock API functions
    vi.mock('@/api/chat', () => ({
      sendMessage: vi.fn().mockResolvedValue(undefined)
    }))
    
    const wrapper = mount(ChatCore, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const vm = wrapper.vm as any
    vm.inputText = 'Test message'
    await vm.handleSend()
    
    expect(sessionStore.createNewSession).toHaveBeenCalledWith('新会话')
    expect(appStore.currentSessionId).toBe('new-session')
  })

  it('should clear input after send', async () => {
    const appStore = useAppStore()
    appStore.setCurrentSession('session-123')
    
    // Mock API functions
    vi.mock('@/api/chat', () => ({
      sendMessage: vi.fn().mockResolvedValue(undefined)
    }))
    
    const wrapper = mount(ChatCore, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const vm = wrapper.vm as any
    vm.inputText = 'Test message'
    await vm.handleSend()
    
    expect(vm.inputText).toBe('')
  })

  it('should not send empty message', async () => {
    // Mock API functions
    vi.mock('@/api/chat', () => ({
      sendMessage: vi.fn().mockResolvedValue(undefined)
    }))
    
    const wrapper = mount(ChatCore, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const vm = wrapper.vm as any
    vm.inputText = ''
    await vm.handleSend()
    
    expect(sendMessage).not.toHaveBeenCalled()
  })

  it('should handle keydown Enter to send', async () => {
    const appStore = useAppStore()
    appStore.setCurrentSession('session-123')
    
    // Mock API functions
    vi.mock('@/api/chat', () => ({
      sendMessage: vi.fn().mockResolvedValue(undefined)
    }))
    
    const wrapper = mount(ChatCore, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const vm = wrapper.vm as any
    vm.inputText = 'Test message'
    
    const textarea = wrapper.find('textarea')
    await textarea.trigger('keydown', { key: 'Enter' })
    
    expect(sendMessage).toHaveBeenCalled()
  })

  it('should not send on Enter with Shift', async () => {
    const appStore = useAppStore()
    appStore.setCurrentSession('session-123')
    
    // Mock API functions
    vi.mock('@/api/chat', () => ({
      sendMessage: vi.fn().mockResolvedValue(undefined)
    }))
    
    const wrapper = mount(ChatCore, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const vm = wrapper.vm as any
    vm.inputText = 'Test message'
    
    const textarea = wrapper.find('textarea')
    await textarea.trigger('keydown', { key: 'Enter', shiftKey: true })
    
    expect(sendMessage).not.toHaveBeenCalled()
  })

  it('should handle drag over', async () => {
    const wrapper = mount(ChatCore, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const vm = wrapper.vm as any
    expect(vm.isDragging).toBe(false)
    
    await wrapper.find('.chat-core-input').trigger('dragover')
    
    expect(vm.isDragging).toBe(true)
  })

  it('should handle drag leave', async () => {
    const wrapper = mount(ChatCore, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const vm = wrapper.vm as any
    vm.isDragging = true
    
    await wrapper.find('.chat-core-input').trigger('dragleave')
    
    expect(vm.isDragging).toBe(false)
  })

  it('should handle drop with files', async () => {
    const wrapper = mount(ChatCore, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const vm = wrapper.vm as any
    vm.isDragging = true
    
    const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(mockFile)
    
    await wrapper.find('.chat-core-input').trigger('drop', {
      dataTransfer: dataTransfer
    })
    
    expect(vm.isDragging).toBe(false)
  })

  it('should add code block on command', async () => {
    const wrapper = mount(ChatCore, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const vm = wrapper.vm as any
    vm.inputText = ''
    vm.handleAddCommand('code')
    
    expect(vm.inputText).toContain('```')
  })

  it('should handle upload command', async () => {
    // Mock electronAPI
    vi.mock('@/utils/electron', () => ({
      electronAPI: {
        openFileDialog: vi.fn().mockResolvedValue({
          canceled: false,
          files: [{ path: 'test.txt', name: 'test.txt' }]
        })
      }
    }))
    
    // Mock API functions
    vi.mock('@/api/file', () => ({
      uploadFile: vi.fn().mockResolvedValue({ name: 'test.txt' })
    }))
    
    const wrapper = mount(ChatCore, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const vm = wrapper.vm as any
    await vm.handleUpload()
    
    expect(electronAPI.openFileDialog).toHaveBeenCalled()
  })
})
