import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MessageList from '@/components/chat/MessageList.vue'
import { useAppStore } from '@/stores/app'

describe('MessageList Component', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  it('should render correctly', () => {
    const wrapper = mount(MessageList, {
      global: {
        plugins: [pinia]
      }
    })
    
    expect(wrapper.find('.message-list').exists()).toBe(true)
  })

  it('should display empty state when no messages', () => {
    const wrapper = mount(MessageList, {
      global: {
        plugins: [pinia]
      }
    })
    
    const messageItems = wrapper.findAll('.message-item')
    expect(messageItems.length).toBe(0)
  })

  it('should display user messages', async () => {
    const appStore = useAppStore()
    appStore.setTurns([
      {
        id: '1',
        role: 'user',
        content: 'Hello',
        time: Date.now()
      }
    ])
    
    const wrapper = mount(MessageList, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('用户')
    expect(wrapper.text()).toContain('Hello')
  })

  it('should display assistant messages', async () => {
    const appStore = useAppStore()
    appStore.setTurns([
      {
        id: '2',
        role: 'assistant',
        content: 'Hi there',
        time: Date.now()
      }
    ])
    
    const wrapper = mount(MessageList, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('助手')
    expect(wrapper.text()).toContain('Hi there')
  })

  it('should display message status', async () => {
    const appStore = useAppStore()
    appStore.setTurns([
      {
        id: '3',
        role: 'assistant',
        content: 'Processing',
        time: Date.now(),
        status: 'running'
      }
    ])
    
    const wrapper = mount(MessageList, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('执行中')
  })

  it('should display plan thinking state', async () => {
    const appStore = useAppStore()
    appStore.setTurns([
      {
        id: '4',
        role: 'assistant',
        content: '',
        time: Date.now(),
        planThinking: true,
        planThinkingContent: 'Thinking about the task...'
      }
    ])
    
    const wrapper = mount(MessageList, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('正在思考')
  })

  it('should display execution plan', async () => {
    const appStore = useAppStore()
    appStore.setTurns([
      {
        id: '5',
        role: 'assistant',
        content: 'Done',
        time: Date.now(),
        plan: ['Step 1', 'Step 2', 'Step 3']
      }
    ])
    
    const wrapper = mount(MessageList, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('执行计划')
  })

  it('should display execution steps', async () => {
    const appStore = useAppStore()
    appStore.setTurns([
      {
        id: '6',
        role: 'assistant',
        content: 'Done',
        time: Date.now(),
        steps: [
          { description: 'Step 1', status: 'completed', step_index: 0 },
          { description: 'Step 2', status: 'running', step_index: 1 }
        ]
      }
    ])
    
    const wrapper = mount(MessageList, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('执行步骤')
    expect(wrapper.text()).toContain('已完成')
    expect(wrapper.text()).toContain('执行中')
  })

  it('should display streaming indicator', async () => {
    const appStore = useAppStore()
    appStore.setTurns([
      {
        id: '7',
        role: 'assistant',
        content: '',
        time: Date.now(),
        isStreaming: true,
        isThinking: false,
        steps: []
      }
    ])
    
    const wrapper = mount(MessageList, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    // 检查 streaming 状态
    expect(appStore.turns[0].isStreaming).toBe(true)
  })

  it('should render markdown content', async () => {
    const appStore = useAppStore()
    appStore.setTurns([
      {
        id: '8',
        role: 'assistant',
        content: '**Bold text** and *italic*',
        time: Date.now()
      }
    ])
    
    const wrapper = mount(MessageList, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.html()).toContain('<strong>Bold text</strong>')
  })

  it('should display message time', async () => {
    const timestamp = Date.now()
    const appStore = useAppStore()
    appStore.setTurns([
      {
        id: '9',
        role: 'user',
        content: 'Test',
        time: timestamp
      }
    ])
    
    const wrapper = mount(MessageList, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    // Should contain formatted time
    expect(wrapper.find('.message-time').exists()).toBe(true)
  })

  it('should have message avatars', async () => {
    const appStore = useAppStore()
    appStore.setTurns([
      {
        id: '10',
        role: 'user',
        content: 'Hello',
        time: Date.now()
      },
      {
        id: '11',
        role: 'assistant',
        content: 'Hi',
        time: Date.now()
      }
    ])
    
    const wrapper = mount(MessageList, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const avatars = wrapper.findAll('.message-avatar')
    expect(avatars.length).toBe(2)
  })

  it('should handle multiple messages', async () => {
    const appStore = useAppStore()
    appStore.setTurns([
      { id: '1', role: 'user', content: 'Message 1', time: Date.now() },
      { id: '2', role: 'assistant', content: 'Message 2', time: Date.now() },
      { id: '3', role: 'user', content: 'Message 3', time: Date.now() }
    ])
    
    const wrapper = mount(MessageList, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const messageItems = wrapper.findAll('.message-item')
    expect(messageItems.length).toBe(3)
  })
})
