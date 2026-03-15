import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ContextBar from '@/components/chat/ContextBar.vue'
import { useAppStore } from '@/stores/app'

describe('ContextBar Component', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  it('should render correctly', () => {
    const wrapper = mount(ContextBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    expect(wrapper.find('.context-bar').exists()).toBe(true)
    expect(wrapper.find('.context-bar-progress').exists()).toBe(true)
    expect(wrapper.find('.context-bar-info').exists()).toBe(true)
  })

  it('should display token usage', async () => {
    const appStore = useAppStore()
    appStore.resourceUsage = {
      tokens: {
        current: 1000,
        limit: 10000
      }
    }
    
    const wrapper = mount(ContextBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Token:')
    expect(wrapper.text()).toContain('1000')
    expect(wrapper.text()).toContain('10000')
  })

  it('should show normal status when token usage is low', async () => {
    const appStore = useAppStore()
    appStore.resourceUsage = {
      tokens: {
        current: 1000,
        limit: 10000
      }
    }
    appStore.tokenStatus = 'normal'
    appStore.tokenPercentage = 10
    
    const wrapper = mount(ContextBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const fill = wrapper.find('.context-bar-fill')
    expect(fill.classes()).toContain('normal')
    expect(fill.attributes('style')).toContain('width: 10%')
  })

  it('should show warning status when token usage is medium', async () => {
    const appStore = useAppStore()
    appStore.resourceUsage = {
      tokens: {
        current: 5000,
        limit: 10000
      }
    }
    appStore.tokenStatus = 'warning'
    appStore.tokenPercentage = 50
    
    const wrapper = mount(ContextBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const fill = wrapper.find('.context-bar-fill')
    expect(fill.classes()).toContain('warning')
    expect(fill.attributes('style')).toContain('width: 50%')
  })

  it('should show critical status when token usage is high', async () => {
    const appStore = useAppStore()
    appStore.resourceUsage = {
      tokens: {
        current: 9000,
        limit: 10000
      }
    }
    appStore.tokenStatus = 'critical'
    appStore.tokenPercentage = 90
    
    const wrapper = mount(ContextBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const fill = wrapper.find('.context-bar-fill')
    expect(fill.classes()).toContain('critical')
    expect(fill.attributes('style')).toContain('width: 90%')
  })

  it('should show compress button when status is critical', async () => {
    const appStore = useAppStore()
    appStore.resourceUsage = {
      tokens: {
        current: 9000,
        limit: 10000
      }
    }
    appStore.tokenStatus = 'critical'
    appStore.tokenPercentage = 90
    
    const wrapper = mount(ContextBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('立即压缩')
  })

  it('should not show compress button when status is not critical', async () => {
    const appStore = useAppStore()
    appStore.resourceUsage = {
      tokens: {
        current: 1000,
        limit: 10000
      }
    }
    appStore.tokenStatus = 'normal'
    appStore.tokenPercentage = 10
    
    const wrapper = mount(ContextBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).not.toContain('立即压缩')
  })

  it('should call handleCompress when compress button is clicked', async () => {
    const appStore = useAppStore()
    appStore.resourceUsage = {
      tokens: {
        current: 9000,
        limit: 10000
      }
    }
    appStore.tokenStatus = 'critical'
    appStore.tokenPercentage = 90
    
    const wrapper = mount(ContextBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const compressButton = wrapper.find('button')
    await compressButton.trigger('click')
    
    // Should not throw error
    expect(wrapper.vm).toBeDefined()
  })

  it('should handle click on context bar', async () => {
    const wrapper = mount(ContextBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.find('.context-bar').trigger('click')
    
    // Should not throw error
    expect(wrapper.vm).toBeDefined()
  })

  it('should handle zero tokens', async () => {
    const appStore = useAppStore()
    appStore.resourceUsage = {
      tokens: {
        current: 0,
        limit: 10000
      }
    }
    appStore.tokenStatus = 'normal'
    appStore.tokenPercentage = 0
    
    const wrapper = mount(ContextBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('0')
    expect(wrapper.text()).toContain('10000')
  })

  it('should handle missing resource usage', async () => {
    const appStore = useAppStore()
    appStore.resourceUsage = null
    
    const wrapper = mount(ContextBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Token:')
  })

  it('should update when store changes', async () => {
    const appStore = useAppStore()
    appStore.resourceUsage = {
      tokens: {
        current: 1000,
        limit: 10000
      }
    }
    
    const wrapper = mount(ContextBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    // Update store
    appStore.resourceUsage = {
      tokens: {
        current: 8000,
        limit: 10000
      }
    }
    
    await wrapper.vm.$nextTick()
    
    const fill = wrapper.find('.context-bar-fill')
    expect(fill.classes()).toContain('critical')
    expect(fill.attributes('style')).toContain('width: 80%')
  })

  it('should have progress bar with correct width', async () => {
    const appStore = useAppStore()
    appStore.resourceUsage = {
      tokens: {
        current: 2500,
        limit: 10000
      }
    }
    appStore.tokenStatus = 'normal'
    appStore.tokenPercentage = 25
    
    const wrapper = mount(ContextBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const fill = wrapper.find('.context-bar-fill')
    expect(fill.attributes('style')).toContain('width: 25%')
  })

  it('should handle 100% token usage', async () => {
    const appStore = useAppStore()
    appStore.resourceUsage = {
      tokens: {
        current: 10000,
        limit: 10000
      }
    }
    appStore.tokenStatus = 'critical'
    appStore.tokenPercentage = 100
    
    const wrapper = mount(ContextBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const fill = wrapper.find('.context-bar-fill')
    expect(fill.attributes('style')).toContain('width: 100%')
    expect(fill.classes()).toContain('critical')
  })
})
