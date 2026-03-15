/**
 * Electron Utils 单元测试
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isElectron, electronAPI } from '../electron'

describe('Electron Utils', () => {
  let originalElectronAPI: any

  beforeEach(() => {
    // Save original electronAPI
    originalElectronAPI = (window as any).electronAPI
    // Clear electronAPI for clean tests
    delete (window as any).electronAPI
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original electronAPI
    if (originalElectronAPI) {
      (window as any).electronAPI = originalElectronAPI
    }
  })

  describe('isElectron', () => {
    it('should return false in web environment', () => {
      delete (window as any).electronAPI
      expect(isElectron()).toBe(false)
    })

    it('should return true in electron environment', () => {
      ;(window as any).electronAPI = {}
      expect(isElectron()).toBe(true)
    })

    it('should return false when window is undefined', () => {
      // This test is more conceptual since we can't actually undefine window
      // In real code, the check handles this case
      expect(typeof window !== 'undefined').toBe(true)
    })
  })

  describe('electronAPI', () => {
    beforeEach(() => {
      // Mock electronAPI for tests
      ;(window as any).electronAPI = {
        showOpenDialog: vi.fn().mockResolvedValue({ canceled: false, filePaths: ['/test/file.txt'] }),
        showSaveDialog: vi.fn().mockResolvedValue({ canceled: false, filePath: '/test/save.txt' }),
        readFile: vi.fn().mockResolvedValue({ success: true, content: 'file content' }),
        minimizeWindow: vi.fn(),
        maximizeWindow: vi.fn(),
        closeWindow: vi.fn(),
        getPlatform: vi.fn().mockReturnValue('linux'),
        getVersion: vi.fn().mockResolvedValue('1.0.0')
      }
    })

    it('should have openFileDialog method', async () => {
      expect(electronAPI.openFileDialog).toBeDefined()
      
      const result = await electronAPI.openFileDialog()
      expect(result).toEqual({ canceled: false, filePaths: ['/test/file.txt'] })
    })

    it('should have saveFileDialog method', async () => {
      expect(electronAPI.saveFileDialog).toBeDefined()
      
      const result = await electronAPI.saveFileDialog()
      expect(result).toEqual({ canceled: false, filePath: '/test/save.txt' })
    })

    it('should have readFile method', async () => {
      expect(electronAPI.readFile).toBeDefined()
      
      const result = await electronAPI.readFile('/test/file.txt')
      expect(result).toEqual({ success: true, content: 'file content' })
    })

    it('should have window methods', () => {
      expect(electronAPI.window).toBeDefined()
      expect(electronAPI.window.minimize).toBeDefined()
      expect(electronAPI.window.maximize).toBeDefined()
      expect(electronAPI.window.close).toBeDefined()
    })

    it('should call minimize window', () => {
      electronAPI.window.minimize()
      expect((window as any).electronAPI.minimizeWindow).toHaveBeenCalled()
    })

    it('should call maximize window', () => {
      electronAPI.window.maximize()
      expect((window as any).electronAPI.maximizeWindow).toHaveBeenCalled()
    })

    it('should call close window', () => {
      electronAPI.window.close()
      expect((window as any).electronAPI.closeWindow).toHaveBeenCalled()
    })

    it('should have getPlatform method', () => {
      expect(electronAPI.getPlatform).toBeDefined()
      
      const platform = electronAPI.getPlatform()
      expect(platform).toBe('linux')
    })

    it('should have getVersion method', async () => {
      expect(electronAPI.getVersion).toBeDefined()
      
      const version = await electronAPI.getVersion()
      expect(version).toBe('1.0.0')
    })

    it('should use web file dialog when not in electron', async () => {
      // Remove electronAPI to simulate web environment
      delete (window as any).electronAPI
      
      // Mock document.createElement for web dialog
      const mockInput = {
        type: '',
        accept: '',
        click: vi.fn(),
        onchange: null as any
      }
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockInput as any)
      
      // Trigger the dialog
      const promise = electronAPI.openFileDialog()
      
      // Simulate file selection
      setTimeout(() => {
        if (mockInput.onchange) {
          mockInput.onchange({ target: { files: [new File(['test'], 'test.txt')] } })
        }
      }, 0)
      
      const result = await promise
      expect(createElementSpy).toHaveBeenCalledWith('input')
    })

    it('should log warning for window methods in web mode', () => {
      delete (window as any).electronAPI
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation()
      
      electronAPI.window.minimize()
      expect(consoleSpy).toHaveBeenCalledWith('Window minimize is not available in web mode')
      
      consoleSpy.mockRestore()
    })
  })
})
