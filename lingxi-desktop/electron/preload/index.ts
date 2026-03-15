import { contextBridge, ipcRenderer } from 'electron'

/**
 * Preload 脚本 - 暴露必要的 Electron API 给渲染进程
 * 
 * 注意：仅暴露最小必要的 API，业务逻辑应在渲染进程中实现
 */

// 窗口管理 API
const windowAPI = {
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close')
}

// 文件对话框 API
const dialogAPI = {
  showOpenDialog: (options: any) => 
    ipcRenderer.invoke('dialog:open', options),
  showSaveDialog: (options: any) => 
    ipcRenderer.invoke('dialog:save', options)
}

// 系统信息 API
const systemAPI = {
  getPlatform: () => process.platform,
  getVersion: () => ipcRenderer.invoke('app:getVersion')
}

// 暴露到全局 window 对象
contextBridge.exposeInMainWorld('electronAPI', {
  // 窗口管理
  minimizeWindow: windowAPI.minimizeWindow,
  maximizeWindow: windowAPI.maximizeWindow,
  closeWindow: windowAPI.closeWindow,
  
  // 文件对话框
  showOpenDialog: dialogAPI.showOpenDialog,
  showSaveDialog: dialogAPI.showSaveDialog,
  
  // 系统信息
  getPlatform: systemAPI.getPlatform,
  getVersion: systemAPI.getVersion,
  
  // 文件读写（仅必要时使用）
  readFile: (filePath: string) => 
    ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath: string, content: string) => 
    ipcRenderer.invoke('file:write', { filePath, content })
})

// 类型声明
export type ElectronAPI = typeof window.electronAPI
