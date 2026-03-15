/**
 * 会话管理 Store
 * 使用 Pinia 管理会话列表和当前会话
 */
import { defineStore } from 'pinia'
import { 
  getSessions, 
  createSession, 
  deleteSession,
  renameSession,
  getCurrentSession,
  exportSession,
  type Session 
} from '@/api/session'
import { getHistoryMessages } from '@/api/chat'
import { useWorkspaceStore } from '@/stores/workspace'

export interface SessionState {
  sessions: Session[]
  currentSessionId: string | null
  currentSessionMessages: any[]
  isLoading: boolean
  error: string | null
}

export const useSessionStore = defineStore('session', {
  state: (): SessionState => ({
    sessions: [],
    currentSessionId: null,
    currentSessionMessages: [],
    isLoading: false,
    error: null
  }),

  getters: {
    currentSession: (state) => {
      return state.sessions.find(s => s.id === state.currentSessionId) || null
    },
    hasSessions: (state) => state.sessions.length > 0,
    sessionCount: (state) => state.sessions.length
  },

  actions: {
    /**
     * 加载会话列表
     */
    async loadSessions() {
      this.isLoading = true
      this.error = null
      
      try {
        const sessionsData = await getSessions()
        this.sessions = sessionsData.map(session => ({
          id: session.session_id || session.id,
          name: session.title || session.name,
          created_at: session.created_at,
          updated_at: session.updated_at,
          message_count: session.message_count || session.task_count
        }))
        return this.sessions
      } catch (error) {
        this.error = (error as Error).message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 创建新会话
     */
    async createNewSession(name?: string) {
      this.isLoading = true
      this.error = null
      
      try {
        // 获取当前工作目录
        const workspaceStore = useWorkspaceStore()
        const workspacePath = workspaceStore.workspacePath
        
        const session = await createSession(name, workspacePath)
        this.sessions.push(session)
        this.currentSessionId = session.id
        return session
      } catch (error) {
        this.error = (error as Error).message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 删除会话
     */
    async deleteSession(id: string) {
      this.isLoading = true
      this.error = null
      
      try {
        await deleteSession(id)
        this.sessions = this.sessions.filter(s => s.id !== id)
        
        // 如果删除的是当前会话，切换到第一个会话或清空
        if (this.currentSessionId === id) {
          this.currentSessionId = this.sessions.length > 0 ? this.sessions[0].id : null
        }
      } catch (error) {
        this.error = (error as Error).message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 重命名会话
     */
    async renameSession(id: string, name: string) {
      this.isLoading = true
      this.error = null
      
      try {
        const session = await renameSession(id, name)
        const index = this.sessions.findIndex(s => s.id === id)
        if (index !== -1) {
          this.sessions[index] = session
        }
        return session
      } catch (error) {
        this.error = (error as Error).message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 设置当前会话
     */
    setCurrentSession(id: string | null) {
      this.currentSessionId = id
    },

    /**
     * 获取当前会话详情
     */
    async fetchCurrentSession() {
      if (!this.currentSessionId) return null
      
      try {
        const session = await getCurrentSession(this.currentSessionId)
        const index = this.sessions.findIndex(s => s.id === session.id)
        if (index !== -1) {
          this.sessions[index] = session
        }
        return session
      } catch (error) {
        this.error = (error as Error).message
        throw error
      }
    },

    /**
     * 导出会话
     */
    async exportCurrentSession(format: 'json' | 'markdown' = 'json') {
      if (!this.currentSessionId) {
        throw new Error('No current session selected')
      }
      
      try {
        const blob = await exportSession(this.currentSessionId, format)
        return blob
      } catch (error) {
        this.error = (error as Error).message
        throw error
      }
    },

    /**
     * 添加会话到列表（用于外部创建）
     */
    addSession(session: Session) {
      this.sessions.push(session)
      if (!this.currentSessionId) {
        this.currentSessionId = session.id
      }
    },

    /**
     * 更新会话（用于实时更新）
     */
    updateSession(id: string, updates: Partial<Session>) {
      const index = this.sessions.findIndex(s => s.id === id)
      if (index !== -1) {
        this.sessions[index] = { ...this.sessions[index], ...updates }
      }
    },

    /**
     * 批量设置会话列表
     */
    setSessions(sessions: Session[]) {
      this.sessions = sessions
    },

    /**
     * 加载会话消息
     */
    async loadSessionMessages(sessionId: string) {
      this.isLoading = true
      this.error = null
      
      try {
        const messages = await getHistoryMessages(sessionId)
        // 转换消息格式为应用需要的格式
        this.currentSessionMessages = messages.map((message, index) => ({
          id: `${sessionId}_${index}_${message.role}`,
          role: message.role,
          content: message.content,
          time: new Date(message.created_at).getTime(),
          timestamp: new Date(message.created_at).getTime(),
          isStreaming: false
        }))
        return this.currentSessionMessages
      } catch (error) {
        this.error = (error as Error).message
        this.currentSessionMessages = []
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 清空当前会话消息
     */
    clearCurrentSessionMessages() {
      this.currentSessionMessages = []
    }
  }
})
