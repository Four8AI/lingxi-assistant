import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ChatCore from '@/components/ChatCore.vue'
import { useAppStore } from '@/stores/app'

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
    window.electronAPI.api.createSession = vi.fn().mockResolvedValue({ session_id: 'session-123' })
    window.electronAPI.ws = {
      sendMessage: vi.fn().mockResolvedValue(undefined)
    }
    
    const wrapper = mount(ChatCore, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const vm = wrapper.vm as any
    vm.inputText = 'Test message'
    await vm.handleSend()
    
    expect(window.electronAPI.ws.sendMessage).toHaveBeenCalledWith(
      'Test message',
      'session-123',
      false
    )
  })

  it('should create new session if none exists when sending', async () => {
    const appStore = useAppStore()
    appStore.setCurrentSession(null)
    window.electronAPI.api.createSession = vi.fn().mockResolvedValue({ session_id: 'new-session' })
    window.electronAPI.ws = {
      sendMessage: vi.fn().mockResolvedValue(undefined)
    }
    
    const wrapper = mount(ChatCore, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const vm = wrapper.vm as any
    vm.inputText = 'Test message'
    await vm.handleSend()
    
    expect(window.electronAPI.api.createSession).toHaveBeenCalledWith('新会话')
    expect(appStore.currentSessionId).toBe('new-session')
  })

  it('should clear input after send', async () => {
    const appStore = useAppStore()
    appStore.setCurrentSession('session-123')
    window.electronAPI.api.createSession = vi.fn().mockResolvedValue({ session_id: 'session-123' })
    window.electronAPI.ws = {
      sendMessage: vi.fn().mockResolvedValue(undefined)
    }
    
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
    const wrapper = mount(ChatCore, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const vm = wrapper.vm as any
    vm.inputText = ''
    await vm.handleSend()
    
    expect(window.electronAPI?.ws?.sendMessage).not.toHaveBeenCalled()
  })

  it('should handle keydown Enter to send', async () => {
    const wrapper = mount(ChatCore, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const vm = wrapper.vm as any
    vm.inputText = 'Test message'
    
    const event = new KeyboardEvent('keydown', { key: 'Enter' })
    const textarea = wrapper.find('textarea')
    await textarea.trigger('keydown', event)
    
    expect(window.electronAPI?.ws?.sendMessage).toHaveBeenCalled()
  })

  it('should not send on Enter with Shift', async () => {
    const wrapper = mount(ChatCore, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const vm = wrapper.vm as any
    vm.inputText = 'Test message'
    
    const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true })
    const textarea = wrapper.find('textarea')
    await textarea.trigger('keydown', event)
    
    expect(window.electronAPI?.ws?.sendMessage).not.toHaveBeenCalled()
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
    const wrapper = mount(ChatCore, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const vm = wrapper.vm as any
    vm.handleUpload()
    
    expect(window.electronAPI.file.selectFiles).toHaveBeenCalled()
  })
})
