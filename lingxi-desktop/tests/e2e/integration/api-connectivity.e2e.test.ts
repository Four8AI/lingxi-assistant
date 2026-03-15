import { test, expect } from '@playwright/test'

test.describe('API 连通性测试', () => {
  test('后端 API 应该可访问', async ({ request }) => {
    const response = await request.get('http://localhost:5000/api/health')
    expect(response.ok()).toBeTruthy()
  })

  test('应该能够获取会话列表', async ({ request }) => {
    const response = await request.get('http://localhost:5000/api/sessions')
    expect(response.ok()).toBeTruthy()
    
    const data = await response.json()
    expect(Array.isArray(data)).toBeTruthy()
  })

  test('应该能够发送消息', async ({ request }) => {
    const response = await request.post('http://localhost:5000/api/chat', {
      data: {
        content: '测试消息',
        session_id: 'e2e-test'
      }
    })
    
    expect(response.ok()).toBeTruthy()
    
    const data = await response.json()
    expect(data).toHaveProperty('content')
  })
})
