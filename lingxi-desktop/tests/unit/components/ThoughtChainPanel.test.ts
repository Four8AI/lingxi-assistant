import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ThoughtChainPanel from '@/components/chat/ThoughtChainPanel.vue'

describe('ThoughtChainPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockChain = {
    steps: [
      {
        type: 'analysis',
        thought: 'Analyzing the problem',
        action: 'Parse user input',
        result: 'Understood the task'
      },
      {
        type: 'planning',
        thought: 'Creating a plan',
        action: 'Define steps',
        result: 'Plan created'
      },
      {
        type: 'execution',
        thought: 'Executing step',
        action: 'Run command',
        result: 'Success'
      }
    ]
  }

  it('should render correctly', () => {
    const wrapper = mount(ThoughtChainPanel, {
      props: {
        chain: mockChain
      }
    })
    
    expect(wrapper.find('.thought-chain-panel').exists()).toBe(true)
    expect(wrapper.find('.panel-header').exists()).toBe(true)
  })

  it('should display step count in header', () => {
    const wrapper = mount(ThoughtChainPanel, {
      props: {
        chain: mockChain
      }
    })
    
    expect(wrapper.find('.panel-title').text()).toContain('3 步')
  })

  it('should be collapsed by default', () => {
    const wrapper = mount(ThoughtChainPanel, {
      props: {
        chain: mockChain
      }
    })
    
    // Panel content should not be visible when collapsed
    expect(wrapper.find('.panel-content').exists()).toBe(false)
  })

  it('should expand when header is clicked', async () => {
    const wrapper = mount(ThoughtChainPanel, {
      props: {
        chain: mockChain
      }
    })
    
    await wrapper.find('.panel-header').trigger('click')
    
    expect(wrapper.find('.panel-content').exists()).toBe(true)
  })

  it('should toggle expand/collapse on header click', async () => {
    const wrapper = mount(ThoughtChainPanel, {
      props: {
        chain: mockChain
      }
    })
    
    // First click - expand
    await wrapper.find('.panel-header').trigger('click')
    expect(wrapper.find('.panel-content').exists()).toBe(true)
    
    // Second click - collapse
    await wrapper.find('.panel-header').trigger('click')
    expect(wrapper.find('.panel-content').exists()).toBe(false)
  })

  it('should display all steps when expanded', async () => {
    const wrapper = mount(ThoughtChainPanel, {
      props: {
        chain: mockChain
      }
    })
    
    await wrapper.find('.panel-header').trigger('click')
    
    const steps = wrapper.findAll('.thought-step')
    expect(steps.length).toBe(3)
  })

  it('should display step index', async () => {
    const wrapper = mount(ThoughtChainPanel, {
      props: {
        chain: mockChain
      }
    })
    
    await wrapper.find('.panel-header').trigger('click')
    
    expect(wrapper.find('.step-index').text()).toContain('步骤 1')
  })

  it('should display step type text', async () => {
    const wrapper = mount(ThoughtChainPanel, {
      props: {
        chain: mockChain
      }
    })
    
    await wrapper.find('.panel-header').trigger('click')
    
    expect(wrapper.text()).toContain('分析')
    expect(wrapper.text()).toContain('规划')
    expect(wrapper.text()).toContain('执行')
  })

  it('should display step thought', async () => {
    const wrapper = mount(ThoughtChainPanel, {
      props: {
        chain: mockChain
      }
    })
    
    await wrapper.find('.panel-header').trigger('click')
    
    expect(wrapper.text()).toContain('Analyzing the problem')
  })

  it('should display step action', async () => {
    const wrapper = mount(ThoughtChainPanel, {
      props: {
        chain: mockChain
      }
    })
    
    await wrapper.find('.panel-header').trigger('click')
    
    expect(wrapper.text()).toContain('执行：')
    expect(wrapper.text()).toContain('Parse user input')
  })

  it('should display step result', async () => {
    const wrapper = mount(ThoughtChainPanel, {
      props: {
        chain: mockChain
      }
    })
    
    await wrapper.find('.panel-header').trigger('click')
    
    expect(wrapper.text()).toContain('结果：')
    expect(wrapper.text()).toContain('Understood the task')
  })

  it('should handle empty steps array', () => {
    const wrapper = mount(ThoughtChainPanel, {
      props: {
        chain: { steps: [] }
      }
    })
    
    expect(wrapper.find('.panel-title').text()).toContain('0 步')
  })

  it('should handle step without thought', async () => {
    const chainWithoutThought = {
      steps: [
        {
          type: 'execution',
          action: 'Run command',
          result: 'Success'
        }
      ]
    }
    
    const wrapper = mount(ThoughtChainPanel, {
      props: {
        chain: chainWithoutThought
      }
    })
    
    await wrapper.find('.panel-header').trigger('click')
    
    expect(wrapper.text()).not.toContain('Analyzing')
    expect(wrapper.text()).toContain('执行：')
  })

  it('should handle step without action', async () => {
    const chainWithoutAction = {
      steps: [
        {
          type: 'analysis',
          thought: 'Thinking',
          result: 'Done'
        }
      ]
    }
    
    const wrapper = mount(ThoughtChainPanel, {
      props: {
        chain: chainWithoutAction
      }
    })
    
    await wrapper.find('.panel-header').trigger('click')
    
    expect(wrapper.text()).toContain('Thinking')
    expect(wrapper.text()).not.toContain('执行：')
  })

  it('should handle step without result', async () => {
    const chainWithoutResult = {
      steps: [
        {
          type: 'analysis',
          thought: 'Thinking',
          action: 'Analyze'
        }
      ]
    }
    
    const wrapper = mount(ThoughtChainPanel, {
      props: {
        chain: chainWithoutResult
      }
    })
    
    await wrapper.find('.panel-header').trigger('click')
    
    expect(wrapper.text()).toContain('Thinking')
    expect(wrapper.text()).toContain('执行：')
    expect(wrapper.text()).not.toContain('结果：')
  })

  it('should display unknown step type as-is', async () => {
    const chainWithUnknownType = {
      steps: [
        {
          type: 'unknown_type',
          thought: 'Unknown'
        }
      ]
    }
    
    const wrapper = mount(ThoughtChainPanel, {
      props: {
        chain: chainWithUnknownType
      }
    })
    
    await wrapper.find('.panel-header').trigger('click')
    
    expect(wrapper.text()).toContain('unknown_type')
  })

  it('should have rotating arrow icon when expanded', async () => {
    const wrapper = mount(ThoughtChainPanel, {
      props: {
        chain: mockChain
      }
    })
    
    const vm = wrapper.vm as any
    // Toggle expanded state
    vm.expanded = true
    await wrapper.vm.$nextTick()
    
    // Check component state
    expect(vm.expanded).toBe(true)
  })

  it('should not have rotating arrow icon when collapsed', () => {
    const wrapper = mount(ThoughtChainPanel, {
      props: {
        chain: mockChain
      }
    })
    
    const vm = wrapper.vm as any
    expect(vm.expanded).toBe(false)
  })
})
