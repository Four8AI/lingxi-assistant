import { test, expect } from '@playwright/test'

test.describe('错误处理测试', () => {
  test('应该显示友好的错误提示', async ({ page }) => {
    // 模拟网络错误
    await page.route('**/api/chat', route => route.abort('failed'))
    
    // 尝试发送消息
    await page.locator('.chat-input textarea').fill('测试消息')
    await page.locator('.send-button').click()
    
    // 等待错误提示
    await page.waitForSelector('.error-message, .toast-error', { timeout: 10000 })
    
    // 验证错误提示友好
    const errorMessage = await page.locator('.error-message').textContent()
    expect(errorMessage).toContain('网络')
    expect(errorMessage).toContain('重试')
  })

  test('应该支持重试机制', async ({ page }) => {
    let attemptCount = 0
    
    await page.route('**/api/chat', route => {
      attemptCount++
      if (attemptCount === 1) {
        route.abort('failed')
      } else {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ content: 'Success' })
        })
      }
    })
    
    // 发送消息
    await page.locator('.chat-input textarea').fill('测试消息')
    await page.locator('.send-button').click()
    
    // 点击重试按钮
    await page.waitForSelector('button:has-text("重试")', { timeout: 5000 })
    await page.locator('button:has-text("重试")').click()
    
    // 验证重试成功
    await page.waitForSelector('.message.assistant', { timeout: 10000 })
  })
})
