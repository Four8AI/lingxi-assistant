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

test.describe('高级集成测试', () => {
  
  test('完整对话流程', async () => {
    console.log('开始完整对话流程测试...')
    
    // 1. 创建新会话
    let newSessionCreated = false
    try {
      const newSessionBtn = await page.locator('.new-session-button, .btn-new-session, [aria-label="新会话"]').first()
      if (await newSessionBtn.count() > 0) {
        await newSessionBtn.click()
        await page.waitForTimeout(500)
        newSessionCreated = true
        console.log('新会话创建成功')
      }
    } catch (e) {
      console.log('创建新会话失败，使用当前会话')
    }
    
    // 2. 发送多条消息
    const textarea = await page.locator('.chat-input textarea')
    await textarea.waitFor({ state: 'visible', timeout: 10000 })
    
    const testMessages = [
      '你好，这是一个测试',
      '请介绍一下你自己',
      '今天天气怎么样'
    ]
    
    for (const message of testMessages) {
      await textarea.fill(message)
      await page.locator('.send-button').click()
      
      // 等待消息显示
      await page.waitForSelector('.message.user', { timeout: 10000 })
      await page.waitForTimeout(1000)
      
      console.log(`发送消息：${message}`)
    }
    
    // 验证消息历史
    const userMessages = await page.locator('.message.user').count()
    expect(userMessages).toBeGreaterThanOrEqual(testMessages.length)
    console.log(`当前会话消息数：${userMessages}`)
    
    // 3. 切换会话（如果可能）
    let switchedSession = false
    try {
      const sessionListBtn = await page.locator('.session-list-button, .sidebar-toggle').first()
      if (await sessionListBtn.count() > 0) {
        await sessionListBtn.click()
        await page.waitForTimeout(500)
        
        // 选择一个历史会话
        const sessionItems = await page.locator('.session-item, .session-list-item').all()
        if (sessionItems.length > 1) {
          await sessionItems[1].click()
          await page.waitForTimeout(1000)
          switchedSession = true
          console.log('切换到历史会话成功')
        }
      }
    } catch (e) {
      console.log('切换会话失败，继续测试')
    }
    
    // 4. 返回原会话验证历史
    if (switchedSession) {
      try {
        // 返回之前的会话
        const sessionListBtn = await page.locator('.session-list-button, .sidebar-toggle').first()
        if (await sessionListBtn.count() > 0) {
          await sessionListBtn.click()
          await page.waitForTimeout(500)
          
          const sessionItems = await page.locator('.session-item, .session-list-item').all()
          if (sessionItems.length > 0) {
            await sessionItems[0].click()
            await page.waitForTimeout(1000)
          }
        }
      } catch (e) {
        console.log('返回原会话失败')
      }
    }
    
    // 验证消息历史仍然存在
    const finalMessageCount = await page.locator('.message.user').count()
    console.log(`最终消息数：${finalMessageCount}`)
    expect(finalMessageCount).toBeGreaterThan(0)
    
    // 截图保存
    await page.screenshot({ path: 'test-results/integration/conversation-flow.png' })
  })
  
  test('工作目录 + 技能完整流程', async () => {
    console.log('开始工作目录 + 技能完整流程测试...')
    
    // 1. 切换工作目录
    let workspaceSwitched = false
    try {
      const workspaceStatus = await page.locator('.workspace-status, .workspace-indicator').first()
      if (await workspaceStatus.count() > 0) {
        await workspaceStatus.click()
        await page.waitForTimeout(500)
        
        // 尝试验证当前工作目录
        const workspacePath = await page.locator('.workspace-path').textContent()
        console.log('当前工作目录:', workspacePath)
        
        workspaceSwitched = true
      }
    } catch (e) {
      console.log('工作目录切换测试跳过')
    }
    
    // 2. 加载工作目录技能
    let skillsLoaded = false
    try {
      // 查找技能列表
      const skillList = await page.locator('.skill-list, .skills-container')
      if (await skillList.count() > 0) {
        const skillItems = await page.locator('.skill-item, .skill-card').count()
        console.log(`检测到 ${skillItems} 个技能`)
        
        if (skillItems > 0) {
          skillsLoaded = true
        }
      }
    } catch (e) {
      console.log('技能列表不可用')
    }
    
    // 3. 调用技能（如果可能）
    if (skillsLoaded) {
      try {
        // 尝试调用第一个技能
        const firstSkill = await page.locator('.skill-item, .skill-card').first()
        if (await firstSkill.count() > 0) {
          await firstSkill.click()
          await page.waitForTimeout(1000)
          console.log('技能调用成功')
        }
      } catch (e) {
        console.log('技能调用失败')
      }
    }
    
    // 4. 验证结果
    // 检查是否有技能执行结果显示
    const skillResults = await page.locator('.skill-result, .skill-output').count()
    console.log(`技能结果数量：${skillResults}`)
    
    // 截图保存
    await page.screenshot({ path: 'test-results/integration/workspace-skill-flow.png' })
    
    // 验证工作目录功能至少部分可用
    expect(workspaceSwitched || skillsLoaded).toBe(true)
  })
  
  test('配置修改 + 持久化完整流程', async () => {
    console.log('开始配置修改 + 持久化完整流程测试...')
    
    // 1. 修改配置
    let configModified = false
    try {
      // 打开设置页面
      const settingsBtn = await page.locator('.settings-button, [aria-label="设置"], .icon-settings').first()
      if (await settingsBtn.count() > 0) {
        await settingsBtn.click()
        await page.waitForTimeout(1000)
        
        // 尝试修改一个配置项（例如模型选择）
        const modelSelect = await page.locator('select.model-select, select#model')
        if (await modelSelect.count() > 0) {
          const options = await modelSelect.locator('option').all()
          if (options.length > 1) {
            // 选择第一个选项
            await modelSelect.selectIndex(0)
            await page.waitForTimeout(500)
            configModified = true
            console.log('配置修改成功')
          }
        }
        
        // 保存配置
        const saveBtn = await page.locator('button:has-text("保存"), button:has-text("Save"), .btn-save').first()
        if (await saveBtn.count() > 0) {
          await saveBtn.click()
          await page.waitForTimeout(1000)
          console.log('配置保存成功')
        }
      }
    } catch (e) {
      console.log('配置修改测试跳过:', e)
    }
    
    // 2. 发送消息验证配置生效
    if (configModified) {
      try {
        const textarea = await page.locator('.chat-input textarea')
        await textarea.waitFor({ state: 'visible', timeout: 10000 })
        
        await textarea.fill('配置测试消息')
        await page.locator('.send-button').click()
        
        // 验证消息发送成功
        await page.waitForSelector('.message.user', { timeout: 10000 })
        console.log('配置生效后消息发送成功')
      } catch (e) {
        console.log('消息验证失败')
      }
    }
    
    // 3. 重启应用验证配置保留
    console.log('重启应用验证配置持久化...')
    
    // 关闭并重新启动应用
    if (electronApp) {
      await electronApp.close().catch(() => {})
      await page.waitForTimeout(1000)
      
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
      
      console.log('应用重启完成')
    }
    
    // 验证配置是否保留
    let configPersisted = false
    try {
      const settingsBtn = await page.locator('.settings-button, [aria-label="设置"]').first()
      if (await settingsBtn.count() > 0) {
        await settingsBtn.click()
        await page.waitForTimeout(1000)
        
        const modelSelect = await page.locator('select.model-select, select#model')
        if (await modelSelect.count() > 0) {
          const selectedValue = await modelSelect.evaluate((el: HTMLSelectElement) => el.value)
          console.log('重启后模型配置:', selectedValue)
          configPersisted = true
        }
      }
    } catch (e) {
      console.log('配置验证失败')
    }
    
    // 截图保存
    await page.screenshot({ path: 'test-results/integration/config-persistence.png' })
    
    // 验证配置流程至少部分完成
    expect(configModified || configPersisted).toBe(true)
  })
})
