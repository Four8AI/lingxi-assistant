import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import WorkspaceSwitchDialog from '@/components/WorkspaceSwitchDialog.vue'
import { useWorkspaceStore } from '@/stores/workspace'

describe('WorkspaceSwitchDialog Component', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  // Common mount options with stubs for Element Plus components
  const mountOptions = {
    global: {
      plugins: [pinia],
      stubs: {
        'el-dialog': {
          template: '<div class="el-dialog-stub"><slot name="default" /><slot name="footer" /></div>'
        },
        'el-input': { template: '<input class="el-input-stub" />' },
        'el-button': { template: '<button class="el-button-stub"><slot /></button>' },
        'el-alert': { template: '<div class="el-alert-stub"><slot /></div>' },
        'el-icon': true
      }
    }
  }

  it('should render correctly', async () => {
    const wrapper = mount(WorkspaceSwitchDialog, mountOptions)
    
    expect(wrapper.find('.workspace-switch-dialog').exists()).toBe(true)
    expect(wrapper.find('.current-workspace').exists()).toBe(true)
    expect(wrapper.find('.select-workspace').exists()).toBe(true)
  })

  it('should display current workspace path', async () => {
    const workspaceStore = useWorkspaceStore()
    workspaceStore.currentWorkspace = {
      workspace: '/home/user/workspace',
      is_initialized: true
    }
    
    const wrapper = mount(WorkspaceSwitchDialog, mountOptions)
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('/home/user/workspace')
  })

  it('should display uninitialized status', async () => {
    const workspaceStore = useWorkspaceStore()
    workspaceStore.currentWorkspace = {
      workspace: '/home/user/workspace',
      is_initialized: false
    }
    
    const wrapper = mount(WorkspaceSwitchDialog, mountOptions)
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('未初始化')
  })

  it('should display initialized status', async () => {
    const workspaceStore = useWorkspaceStore()
    workspaceStore.currentWorkspace = {
      workspace: '/home/user/workspace',
      is_initialized: true
    }
    
    const wrapper = mount(WorkspaceSwitchDialog, mountOptions)
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('已初始化')
  })

  it('should display no workspace when null', async () => {
    const workspaceStore = useWorkspaceStore()
    workspaceStore.currentWorkspace = null
    
    const wrapper = mount(WorkspaceSwitchDialog, mountOptions)
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('未初始化')
  })

  it('should have input for new workspace path', () => {
    const wrapper = mount(WorkspaceSwitchDialog, mountOptions)
    
    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toContain('请输入或选择工作目录路径')
  })

  it('should have select directory button', () => {
    const wrapper = mount(WorkspaceSwitchDialog, mountOptions)
    
    expect(wrapper.text()).toContain('选择目录')
  })

  it('should have cancel button', () => {
    const wrapper = mount(WorkspaceSwitchDialog, mountOptions)
    
    expect(wrapper.text()).toContain('取消')
  })

  it('should have switch button', () => {
    const wrapper = mount(WorkspaceSwitchDialog, mountOptions)
    
    expect(wrapper.text()).toContain('切换')
  })

  it('should call selectDirectory when button is clicked', async () => {
    window.electronAPI.file.selectDirectory = vi.fn().mockResolvedValue('/new/workspace')
    window.electronAPI.workspace.validate = vi.fn().mockResolvedValue({
      data: { valid: true, message: 'Valid workspace' }
    })
    
    const wrapper = mount(WorkspaceSwitchDialog, mountOptions)
    
    const selectButton = wrapper.findAll('button').find(btn => btn.text().includes('选择目录'))
    await selectButton?.trigger('click')
    await wrapper.vm.$nextTick()
    
    expect(window.electronAPI.file.selectDirectory).toHaveBeenCalled()
  })

  it('should update input when directory is selected', async () => {
    window.electronAPI.file.selectDirectory = vi.fn().mockResolvedValue('/new/workspace')
    window.electronAPI.workspace.validate = vi.fn().mockResolvedValue({
      data: { valid: true, message: 'Valid workspace' }
    })
    
    const wrapper = mount(WorkspaceSwitchDialog, mountOptions)
    
    const selectButton = wrapper.findAll('button').find(btn => btn.text().includes('选择目录'))
    await selectButton?.trigger('click')
    await wrapper.vm.$nextTick()
    
    const vm = wrapper.vm as any
    expect(vm.newWorkspacePath).toBe('/new/workspace')
  })

  it('should validate workspace after selection', async () => {
    window.electronAPI.file.selectDirectory = vi.fn().mockResolvedValue('/new/workspace')
    window.electronAPI.workspace.validate = vi.fn().mockResolvedValue({
      data: { valid: true, message: 'Valid workspace' }
    })
    
    const wrapper = mount(WorkspaceSwitchDialog, mountOptions)
    
    const selectButton = wrapper.findAll('button').find(btn => btn.text().includes('选择目录'))
    await selectButton?.trigger('click')
    await wrapper.vm.$nextTick()
    
    expect(window.electronAPI.workspace.validate).toHaveBeenCalledWith('/new/workspace')
  })

  it('should show validation result', async () => {
    window.electronAPI.file.selectDirectory = vi.fn().mockResolvedValue('/new/workspace')
    window.electronAPI.workspace.validate = vi.fn().mockResolvedValue({
      data: { valid: true, message: 'Valid workspace' }
    })
    
    const wrapper = mount(WorkspaceSwitchDialog, mountOptions)
    
    const selectButton = wrapper.findAll('button').find(btn => btn.text().includes('选择目录'))
    await selectButton?.trigger('click')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Valid workspace')
  })

  it('should show error for invalid workspace', async () => {
    window.electronAPI.file.selectDirectory = vi.fn().mockResolvedValue('/invalid/workspace')
    window.electronAPI.workspace.validate = vi.fn().mockResolvedValue({
      data: { valid: false, message: 'Invalid workspace' }
    })
    
    const wrapper = mount(WorkspaceSwitchDialog, mountOptions)
    
    const selectButton = wrapper.findAll('button').find(btn => btn.text().includes('选择目录'))
    await selectButton?.trigger('click')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Invalid workspace')
  })

  it('should call handleSwitch when switch button is clicked', async () => {
    const workspaceStore = useWorkspaceStore()
    workspaceStore.currentWorkspace = {
      workspace: '/old/workspace',
      is_initialized: true
    }
    
    window.electronAPI.file.selectDirectory = vi.fn().mockResolvedValue('/new/workspace')
    window.electronAPI.workspace.validate = vi.fn().mockResolvedValue({
      data: { valid: true, message: 'Valid' }
    })
    window.electronAPI.workspace.switch = vi.fn().mockResolvedValue({ success: true })
    
    const wrapper = mount(WorkspaceSwitchDialog, mountOptions)
    
    // Select directory first
    const selectButton = wrapper.findAll('button').find(btn => btn.text().includes('选择目录'))
    await selectButton?.trigger('click')
    await wrapper.vm.$nextTick()
    
    // Then click switch
    const switchButton = wrapper.findAll('button').find(btn => btn.text() === '切换')
    await switchButton?.trigger('click')
    await wrapper.vm.$nextTick()
    
    expect(window.electronAPI.workspace.switch).toHaveBeenCalledWith('/new/workspace', false)
  })

  it('should call loadCurrentWorkspace after successful switch', async () => {
    const workspaceStore = useWorkspaceStore()
    workspaceStore.currentWorkspace = {
      workspace: '/old/workspace',
      is_initialized: true
    }
    workspaceStore.reloadSessions = vi.fn().mockResolvedValue(undefined)
    
    window.electronAPI.file.selectDirectory = vi.fn().mockResolvedValue('/new/workspace')
    window.electronAPI.workspace.validate = vi.fn().mockResolvedValue({
      data: { valid: true, message: 'Valid' }
    })
    window.electronAPI.workspace.switch = vi.fn().mockResolvedValue({ success: true })
    
    const wrapper = mount(WorkspaceSwitchDialog, mountOptions)
    
    const selectButton = wrapper.findAll('button').find(btn => btn.text().includes('选择目录'))
    await selectButton?.trigger('click')
    await wrapper.vm.$nextTick()
    
    const switchButton = wrapper.findAll('button').find(btn => btn.text() === '切换')
    await switchButton?.trigger('click')
    await wrapper.vm.$nextTick()
    
    expect(workspaceStore.loadCurrentWorkspace).toHaveBeenCalled()
  })

  it('should close dialog after successful switch', async () => {
    const workspaceStore = useWorkspaceStore()
    workspaceStore.currentWorkspace = {
      workspace: '/old/workspace',
      is_initialized: true
    }
    workspaceStore.reloadSessions = vi.fn().mockResolvedValue(undefined)
    
    window.electronAPI.file.selectDirectory = vi.fn().mockResolvedValue('/new/workspace')
    window.electronAPI.workspace.validate = vi.fn().mockResolvedValue({
      data: { valid: true, message: 'Valid' }
    })
    window.electronAPI.workspace.switch = vi.fn().mockResolvedValue({ success: true })
    
    const wrapper = mount(WorkspaceSwitchDialog, mountOptions)
    
    const selectButton = wrapper.findAll('button').find(btn => btn.text().includes('选择目录'))
    await selectButton?.trigger('click')
    await wrapper.vm.$nextTick()
    
    const switchButton = wrapper.findAll('button').find(btn => btn.text() === '切换')
    await switchButton?.trigger('click')
    await wrapper.vm.$nextTick()
    
    const vm = wrapper.vm as any
    expect(vm.visible).toBe(false)
  })

  it('should handle switch failure', async () => {
    const workspaceStore = useWorkspaceStore()
    workspaceStore.currentWorkspace = {
      workspace: '/old/workspace',
      is_initialized: true
    }
    
    window.electronAPI.file.selectDirectory = vi.fn().mockResolvedValue('/new/workspace')
    window.electronAPI.workspace.validate = vi.fn().mockResolvedValue({
      data: { valid: true, message: 'Valid' }
    })
    window.electronAPI.workspace.switch = vi.fn().mockResolvedValue({ success: false, error: 'Switch failed' })
    
    const wrapper = mount(WorkspaceSwitchDialog, mountOptions)
    
    const selectButton = wrapper.findAll('button').find(btn => btn.text().includes('选择目录'))
    await selectButton?.trigger('click')
    await wrapper.vm.$nextTick()
    
    const switchButton = wrapper.findAll('button').find(btn => btn.text() === '切换')
    await switchButton?.trigger('click')
    await wrapper.vm.$nextTick()
    
    // Dialog should remain open
    const vm = wrapper.vm as any
    expect(vm.visible).toBe(true)
  })

  it('should call handleCancel when cancel button is clicked', async () => {
    const wrapper = mount(WorkspaceSwitchDialog, mountOptions)
    
    const cancelButton = wrapper.findAll('button').find(btn => btn.text() === '取消')
    await cancelButton?.trigger('click')
    
    const vm = wrapper.vm as any
    expect(vm.visible).toBe(false)
  })

  it('should disable switch button when validation fails', async () => {
    window.electronAPI.file.selectDirectory = vi.fn().mockResolvedValue('/invalid/workspace')
    window.electronAPI.workspace.validate = vi.fn().mockResolvedValue({
      data: { valid: false, message: 'Invalid' }
    })
    
    const wrapper = mount(WorkspaceSwitchDialog, mountOptions)
    
    const selectButton = wrapper.findAll('button').find(btn => btn.text().includes('选择目录'))
    await selectButton?.trigger('click')
    await wrapper.vm.$nextTick()
    
    const switchButton = wrapper.find('button[type="primary"]')
    expect(switchButton.attributes('disabled')).toBeDefined()
  })

  it('should show loading state during switch', async () => {
    const workspaceStore = useWorkspaceStore()
    workspaceStore.currentWorkspace = {
      workspace: '/old/workspace',
      is_initialized: true
    }
    
    window.electronAPI.file.selectDirectory = vi.fn().mockResolvedValue('/new/workspace')
    window.electronAPI.workspace.validate = vi.fn().mockResolvedValue({
      data: { valid: true, message: 'Valid' }
    })
    // Make switch slow
    window.electronAPI.workspace.switch = vi.fn().mockImplementation(() => {
      return new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    })
    
    const wrapper = mount(WorkspaceSwitchDialog, mountOptions)
    
    const selectButton = wrapper.findAll('button').find(btn => btn.text().includes('选择目录'))
    await selectButton?.trigger('click')
    await wrapper.vm.$nextTick()
    
    const switchButton = wrapper.findAll('button').find(btn => btn.text() === '切换')
    await switchButton?.trigger('click')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('切换中')
  })

  it('should reset state when dialog opens', async () => {
    const workspaceStore = useWorkspaceStore()
    workspaceStore.switchDialogVisible = true
    
    const wrapper = mount(WorkspaceSwitchDialog, mountOptions)
    
    await wrapper.vm.$nextTick()
    
    const vm = wrapper.vm as any
    expect(vm.newWorkspacePath).toBe('')
    expect(vm.validationResult).toBe(null)
  })
})
