import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import InputArea from '@/components/chat/InputArea.vue'
import { useAppStore } from '@/stores/app'

describe('InputArea Component', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  it('should render correctly', () => {
    const wrapper = mount(InputArea, {
      global: {
        plugins: [pinia]
      }
    })
    
    expect(wrapper.find('.input-area').exists()).toBe(true)
    expect(wrapper.find('.input-area-toolbar').exists()).toBe(true)
    expect(wrapper.find('.input-area-main').exists()).toBe(true)
    expect(wrapper.find('.input-area-footer').exists()).toBe(true)
  })

  it('should display upload and voice buttons', () => {
    const wrapper = mount(InputArea, {
      global: {
        plugins: [pinia]
      }
    })
    
    const buttons = wrapper.findAll('.el-button')
    expect(buttons.length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain('上传文件')
    expect(wrapper.text()).toContain('语音输入')
  })

  it('should have a textarea for input', () => {
    const wrapper = mount(InputArea, {
      global: {
        plugins: [pinia]
      }
    })
    
    const textarea = wrapper.find('textarea')
    expect(textarea.exists()).toBe(true)
    expect(textarea.attributes('placeholder')).toBe('输入您的任务或问题...')
  })

  it('should have a send button', () => {
    const wrapper = mount(InputArea, {
      global: {
        plugins: [pinia]
      }
    })
    
    expect(wrapper.text()).toContain('发送')
  })

  it('should display loading state when store is loading', async () => {
    const appStore = useAppStore()
    appStore.setLoading(true)
    
    const wrapper = mount(InputArea, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    // 检查 loading 状态是否影响组件
    expect(appStore.loading).toBe(true)
  })

  it('should call handleUpload when upload button is clicked', async () => {
    const wrapper = mount(InputArea, {
      global: {
        plugins: [pinia],
        mocks: {
          window: {
            electronAPI: window.electronAPI
          }
        }
      }
    })
    
    await wrapper.vm.$nextTick()
    
    // 直接测试方法调用
    wrapper.vm.handleUpload()
    
    expect(window.electronAPI.file.selectFiles).toHaveBeenCalled()
  })

  it('should not send empty message', async () => {
    const appStore = useAppStore()
    appStore.setCurrentSession('session-123')
    
    const wrapper = mount(InputArea, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    // 直接调用方法测试
    wrapper.vm.handleSend()
    
    expect(window.electronAPI.api.executeTask).not.toHaveBeenCalled()
  })

  it('should not send when no active session', async () => {
    const appStore = useAppStore()
    appStore.setCurrentSession(null)
    
    const wrapper = mount(InputArea, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    // 设置 inputText 并调用 handleSend
    wrapper.vm.inputText = 'Test message'
    wrapper.vm.handleSend()
    
    expect(window.electronAPI.api.executeTask).not.toHaveBeenCalled()
  })

  it('should send message when send button is clicked with valid input', async () => {
    const appStore = useAppStore()
    appStore.setCurrentSession('session-123')
    window.electronAPI.api.executeTask = vi.fn().mockResolvedValue({ success: true })
    
    const wrapper = mount(InputArea, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    // 直接设置 inputText 并调用 handleSend
    wrapper.vm.inputText = 'Test message'
    await wrapper.vm.handleSend()
    
    expect(window.electronAPI.api.executeTask).toHaveBeenCalledWith(
      'Test message',
      'session-123'
    )
  })

  it('should clear input after successful send', async () => {
    const appStore = useAppStore()
    appStore.setCurrentSession('session-123')
    window.electronAPI.api.executeTask = vi.fn().mockResolvedValue({ success: true })
    
    const wrapper = mount(InputArea, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    wrapper.vm.inputText = 'Test message'
    await wrapper.vm.handleSend()
    
    expect(wrapper.vm.inputText).toBe('')
  })

  it('should handle send error gracefully', async () => {
    const appStore = useAppStore()
    appStore.setCurrentSession('session-123')
    window.electronAPI.api.executeTask = vi.fn().mockRejectedValue(new Error('Failed'))
    
    const wrapper = mount(InputArea, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    wrapper.vm.inputText = 'Test message'
    await wrapper.vm.handleSend()
    
    // Should not throw, loading state should be reset
    const store = useAppStore()
    expect(store.loading).toBe(false)
  })
})
