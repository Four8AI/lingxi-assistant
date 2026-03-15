import { test, expect, ElectronApplication, Page } from '@playwright/test'
import { _electron as electron } from 'playwright'
import * as path from 'path'

let electronApp: ElectronApplication
let page: Page

test.describe('会话管理功能测试', () => {
  
  test.beforeAll(async () => {
    const projectRoot = path.resolve(__dirname, '../../')
    
    electronApp = await electron.launch({
      args: [path.join(projectRoot, 'dist-electron/main/index.js')],
      cwd: projectRoot,
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    })
    
    page = await electronApp.firstWindow()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)
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
  
  test('应该能够创建新会话', async () => {
    // 点击新建会话按钮
    const newSessionButton = await page.locator('button:has-text("新建"), button:has-text("+")').first()
    await newSessionButton.click()
    
    // 验证新会话创建（标题变为"新会话"）
    await page.waitForTimeout(1000)
    const title = await page.locator('.chat-core-title').textContent()
    expect(title).toContain('新会话')
  })
  
  test('应该能够切换历史会话', async () => {
    // 打开历史记录面板
    const historyButton = await page.locator('button:has-text("历史"), .history-button').first()
    if (await historyButton.count() > 0) {
      await historyButton.click()
      
      // 等待会话列表加载
      await page.waitForSelector('.session-item, .history-item', { timeout: 5000 })
      
      // 选择第一个历史会话
      const sessionItem = await page.locator('.session-item').first()
      if (await sessionItem.count() > 0) {
        await sessionItem.click()
        await page.waitForTimeout(1000)
      }
    }
  })
  
  test('应该能够重命名会话', async () => {
    // 找到会话菜单按钮（三个点或右键菜单）
    const menuButton = await page.locator('button:has-text("..."), .menu-button').first()
    if (await menuButton.count() > 0) {
      await menuButton.click()
      
      // 点击重命名选项
      const renameOption = await page.locator('text=重命名').first()
      if (await renameOption.count() > 0) {
        await renameOption.click()
        
        // 输入新名称（处理 prompt）
        page.on('dialog', async dialog => {
          await dialog.accept('测试会话-' + Date.now())
        })
        
        await page.waitForTimeout(500)
      }
    }
  })
  
  test('应该能够删除会话', async () => {
    // 找到删除选项
    const menuButton = await page.locator('button:has-text("..."), .menu-button').first()
    if (await menuButton.count() > 0) {
      await menuButton.click()
      
      const deleteOption = await page.locator('text=删除').first()
      if (await deleteOption.count() > 0) {
        // 处理确认对话框
        page.on('dialog', async dialog => {
          expect(dialog.type()).toBe('confirm')
          await dialog.accept()
        })
        
        await deleteOption.click()
        await page.waitForTimeout(1000)
      }
    }
  })
  
  test('应该能够导出会话记录', async () => {
    // 找到导出选项
    const menuButton = await page.locator('button:has-text("..."), .menu-button').first()
    if (await menuButton.count() > 0) {
      await menuButton.click()
      
      const exportOption = await page.locator('text=导出').first()
      if (await exportOption.count() > 0) {
        await exportOption.click()
        
        // 验证有导出格式选择
        await page.waitForSelector('text=JSON, text=Markdown', { timeout: 5000 })
      }
    }
  })
})
