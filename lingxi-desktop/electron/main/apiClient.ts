import axios, { AxiosInstance, AxiosError } from 'axios'
import type {
  Session,
  HistoryResponse,
  ExecutionResult,
  ExecutionStatus,
  Checkpoint,
  Skill,
  InstallResult,
  DiagnosticResult,
  ResourceUsage,
  Config
} from '../types'

export class ApiClient {
  private client: AxiosInstance
  private baseUrl: string
  private maxRetries: number = 3
  private timeout: number = 30000

  constructor(baseUrl: string, timeout?: number) {
    this.baseUrl = baseUrl
    this.timeout = timeout || this.timeout

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.client.interceptors.request.use(
      (config) => config,
      (error) => Promise.reject(error)
    )

    this.client.interceptors.response.use(
      (response) => response.data,
      async (error: AxiosError) => {
        if (!error.config) return Promise.reject(error)

        const retryCount = (error.config as any).__retryCount || 0

        if (retryCount < this.maxRetries && this.shouldRetry(error)) {
          (error.config as any).__retryCount = retryCount + 1
          await this.delay(Math.pow(2, retryCount) * 1000)
          return this.client.request(error.config)
        }

        return Promise.reject(error)
      }
    )
  }

  private shouldRetry(error: AxiosError): boolean {
    if (!error.response) return true
    const status = error.response.status
    return status >= 500 || status === 429
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async getSessions(): Promise<Session[]> {
    const response = await this.client.get('/api/sessions')
    // 转换后端返回的会话数据格式为前端期望的格式
    return response.sessions.map((session: any) => ({
      id: session.session_id,
      name: session.first_message || '新会话'
    }))
  }

  async getSessionHistory(sessionId: string, maxTurns?: number): Promise<HistoryResponse> {
    const params = maxTurns ? { maxTurns } : {}
    return this.client.get(`/api/sessions/${sessionId}/history`, { params })
  }

  async createSession(userName?: string): Promise<Session> {
    return this.client.post('/api/sessions', { userName })
  }

  async deleteSession(sessionId: string): Promise<void> {
    return this.client.delete(`/api/sessions/${sessionId}`)
  }

  async updateSessionName(sessionId: string, name: string): Promise<void> {
    return this.client.patch(`/api/sessions/${sessionId}`, { name })
  }

  async clearSessionHistory(sessionId: string): Promise<void> {
    return this.client.delete(`/api/sessions/${sessionId}/history`)
  }

  async executeTask(
    task: string,
    sessionId: string,
    modelOverride?: string
  ): Promise<ExecutionResult> {
    return this.client.post('/api/tasks/execute', {
      task,
      sessionId,
      modelOverride
    })
  }

  async getTaskStatus(executionId: string): Promise<ExecutionStatus> {
    return this.client.get(`/api/tasks/${executionId}/status`)
  }

  async retryTask(
    executionId: string,
    stepIndex?: number,
    userInput?: string
  ): Promise<void> {
    return this.client.post(`/api/tasks/${executionId}/retry`, {
      stepIndex,
      userInput
    })
  }

  async cancelTask(executionId: string): Promise<void> {
    return this.client.post(`/api/tasks/${executionId}/cancel`)
  }

  async getCheckpoints(): Promise<Checkpoint[]> {
    return this.client.get('/api/checkpoints')
  }

  async resumeCheckpoint(sessionId: string): Promise<ExecutionResult> {
    return this.client.post(`/api/checkpoints/${sessionId}/resume`)
  }

  async deleteCheckpoint(sessionId: string): Promise<void> {
    return this.client.delete(`/api/checkpoints/${sessionId}`)
  }

  async getSkills(): Promise<Skill[]> {
    return this.client.get('/api/skills')
  }

  async installSkill(
    skillData: any,
    skillFiles: Record<string, string>
  ): Promise<InstallResult> {
    return this.client.post('/api/skills/install', {
      skillData,
      skillFiles
    })
  }

  async diagnoseSkill(skillId: string): Promise<DiagnosticResult> {
    return this.client.get(`/api/skills/${skillId}/diagnose`)
  }

  async reloadSkill(skillId: string): Promise<void> {
    return this.client.post(`/api/skills/${skillId}/reload`)
  }

  async getResourceUsage(): Promise<ResourceUsage> {
    return this.client.get('/api/resources')
  }

  async getConfig(): Promise<Config> {
    return this.client.get('/api/config')
  }

  async updateConfig(config: Partial<Config>): Promise<void> {
    return this.client.patch('/api/config', config)
  }

  async getSessionInfo(sessionId: string): Promise<any> {
    return this.client.get(`/api/sessions/${sessionId}`)
  }
}
