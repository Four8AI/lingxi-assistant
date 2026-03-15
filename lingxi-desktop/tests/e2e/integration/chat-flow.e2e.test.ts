import { test, expect, type Page } from '@playwright/test'

test.describe('聊天功能联调测试', () => {
  let page: Page

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('应该能够发送消息并接收回复', async ({ page }) => {
    // 等待输入区域就绪
    await expect(page.locator('.chat-input')).toBeVisible()
    
    // 输入消息
    const testMessage = '你好，这是一个测试消息'
    await page.locator('.chat-input textarea').fill(testMessage)
    
    // 点击发送
    await page.locator('.send-button').click()
    
    // 等待回复（最多 30 秒）
    await page.waitForSelector('.message.assistant', { timeout: 30000 })
    
    // 验证消息已发送
    const sentMessages = await page.locator('.message.user').all()
    expect(sentMessages.length).toBeGreaterThan(0)
    
    // 验证有助理回复
    const assistantMessages = await page.locator('.message.assistant').all()
    expect(assistantMessages.length).toBeGreaterThan(0)
  })

  test('应该显示思考链过程', async ({ page }) => {
    // 发送需要推理的问题
    await page.locator('.chat-input textarea').fill(
      '请逐步推理：如果今天下雨，我会带伞。现在下雨了，我会带伞吗？'
    )
    await page.locator('.send-button').click()
    
    // 等待思维链面板显示
    await page.waitForSelector('.thought-chain', { timeout: 15000 })
    
    // 验证思维链面板可见
    const thoughtChain = page.locator('.thought-chain')
    await expect(thoughtChain).toBeVisible()
    
    // 验证有步骤显示
    const steps = page.locator('.thought-step')
    await expect(steps.count()).resolves.toBeGreaterThan(0)
  })

  test('应该支持多轮对话', async ({ page }) => {
    // 第一轮对话
    await page.locator('.chat-input textarea').fill('我喜欢吃苹果')
    await page.locator('.send-button').click()
    await page.waitForSelector('.message.assistant', { timeout: 15000 })
    
    // 第二轮对话（基于上下文）
    await page.locator('.chat-input textarea').fill('我喜欢什么水果？')
    await page.locator('.send-button').click()
    await page.waitForSelector('.message.assistant', { timeout: 15000 })
    
    // 验证回复中提到苹果
    const lastMessage = page.locator('.message.assistant').last()
    const content = await lastMessage.textContent()
    expect(content).toContain('苹果')
  })

  test('应该能够创建新会话', async ({ page }) => {
    // 点击新建会话按钮
    await page.locator('button:has-text("新建"), button:has-text("+")').first().click()
    
    // 等待新会话创建
    await page.waitForTimeout(2000)
    
    // 验证标题变为"新会话"
    const title = await page.locator('.chat-core-title').textContent()
    expect(title).toContain('新会话')
  })

  test('应该能够切换会话', async ({ page }) => {
    // 打开历史记录面板
    const historyButton = page.locator('button:has-text("历史"), .history-button').first()
    if (await historyButton.count() > 0) {
      await historyButton.click()
      
      // 等待会话列表加载
      await page.waitForSelector('.session-item', { timeout: 5000 })
      
      // 选择第一个历史会话
      const sessionItem = page.locator('.session-item').first()
      if (await sessionItem.count() > 0) {
        await sessionItem.click()
        await page.waitForTimeout(1000)
      }
    }
  })
})
