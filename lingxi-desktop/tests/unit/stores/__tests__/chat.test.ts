/**
 * Chat Store 单元测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useChatStore } from '@/stores/chat'
import * as chatApi from '@/api/chat'

describe('Chat Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const store = useChatStore()
    expect(store.messages).toEqual([])
    expect(store.isLoading).toBe(false)
    expect(store.isStreaming).toBe(false)
    expect(store.error).toBe(null)
    expect(store.currentExecutionId).toBe(null)
  })

  it('should send message successfully', async () => {
    vi.spyOn(chatApi, 'sendMessage').mockResolvedValue({
      id: '1',
      content: 'Hello',
      role: 'assistant',
      session_id: 'session-1',
      created_at: new Date().toISOString()
    })

    const store = useChatStore()
    await store.sendMessage('Test message', 'session-1')
    
    expect(store.messages.length).toBe(1)
    expect(store.messages[0].content).toBe('Hello')
    expect(store.isLoading).toBe(false)
    expect(store.error).toBe(null)
  })

  it('should handle send error', async () => {
    vi.spyOn(chatApi, 'sendMessage').mockRejectedValue(new Error('Network error'))
    
    const store = useChatStore()
    await expect(store.sendMessage('Test', 'session-1')).rejects.toThrow('Network error')
    expect(store.isLoading).toBe(false)
    expect(store.error).toBe('Network error')
  })

  it('should load history messages', async () => {
    const mockMessages = [
      { id: '1', content: 'Hello', role: 'user' as const, session_id: 'session-1', created_at: new Date().toISOString() },
      { id: '2', content: 'Hi there', role: 'assistant' as const, session_id: 'session-1', created_at: new Date().toISOString() }
    ]
    
    vi.spyOn(chatApi, 'getHistoryMessages').mockResolvedValue(mockMessages)
    
    const store = useChatStore()
    await store.loadHistory('session-1', 50)
    
    expect(store.messages).toEqual(mockMessages)
    expect(store.isLoading).toBe(false)
  })

  it('should add message to list', () => {
    const store = useChatStore()
    const message = {
      id: '1',
      content: 'New message',
      role: 'assistant' as const,
      session_id: 'session-1',
      created_at: new Date().toISOString()
    }
    
    store.addMessage(message)
    
    expect(store.messages.length).toBe(1)
    expect(store.messages[0]).toEqual(message)
  })

  it('should update message', () => {
    const store = useChatStore()
    const message = {
      id: '1',
      content: 'Initial',
      role: 'assistant' as const,
      session_id: 'session-1',
      created_at: new Date().toISOString()
    }
    
    store.addMessage(message)
    store.updateMessage('1', { content: 'Updated' })
    
    expect(store.messages[0].content).toBe('Updated')
  })

  it('should clear messages', () => {
    const store = useChatStore()
    store.addMessage({
      id: '1',
      content: 'Test',
      role: 'user' as const,
      session_id: 'session-1',
      created_at: new Date().toISOString()
    })
    store.error = 'Some error'
    store.currentExecutionId = 'exec-1'
    
    store.clearMessages()
    
    expect(store.messages).toEqual([])
    expect(store.error).toBe(null)
    expect(store.currentExecutionId).toBe(null)
  })

  it('should set streaming state', () => {
    const store = useChatStore()
    
    store.setStreaming(true)
    expect(store.isStreaming).toBe(true)
    
    store.setStreaming(false)
    expect(store.isStreaming).toBe(false)
  })

  it('should have correct getters', () => {
    const store = useChatStore()
    
    expect(store.hasMessages).toBe(false)
    expect(store.lastMessage).toBe(null)
    
    store.addMessage({
      id: '1',
      content: 'Test',
      role: 'user' as const,
      session_id: 'session-1',
      created_at: new Date().toISOString()
    })
    
    expect(store.hasMessages).toBe(true)
    expect(store.lastMessage?.content).toBe('Test')
  })
})
