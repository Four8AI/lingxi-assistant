import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import StepInterventionCard from '@/components/chat/StepInterventionCard.vue'
import type { Step } from '@/types'

describe('StepInterventionCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockSteps: Step[] = [
    {
      step_id: 'step-1',
      step_index: 0,
      step_type: 'thinking',
      description: 'First step',
      thought: 'Thinking about step 1',
      result: 'Success',
      skill_call: null,
      status: 'completed',
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      step_id: 'step-2',
      step_index: 1,
      step_type: 'action',
      description: 'Failed step',
      thought: 'Attempting action',
      result: '',
      skill_call: 'test-skill',
      status: 'failed',
      created_at: '2024-01-01T00:00:00Z'
    }
  ]

  it('should render correctly', () => {
    const wrapper = mount(StepInterventionCard, {
      props: {
        steps: mockSteps
      }
    })
    
    expect(wrapper.find('.step-intervention-card').exists()).toBe(true)
    expect(wrapper.find('.intervention-header').exists()).toBe(true)
    expect(wrapper.find('.intervention-body').exists()).toBe(true)
  })

  it('should display intervention header', () => {
    const wrapper = mount(StepInterventionCard, {
      props: {
        steps: mockSteps
      }
    })
    
    expect(wrapper.text()).toContain('步骤执行失败')
    expect(wrapper.text()).toContain('需要人工干预')
  })

  it('should display failed steps only', () => {
    const wrapper = mount(StepInterventionCard, {
      props: {
        steps: mockSteps
      }
    })
    
    const interventionSteps = wrapper.findAll('.intervention-step')
    expect(interventionSteps.length).toBe(1)
    expect(wrapper.text()).toContain('步骤 2')
  })

  it('should display step name', () => {
    const wrapper = mount(StepInterventionCard, {
      props: {
        steps: mockSteps
      }
    })
    
    expect(wrapper.text()).toContain('Failed step')
  })

  it('should display retry count', () => {
    const stepsWithRetry: Step[] = [
      {
        ...mockSteps[1],
        step_index: 1
      }
    ]
    
    const wrapper = mount(StepInterventionCard, {
      props: {
        steps: stepsWithRetry
      }
    })
    
    expect(wrapper.text()).toContain('重试次数')
  })

  it('should have text area for user input', () => {
    const wrapper = mount(StepInterventionCard, {
      props: {
        steps: mockSteps
      }
    })
    
    const textarea = wrapper.find('textarea')
    expect(textarea.exists()).toBe(true)
    expect(textarea.attributes('placeholder')).toContain('请输入修正内容')
  })

  it('should have skip button', () => {
    const wrapper = mount(StepInterventionCard, {
      props: {
        steps: mockSteps
      }
    })
    
    expect(wrapper.text()).toContain('跳过')
  })

  it('should have retry button', () => {
    const wrapper = mount(StepInterventionCard, {
      props: {
        steps: mockSteps
      }
    })
    
    expect(wrapper.text()).toContain('重试')
  })

  it('should have batch retry button', () => {
    const wrapper = mount(StepInterventionCard, {
      props: {
        steps: mockSteps
      }
    })
    
    expect(wrapper.text()).toContain('批量重试')
  })

  it('should have submit button', () => {
    const wrapper = mount(StepInterventionCard, {
      props: {
        steps: mockSteps
      }
    })
    
    expect(wrapper.text()).toContain('提交修正')
  })

  it('should emit skip event when skip button is clicked', async () => {
    const wrapper = mount(StepInterventionCard, {
      props: {
        steps: mockSteps
      }
    })
    
    const skipButton = wrapper.findAll('button').find(btn => btn.text().includes('跳过'))
    await skipButton?.trigger('click')
    
    expect(wrapper.emitted('skip')).toBeDefined()
    expect(wrapper.emitted('skip')?.[0]).toEqual([1])
  })

  it('should emit retry event when retry button is clicked', async () => {
    const wrapper = mount(StepInterventionCard, {
      props: {
        steps: mockSteps
      }
    })
    
    const vm = wrapper.vm as any
    vm.userInput = 'Retry with this input'
    
    const retryButton = wrapper.findAll('button').find(btn => btn.text().includes('重试') && !btn.text().includes('批量'))
    await retryButton?.trigger('click')
    
    expect(wrapper.emitted('retry')).toBeDefined()
    expect(wrapper.emitted('retry')?.[0]).toEqual([1, 'Retry with this input'])
  })

  it('should emit batchRetry event when batch retry button is clicked', async () => {
    const wrapper = mount(StepInterventionCard, {
      props: {
        steps: mockSteps
      }
    })
    
    const batchRetryButton = wrapper.findAll('button').find(btn => btn.text().includes('批量重试'))
    await batchRetryButton?.trigger('click')
    
    expect(wrapper.emitted('batchRetry')).toBeDefined()
  })

  it('should emit submit event when submit button is clicked with input', async () => {
    const wrapper = mount(StepInterventionCard, {
      props: {
        steps: mockSteps
      }
    })
    
    const vm = wrapper.vm as any
    vm.userInput = 'Corrected content'
    
    const submitButton = wrapper.findAll('button').find(btn => btn.text().includes('提交修正'))
    await submitButton?.trigger('click')
    
    expect(wrapper.emitted('submit')).toBeDefined()
    expect(wrapper.emitted('submit')?.[0]).toEqual(['Corrected content'])
  })

  it('should not emit submit event when input is empty', async () => {
    const wrapper = mount(StepInterventionCard, {
      props: {
        steps: mockSteps
      }
    })
    
    const vm = wrapper.vm as any
    vm.userInput = ''
    
    const submitButton = wrapper.findAll('button').find(btn => btn.text().includes('提交修正'))
    await submitButton?.trigger('click')
    
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('should clear input after successful submit', async () => {
    const wrapper = mount(StepInterventionCard, {
      props: {
        steps: mockSteps
      }
    })
    
    const vm = wrapper.vm as any
    vm.userInput = 'Test input'
    
    const submitButton = wrapper.findAll('button').find(btn => btn.text().includes('提交修正'))
    await submitButton?.trigger('click')
    
    expect(vm.userInput).toBe('')
  })

  it('should handle steps without error', () => {
    const stepsWithoutError: Step[] = [
      {
        step_id: 'step-1',
        step_index: 0,
        step_type: 'action',
        description: 'Failed step',
        thought: 'Thinking',
        result: '',
        skill_call: null,
        status: 'failed',
        created_at: '2024-01-01T00:00:00Z'
      }
    ]
    
    const wrapper = mount(StepInterventionCard, {
      props: {
        steps: stepsWithoutError
      }
    })
    
    expect(wrapper.text()).not.toContain('错误信息')
  })

  it('should display error message when present', () => {
    const stepsWithError: any[] = [
      {
        ...mockSteps[1],
        error: {
          message: 'Test error message',
          type: 'TestError',
          suggestions: ['Fix this', 'Try that']
        }
      }
    ]
    
    const wrapper = mount(StepInterventionCard, {
      props: {
        steps: stepsWithError
      }
    })
    
    expect(wrapper.text()).toContain('错误信息')
    expect(wrapper.text()).toContain('Test error message')
  })

  it('should display error type when present', () => {
    const stepsWithError: any[] = [
      {
        ...mockSteps[1],
        error: {
          message: 'Test error',
          type: 'ValidationError'
        }
      }
    ]
    
    const wrapper = mount(StepInterventionCard, {
      props: {
        steps: stepsWithError
      }
    })
    
    expect(wrapper.text()).toContain('错误类型')
    expect(wrapper.text()).toContain('ValidationError')
  })

  it('should display suggestions when present', () => {
    const stepsWithSuggestions: any[] = [
      {
        ...mockSteps[1],
        error: {
          message: 'Test error',
          type: 'Error',
          suggestions: ['Suggestion 1', 'Suggestion 2']
        }
      }
    ]
    
    const wrapper = mount(StepInterventionCard, {
      props: {
        steps: stepsWithSuggestions
      }
    })
    
    expect(wrapper.text()).toContain('修正建议')
    expect(wrapper.text()).toContain('Suggestion 1')
    expect(wrapper.text()).toContain('Suggestion 2')
  })

  it('should handle empty steps array', () => {
    const wrapper = mount(StepInterventionCard, {
      props: {
        steps: []
      }
    })
    
    expect(wrapper.find('.step-intervention-card').exists()).toBe(true)
    const interventionSteps = wrapper.findAll('.intervention-step')
    expect(interventionSteps.length).toBe(0)
  })

  it('should handle all steps completed (no failed steps)', () => {
    const completedSteps: Step[] = [
      {
        ...mockSteps[0],
        status: 'completed'
      }
    ]
    
    const wrapper = mount(StepInterventionCard, {
      props: {
        steps: completedSteps
      }
    })
    
    const interventionSteps = wrapper.findAll('.intervention-step')
    expect(interventionSteps.length).toBe(0)
  })
})
