import { describe, it, expect } from 'vitest'
import type {
  ApiResponse,
  Session,
  Turn,
  ThoughtChain,
  ThoughtStep,
  ModelRoute,
  Step,
  StepError,
  WorkspaceInfo,
  WorkspaceValidationResult,
  Skill,
  ResourceUsage,
  FileChange,
  WorkspaceFilesChangedEvent
} from '@/types'

describe('Type Definitions', () => {
  describe('ApiResponse', () => {
    it('should have correct structure', () => {
      const response: ApiResponse<string> = {
        code: 200,
        message: 'Success',
        data: 'test data'
      }
      
      expect(response.code).toBe(200)
      expect(response.message).toBe('Success')
      expect(response.data).toBe('test data')
    })

    it('should support optional error', () => {
      const response: ApiResponse<null> = {
        code: 500,
        message: 'Error',
        data: null,
        error: {
          error_code: 'INTERNAL_ERROR',
          error_detail: 'Something went wrong'
        }
      }
      
      expect(response.error?.error_code).toBe('INTERNAL_ERROR')
    })
  })

  describe('Session', () => {
    it('should have required fields', () => {
      const session: Session = {
        id: 'session-1',
        name: 'Test Session',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        userName: 'test-user',
        hasCheckpoint: false,
        checkpointCount: 0
      }
      
      expect(session.id).toBe('session-1')
      expect(session.name).toBe('Test Session')
      expect(typeof session.createdAt).toBe('number')
    })

    it('should support optional checkpoint expiry', () => {
      const session: Session = {
        id: 'session-1',
        name: 'Test Session',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        hasCheckpoint: true,
        checkpointCount: 1,
        checkpointExpiry: Date.now() + 3600000
      }
      
      expect(session.checkpointExpiry).toBeDefined()
    })
  })

  describe('Turn', () => {
    it('should have user turn structure', () => {
      const turn: Turn = {
        id: 'turn-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now()
      }
      
      expect(turn.role).toBe('user')
      expect(turn.content).toBe('Hello')
    })

    it('should have assistant turn with thought chain', () => {
      const turn: Turn = {
        id: 'turn-1',
        role: 'assistant',
        content: 'Response',
        timestamp: Date.now(),
        thoughtChain: {
          taskId: 'task-1',
          steps: [],
          status: 'completed'
        }
      }
      
      expect(turn.role).toBe('assistant')
      expect(turn.thoughtChain?.status).toBe('completed')
    })

    it('should have assistant turn with steps', () => {
      const turn: Turn = {
        id: 'turn-1',
        role: 'assistant',
        content: 'Response',
        timestamp: Date.now(),
        steps: [
          {
            step_id: 'step-1',
            step_index: 0,
            step_type: 'thinking',
            description: 'Step 1',
            thought: 'Thinking',
            result: 'Done',
            skill_call: null,
            status: 'completed',
            created_at: '2024-01-01T00:00:00Z'
          }
        ]
      }
      
      expect(turn.steps?.length).toBe(1)
    })
  })

  describe('ThoughtChain', () => {
    it('should have correct status values', () => {
      const pending: ThoughtChain = {
        taskId: 'task-1',
        steps: [],
        status: 'pending'
      }
      
      const running: ThoughtChain = {
        taskId: 'task-1',
        steps: [],
        status: 'running'
      }
      
      const completed: ThoughtChain = {
        taskId: 'task-1',
        steps: [],
        status: 'completed'
      }
      
      const failed: ThoughtChain = {
        taskId: 'task-1',
        steps: [],
        status: 'failed'
      }
      
      expect(pending.status).toBe('pending')
      expect(running.status).toBe('running')
      expect(completed.status).toBe('completed')
      expect(failed.status).toBe('failed')
    })
  })

  describe('ThoughtStep', () => {
    it('should have correct step types', () => {
      const analysis: ThoughtStep = {
        stepIndex: 0,
        type: 'analysis',
        content: 'Analyzing',
        status: 'completed'
      }
      
      const planning: ThoughtStep = {
        stepIndex: 1,
        type: 'planning',
        content: 'Planning',
        status: 'completed'
      }
      
      const routing: ThoughtStep = {
        stepIndex: 2,
        type: 'routing',
        content: 'Routing',
        status: 'completed'
      }
      
      const execution: ThoughtStep = {
        stepIndex: 3,
        type: 'execution',
        content: 'Executing',
        status: 'completed'
      }
      
      expect(analysis.type).toBe('analysis')
      expect(planning.type).toBe('planning')
      expect(routing.type).toBe('routing')
      expect(execution.type).toBe('execution')
    })

    it('should support optional fields', () => {
      const step: ThoughtStep = {
        stepIndex: 0,
        type: 'analysis',
        content: 'Analyzing',
        status: 'completed',
        thought: 'Deep thought',
        action: 'Run command',
        observation: 'Command output',
        confidence: 0.95
      }
      
      expect(step.thought).toBe('Deep thought')
      expect(step.action).toBe('Run command')
      expect(step.confidence).toBe(0.95)
    })
  })

  describe('ModelRoute', () => {
    it('should have correct structure', () => {
      const route: ModelRoute = {
        taskId: 'task-1',
        selectedModel: 'gpt-4',
        reason: 'Complex task requires advanced reasoning',
        estimatedTokens: 1000,
        estimatedCost: 0.03,
        canOverride: true
      }
      
      expect(route.selectedModel).toBe('gpt-4')
      expect(route.canOverride).toBe(true)
    })
  })

  describe('Step', () => {
    it('should have correct step types', () => {
      const thinking: Step = {
        step_id: 'step-1',
        step_index: 0,
        step_type: 'thinking',
        description: 'Thinking step',
        thought: 'Deep thought',
        result: 'Conclusion',
        skill_call: null,
        status: 'completed',
        created_at: '2024-01-01T00:00:00Z'
      }
      
      const action: Step = {
        step_id: 'step-2',
        step_index: 1,
        step_type: 'action',
        description: 'Action step',
        thought: 'Planning action',
        result: 'Success',
        skill_call: 'test-skill',
        status: 'completed',
        created_at: '2024-01-01T00:00:00Z'
      }
      
      expect(thinking.step_type).toBe('thinking')
      expect(action.step_type).toBe('action')
    })

    it('should have correct status values', () => {
      const completed: Step = {
        step_id: 'step-1',
        step_index: 0,
        step_type: 'thinking',
        description: 'Step',
        thought: 'Thought',
        result: 'Result',
        skill_call: null,
        status: 'completed',
        created_at: '2024-01-01T00:00:00Z'
      }
      
      const failed: Step = {
        ...completed,
        step_id: 'step-2',
        status: 'failed'
      }
      
      const running: Step = {
        ...completed,
        step_id: 'step-3',
        status: 'running'
      }
      
      expect(completed.status).toBe('completed')
      expect(failed.status).toBe('failed')
      expect(running.status).toBe('running')
    })
  })

  describe('StepError', () => {
    it('should have correct structure', () => {
      const error: StepError = {
        message: 'Something went wrong',
        type: 'ExecutionError',
        suggestions: ['Try again', 'Check inputs'],
        requiresIntervention: true
      }
      
      expect(error.message).toBe('Something went wrong')
      expect(error.suggestions.length).toBe(2)
      expect(error.requiresIntervention).toBe(true)
    })
  })

  describe('WorkspaceInfo', () => {
    it('should have correct structure', () => {
      const info: WorkspaceInfo = {
        workspace: '/home/user/workspace',
        lingxi_dir: '/home/user/workspace/.lingxi',
        is_initialized: true
      }
      
      expect(info.workspace).toBe('/home/user/workspace')
      expect(info.is_initialized).toBe(true)
    })

    it('should support null workspace', () => {
      const info: WorkspaceInfo = {
        workspace: null,
        lingxi_dir: null,
        is_initialized: false
      }
      
      expect(info.workspace).toBe(null)
      expect(info.is_initialized).toBe(false)
    })
  })

  describe('WorkspaceValidationResult', () => {
    it('should have correct structure for valid workspace', () => {
      const result: WorkspaceValidationResult = {
        valid: true,
        exists: true,
        has_lingxi_dir: true,
        message: 'Valid workspace'
      }
      
      expect(result.valid).toBe(true)
      expect(result.has_lingxi_dir).toBe(true)
    })

    it('should have correct structure for invalid workspace', () => {
      const result: WorkspaceValidationResult = {
        valid: false,
        exists: true,
        has_lingxi_dir: false,
        message: 'Missing .lingxi directory'
      }
      
      expect(result.valid).toBe(false)
      expect(result.has_lingxi_dir).toBe(false)
    })
  })

  describe('Skill', () => {
    it('should have correct structure', () => {
      const skill: Skill = {
        skill_id: 'skill-1',
        name: 'Test Skill',
        description: 'A test skill',
        version: '1.0.0',
        author: 'Test Author',
        status: 'available',
        manifest: {
          name: 'Test Skill',
          version: '1.0.0',
          description: 'A test skill',
          author: 'Test Author',
          entry_point: 'index.js'
        }
      }
      
      expect(skill.skill_id).toBe('skill-1')
      expect(skill.status).toBe('available')
    })

    it('should support all status values', () => {
      const available: Skill = {
        skill_id: 'skill-1',
        name: 'Skill',
        description: 'Desc',
        version: '1.0.0',
        author: 'Author',
        status: 'available',
        manifest: { name: 'Skill', version: '1.0.0', description: 'Desc', author: 'Author', entry_point: 'index.js' }
      }
      
      const installed: Skill = {
        ...available,
        skill_id: 'skill-2',
        status: 'installed',
        installed_at: '2024-01-01T00:00:00Z'
      }
      
      const error: Skill = {
        ...available,
        skill_id: 'skill-3',
        status: 'error'
      }
      
      expect(available.status).toBe('available')
      expect(installed.status).toBe('installed')
      expect(error.status).toBe('error')
    })
  })

  describe('ResourceUsage', () => {
    it('should have correct structure', () => {
      const usage: ResourceUsage = {
        system: {
          cpu_percent: 50,
          memory_percent: 60,
          disk_percent: 70
        },
        token_usage: {
          current: 1000,
          limit: 10000,
          percent: 10,
          daily_limit: 100000,
          daily_used: 5000
        },
        tasks: {
          running: 2,
          queued: 5,
          completed_today: 100
        },
        skills: {
          total: 20,
          available: 18,
          error: 2
        }
      }
      
      expect(usage.system.cpu_percent).toBe(50)
      expect(usage.token_usage.percent).toBe(10)
      expect(usage.tasks.running).toBe(2)
    })
  })

  describe('FileChange', () => {
    it('should have correct change types', () => {
      const created: FileChange = {
        type: 'created',
        path: '/new/file.txt',
        timestamp: '2024-01-01T00:00:00Z'
      }
      
      const modified: FileChange = {
        type: 'modified',
        path: '/existing/file.txt',
        timestamp: '2024-01-01T00:00:00Z'
      }
      
      const deleted: FileChange = {
        type: 'deleted',
        path: '/removed/file.txt',
        timestamp: '2024-01-01T00:00:00Z'
      }
      
      expect(created.type).toBe('created')
      expect(modified.type).toBe('modified')
      expect(deleted.type).toBe('deleted')
    })
  })

  describe('WorkspaceFilesChangedEvent', () => {
    it('should have correct structure for task_end source', () => {
      const event: WorkspaceFilesChangedEvent = {
        source: 'task_end',
        session_id: 'session-1',
        task_id: 'task-1',
        changes: [
          { type: 'created', path: '/new/file.txt' }
        ]
      }
      
      expect(event.source).toBe('task_end')
      expect(event.session_id).toBe('session-1')
    })

    it('should have correct structure for file_watcher source', () => {
      const event: WorkspaceFilesChangedEvent = {
        source: 'file_watcher',
        changes: [
          { type: 'modified', path: '/modified/file.txt' }
        ]
      }
      
      expect(event.source).toBe('file_watcher')
      expect(event.session_id).toBeUndefined()
    })
  })

  describe('UUID and Timestamp types', () => {
    it('should accept string as UUID', () => {
      const uuid: string = '550e8400-e29b-41d4-a716-446655440000'
      expect(uuid.length).toBeGreaterThan(0)
    })

    it('should accept number as Timestamp', () => {
      const timestamp: number = Date.now()
      expect(typeof timestamp).toBe('number')
    })

    it('should accept string as DateTime', () => {
      const dateTime: string = '2024-01-01T00:00:00Z'
      expect(dateTime).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })
  })
})
