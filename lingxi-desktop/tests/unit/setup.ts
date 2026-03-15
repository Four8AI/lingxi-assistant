import { vi } from 'vitest'
import { config } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// jsdom 已经提供完整的 DOM API，不需要手动补充
// 只需要 mock electronAPI 和 Element Plus 组件

// Mock window.electronAPI
const mockElectronAPI = {
  api: {
    send: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    removeListener: vi.fn(),
    executeTask: vi.fn(),
    getSessions: vi.fn(),
    getWorkspaceSessions: vi.fn(),
    getSkills: vi.fn(),
    createSession: vi.fn().mockResolvedValue({ session_id: 'mock-session' }),
    renameSession: vi.fn(),
    deleteSession: vi.fn(),
    getSessionInfo: vi.fn()
  },
  workspace: {
    getCurrent: vi.fn(),
    switch: vi.fn(),
    initialize: vi.fn(),
    validate: vi.fn()
  },
  file: {
    selectFiles: vi.fn(),
    selectDirectory: vi.fn(),
    openExplorer: vi.fn()
  },
  ws: {
    onWorkspaceFilesChanged: vi.fn(),
    sendMessage: vi.fn(),
    isConnected: vi.fn().mockResolvedValue(true),
    connect: vi.fn(),
    disconnect: vi.fn()
  },
  window: {
    minimize: vi.fn(),
    maximize: vi.fn(),
    close: vi.fn(),
    isMaximized: vi.fn().mockResolvedValue(false)
  }
}

// 设置全局 mock
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
  configurable: true
})

// Mock DataTransfer for drag and drop tests
class MockDataTransfer {
  data = new Map()
  setData(format: string, value: string) { this.data.set(format, value) }
  getData(format: string) { return this.data.get(format) || '' }
  clearData() { this.data.clear() }
  items = {
    add: vi.fn(),
    length: 0
  }
  files = []
}

Object.defineProperty(window, 'DataTransfer', {
  value: MockDataTransfer,
  writable: true,
  configurable: true
})

// Mock WebSocket
const mockWebSocket = vi.fn().mockImplementation(() => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  isConnected: false
}))

Object.defineProperty(window, 'WebSocket', {
  value: mockWebSocket,
  writable: true,
  configurable: true
})

// Mock window.prompt to prevent tests from hanging
Object.defineProperty(window, 'prompt', {
  value: vi.fn(() => 'mocked value'),
  writable: true,
  configurable: true
})

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  value: vi.fn(() => true),
  writable: true,
  configurable: true
})

// 全局使用 Element Plus
config.global.plugins = [ElementPlus]

// 只 stub 图标组件和 teleport（它们会导致测试问题）
config.global.stubs = {
  'el-icon': true,
  'icon': true,
  Teleport: {
    template: '<div><slot /></div>'
  }
}

// 导出 flushPromises 工具
export const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))
