import { app, BrowserWindow, ipcMain } from 'electron'
import { WindowManager } from './windowManager'
import { ApiClient } from './apiClient'
import { WsClient } from './wsClient'
import { FileManager } from './fileManager'

class App {
  private windowManager: WindowManager
  private apiClient: ApiClient
  private wsClient: WsClient
  private fileManager: FileManager

  constructor() {
    this.windowManager = new WindowManager()
    this.apiClient = new ApiClient('http://127.0.0.1:5000')
    this.wsClient = new WsClient('ws://127.0.0.1:5000/ws')
    this.fileManager = new FileManager()

    this.setupIpcHandlers()
  }

  private setupIpcHandlers(): void {
    ipcMain.handle('window:minimize', () => {
      this.windowManager.hideToEdge()
    })

    ipcMain.handle('window:toggle', () => {
      this.windowManager.toggleWindow()
    })

    ipcMain.handle('window:maximize', () => {
      this.windowManager.maximizeWindow()
    })

    ipcMain.handle('window:edge-check', () => {
      return this.windowManager.checkEdgePosition()
    })

    ipcMain.handle('window:is-maximized', () => {
      return this.windowManager.isMaximized()
    })

    ipcMain.handle('file:select', async (_, filters) => {
      return this.fileManager.selectFile(filters)
    })

    ipcMain.handle('file:select-directory', async () => {
      return this.fileManager.selectDirectory()
    })

    ipcMain.handle('file:select-files', async (_, filters) => {
      return this.fileManager.selectFiles(filters)
    })

    ipcMain.handle('file:save', async (_, defaultPath, filters) => {
      return this.fileManager.saveFile(defaultPath, filters)
    })

    ipcMain.handle('file:open-explorer', async (_, filePath) => {
      return this.fileManager.openInExplorer(filePath)
    })

    ipcMain.handle('api:get-sessions', async () => {
      return this.apiClient.getSessions()
    })

    ipcMain.handle('api:get-session-history', async (_, sessionId, maxTurns) => {
      return this.apiClient.getSessionHistory(sessionId, maxTurns)
    })

    ipcMain.handle('api:create-session', async (_, userName) => {
      return this.apiClient.createSession(userName)
    })

    ipcMain.handle('api:delete-session', async (_, sessionId) => {
      return this.apiClient.deleteSession(sessionId)
    })

    ipcMain.handle('api:update-session-name', async (_, sessionId, name) => {
      return this.apiClient.updateSessionName(sessionId, name)
    })

    ipcMain.handle('api:clear-session-history', async (_, sessionId) => {
      return this.apiClient.clearSessionHistory(sessionId)
    })

    ipcMain.handle('api:execute-task', async (_, task, sessionId, modelOverride) => {
      return this.apiClient.executeTask(task, sessionId, modelOverride)
    })

    ipcMain.handle('api:get-task-status', async (_, executionId) => {
      return this.apiClient.getTaskStatus(executionId)
    })

    ipcMain.handle('api:retry-task', async (_, executionId, stepIndex, userInput) => {
      return this.apiClient.retryTask(executionId, stepIndex, userInput)
    })

    ipcMain.handle('api:cancel-task', async (_, executionId) => {
      return this.apiClient.cancelTask(executionId)
    })

    ipcMain.handle('api:get-checkpoints', async () => {
      return this.apiClient.getCheckpoints()
    })

    ipcMain.handle('api:resume-checkpoint', async (_, sessionId) => {
      return this.apiClient.resumeCheckpoint(sessionId)
    })

    ipcMain.handle('api:delete-checkpoint', async (_, sessionId) => {
      return this.apiClient.deleteCheckpoint(sessionId)
    })

    ipcMain.handle('api:get-skills', async () => {
      return this.apiClient.getSkills()
    })

    ipcMain.handle('api:install-skill', async (_, skillData, skillFiles) => {
      return this.apiClient.installSkill(skillData, skillFiles)
    })

    ipcMain.handle('api:diagnose-skill', async (_, skillId) => {
      return this.apiClient.diagnoseSkill(skillId)
    })

    ipcMain.handle('api:reload-skill', async (_, skillId) => {
      return this.apiClient.reloadSkill(skillId)
    })

    ipcMain.handle('api:get-resource-usage', async () => {
      return this.apiClient.getResourceUsage()
    })

    ipcMain.handle('api:get-config', async () => {
      return this.apiClient.getConfig()
    })

    ipcMain.handle('api:update-config', async (_, config) => {
      return this.apiClient.updateConfig(config)
    })

    ipcMain.handle('ws:connect', async (_, sessionId) => {
      this.wsClient.connect(sessionId)
    })

    ipcMain.handle('ws:disconnect', async () => {
      this.wsClient.disconnect()
    })

    ipcMain.handle('ws:is-connected', async () => {
      return this.wsClient.isConnected()
    })

    ipcMain.handle('ws:send-message', async (_, message, sessionId) => {
      this.wsClient.send({
        type: 'stream_chat',
        content: message,
        sessionId: sessionId || 'default'
      })
    })

    this.wsClient.on('connected', () => {
      const mainWindow = this.windowManager.getWindow()
      if (mainWindow) {
        mainWindow.webContents.send('ws:connected')
      }
    })

    this.wsClient.on('disconnected', () => {
      const mainWindow = this.windowManager.getWindow()
      if (mainWindow) {
        mainWindow.webContents.send('ws:disconnected')
      }
    })

    this.wsClient.on('thought_chain', (data) => {
      const mainWindow = this.windowManager.getWindow()
      if (mainWindow) {
        mainWindow.webContents.send('ws:thought-chain', data)
      }
    })

    this.wsClient.on('task_start', (data) => {
      const mainWindow = this.windowManager.getWindow()
      if (mainWindow) {
        mainWindow.webContents.send('ws:task-start', data)
      }
    })

    this.wsClient.on('task_end', (data) => {
      const mainWindow = this.windowManager.getWindow()
      if (mainWindow) {
        mainWindow.webContents.send('ws:task-end', data)
      }
    })

    this.wsClient.on('think_start', (data) => {
      const mainWindow = this.windowManager.getWindow()
      if (mainWindow) {
        mainWindow.webContents.send('ws:think-start', data)
      }
    })

    this.wsClient.on('think_stream', (data) => {
      const mainWindow = this.windowManager.getWindow()
      if (mainWindow) {
        mainWindow.webContents.send('ws:think-stream', data)
      }
    })

    this.wsClient.on('think_final', (data) => {
      const mainWindow = this.windowManager.getWindow()
      if (mainWindow) {
        mainWindow.webContents.send('ws:think-final', data)
      }
    })

    this.wsClient.on('plan_start', (data) => {
      const mainWindow = this.windowManager.getWindow()
      if (mainWindow) {
        mainWindow.webContents.send('ws:plan-start', data)
      }
    })

    this.wsClient.on('plan_final', (data) => {
      const mainWindow = this.windowManager.getWindow()
      if (mainWindow) {
        mainWindow.webContents.send('ws:plan-final', data)
      }
    })

    this.wsClient.on('step_start', (data) => {
      const mainWindow = this.windowManager.getWindow()
      if (mainWindow) {
        mainWindow.webContents.send('ws:step-start', data)
      }
    })

    this.wsClient.on('step_end', (data) => {
      const mainWindow = this.windowManager.getWindow()
      if (mainWindow) {
        mainWindow.webContents.send('ws:step-end', data)
      }
    })

    this.wsClient.on('task_failed', (data) => {
      const mainWindow = this.windowManager.getWindow()
      if (mainWindow) {
        mainWindow.webContents.send('ws:task-failed', data)
      }
    })
  }

  start(): void {
    app.whenReady().then(() => {
      this.windowManager.createMainWindow()
    })

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.windowManager.createMainWindow()
      }
    })
  }
}

new App().start()
