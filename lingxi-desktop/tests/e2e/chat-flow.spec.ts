import { test, expect, ElectronApplication, Page } from '@playwright/test'
import { _electron as electron } from 'playwright'
import * as path from 'path'

let electronApp: ElectronApplication
let page: Page

test.describe('聊天功能流程测试', () => {
  
  test.beforeAll(async () => {
    const projectRoot = path.resolve(__dirname, '../../')
    
    // 启动 Electron 应用
    electronApp = await electron.launch({
      args: [path.join(projectRoot, 'dist-electron/main/index.js')],
      cwd: projectRoot,
      env: {
        ...process.env,
        DISPLAY: ':99'
      },
      timeout: 60000
    })
    
    // 等待窗口创建
    page = await electronApp.firstWindow({ timeout: 30000 })
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 })
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
  
  test('应该能够正确启动并显示界面', async () => {
    // 需要后端服务才能完整测试
    test.skip("需要后端服务")
    
    const title = await page.title()
    expect(title).toBe('Lingxi Agent')
    
    const isVisible = await page.isVisible('body')
    expect(isVisible).toBe(true)
  })
  
  test('应该显示聊天核心组件', async () => {
    test.skip("需要后端服务")
    
    await page.waitForSelector('.chat-core', { timeout: 10000 })
    const chatCore = await page.locator('.chat-core')
    await expect(chatCore).toBeVisible()
  })
  
  test('应该显示输入区域', async () => {
    test.skip("需要后端服务")
    
    await page.waitForSelector('.chat-core-input', { timeout: 10000 })
    const inputArea = await page.locator('.chat-core-input')
    await expect(inputArea).toBeVisible()
  })
  
  test('应该能够发送文本消息并接收回复', async () => {
    test.skip("需要后端服务")
    
    await page.waitForSelector('.chat-input textarea')
    const textarea = await page.locator('.chat-input textarea')
    await expect(textarea).toBeVisible()
    
    await textarea.fill('你好，请介绍一下自己')
    await page.waitForTimeout(500)
    await page.locator('button:has-text("发送")').click()
    
    // 等待回复
    await page.waitForSelector('.message.assistant', { timeout: 30000 })
    const messages = await page.locator('.message.assistant').count()
    expect(messages).toBeGreaterThan(0)
  })
  
  test('应该显示思考链过程', async () => {
    test.skip("需要后端服务")
    
    // 发送需要推理的问题
    await page.locator('.chat-input textarea').fill('请逐步推理：如果今天下雨，我会带伞。现在下雨了，我会带伞吗？')
    await page.locator('button:has-text("发送")').click()
    
    // 验证思维链面板显示
    await page.waitForSelector('.thought-chain', { timeout: 10000 })
    const thoughtChain = await page.locator('.thought-chain')
    await expect(thoughtChain).toBeVisible()
  })
})
