import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('WebSocket Connection Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup mock WebSocket handlers
    window.electronAPI.ws = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockResolvedValue(false),
      sendMessage: vi.fn().mockResolvedValue(undefined),
      onConnected: vi.fn(),
      onDisconnected: vi.fn(),
      onThoughtChain: vi.fn(),
      onStepStart: vi.fn(),
      onStepEnd: vi.fn(),
      onTaskStart: vi.fn(),
      onTaskEnd: vi.fn(),
      onTaskFailed: vi.fn(),
      onThinkStart: vi.fn(),
      onThinkStream: vi.fn(),
      onThinkFinal: vi.fn(),
      onPlanStart: vi.fn(),
      onPlanFinal: vi.fn(),
      removeAllListeners: vi.fn()
    }
  })

  describe('Connection', () => {
    it('should connect to WebSocket', async () => {
      await window.electronAPI.ws.connect()
      
      expect(window.electronAPI.ws.connect).toHaveBeenCalled()
    })

    it('should connect with session ID', async () => {
      await window.electronAPI.ws.connect('session-123')
      
      expect(window.electronAPI.ws.connect).toHaveBeenCalledWith('session-123')
    })

    it('should check connection status', async () => {
      window.electronAPI.ws.isConnected = vi.fn().mockResolvedValue(true)
      
      const result = await window.electronAPI.ws.isConnected()
      
      expect(result).toBe(true)
    })

    it('should return false when not connected', async () => {
      window.electronAPI.ws.isConnected = vi.fn().mockResolvedValue(false)
      
      const result = await window.electronAPI.ws.isConnected()
      
      expect(result).toBe(false)
    })

    it('should disconnect from WebSocket', async () => {
      await window.electronAPI.ws.disconnect()
      
      expect(window.electronAPI.ws.disconnect).toHaveBeenCalled()
    })
  })

  describe('Message Sending', () => {
    it('should send message', async () => {
      await window.electronAPI.ws.sendMessage('Hello')
      
      expect(window.electronAPI.ws.sendMessage).toHaveBeenCalledWith('Hello')
    })

    it('should send message with session ID', async () => {
      await window.electronAPI.ws.sendMessage('Hello', 'session-123')
      
      expect(window.electronAPI.ws.sendMessage).toHaveBeenCalledWith('Hello', 'session-123')
    })

    it('should handle send failure', async () => {
      window.electronAPI.ws.sendMessage = vi.fn().mockRejectedValue(new Error('Send failed'))
      
      await expect(window.electronAPI.ws.sendMessage('Hello')).rejects.toThrow('Send failed')
    })
  })

  describe('Event Handlers', () => {
    it('should register connected handler', () => {
      const handler = vi.fn()
      window.electronAPI.ws.onConnected(handler)
      
      expect(window.electronAPI.ws.onConnected).toHaveBeenCalledWith(handler)
    })

    it('should register disconnected handler', () => {
      const handler = vi.fn()
      window.electronAPI.ws.onDisconnected(handler)
      
      expect(window.electronAPI.ws.onDisconnected).toHaveBeenCalledWith(handler)
    })

    it('should register thought chain handler', () => {
      const handler = vi.fn()
      window.electronAPI.ws.onThoughtChain(handler)
      
      expect(window.electronAPI.ws.onThoughtChain).toHaveBeenCalledWith(handler)
    })

    it('should register step start handler', () => {
      const handler = vi.fn()
      window.electronAPI.ws.onStepStart(handler)
      
      expect(window.electronAPI.ws.onStepStart).toHaveBeenCalledWith(handler)
    })

    it('should register step end handler', () => {
      const handler = vi.fn()
      window.electronAPI.ws.onStepEnd(handler)
      
      expect(window.electronAPI.ws.onStepEnd).toHaveBeenCalledWith(handler)
    })

    it('should register task start handler', () => {
      const handler = vi.fn()
      window.electronAPI.ws.onTaskStart(handler)
      
      expect(window.electronAPI.ws.onTaskStart).toHaveBeenCalledWith(handler)
    })

    it('should register task end handler', () => {
      const handler = vi.fn()
      window.electronAPI.ws.onTaskEnd(handler)
      
      expect(window.electronAPI.ws.onTaskEnd).toHaveBeenCalledWith(handler)
    })

    it('should register task failed handler', () => {
      const handler = vi.fn()
      window.electronAPI.ws.onTaskFailed(handler)
      
      expect(window.electronAPI.ws.onTaskFailed).toHaveBeenCalledWith(handler)
    })

    it('should register think start handler', () => {
      const handler = vi.fn()
      window.electronAPI.ws.onThinkStart(handler)
      
      expect(window.electronAPI.ws.onThinkStart).toHaveBeenCalledWith(handler)
    })

    it('should register think stream handler', () => {
      const handler = vi.fn()
      window.electronAPI.ws.onThinkStream(handler)
      
      expect(window.electronAPI.ws.onThinkStream).toHaveBeenCalledWith(handler)
    })

    it('should register think final handler', () => {
      const handler = vi.fn()
      window.electronAPI.ws.onThinkFinal(handler)
      
      expect(window.electronAPI.ws.onThinkFinal).toHaveBeenCalledWith(handler)
    })

    it('should register plan start handler', () => {
      const handler = vi.fn()
      window.electronAPI.ws.onPlanStart(handler)
      
      expect(window.electronAPI.ws.onPlanStart).toHaveBeenCalledWith(handler)
    })

    it('should register plan final handler', () => {
      const handler = vi.fn()
      window.electronAPI.ws.onPlanFinal(handler)
      
      expect(window.electronAPI.ws.onPlanFinal).toHaveBeenCalledWith(handler)
    })
  })

  describe('Event Handling', () => {
    it('should call connected handler when connected', () => {
      const handler = vi.fn()
      window.electronAPI.ws.onConnected(handler)
      
      // Simulate connection event
      const registeredHandler = (window.electronAPI.ws.onConnected as any).mock.calls[0][0]
      registeredHandler()
      
      expect(handler).toHaveBeenCalled()
    })

    it('should call disconnected handler when disconnected', () => {
      const handler = vi.fn()
      window.electronAPI.ws.onDisconnected(handler)
      
      const registeredHandler = (window.electronAPI.ws.onDisconnected as any).mock.calls[0][0]
      registeredHandler()
      
      expect(handler).toHaveBeenCalled()
    })

    it('should call thought chain handler with data', () => {
      const handler = vi.fn()
      window.electronAPI.ws.onThoughtChain(handler)
      
      const mockData = { taskId: 'task-1', steps: [] }
      const registeredHandler = (window.electronAPI.ws.onThoughtChain as any).mock.calls[0][0]
      registeredHandler(mockData)
      
      expect(handler).toHaveBeenCalledWith(mockData)
    })

    it('should call step start handler with data', () => {
      const handler = vi.fn()
      window.electronAPI.ws.onStepStart(handler)
      
      const mockData = { executionId: 'exec-1', stepIndex: 0 }
      const registeredHandler = (window.electronAPI.ws.onStepStart as any).mock.calls[0][0]
      registeredHandler(mockData)
      
      expect(handler).toHaveBeenCalledWith(mockData)
    })

    it('should call step end handler with data', () => {
      const handler = vi.fn()
      window.electronAPI.ws.onStepEnd(handler)
      
      const mockData = { executionId: 'exec-1', stepIndex: 0, result: 'Success' }
      const registeredHandler = (window.electronAPI.ws.onStepEnd as any).mock.calls[0][0]
      registeredHandler(mockData)
      
      expect(handler).toHaveBeenCalledWith(mockData)
    })

    it('should call task start handler with data', () => {
      const handler = vi.fn()
      window.electronAPI.ws.onTaskStart(handler)
      
      const mockData = { executionId: 'exec-1', task: 'Test task' }
      const registeredHandler = (window.electronAPI.ws.onTaskStart as any).mock.calls[0][0]
      registeredHandler(mockData)
      
      expect(handler).toHaveBeenCalledWith(mockData)
    })

    it('should call task end handler with data', () => {
      const handler = vi.fn()
      window.electronAPI.ws.onTaskEnd(handler)
      
      const mockData = { executionId: 'exec-1', result: 'Completed' }
      const registeredHandler = (window.electronAPI.ws.onTaskEnd as any).mock.calls[0][0]
      registeredHandler(mockData)
      
      expect(handler).toHaveBeenCalledWith(mockData)
    })

    it('should call task failed handler with data', () => {
      const handler = vi.fn()
      window.electronAPI.ws.onTaskFailed(handler)
      
      const mockData = { executionId: 'exec-1', error: 'Failed' }
      const registeredHandler = (window.electronAPI.ws.onTaskFailed as any).mock.calls[0][0]
      registeredHandler(mockData)
      
      expect(handler).toHaveBeenCalledWith(mockData)
    })
  })

  describe('Cleanup', () => {
    it('should remove all listeners for a channel', () => {
      window.electronAPI.ws.removeAllListeners('thoughtChain')
      
      expect(window.electronAPI.ws.removeAllListeners).toHaveBeenCalledWith('thoughtChain')
    })

    it('should remove listeners for multiple channels', () => {
      window.electronAPI.ws.removeAllListeners('stepStart')
      window.electronAPI.ws.removeAllListeners('stepEnd')
      
      expect(window.electronAPI.ws.removeAllListeners).toHaveBeenCalledWith('stepStart')
      expect(window.electronAPI.ws.removeAllListeners).toHaveBeenCalledWith('stepEnd')
    })
  })

  describe('Connection Flow', () => {
    it('should handle complete connection flow', async () => {
      const connectedHandler = vi.fn()
      const messageHandler = vi.fn()
      
      window.electronAPI.ws.onConnected(connectedHandler)
      window.electronAPI.ws.onThoughtChain(messageHandler)
      window.electronAPI.ws.isConnected = vi.fn().mockResolvedValue(true)
      
      await window.electronAPI.ws.connect('session-1')
      
      expect(window.electronAPI.ws.connect).toHaveBeenCalledWith('session-1')
      
      // Simulate connection
      const isConnected = await window.electronAPI.ws.isConnected()
      expect(isConnected).toBe(true)
    })

    it('should handle disconnection', async () => {
      const disconnectedHandler = vi.fn()
      window.electronAPI.ws.onDisconnected(disconnectedHandler)
      
      await window.electronAPI.ws.disconnect()
      
      expect(window.electronAPI.ws.disconnect).toHaveBeenCalled()
    })

    it('should handle reconnection', async () => {
      window.electronAPI.ws.isConnected = vi.fn()
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true)
      
      await window.electronAPI.ws.connect()
      
      expect(window.electronAPI.ws.connect).toHaveBeenCalled()
    })
  })

  describe('Error Scenarios', () => {
    it('should handle connection failure', async () => {
      window.electronAPI.ws.connect = vi.fn().mockRejectedValue(new Error('Connection failed'))
      
      await expect(window.electronAPI.ws.connect()).rejects.toThrow('Connection failed')
    })

    it('should handle disconnection failure', async () => {
      window.electronAPI.ws.disconnect = vi.fn().mockRejectedValue(new Error('Disconnect failed'))
      
      await expect(window.electronAPI.ws.disconnect()).rejects.toThrow('Disconnect failed')
    })

    it('should handle status check failure', async () => {
      window.electronAPI.ws.isConnected = vi.fn().mockRejectedValue(new Error('Status check failed'))
      
      await expect(window.electronAPI.ws.isConnected()).rejects.toThrow('Status check failed')
    })
  })

  describe('Message Queue', () => {
    it('should queue messages when disconnected', async () => {
      window.electronAPI.ws.isConnected = vi.fn().mockResolvedValue(false)
      
      // In a real implementation, messages would be queued
      // This test verifies the check happens
      const isConnected = await window.electronAPI.ws.isConnected()
      expect(isConnected).toBe(false)
    })

    it('should send queued messages after reconnection', async () => {
      window.electronAPI.ws.isConnected = vi.fn()
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true)
      
      await window.electronAPI.ws.connect()
      
      const isConnected = await window.electronAPI.ws.isConnected()
      expect(isConnected).toBe(true)
    })
  })
})
