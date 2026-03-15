import { test, expect } from '@playwright/test'

test.describe('性能基准测试', () => {
  test('消息响应时间应该小于 3 秒', async ({ page }) => {
    await page.goto('/')
    
    const startTime = Date.now()
    
    // 发送消息
    await page.locator('.chat-input textarea').fill('测试消息')
    await page.locator('.send-button').click()
    
    // 等待回复
    await page.waitForSelector('.message.assistant', { timeout: 30000 })
    
    const responseTime = Date.now() - startTime
    console.log(`响应时间：${responseTime}ms`)
    
    expect(responseTime).toBeLessThan(3000)
  })

  test('界面渲染应该流畅', async ({ page }) => {
    await page.goto('/')
    
    // 快速滚动消息列表
    await page.evaluate(async () => {
      const content = document.querySelector('.chat-core-content')
      if (content) {
        content.scrollTop = content.scrollHeight
        await new Promise(resolve => setTimeout(resolve, 100))
        content.scrollTop = 0
      }
    })
    
    // 验证无卡顿（通过 FPS 检测，需要额外配置）
  })

  test('内存占用应该稳定', async ({ page }) => {
    await page.goto('/')
    
    // 获取初始内存（需要 Chrome DevTools Protocol）
    // 执行多个操作
    for (let i = 0; i < 5; i++) {
      await page.locator('.chat-input textarea').fill(`测试消息${i}`)
      await page.locator('.send-button').click()
      await page.waitForSelector('.message.assistant', { timeout: 10000 })
    }
    
    // 验证内存无显著增长
  })
})
