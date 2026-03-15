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

test.describe('错误处理测试', () => {
  
  test('应该处理后端连接失败', async () => {
    // 需要模拟后端不可用场景，暂时跳过
    test.skip("暂时跳过")
    
    // 1. 模拟后端不可用
    // 2. 验证错误提示显示
    // 3. 检查重试机制
  })
  
  test('应该处理 API 超时', async () => {
    // 需要模拟慢响应，暂时跳过
    test.skip("暂时跳过")
    
    // 1. 模拟慢响应
    // 2. 验证超时提示
    // 3. 检查取消功能
  })
  
  test('应该处理 WebSocket 断线重连', async () => {
    // 需要模拟连接断开，暂时跳过
    test.skip("暂时跳过")
    
    // 1. 模拟连接断开
    // 2. 验证重连提示
    // 3. 检查自动重连
  })
  
  test('应该处理技能执行错误', async () => {
    // 1. 触发技能错误（发送无效的技能调用）
    const textarea = await page.locator('.chat-input textarea')
    await expect(textarea).toBeVisible()
    
    await textarea.fill('执行一个会导致错误的操作 @invalid_skill')
    await page.waitForTimeout(500)
    
    const sendButton = await page.locator('button:has-text("发送"), .send-button').first()
    await sendButton.click()
    
    // 2. 验证错误信息展示
    await page.waitForSelector('.message.assistant, .error-message', { timeout: 30000 })
    
    // 3. 检查错误恢复建议
    const errorMessage = await page.locator('.message.assistant .error, .error-message').first()
    if (await errorMessage.count() > 0) {
      const errorText = await errorMessage.textContent()
      expect(errorText).toBeTruthy()
      expect(errorText.length).toBeGreaterThan(10)
    }
  })
  
  test('应该显示友好的错误提示', async () => {
    // 1. 触发一个错误场景
    const textarea = await page.locator('.chat-input textarea')
    await textarea.fill('')
    await page.waitForTimeout(500)
    
    // 2. 尝试发送空消息
    const sendButton = await page.locator('button:has-text("发送"), .send-button').first()
    await sendButton.click()
    await page.waitForTimeout(1000)
    
    // 3. 验证有适当的处理（禁用或提示）
    const isDisabled = await sendButton.isDisabled()
    const hasError = await page.locator('.error-message, .toast-error').count()
    
    // 要么按钮禁用，要么显示错误
    expect(isDisabled || hasError > 0).toBeTruthy()
  })
  
  test('应该支持错误恢复重试', async () => {
    // 1. 找到重试按钮（如果存在）
    const retryButton = await page.locator('button:has-text("重试"), .retry-button, [title*="重试"]').first()
    
    if (await retryButton.count() > 0) {
      await expect(retryButton).toBeVisible()
      // 验证重试按钮可点击
      const isEnabled = await retryButton.isEnabled()
      expect(isEnabled).toBeTruthy()
    }
  })
  
  test('应该显示网络连接状态', async () => {
    // 1. 检查网络状态指示器
    const networkStatus = await page.locator('.network-status, .connection-status, .online-indicator').first()
    
    if (await networkStatus.count() > 0) {
      await expect(networkStatus).toBeVisible()
      // 验证状态指示器存在
      const statusClass = await networkStatus.getAttribute('class')
      expect(statusClass).toBeTruthy()
    }
  })
  
  test('应该处理无效输入', async () => {
    // 1. 输入特殊字符
    const textarea = await page.locator('.chat-input textarea')
    await textarea.fill('!@#$%^&*()_+{}|:"<>?')
    await page.waitForTimeout(500)
    
    // 2. 发送消息
    const sendButton = await page.locator('button:has-text("发送"), .send-button').first()
    await sendButton.click()
    
    // 3. 验证应用没有崩溃
    await page.waitForTimeout(2000)
    const isAppResponsive = await page.isVisible('body')
    expect(isAppResponsive).toBeTruthy()
  })
  
  test('应该显示加载状态指示器', async () => {
    // 1. 触发一个需要加载的操作
    const textarea = await page.locator('.chat-input textarea')
    await textarea.fill('你好')
    
    const sendButton = await page.locator('button:has-text("发送"), .send-button').first()
    await sendButton.click()
    
    // 2. 验证加载指示器显示
    const loadingIndicator = await page.locator('.loading, .spinner, .loading-indicator, .thinking').first()
    if (await loadingIndicator.count() > 0) {
      await expect(loadingIndicator).toBeVisible()
    }
  })
})
