import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { FileManager } from './fileManager'

/**
 * 灵犀助手 - Main Process（精简版）
 * 
 * 职责：
 * - 窗口管理
 * - 原生对话框
 * - 系统功能
 * 
 * 注意：业务逻辑已迁移到 Renderer 进程
 */

class App {
  private mainWindow: BrowserWindow | null = null
  private isQuitting: boolean = false
  private fileManager: FileManager = new FileManager()

  constructor() {
    this.setupAppEvents()
    this.setupIpcHandlers()
  }

  /**
   * 设置应用事件
   */
  private setupAppEvents() {
    // 应用准备就绪
    app.whenReady().then(() => {
      this.createWindow()
    })

    // 所有窗口关闭
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })

    // macOS 激活
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow()
      }
    })

    // 即将退出
    app.on('before-quit', () => {
      this.isQuitting = true
    })
  }

  /**
   * 创建主窗口
   */
  private createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      frame: false, // 无边框窗口
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    })

    // 加载页面
    if (process.env.VITE_DEV_SERVER_URL) {
      // 开发环境：加载 Vite 开发服务器
      this.mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
      // 打开开发者工具
      this.mainWindow.webContents.openDevTools()
    } else {
      // 生产环境：加载构建文件
      this.mainWindow.loadFile(
        path.join(__dirname, '../dist/index.html')
      )
    }

    // 窗口关闭事件
    this.mainWindow.on('closed', () => {
      this.mainWindow = null
    })
  }

  /**
   * 设置 IPC 处理器
   * 
   * 注意：仅保留必要的 IPC 处理
   * 业务逻辑相关的 IPC 已移除
   */
  private setupIpcHandlers() {
    // ========== 窗口管理 ==========
    ipcMain.handle('window:minimize', () => {
      this.mainWindow?.minimize()
    })

    ipcMain.handle('window:maximize', () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.unmaximize()
      } else {
        this.mainWindow?.maximize()
      }
    })

    ipcMain.handle('window:close', () => {
      this.mainWindow?.close()
    })

    // ========== 文件对话框 ==========
    ipcMain.handle('dialog:open', async (event, options) => {
      const result = await dialog.showOpenDialog(this.mainWindow!, options)
      return result
    })

    ipcMain.handle('dialog:save', async (event, options) => {
      const result = await dialog.showSaveDialog(this.mainWindow!, options)
      return result
    })

    // ========== 文件读写（仅必要时） ==========
    ipcMain.handle('file:read', async (event, filePath: string) => {
      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        return { success: true, content }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    })

    ipcMain.handle('file:write', async (event, data: { filePath: string; content: string }) => {
      try {
        fs.writeFileSync(data.filePath, data.content, 'utf-8')
        return { success: true }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    })

    // ========== 系统信息 ==========
    ipcMain.handle('app:getVersion', () => {
      return app.getVersion()
    })

    // ========== 文件管理 ==========
    ipcMain.handle('file:selectDirectory', async () => {
      return await this.fileManager.selectDirectory()
    })

    ipcMain.handle('file:selectFiles', async (event, filters) => {
      return await this.fileManager.selectFiles(filters)
    })

    ipcMain.handle('file:openFile', async (event, filePath) => {
      return await this.fileManager.openFile(filePath)
    })

    ipcMain.handle('file:openExplorer', async (event, filePath) => {
      return await this.fileManager.openInExplorer(filePath)
    })

    ipcMain.handle('file:readDirectoryTree', async (event, dirPath, maxDepth) => {
      return await this.fileManager.readDirectoryTree(dirPath, maxDepth)
    })

    // ========== 日志 ==========
    console.log('[Main Process] IPC handlers setup complete')
  }
}

// 启动应用
const appInstance = new App()

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('[Main Process] Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason) => {
  console.error('[Main Process] Unhandled Rejection:', reason)
})
