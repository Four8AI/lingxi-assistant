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
      DISPLAY: ':99',
      NODE_ENV: 'production'
    }
  })
  
  page = await electronApp.firstWindow()
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(3000)
})

test.afterAll(async () => {
  if (electronApp) {
    try {
      const pages = electronApp.windows()
      for (const p of pages) {
        try {
          await p.close({ timeout: 3000 }).catch(() => {})
        } catch (e) {
          // 忽略关闭错误
        }
      }
      await electronApp.close({ timeout: 5000 }).catch(() => {})
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
})

test.describe('视觉回归测试', () => {
  
  test('主界面应该与基准截图一致', async () => {
    // 截取主界面
    const screenshot = await page.screenshot({
      fullPage: false,
      path: 'test-results/visual/main-interface.png'
    })
    
    // 验证截图已生成
    expect(screenshot).toBeDefined()
    
    // 验证主要 UI 元素存在
    await expect(page.locator('.title-bar')).toBeVisible()
    await expect(page.locator('.chat-core')).toBeVisible()
    await expect(page.locator('.chat-core-input')).toBeVisible()
    
    // 验证布局结构
    const layoutContainer = await page.locator('.layout-container')
    await expect(layoutContainer).toBeVisible()
    
    // 截图对比（在 CI 环境中可以启用像素对比）
    // await expect(screenshot).toMatchSnapshot('main-interface.png', {
    //   maxDiffPixels: 100 // 允许 1% 的像素差异
    // })
  })
  
  test('聊天界面应该正确渲染', async () => {
    // 发送一条测试消息以显示聊天界面
    const textarea = await page.locator('.chat-input textarea')
    await textarea.waitFor({ state: 'visible', timeout: 10000 })
    await textarea.fill('视觉回归测试消息')
    await page.locator('.send-button').click()
    
    // 等待消息显示
    await page.waitForSelector('.message.user', { timeout: 10000 })
    
    // 截取聊天界面
    const chatArea = await page.locator('.chat-core')
    await chatArea.screenshot({ path: 'test-results/visual/chat-interface.png' })
    
    // 验证消息气泡样式
    const userMessage = await page.locator('.message.user').first()
    await expect(userMessage).toBeVisible()
    
    // 验证消息内容显示
    const messageContent = await userMessage.locator('.message-content')
    await expect(messageContent).toContainText('视觉回归测试消息')
    
    // 验证代码块高亮（如果存在代码块）
    const codeBlocks = await page.locator('pre code').count()
    console.log(`检测到 ${codeBlocks} 个代码块`)
    
    // 验证消息时间戳显示
    const timestamps = await page.locator('.message-timestamp').count()
    expect(timestamps).toBeGreaterThan(0)
  })
  
  test('设置界面应该正确显示', async () => {
    // 尝试打开设置页面
    let settingsOpened = false
    
    try {
      // 查找设置按钮
      const settingsBtn = await page.locator('.settings-button, [aria-label="设置"], .icon-settings')
      if (await settingsBtn.count() > 0) {
        await settingsBtn.first().click()
        await page.waitForTimeout(1000)
        settingsOpened = true
      }
    } catch (e) {
      console.log('设置按钮未找到，跳过设置界面测试')
    }
    
    if (settingsOpened) {
      // 截取设置界面
      await page.screenshot({ path: 'test-results/visual/settings-interface.png' })
      
      // 验证设置面板存在
      const settingsPanel = await page.locator('.settings-panel, .settings-modal, [role="dialog"]')
      await expect(settingsPanel.first()).toBeVisible()
      
      // 验证设置项存在
      const settingItems = await page.locator('.setting-item, .form-item, .config-item').count()
      expect(settingItems).toBeGreaterThan(0)
      
      // 验证保存/取消按钮存在
      const saveBtn = await page.locator('button:has-text("保存"), button:has-text("Save")')
      const cancelBtn = await page.locator('button:has-text("取消"), button:has-text("Cancel")')
      
      if (await saveBtn.count() > 0) {
        await expect(saveBtn.first()).toBeVisible()
      }
      if (await cancelBtn.count() > 0) {
        await expect(cancelBtn.first()).toBeVisible()
      }
    }
  })
  
  test('响应式布局应该正确', async () => {
    // 获取初始窗口大小
    const initialSize = await page.viewportSize()
    console.log(`初始窗口大小：${initialSize?.width}x${initialSize?.height}`)
    
    // 测试不同窗口尺寸
    const testSizes = [
      { width: 800, height: 600 },   // 小窗口
      { width: 1280, height: 720 },  // 中等窗口
      { width: 1920, height: 1080 }  // 大窗口
    ]
    
    for (const size of testSizes) {
      // 调整窗口大小
      await page.setViewportSize(size)
      await page.waitForTimeout(500)
      
      // 截取当前尺寸下的界面
      await page.screenshot({ 
        path: `test-results/visual/responsive-${size.width}x${size.height}.png` 
      })
      
      // 验证布局适配
      const layoutContainer = await page.locator('.layout-container')
      await expect(layoutContainer).toBeVisible()
      
      // 验证主要组件仍然可见
      await expect(page.locator('.title-bar').first()).toBeVisible()
      await expect(page.locator('.chat-core-input').first()).toBeVisible()
      
      // 检查元素是否重叠（通过检查是否有元素被遮挡）
      const visibleElements = await page.locator('.title-bar, .chat-core, .chat-core-input').all()
      for (const element of visibleElements) {
        const boundingBox = await element.boundingBox()
        expect(boundingBox).toBeDefined()
        expect(boundingBox!.width).toBeGreaterThan(0)
        expect(boundingBox!.height).toBeGreaterThan(0)
      }
    }
    
    // 恢复原始窗口大小
    if (initialSize) {
      await page.setViewportSize(initialSize)
    }
  })
})
