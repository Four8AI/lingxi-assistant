import EventEmitter from 'events'
import WebSocket from 'ws'
import type {
  ThoughtChainData,
  StepStatusData,
  SkillCallData,
  ModelRouteData,
  TaskCompletedData,
  TaskFailedData
} from '../types'

export class WsClient extends EventEmitter {
  private ws: WebSocket | null = null
  private url: string
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 10
  private reconnectInterval: number = 1000
  private maxReconnectInterval: number = 30000
  private heartbeatInterval: number = 30000
  private heartbeatTimer: NodeJS.Timeout | null = null
  private isManualClose: boolean = false

  constructor(url: string) {
    super()
    this.url = url
  }

  connect(sessionId?: string): void {
    this.isManualClose = false
    const wsUrl = sessionId ? `${this.url}?sessionId=${sessionId}` : this.url

    try {
      this.ws = new WebSocket(wsUrl)
      this.setupEventHandlers()
    } catch (error) {
      this.emit('error', error)
      this.scheduleReconnect()
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return

    this.ws.on('open', () => {
      this.reconnectAttempts = 0
      this.emit('connected')
      this.startHeartbeat()
    })

    this.ws.on('message', (data) => {
      try {
        const message = data.toString()
        const parsed = JSON.parse(message)
        this.handleMessage(parsed)
      } catch (error) {
        this.emit('error', error)
      }
    })

    this.ws.on('error', (error) => {
      this.emit('error', error)
    })

    this.ws.on('close', () => {
      this.stopHeartbeat()
      this.emit('disconnected')

      if (!this.isManualClose) {
        this.scheduleReconnect()
      }
    })
  }

  private handleMessage(data: any): void {
    const { type, payload, content, streamId, chunk_index, is_last, metadata } = data

    switch (type) {
      case 'thought_chain':
        this.emit('thought_chain', payload as ThoughtChainData)
        break
      case 'heartbeat':
        break
      case 'step_start':
        this.emit('step_start', payload || data)
        break
      case 'step_end':
        this.emit('step_end', payload || data)
        break
      case 'task_start':
        this.emit('task_start', payload || data)
        break
      case 'task_end':
        this.emit('task_end', payload || data)
        break
      case 'think_start':
        this.emit('think_start', payload || data)
        break
      case 'think_stream':
        this.emit('think_stream', payload || data)
        break
      case 'think_final':
        this.emit('think_final', payload || data)
        break
      case 'plan_start':
        this.emit('plan_start', payload || data)
        break
      case 'plan_final':
        this.emit('plan_final', payload || data)
        break
      case 'task_failed':
        this.emit('task_failed', payload || data)
        break
      default:
        this.emit('unknown', data)
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'heartbeat' })
    }, this.heartbeatInterval)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('reconnect_failed')
      return
    }

    const interval = Math.min(
      this.reconnectInterval * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectInterval
    )

    this.reconnectAttempts++
    this.emit('reconnecting', this.reconnectAttempts, interval)

    setTimeout(() => {
      this.connect()
    }, interval)
  }

  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  disconnect(): void {
    this.isManualClose = true
    this.stopHeartbeat()

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  onThoughtChain(callback: (data: ThoughtChainData) => void): void {
    this.on('thought_chain', callback)
  }

  onStepStatus(callback: (data: StepStatusData) => void): void {
    this.on('step_status', callback)
  }

  onSkillCall(callback: (data: SkillCallData) => void): void {
    this.on('skill_call', callback)
  }

  onResourceUpdate(callback: (data: any) => void): void {
    this.on('resource_update', callback)
  }

  onModelRoute(callback: (data: ModelRouteData) => void): void {
    this.on('model_route', callback)
  }

  onTaskStart(callback: (data: any) => void): void {
    this.on('task_start', callback)
  }

  onTaskEnd(callback: (data: any) => void): void {
    this.on('task_end', callback)
  }

  onThinkStart(callback: (data: any) => void): void {
    this.on('think_start', callback)
  }

  onThinkStream(callback: (data: any) => void): void {
    this.on('think_stream', callback)
  }

  onThinkFinal(callback: (data: any) => void): void {
    this.on('think_final', callback)
  }

  onPlanStart(callback: (data: any) => void): void {
    this.on('plan_start', callback)
  }

  onPlanFinal(callback: (data: any) => void): void {
    this.on('plan_final', callback)
  }

  onStepEnd(callback: (data: any) => void): void {
    this.on('step_end', callback)
  }

  onTaskFailed(callback: (data: any) => void): void {
    this.on('task_failed', callback)
  }

  off(eventType: string, callback: Function): void {
    this.removeListener(eventType, callback)
  }
}
