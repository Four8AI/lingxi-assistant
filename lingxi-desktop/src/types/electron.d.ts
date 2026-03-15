/**
 * Electron API 类型声明
 */

export interface ElectronAPI {
  // 窗口管理
  minimizeWindow: () => Promise<void>
  maximizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
  
  // 文件对话框
  showOpenDialog: (options?: OpenDialogOptions) => Promise<DialogReturn>
  showSaveDialog: (options?: SaveDialogOptions) => Promise<DialogReturn>
  
  // 文件读写
  readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>
  writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>
  
  // 系统信息
  getPlatform: () => string
  getVersion: () => Promise<string>
}

export interface OpenDialogOptions {
  title?: string
  filters?: Array<{ name: string; extensions: string[] }>
  properties?: string[]
  defaultPath?: string
}

export interface SaveDialogOptions {
  title?: string
  defaultPath?: string
  filters?: Array<{ name: string; extensions: string[] }>
}

export interface DialogReturn {
  canceled: boolean
  filePaths?: string[]
  files?: File[]
}

// 扩展 Window 接口
declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
