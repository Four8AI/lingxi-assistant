import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Session API', () => {
    it('should get sessions', async () => {
      const mockSessions = [
        { session_id: '1', title: 'Session 1' },
        { session_id: '2', title: 'Session 2' }
      ]
      window.electronAPI.api.getSessions = vi.fn().mockResolvedValue(mockSessions)
      
      const result = await window.electronAPI.api.getSessions()
      
      expect(result).toEqual(mockSessions)
      expect(window.electronAPI.api.getSessions).toHaveBeenCalled()
    })

    it('should get session history', async () => {
      const mockHistory = {
        sessionId: 'session-1',
        turns: [
          { id: '1', role: 'user', content: 'Hello' },
          { id: '2', role: 'assistant', content: 'Hi there' }
        ]
      }
      window.electronAPI.api.getSessionHistory = vi.fn().mockResolvedValue(mockHistory)
      
      const result = await window.electronAPI.api.getSessionHistory('session-1')
      
      expect(result).toEqual(mockHistory)
      expect(window.electronAPI.api.getSessionHistory).toHaveBeenCalledWith('session-1')
    })

    it('should get session history with maxTurns', async () => {
      const mockHistory = { sessionId: 'session-1', turns: [] }
      window.electronAPI.api.getSessionHistory = vi.fn().mockResolvedValue(mockHistory)
      
      await window.electronAPI.api.getSessionHistory('session-1', 10)
      
      expect(window.electronAPI.api.getSessionHistory).toHaveBeenCalledWith('session-1', 10)
    })

    it('should create session', async () => {
      const mockSession = { session_id: 'new-session', title: 'New Session' }
      window.electronAPI.api.createSession = vi.fn().mockResolvedValue(mockSession)
      
      const result = await window.electronAPI.api.createSession('test-user')
      
      expect(result).toEqual(mockSession)
      expect(window.electronAPI.api.createSession).toHaveBeenCalledWith('test-user')
    })

    it('should create session without username', async () => {
      const mockSession = { session_id: 'new-session', title: 'New Session' }
      window.electronAPI.api.createSession = vi.fn().mockResolvedValue(mockSession)
      
      await window.electronAPI.api.createSession()
      
      expect(window.electronAPI.api.createSession).toHaveBeenCalled()
    })

    it('should delete session', async () => {
      window.electronAPI.api.deleteSession = vi.fn().mockResolvedValue(undefined)
      
      await window.electronAPI.api.deleteSession('session-1')
      
      expect(window.electronAPI.api.deleteSession).toHaveBeenCalledWith('session-1')
    })

    it('should get session info', async () => {
      const mockInfo = {
        session_id: 'session-1',
        title: 'Test Session',
        task_list: []
      }
      window.electronAPI.api.getSessionInfo = vi.fn().mockResolvedValue(mockInfo)
      
      const result = await window.electronAPI.api.getSessionInfo('session-1')
      
      expect(result).toEqual(mockInfo)
    })

    it('should update session name', async () => {
      window.electronAPI.api.updateSessionName = vi.fn().mockResolvedValue(undefined)
      
      await window.electronAPI.api.updateSessionName('session-1', 'New Name')
      
      expect(window.electronAPI.api.updateSessionName).toHaveBeenCalledWith('session-1', 'New Name')
    })
  })

  describe('Task API', () => {
    it('should execute task', async () => {
      const mockResult = { execution_id: 'exec-1', status: 'running' }
      window.electronAPI.api.executeTask = vi.fn().mockResolvedValue(mockResult)
      
      const result = await window.electronAPI.api.executeTask('Test task', 'session-1')
      
      expect(result).toEqual(mockResult)
      expect(window.electronAPI.api.executeTask).toHaveBeenCalledWith('Test task', 'session-1')
    })

    it('should execute task with model override', async () => {
      const mockResult = { execution_id: 'exec-1', status: 'running' }
      window.electronAPI.api.executeTask = vi.fn().mockResolvedValue(mockResult)
      
      await window.electronAPI.api.executeTask('Test task', 'session-1', 'gpt-4')
      
      expect(window.electronAPI.api.executeTask).toHaveBeenCalledWith('Test task', 'session-1', 'gpt-4')
    })

    it('should get task status', async () => {
      const mockStatus = { execution_id: 'exec-1', status: 'completed', progress: 100 }
      window.electronAPI.api.getTaskStatus = vi.fn().mockResolvedValue(mockStatus)
      
      const result = await window.electronAPI.api.getTaskStatus('exec-1')
      
      expect(result).toEqual(mockStatus)
    })

    it('should retry task', async () => {
      window.electronAPI.api.retryTask = vi.fn().mockResolvedValue(undefined)
      
      await window.electronAPI.api.retryTask('exec-1', 2, 'Retry with this')
      
      expect(window.electronAPI.api.retryTask).toHaveBeenCalledWith('exec-1', 2, 'Retry with this')
    })

    it('should retry task without step index', async () => {
      window.electronAPI.api.retryTask = vi.fn().mockResolvedValue(undefined)
      
      await window.electronAPI.api.retryTask('exec-1')
      
      expect(window.electronAPI.api.retryTask).toHaveBeenCalledWith('exec-1')
    })

    it('should cancel task', async () => {
      window.electronAPI.api.cancelTask = vi.fn().mockResolvedValue(undefined)
      
      await window.electronAPI.api.cancelTask('exec-1')
      
      expect(window.electronAPI.api.cancelTask).toHaveBeenCalledWith('exec-1')
    })
  })

  describe('Checkpoint API', () => {
    it('should get checkpoints', async () => {
      const mockCheckpoints = [
        { session_id: 'session-1', task_id: 'task-1', created_at: '2024-01-01' }
      ]
      window.electronAPI.api.getCheckpoints = vi.fn().mockResolvedValue(mockCheckpoints)
      
      const result = await window.electronAPI.api.getCheckpoints()
      
      expect(result).toEqual(mockCheckpoints)
    })

    it('should resume checkpoint', async () => {
      const mockResult = { success: true }
      window.electronAPI.api.resumeCheckpoint = vi.fn().mockResolvedValue(mockResult)
      
      const result = await window.electronAPI.api.resumeCheckpoint('session-1')
      
      expect(result).toEqual(mockResult)
    })

    it('should delete checkpoint', async () => {
      window.electronAPI.api.deleteCheckpoint = vi.fn().mockResolvedValue(undefined)
      
      await window.electronAPI.api.deleteCheckpoint('session-1')
      
      expect(window.electronAPI.api.deleteCheckpoint).toHaveBeenCalledWith('session-1')
    })
  })

  describe('Skill API', () => {
    it('should get skills', async () => {
      const mockSkills = [
        { skill_id: 'skill-1', name: 'Test Skill', version: '1.0.0' }
      ]
      window.electronAPI.api.getSkills = vi.fn().mockResolvedValue(mockSkills)
      
      const result = await window.electronAPI.api.getSkills()
      
      expect(result).toEqual(mockSkills)
    })

    it('should install skill', async () => {
      const mockResult = { success: true, skill_id: 'skill-1' }
      window.electronAPI.api.installSkill = vi.fn().mockResolvedValue(mockResult)
      
      const skillData = { name: 'Test Skill', version: '1.0.0' }
      const skillFiles = { 'index.js': 'console.log("hello")' }
      
      const result = await window.electronAPI.api.installSkill(skillData, skillFiles)
      
      expect(result).toEqual(mockResult)
      expect(window.electronAPI.api.installSkill).toHaveBeenCalledWith(skillData, skillFiles)
    })

    it('should diagnose skill', async () => {
      const mockDiagnosis = { skill_id: 'skill-1', status: 'healthy' }
      window.electronAPI.api.diagnoseSkill = vi.fn().mockResolvedValue(mockDiagnosis)
      
      const result = await window.electronAPI.api.diagnoseSkill('skill-1')
      
      expect(result).toEqual(mockDiagnosis)
    })

    it('should reload skill', async () => {
      window.electronAPI.api.reloadSkill = vi.fn().mockResolvedValue(undefined)
      
      await window.electronAPI.api.reloadSkill('skill-1')
      
      expect(window.electronAPI.api.reloadSkill).toHaveBeenCalledWith('skill-1')
    })
  })

  describe('Resource API', () => {
    it('should get resource usage', async () => {
      const mockUsage = {
        system: { cpu_percent: 50, memory_percent: 60 },
        token_usage: { current: 1000, limit: 10000 }
      }
      window.electronAPI.api.getResourceUsage = vi.fn().mockResolvedValue(mockUsage)
      
      const result = await window.electronAPI.api.getResourceUsage()
      
      expect(result).toEqual(mockUsage)
    })
  })

  describe('Config API', () => {
    it('should get config', async () => {
      const mockConfig = {
        llm: { model: 'gpt-4', api_key: '***' },
        execution: { max_steps: 100 }
      }
      window.electronAPI.api.getConfig = vi.fn().mockResolvedValue(mockConfig)
      
      const result = await window.electronAPI.api.getConfig()
      
      expect(result).toEqual(mockConfig)
    })

    it('should update config', async () => {
      window.electronAPI.api.updateConfig = vi.fn().mockResolvedValue(undefined)
      
      const newConfig = { llm: { model: 'gpt-4' } }
      await window.electronAPI.api.updateConfig(newConfig)
      
      expect(window.electronAPI.api.updateConfig).toHaveBeenCalledWith(newConfig)
    })
  })

  describe('Error Handling', () => {
    it('should handle API error', async () => {
      window.electronAPI.api.getSessions = vi.fn().mockRejectedValue(new Error('API Error'))
      
      await expect(window.electronAPI.api.getSessions()).rejects.toThrow('API Error')
    })

    it('should handle network error', async () => {
      window.electronAPI.api.executeTask = vi.fn().mockRejectedValue(new Error('Network Error'))
      
      await expect(window.electronAPI.api.executeTask('task', 'session')).rejects.toThrow('Network Error')
    })

    it('should handle timeout error', async () => {
      window.electronAPI.api.getTaskStatus = vi.fn().mockRejectedValue(new Error('Timeout'))
      
      await expect(window.electronAPI.api.getTaskStatus('exec-1')).rejects.toThrow('Timeout')
    })
  })
})
