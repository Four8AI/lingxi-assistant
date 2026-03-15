/**
 * Electron 环境检测
 */
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof (window as any).electronAPI !== 'undefined'
}

/**
 * Electron API 适配层
 * 
 * 提供统一的 API 接口，自动判断运行环境（Electron/Web）
 * 在 Electron 环境下使用原生 API，在 Web 环境下使用 Web API
 */
export const electronAPI = {
  /**
   * 打开文件对话框
   */
  openFileDialog: async (options?: {
    title?: string
    filters?: Array<{ name: string; extensions: string[] }>
    properties?: string[]
  }) => {
    if (isElectron()) {
      // Electron 环境：使用原生对话框
      return await (window as any).electronAPI.showOpenDialog(options)
    } else {
      // Web 环境：使用 Web API
      return await showWebFileDialog(options)
    }
  },

  /**
   * 保存文件对话框
   */
  saveFileDialog: async (options?: {
    title?: string
    defaultPath?: string
    filters?: Array<{ name: string; extensions: string[] }>
  }) => {
    if (isElectron()) {
      return await (window as any).electronAPI.showSaveDialog(options)
    } else {
      return await showWebSaveDialog(options)
    }
  },

  /**
   * 读取文件（Electron 环境可直接读取，Web 环境需要后端支持）
   */
  readFile: async (filePath: string) => {
    if (isElectron()) {
      return await (window as any).electronAPI.readFile(filePath)
    } else {
      // Web 环境需要通过后端 API 读取
      const response = await fetch(`/api/file/read?path=${encodeURIComponent(filePath)}`)
      if (!response.ok) {
        throw new Error(`Failed to read file: ${response.statusText}`)
      }
      return response.json()
    }
  },

  /**
   * 窗口管理
   */
  window: {
    minimize: () => {
      if (isElectron()) {
        return (window as any).electronAPI.minimizeWindow()
      } else {
        console.warn('Window minimize is not available in web mode')
      }
    },
    
    maximize: () => {
      if (isElectron()) {
        return (window as any).electronAPI.maximizeWindow()
      } else {
        console.warn('Window maximize is not available in web mode')
      }
    },
    
    close: () => {
      if (isElectron()) {
        return (window as any).electronAPI.closeWindow()
      } else {
        console.warn('Window close is not available in web mode')
      }
    }
  },

  /**
   * 获取平台信息
   */
  getPlatform: (): string => {
    if (isElectron()) {
      return (window as any).electronAPI.getPlatform()
    } else {
      return 'web'
    }
  },

  /**
   * 获取应用版本
   */
  getVersion: async (): Promise<string> => {
    if (isElectron()) {
      return await (window as any).electronAPI.getVersion()
    } else {
      return 'web-mode'
    }
  }
}

/**
 * Web 环境文件对话框实现
 */
async function showWebFileDialog(options?: any): Promise<any> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    
    if (options?.filters) {
      const accept = options.filters
        .flatMap((f: any) => f.extensions.map((ext: string) => `.${ext}`))
        .join(',')
      input.accept = accept
    }
    
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement
      const files = target.files
      if (files && files.length > 0) {
        resolve({
          canceled: false,
          filePaths: Array.from(files).map(f => f.name),
          files: Array.from(files)
        })
      } else {
        resolve({ canceled: true, filePaths: [] })
      }
    }
    
    input.click()
  })
}

/**
 * Web 环境保存对话框实现
 */
async function showWebSaveDialog(options?: any): Promise<any> {
  // Web 环境无法直接实现保存对话框，返回提示
  console.warn('Save dialog is not fully supported in web mode')
  return { canceled: true }
}

/**
 * 类型定义
 */
export interface OpenDialogOptions {
  title?: string
  filters?: Array<{ name: string; extensions: string[] }>
  properties?: string[]
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
