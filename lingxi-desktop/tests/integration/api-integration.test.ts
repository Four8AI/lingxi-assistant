import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { sendMessage } from '@/api/chat'
import { getSessions, createSession } from '@/api/session'

describe('API Integration Tests', () => {
  let testSessionId: string

  beforeAll(async () => {
    // 创建测试会话
    const session = await createSession('Test Session')
    testSessionId = session.id
  })

  it('should send message and receive response', async () => {
    const response = await sendMessage({
      content: 'Hello, this is a test message',
      session_id: testSessionId
    })
    expect(response).toBeDefined()
    expect(response.content).toBeDefined()
  })

  it('should get sessions list', async () => {
    const sessions = await getSessions()
    expect(Array.isArray(sessions)).toBe(true)
    expect(sessions.length).toBeGreaterThan(0)
  })

  afterAll(async () => {
    // 清理测试数据
    // await deleteSession(testSessionId)
  })
})
