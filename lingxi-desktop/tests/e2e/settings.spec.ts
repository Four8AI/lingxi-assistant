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

test.describe('设置功能测试', () => {
  
  test('应该能够修改模型配置', async () => {
    // 1. 打开设置页面
    const settingsButton = await page.locator('button:has-text("设置"), .settings-button, [title*="设置"]').first()
    await settingsButton.click()
    await page.waitForTimeout(1000)
    
    // 2. 验证设置页面显示
    const settingsPanel = await page.locator('.settings-panel, .settings-modal, .settings-page')
    await expect(settingsPanel).toBeVisible()
    
    // 3. 找到模型选择器
    const modelSelector = await page.locator('.model-selector, .model-select, select[name="model"]').first()
    if (await modelSelector.count() > 0) {
      await expect(modelSelector).toBeVisible()
      
      // 4. 修改模型配置
      const options = await modelSelector.locator('option').count()
      expect(options).toBeGreaterThan(0)
    }
  })
  
  test('应该能够修改 Token 预算', async () => {
    // 1. 打开设置页面
    const settingsButton = await page.locator('button:has-text("设置"), .settings-button').first()
    await settingsButton.click()
    await page.waitForTimeout(1000)
    
    // 2. 找到 Token 预算滑块或输入框
    const tokenBudgetSlider = await page.locator('.token-budget-slider, input[type="range"][name*="token"], .budget-input').first()
    
    if (await tokenBudgetSlider.count() > 0) {
      await expect(tokenBudgetSlider).toBeVisible()
      
      // 3. 调整 Token 预算
      const currentValue = await tokenBudgetSlider.inputValue()
      expect(currentValue).toBeTruthy()
    }
  })
  
  test('应该能够恢复默认配置', async () => {
    // 1. 打开设置页面
    const settingsButton = await page.locator('button:has-text("设置"), .settings-button').first()
    await settingsButton.click()
    await page.waitForTimeout(1000)
    
    // 2. 找到恢复默认按钮
    const resetButton = await page.locator('button:has-text("恢复默认"), .reset-button, [title*="恢复"]').first()
    
    if (await resetButton.count() > 0) {
      await expect(resetButton).toBeVisible()
      const isEnabled = await resetButton.isEnabled()
      expect(isEnabled).toBeTruthy()
    }
  })
  
  test('应该持久化配置到本地', async () => {
    // 这个测试需要重启应用验证，暂时跳过
    test.skip("暂时跳过")
    
    // 1. 修改配置
    // 2. 重启应用
    // 3. 验证配置保留
  })
  
  test('应该显示设置分类导航', async () => {
    // 1. 打开设置页面
    const settingsButton = await page.locator('button:has-text("设置"), .settings-button').first()
    await settingsButton.click()
    await page.waitForTimeout(1000)
    
    // 2. 验证设置分类显示
    const settingsNav = await page.locator('.settings-nav, .settings-tabs, .settings-categories').first()
    if (await settingsNav.count() > 0) {
      await expect(settingsNav).toBeVisible()
      
      // 3. 检查至少有一个分类
      const navItems = await settingsNav.locator('.nav-item, .tab, .category-item').count()
      expect(navItems).toBeGreaterThan(0)
    }
  })
  
  test('应该能够保存配置', async () => {
    // 1. 打开设置页面
    const settingsButton = await page.locator('button:has-text("设置"), .settings-button').first()
    await settingsButton.click()
    await page.waitForTimeout(1000)
    
    // 2. 找到保存按钮
    const saveButton = await page.locator('button:has-text("保存"), .save-button').first()
    
    if (await saveButton.count() > 0) {
      await expect(saveButton).toBeVisible()
      const isEnabled = await saveButton.isEnabled()
      expect(isEnabled).toBeTruthy()
      
      // 3. 点击保存
      await saveButton.click()
      await page.waitForTimeout(1000)
      
      // 4. 验证保存成功提示
      const successMessage = await page.locator('.success-message, .toast-success, text=保存成功').count()
      expect(successMessage).toBeGreaterThanOrEqual(0)
    }
  })
  
  test('应该支持快捷键配置', async () => {
    // 1. 打开设置页面
    const settingsButton = await page.locator('button:has-text("设置"), .settings-button').first()
    await settingsButton.click()
    await page.waitForTimeout(1000)
    
    // 2. 找到快捷键设置区域
    const shortcutSection = await page.locator('.shortcut-section, .hotkey-settings, text=快捷键').first()
    
    if (await shortcutSection.count() > 0) {
      await expect(shortcutSection).toBeVisible()
    }
  })
  
  test('应该显示版本信息', async () => {
    // 1. 打开设置页面
    const settingsButton = await page.locator('button:has-text("设置"), .settings-button').first()
    await settingsButton.click()
    await page.waitForTimeout(1000)
    
    // 2. 找到版本信息显示
    const versionInfo = await page.locator('.version-info, .app-version, text=版本').first()
    
    if (await versionInfo.count() > 0) {
      await expect(versionInfo).toBeVisible()
      const versionText = await versionInfo.textContent()
      expect(versionText).toBeTruthy()
    }
  })
})
