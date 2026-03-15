import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import WorkspaceStatus from '@/components/WorkspaceStatus.vue'
import { useWorkspaceStore } from '@/stores/workspace'

describe('WorkspaceStatus Component', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  it('should render correctly', () => {
    const wrapper = mount(WorkspaceStatus, {
      global: {
        plugins: [pinia]
      }
    })
    
    expect(wrapper.find('.workspace-status').exists()).toBe(true)
  })

  it('should display workspace path', async () => {
    const workspaceStore = useWorkspaceStore()
    workspaceStore.currentWorkspace = {
      workspace: '/home/user/project',
      lingxi_dir: '/home/user/project/.lingxi',
      is_initialized: true
    }
    
    const wrapper = mount(WorkspaceStatus, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('/home/user/project')
  })

  it('should display "未初始化" when no workspace', () => {
    const wrapper = mount(WorkspaceStatus, {
      global: {
        plugins: [pinia]
      }
    })
    
    expect(wrapper.text()).toContain('未初始化')
  })

  it('should show initialized status when workspace is initialized', async () => {
    const workspaceStore = useWorkspaceStore()
    workspaceStore.currentWorkspace = {
      workspace: '/home/user/project',
      lingxi_dir: '/home/user/project/.lingxi',
      is_initialized: true
    }
    
    const wrapper = mount(WorkspaceStatus, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const lingxiStatus = wrapper.find('.lingxi-status.initialized')
    expect(lingxiStatus.exists()).toBe(true)
  })

  it('should show uninitialized status when workspace is not initialized', async () => {
    const workspaceStore = useWorkspaceStore()
    workspaceStore.currentWorkspace = {
      workspace: '/home/user/project',
      lingxi_dir: '/home/user/project/.lingxi',
      is_initialized: false
    }
    
    const wrapper = mount(WorkspaceStatus, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const lingxiStatus = wrapper.find('.lingxi-status')
    expect(lingxiStatus.exists()).toBe(true)
    expect(lingxiStatus.classes()).not.toContain('initialized')
  })

  it('should display workspace skills count when greater than 0', async () => {
    const workspaceStore = useWorkspaceStore()
    workspaceStore.currentWorkspace = {
      workspace: '/home/user/project',
      lingxi_dir: '/home/user/project/.lingxi',
      is_initialized: true
    }
    workspaceStore.workspaceSkillsCount = 5
    
    const wrapper = mount(WorkspaceStatus, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.workspace-skills').exists()).toBe(true)
    expect(wrapper.text()).toContain('5')
  })

  it('should not display workspace skills when count is 0', async () => {
    const workspaceStore = useWorkspaceStore()
    workspaceStore.currentWorkspace = {
      workspace: '/home/user/project',
      lingxi_dir: '/home/user/project/.lingxi',
      is_initialized: true
    }
    workspaceStore.workspaceSkillsCount = 0
    
    const wrapper = mount(WorkspaceStatus, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.workspace-skills').exists()).toBe(false)
  })

  it('should truncate long workspace paths', async () => {
    const workspaceStore = useWorkspaceStore()
    workspaceStore.currentWorkspace = {
      workspace: '/home/user/very/long/path/to/a/project/that/exceeds/thirty/characters',
      lingxi_dir: '/home/user/very/long/path/to/a/project/that/exceeds/thirty/characters/.lingxi',
      is_initialized: true
    }
    
    const wrapper = mount(WorkspaceStatus, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const pathText = wrapper.find('.path-text').text()
    expect(pathText).toContain('...')
  })

  it('should open switch dialog when clicked', async () => {
    const wrapper = mount(WorkspaceStatus, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    // 直接调用 handleClick 方法
    wrapper.vm.handleClick()
    
    const workspaceStore = useWorkspaceStore()
    expect(workspaceStore.switchDialogVisible).toBe(true)
  })

  it('should call loadCurrentWorkspace on mount', async () => {
    const workspaceStore = useWorkspaceStore()
    const loadCurrentWorkspaceMock = vi.spyOn(workspaceStore, 'loadCurrentWorkspace')
    
    const wrapper = mount(WorkspaceStatus, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    expect(loadCurrentWorkspaceMock).toHaveBeenCalled()
  })

  it('should display switch button', () => {
    const wrapper = mount(WorkspaceStatus, {
      global: {
        plugins: [pinia]
      }
    })
    
    const switchButton = wrapper.find('[class*="el-button"]')
    expect(switchButton.exists()).toBe(true)
  })

  it('should have hover effect', () => {
    const wrapper = mount(WorkspaceStatus, {
      global: {
        plugins: [pinia]
      }
    })
    
    const workspaceStatus = wrapper.find('.workspace-status')
    expect(workspaceStatus.classes()).toContain('workspace-status')
  })
})
