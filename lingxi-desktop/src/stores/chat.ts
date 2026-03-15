/**
 * 聊天状态管理 Store
 * 使用 Pinia 管理聊天消息、加载状态和错误状态
 */
import { defineStore } from 'pinia'
import { sendMessage, getHistoryMessages, stopGeneration, clearHistory, type Message } from '@/api/chat'

export interface ChatState {
  messages: Message[]
  isLoading: boolean
  isStreaming: boolean
  error: string | null
  currentExecutionId: string | null
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    messages: [],
    isLoading: false,
    isStreaming: false,
    error: null,
    currentExecutionId: null
  }),

  getters: {
    hasMessages: (state) => state.messages.length > 0,
    lastMessage: (state) => state.messages[state.messages.length - 1] || null
  },

  actions: {
    /**
     * 发送消息
     */
    async sendMessage(content: string, sessionId: string) {
      this.isLoading = true
      this.error = null
      
      try {
        const message = await sendMessage({
          content,
          session_id: sessionId
        })
        this.messages.push(message as Message)
        return message
      } catch (error) {
        this.error = (error as Error).message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 加载历史消息
     */
    async loadHistory(sessionId: string, limit: number = 50) {
      this.isLoading = true
      this.error = null
      
      try {
        this.messages = await getHistoryMessages(sessionId, limit)
        return this.messages
      } catch (error) {
        this.error = (error as Error).message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 添加消息到列表（用于 WebSocket 实时更新）
     */
    addMessage(message: Message) {
      this.messages.push(message)
    },

    /**
     * 更新消息（用于流式响应）
     */
    updateMessage(messageId: string, updates: Partial<Message>) {
      const index = this.messages.findIndex(m => m.id === messageId)
      if (index !== -1) {
        this.messages[index] = { ...this.messages[index], ...updates }
      }
    },

    /**
     * 清除消息列表
     */
    clearMessages() {
      this.messages = []
      this.error = null
      this.currentExecutionId = null
    },

    /**
     * 设置流式状态
     */
    setStreaming(streaming: boolean) {
      this.isStreaming = streaming
    },

    /**
     * 设置当前执行 ID
     */
    setCurrentExecutionId(executionId: string | null) {
      this.currentExecutionId = executionId
    },

    /**
     * 停止生成
     */
    async stop(sessionId: string) {
      try {
        await stopGeneration(sessionId)
      } catch (error) {
        console.error('Failed to stop generation:', error)
      }
    },

    /**
     * 清除历史
     */
    async clearHistoryMessages(sessionId: string) {
      try {
        await clearHistory(sessionId)
        this.clearMessages()
      } catch (error) {
        this.error = (error as Error).message
        throw error
      }
    }
  }
})
