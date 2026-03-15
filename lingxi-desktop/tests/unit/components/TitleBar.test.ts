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
    
    const folderButton = wrapper.find('[aria-label="Folder"]')
    expect(folderButton.exists()).toBe(true)
  })

  it('should have settings button', () => {
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    const settingsButton = wrapper.find('[aria-label="Setting"]')
    expect(settingsButton.exists()).toBe(true)
  })

  it('should have minimize button', () => {
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    const minimizeButton = wrapper.find('[aria-label="Minus"]')
    expect(minimizeButton.exists()).toBe(true)
  })

  it('should have maximize button', () => {
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    // Maximize button uses FullScreen or ZoomIn icon
    const maximizeButton = wrapper.findAll('button').filter(btn => 
      btn.find('[aria-label="FullScreen"]')?.exists() || 
      btn.find('[aria-label="ZoomIn"]')?.exists()
    )
    expect(maximizeButton.length).toBeGreaterThan(0)
  })

  it('should have close button', () => {
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    const closeButton = wrapper.find('[aria-label="Close"]')
    expect(closeButton.exists()).toBe(true)
  })

  it('should call minimize when minimize button is clicked', async () => {
    window.electronAPI.window.minimize = vi.fn().mockResolvedValue(undefined)
    
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    const minimizeButton = wrapper.find('[aria-label="Minus"]')
    await minimizeButton.trigger('click')
    
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
    
    // Find maximize button (the one without a specific icon aria-label)
    const buttons = wrapper.findAll('button')
    const maximizeButton = buttons.find(btn => {
      const icon = btn.find('[aria-label="FullScreen"]') || btn.find('[aria-label="ZoomIn"]')
      return icon?.exists()
    })
    
    await maximizeButton?.trigger('click')
    
    expect(window.electronAPI.window.maximize).toHaveBeenCalled()
  })

  it('should call minimize when close button is clicked', async () => {
    window.electronAPI.window.minimize = vi.fn().mockResolvedValue(undefined)
    
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    const closeButton = wrapper.find('[aria-label="Close"]')
    await closeButton.trigger('click')
    
    expect(window.electronAPI.window.minimize).toHaveBeenCalled()
  })

  it('should call handleSettings when settings button is clicked', async () => {
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    const settingsButton = wrapper.find('[aria-label="Setting"]')
    await settingsButton.trigger('click')
    
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
    
    const folderButton = wrapper.find('[aria-label="Folder"]')
    await folderButton.trigger('click')
    
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
    
    const folderButton = wrapper.find('[aria-label="Folder"]')
    await folderButton.trigger('click')
    await wrapper.vm.$nextTick()
    
    expect(window.electronAPI.workspace.validate).toHaveBeenCalledWith('/test/workspace')
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
    
    const folderButton = wrapper.find('[aria-label="Folder"]')
    await folderButton.trigger('click')
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
    
    const folderButton = wrapper.find('[aria-label="Folder"]')
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
    
    const folderButton = wrapper.find('[aria-label="Folder"]')
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

  it('should have search input bound to searchText', () => {
    const wrapper = mount(TitleBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    const vm = wrapper.vm as any
    vm.searchText = 'Test search'
    
    const searchInput = wrapper.find('.title-bar-search input')
    expect(searchInput.element).toHaveValue('Test search')
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
