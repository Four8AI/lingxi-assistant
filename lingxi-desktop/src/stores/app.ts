import { defineStore } from 'pinia'

interface Session {
  id: string
  name: string
}

interface Checkpoint {
  id: string
  name: string
  timestamp: number
}

interface ThoughtChain {
  taskId: string
  steps: any[]
  status: string
}

interface ResourceUsage {
  cpu: number
  memory: number
  disk: number
}

export const useAppStore = defineStore('app', {
  state: () => ({
    currentWorkspace: '',
    currentSessionId: '1',
    sessions: [
      {
        id: '1',
        name: '分析工程计划模式系统提醒'
      },
      {
        id: '2',
        name: '用户需求分析'
      },
      {
        id: '3',
        name: '代码审查反馈'
      }
    ],
    selectedSessions: [] as string[],
    turns: [
      {
        id: '1',
        role: 'user',
        content: '帮我分析一下这个项目的架构',
        time: Date.now() - 10000
      },
      {
        id: '2',
        role: 'assistant',
        content: '我来帮你分析这个项目的架构。首先让我查看项目结构和关键文件。',
        time: Date.now() - 5000,
        thought: '用户想要了解项目架构，我需要先查看项目结构，然后分析关键组件和模块之间的关系。',
        observation: '成功获取项目结构信息，发现这是一个基于Electron+Vue3的桌面应用项目。',
        skill_calls: [
          {
            skill_name: 'file_reader',
            parameters: { path: 'README.md' },
            result: '成功读取README文件'
          }
        ],
        steps: [
          {
            step_idx: 1,
            description: '分析项目结构',
            status: 'completed'
          },
          {
            step_idx: 2,
            description: '分析核心组件',
            status: 'completed'
          },
          {
            step_idx: 3,
            description: '分析数据流',
            status: 'completed'
          }
        ],
        metadata: {
          task_level: 'complex',
          plan_count: 3
        }
      },
      {
        id: '3',
        role: 'assistant',
        content: '在分析过程中遇到了一些问题，需要重新处理。',
        time: Date.now(),
        metadata: {
          action: 'task_failed',
          failed_step: 2,
          error: '无法读取某些配置文件'
        }
      }
    ] as any[],
    checkpoints: [] as Checkpoint[],
    activeCheckpoints: [] as Checkpoint[],
    wsConnected: false,
    thoughtChain: null as ThoughtChain | null,
    modelRoute: null as any,
    resourceUsage: null as ResourceUsage | null,
    loading: false
  }),
  actions: {
    setCurrentWorkspace(path: string) {
      this.currentWorkspace = path
    },
    setCurrentSession(id: string) {
      this.currentSessionId = id
    },
    setSessions(sessions: Session[]) {
      this.sessions = sessions
    },
    setTurns(turns: any[]) {
      this.turns = turns
    },
    setCheckpoints(checkpoints: Checkpoint[]) {
      this.checkpoints = checkpoints
      this.activeCheckpoints = checkpoints
    },
    setWsConnected(connected: boolean) {
      this.wsConnected = connected
    },
    setThoughtChain(thoughtChain: ThoughtChain) {
      this.thoughtChain = thoughtChain
    },
    setModelRoute(modelRoute: any) {
      this.modelRoute = modelRoute
    },
    setResourceUsage(resourceUsage: ResourceUsage) {
      this.resourceUsage = resourceUsage
    },
    setLoading(loading: boolean) {
      this.loading = loading
    },
    addSession(name: string) {
      const id = Date.now().toString()
      this.sessions.unshift({ id, name })
      return id
    },
    deleteSession(id: string) {
      this.sessions = this.sessions.filter(session => session.id !== id)
    },
    toggleSessionSelection(id: string) {
      const index = this.selectedSessions.indexOf(id)
      if (index > -1) {
        this.selectedSessions.splice(index, 1)
      } else {
        this.selectedSessions.push(id)
      }
    }
  }
})
