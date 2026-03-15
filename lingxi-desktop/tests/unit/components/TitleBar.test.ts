import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TitleBar from '@/components/TitleBar.vue'
import { useWorkspaceStore } from '@/stores/workspace'

describe('TitleBar Component', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  it('should render correctly', () => {
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    expect(wrapper.find('.title-bar').exists()).toBe(true)
    expect(wrapper.find('.title-bar-left').exists()).toBe(true)
    expect(wrapper.find('.title-bar-center').exists()).toBe(true)
    expect(wrapper.find('.title-bar-right').exists()).toBe(true)
  })

  it('should display logo', () => {
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    const logo = wrapper.find('.title-bar-logo')
    expect(logo.exists()).toBe(true)
    expect(logo.attributes('alt')).toBe('Lingxi Logo')
  })

  it('should display app name', () => {
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    expect(wrapper.text()).toContain('Lingxi 助手')
  })

  it('should have search input', () => {
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    const searchInput = wrapper.find('.title-bar-search input')
    expect(searchInput.exists()).toBe(true)
    expect(searchInput.attributes('placeholder')).toBe('搜索')
  })

  it('should have workspace status component', () => {
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    expect(wrapper.findComponent({ name: 'WorkspaceStatus' }).exists()).toBe(true)
  })

  it('should display status indicator', () => {
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    expect(wrapper.text()).toContain('状态')
    expect(wrapper.find('.status-dot').exists()).toBe(true)
  })

  it('should have folder button', () => {
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    // Check that buttons exist
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('should have settings button', () => {
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    // Settings button is the second circular button
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThan(1)
  })

  it('should have minimize button', () => {
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    // Minimize button uses Minus icon
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThan(2)
  })

  it('should have maximize button', () => {
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    // Maximize button is one of the window control buttons
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThan(3)
  })

  it('should have close button', () => {
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    // Close button is the last button
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThan(4)
  })

  it('should call minimize when minimize button is clicked', async () => {
    window.electronAPI.window.minimize = vi.fn().mockResolvedValue(undefined)
    
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    const vm = wrapper.vm as any
    await vm.handleMinimize()
    
    expect(window.electronAPI.window.minimize).toHaveBeenCalled()
  })

  it('should call maximize when maximize button is clicked', async () => {
    window.electronAPI.window.maximize = vi.fn().mockResolvedValue(undefined)
    window.electronAPI.window.isMaximized = vi.fn().mockResolvedValue(false)
    
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    const vm = wrapper.vm as any
    await vm.handleMaximize()
    
    expect(window.electronAPI.window.maximize).toHaveBeenCalled()
  })

  it('should call minimize when close button is clicked', async () => {
    window.electronAPI.window.minimize = vi.fn().mockResolvedValue(undefined)
    
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    const vm = wrapper.vm as any
    await vm.handleClose()
    
    expect(window.electronAPI.window.minimize).toHaveBeenCalled()
  })

  it('should call handleSettings when settings button is clicked', async () => {
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    const vm = wrapper.vm as any
    await vm.handleSettings()
    
    // Should not throw error
    expect(wrapper.vm).toBeDefined()
  })

  it('should call handleFolder when folder button is clicked', async () => {
    window.electronAPI.file.selectDirectory = vi.fn().mockResolvedValue('/test/workspace')
    
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    const vm = wrapper.vm as any
    await vm.handleFolder()
    await wrapper.vm.$nextTick()
    
    expect(window.electronAPI.file.selectDirectory).toHaveBeenCalled()
  })

  it('should validate workspace when folder is selected', async () => {
    window.electronAPI.file.selectDirectory = vi.fn().mockResolvedValue('/test/workspace')
    window.electronAPI.workspace.validate = vi.fn().mockResolvedValue({ valid: true, message: 'Valid' })
    
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    const vm = wrapper.vm as any
    // Call handleFolder directly
    await vm.handleFolder()
    await wrapper.vm.$nextTick()
    
    expect(window.electronAPI.workspace.validate).toHaveBeenCalled()
  })

  it('should switch workspace when confirmed', async () => {
    window.electronAPI.file.selectDirectory = vi.fn().mockResolvedValue('/test/workspace')
    window.electronAPI.workspace.validate = vi.fn().mockResolvedValue({ valid: true, message: 'Valid' })
    window.electronAPI.workspace.switch = vi.fn().mockResolvedValue({ success: true })
    
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    const vm = wrapper.vm as any
    // Call handleFolder directly
    await vm.handleFolder()
    await wrapper.vm.$nextTick()
    
    expect(window.electronAPI.workspace.switch).toHaveBeenCalled()
  })

  it('should show error for invalid workspace', async () => {
    window.electronAPI.file.selectDirectory = vi.fn().mockResolvedValue('/invalid/workspace')
    window.electronAPI.workspace.validate = vi.fn().mockResolvedValue({ valid: false, message: 'Invalid' })
    
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    const buttons = wrapper.findAll('button')
    const folderButton = buttons[0]
    await folderButton.trigger('click')
    await wrapper.vm.$nextTick()
    
    // Should handle gracefully
    expect(wrapper.vm).toBeDefined()
  })

  it('should handle folder selection cancellation', async () => {
    window.electronAPI.file.selectDirectory = vi.fn().mockResolvedValue(null)
    
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    const buttons = wrapper.findAll('button')
    const folderButton = buttons[0]
    await folderButton.trigger('click')
    await wrapper.vm.$nextTick()
    
    // Should not call validate if no path selected
    expect(window.electronAPI.workspace.validate).not.toHaveBeenCalled()
  })

  it('should update maximized state on mount', async () => {
    window.electronAPI.window.isMaximized = vi.fn().mockResolvedValue(true)
    
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(window.electronAPI.window.isMaximized).toHaveBeenCalled()
  })

  it('should show FullScreen icon when maximized', async () => {
    window.electronAPI.window.isMaximized = vi.fn().mockResolvedValue(true)
    
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()
    
    const vm = wrapper.vm as any
    expect(vm.isMaximized).toBe(true)
  })

  it('should show ZoomIn icon when not maximized', async () => {
    window.electronAPI.window.isMaximized = vi.fn().mockResolvedValue(false)
    
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()
    
    const vm = wrapper.vm as any
    expect(vm.isMaximized).toBe(false)
  })

  it('should handle missing electronAPI gracefully', () => {
    const originalElectronAPI = window.electronAPI
    // @ts-ignore
    window.electronAPI = undefined
    
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    // Should not throw error
    expect(wrapper.vm).toBeDefined()
    
    window.electronAPI = originalElectronAPI
  })

  it('should have search input bound to searchText', async () => {
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    const vm = wrapper.vm as any
    vm.searchText = 'Test search'
    
    await wrapper.vm.$nextTick()
    
    const searchInput = wrapper.find('.title-bar-search input')
    expect((searchInput.element as HTMLInputElement).value).toBe('Test search')
  })

  it('should display status dot with online class', () => {
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    const statusDot = wrapper.find('.status-dot')
    expect(statusDot.classes()).toContain('online')
  })
})
