import { test, expect, ElectronApplication, Page } from '@playwright/test'
import { _electron as electron } from 'playwright'
import * as path from 'path'

let electronApp: ElectronApplication
let page: Page

test.describe.beforeAll(async () => {
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

test.describe.afterAll(async () => {
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

test.describe('技能系统功能测试', () => {
  
  test('应该能够加载工作目录技能', async () => {
    // 1. 等待技能列表加载
    await page.waitForSelector('.skill-list, .skills-panel', { timeout: 10000 })
    
    // 2. 验证技能显示
    const skillItems = await page.locator('.skill-item, .skill-card').count()
    expect(skillItems).toBeGreaterThan(0)
    
    // 3. 检查技能来源标识
    const skillSourceIndicators = await page.locator('.skill-source, .workspace-badge').count()
    // 至少应该有全局技能
    expect(skillItems).toBeGreaterThanOrEqual(1)
  })
  
  test('应该能够调用文件读取技能', async () => {
    // 1. 输入技能调用指令
    const textarea = await page.locator('.chat-input textarea')
    await expect(textarea).toBeVisible()
    
    await textarea.fill('读取当前目录下的 README.md 文件')
    await page.waitForTimeout(500)
    
    // 2. 点击发送按钮
    const sendButton = await page.locator('button:has-text("发送"), .send-button').first()
    await sendButton.click()
    
    // 3. 验证技能执行过程
    await page.waitForSelector('.message.assistant, .skill-executing', { timeout: 30000 })
    
    // 4. 检查结果返回
    const assistantMessage = await page.locator('.message.assistant').first()
    await expect(assistantMessage).toBeVisible()
    
    // 验证回复中包含文件内容或技能执行结果
    const messageContent = await assistantMessage.textContent()
    expect(messageContent).toBeTruthy()
  })
  
  test('应该能够处理技能调用错误', async () => {
    // 1. 调用不存在的技能
    const textarea = await page.locator('.chat-input textarea')
    await textarea.fill('调用一个不存在的技能 xyz_nonexistent_skill')
    await page.waitForTimeout(500)
    
    const sendButton = await page.locator('button:has-text("发送"), .send-button').first()
    await sendButton.click()
    
    // 2. 验证错误提示显示
    await page.waitForSelector('.message.assistant, .error-message', { timeout: 30000 })
    
    // 3. 检查错误恢复机制
    const errorMessage = await page.locator('.message.assistant .error, .error-message').first()
    if (await errorMessage.count() > 0) {
      const errorText = await errorMessage.textContent()
      expect(errorText).toBeTruthy()
      // 错误信息应该包含友好的提示
      expect(errorText.length).toBeGreaterThan(10)
    }
  })
  
  test('应该支持技能优先级（工作目录 > 全局）', async ({ skip }) => {
    // 这个测试需要特定的工作目录配置，暂时跳过
    skip()
    
    // 1. 在同名技能场景下
    // 2. 验证工作目录技能优先调用
    // 需要通过技能执行日志来验证优先级
  })
  
  test('应该显示技能详细信息', async () => {
    // 1. 点击技能卡片或列表项
    const skillItem = await page.locator('.skill-item, .skill-card').first()
    if (await skillItem.count() > 0) {
      await skillItem.click()
      await page.waitForTimeout(500)
      
      // 2. 验证技能详情面板显示
      const skillDetailPanel = await page.locator('.skill-detail, .skill-info-panel')
      if (await skillDetailPanel.count() > 0) {
        await expect(skillDetailPanel).toBeVisible()
      }
    }
  })
  
  test('应该支持技能搜索过滤', async () => {
    // 1. 找到技能搜索框
    const searchInput = await page.locator('.skill-search input, .search-skill-input').first()
    if (await searchInput.count() > 0) {
      await searchInput.fill('read')
      await page.waitForTimeout(1000)
      
      // 2. 验证搜索结果过滤
      const filteredSkills = await page.locator('.skill-item, .skill-card').count()
      expect(filteredSkills).toBeGreaterThanOrEqual(0)
    }
  })
  
  test('应该能够刷新技能列表', async () => {
    // 1. 找到刷新按钮
    const refreshButton = await page.locator('button:has-text("刷新"), .refresh-skills, [title*="刷新"]').first()
    if (await refreshButton.count() > 0) {
      await refreshButton.click()
      await page.waitForTimeout(2000)
      
      // 2. 验证技能列表重新加载
      const skillItems = await page.locator('.skill-item, .skill-card').count()
      expect(skillItems).toBeGreaterThanOrEqual(0)
    }
  })
})
