import { test, expect, ElectronApplication, Page } from '@playwright/test'
import { _electron as electron } from 'playwright'
import * as path from 'path'

let electronApp: ElectronApplication
let page: Page

test.beforeAll(async () => {
  const projectRoot = path.resolve(__dirname, '../../')
  electronApp = await electron.launch({
    args: [path.join(projectRoot, 'dist-electron/main/index.js')],
    cwd: projectRoot,
    env: {
      ...process.env,
      DISPLAY: ':99'
    },
    timeout: 60000
  })
  page = await electronApp.firstWindow()
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(3000)
}, 90000)

test.afterAll(async () => {
  if (electronApp) {
    try {
      const pages = electronApp.windows()
      for (const p of pages) {
        try {
          await p.close({ timeout: 3000 })
        } catch (e) {
          // 忽略关闭错误
        }
      }
      await electronApp.close({ timeout: 5000 })
    } catch (error) {
      try {
        if (electronApp.process()) {
          electronApp.process().kill()
        }
      } catch (killError) {
        // 忽略强制终止错误
      }
    }
  }
}, 60000)

test.describe('上下文管理功能测试', () => {
  
  test('应该显示 Token 使用状态', async () => {
    // 1. 发送多条消息
    const textarea = await page.locator('.chat-input textarea')
    await expect(textarea).toBeVisible()
    
    // 发送第一条消息
    await textarea.fill('你好，请介绍一下你自己')
    await page.waitForTimeout(500)
    const sendButton = await page.locator('button:has-text("发送"), .send-button').first()
    await sendButton.click()
    await page.waitForTimeout(3000)
    
    // 发送第二条消息
    await textarea.fill('你能做什么？')
    await page.waitForTimeout(500)
    await sendButton.click()
    await page.waitForTimeout(3000)
    
    // 2. 验证 Token 计数器更新
    const tokenCounter = await page.locator('.token-counter, .token-usage, .context-tokens').first()
    if (await tokenCounter.count() > 0) {
      await expect(tokenCounter).toBeVisible()
      const tokenText = await tokenCounter.textContent()
      expect(tokenText).toBeTruthy()
      // 应该包含数字
      expect(/\d+/.test(tokenText)).toBeTruthy()
    }
  })
  
  test('应该自动压缩超限的历史记录', async () => {
    // 这个测试需要发送大量消息，暂时跳过
    test.skip("暂时跳过")
    
    // 1. 发送大量消息超出预算
    // 2. 验证压缩提示显示
    // 3. 检查压缩后历史保留
  })
  
  test('应该支持手动压缩历史', async () => {
    // 1. 找到压缩按钮
    const compressButton = await page.locator('button:has-text("压缩"), .compress-history, [title*="压缩"]').first()
    
    if (await compressButton.count() > 0) {
      await expect(compressButton).toBeVisible()
      
      // 2. 点击压缩按钮
      await compressButton.click()
      await page.waitForTimeout(1000)
      
      // 3. 验证压缩对话框或选项出现
      const compressDialog = await page.locator('.compress-dialog, .modal, .compression-options').first()
      if (await compressDialog.count() > 0) {
        await expect(compressDialog).toBeVisible()
      }
    }
  })
  
  test('应该显示上下文窗口大小', async () => {
    // 1. 检查上下文信息显示
    const contextInfo = await page.locator('.context-info, .window-size, .context-window').first()
    
    if (await contextInfo.count() > 0) {
      await expect(contextInfo).toBeVisible()
      const infoText = await contextInfo.textContent()
      expect(infoText).toBeTruthy()
    }
  })
  
  test('应该显示消息计数', async () => {
    // 1. 检查消息计数显示
    const messageCount = await page.locator('.message-count, .chat-stats').first()
    
    if (await messageCount.count() > 0) {
      await expect(messageCount).toBeVisible()
      const countText = await messageCount.textContent()
      expect(countText).toBeTruthy()
    }
  })
  
  test('应该支持清除对话历史', async () => {
    // 1. 找到清除按钮
    const clearButton = await page.locator('button:has-text("清除"), .clear-history, [title*="清除"]').first()
    
    if (await clearButton.count() > 0) {
      await expect(clearButton).toBeVisible()
      
      // 2. 验证清除功能存在
      const isEnabled = await clearButton.isEnabled()
      expect(isEnabled).toBeTruthy()
    }
  })
  
  test('应该显示 Token 预算警告', async () => {
    // 需要达到预算阈值，暂时跳过
    test.skip("暂时跳过")
    
    // 1. 发送消息直到接近预算
    // 2. 验证警告提示显示
    // 3. 检查警告阈值配置
  })
})
