declare global {
  interface Window {
    electronAPI: {
      window: {
        minimize: () => Promise<void>
        toggle: () => Promise<void>
        maximize: () => Promise<void>
        isMaximized: () => Promise<boolean>
        edgeCheck: () => Promise<boolean>
      }
      file: {
        select: (filters?: any) => Promise<string | null>
        selectDirectory: () => Promise<string | null>
        selectFiles: (filters?: any) => Promise<string[]>
        save: (defaultPath?: string, filters?: any) => Promise<string | null>
        openExplorer: (filePath: string) => Promise<void>
      }
      api: {
        getSessions: () => Promise<any[]>
        getSessionHistory: (sessionId: string, maxTurns?: number) => Promise<any>
        createSession: (userName?: string) => Promise<any>
        deleteSession: (sessionId: string) => Promise<void>
        executeTask: (task: string, sessionId: string, modelOverride?: string) => Promise<any>
        getTaskStatus: (executionId: string) => Promise<any>
        retryTask: (executionId: string, stepIndex?: number, userInput?: string) => Promise<void>
        cancelTask: (executionId: string) => Promise<void>
        getCheckpoints: () => Promise<any[]>
        resumeCheckpoint: (sessionId: string) => Promise<any>
        deleteCheckpoint: (sessionId: string) => Promise<void>
        getSkills: () => Promise<any[]>
        installSkill: (skillData: any, skillFiles: Record<string, string>) => Promise<any>
        diagnoseSkill: (skillId: string) => Promise<any>
        reloadSkill: (skillId: string) => Promise<void>
        getResourceUsage: () => Promise<any>
        getConfig: () => Promise<any>
        updateConfig: (config: any) => Promise<void>
      }
      ws: {
        connect: (sessionId?: string) => Promise<void>
        disconnect: () => Promise<void>
        isConnected: () => Promise<boolean>
        onConnected: (callback: () => void) => void
        onDisconnected: (callback: () => void) => void
        onThoughtChain: (callback: (data: any) => void) => void
        onStepStatus: (callback: (data: any) => void) => void
        onSkillCall: (callback: (data: any) => void) => void
        onResourceUpdate: (callback: (data: any) => void) => void
        onModelRoute: (callback: (data: any) => void) => void
        onTaskCompleted: (callback: (data: any) => void) => void
        onTaskFailed: (callback: (data: any) => void) => void
        removeAllListeners: (channel: string) => void
      }
    }
  }
}

export {}
