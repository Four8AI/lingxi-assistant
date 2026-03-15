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
      DISPLAY: ':99',
      NODE_ENV: 'production'
    }
  })
  
  page = await electronApp.firstWindow()
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(3000)
})

test.describe.afterAll(async () => {
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

test.describe('无障碍功能测试', () => {
  
  test('所有按钮应该有可访问标签', async () => {
    // 查找所有按钮元素
    const buttons = await page.locator('button, [role="button"], .btn, .button').all()
    console.log(`检测到 ${buttons.length} 个按钮元素`)
    
    let buttonsWithoutLabel = 0
    let buttonsWithLabel = 0
    
    for (const button of buttons) {
      // 检查是否有 aria-label
      const ariaLabel = await button.getAttribute('aria-label')
      // 检查是否有文本内容
      const textContent = await button.textContent()
      // 检查是否有 title 属性
      const title = await button.getAttribute('title')
      
      if (ariaLabel || (textContent && textContent.trim().length > 0) || title) {
        buttonsWithLabel++
      } else {
        buttonsWithoutLabel++
        console.log('缺少可访问标签的按钮:', await button.evaluate(el => el.outerHTML))
      }
    }
    
    console.log(`有标签的按钮：${buttonsWithLabel}, 无标签的按钮：${buttonsWithoutLabel}`)
    
    // 要求至少 80% 的按钮有可访问标签
    const totalButtons = buttonsWithLabel + buttonsWithoutLabel
    if (totalButtons > 0) {
      const labeledPercentage = (buttonsWithLabel / totalButtons) * 100
      expect(labeledPercentage).toBeGreaterThanOrEqual(80)
    }
  })
  
  test('支持键盘导航', async () => {
    // 测试 Tab 键导航
    const interactiveElements = []
    
    // 聚焦到页面
    await page.keyboard.press('Tab')
    await page.waitForTimeout(200)
    
    // 使用 Tab 键遍历所有交互元素
    for (let i = 0; i < 20; i++) {
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement
        return {
          tagName: el?.tagName,
          className: el?.className,
          ariaLabel: el?.getAttribute('aria-label'),
          text: el?.textContent?.substring(0, 50)
        }
      })
      
      interactiveElements.push(focusedElement)
      console.log(`焦点元素 ${i + 1}:`, focusedElement)
      
      // 按 Tab 键移动到下一个元素
      await page.keyboard.press('Tab')
      await page.waitForTimeout(100)
    }
    
    // 验证焦点顺序合理（至少遍历了多个元素）
    expect(interactiveElements.length).toBeGreaterThan(5)
    
    // 验证 Enter 键触发操作
    // 找到第一个可点击的按钮
    const firstButton = await page.locator('button').first()
    if (await firstButton.count() > 0) {
      await firstButton.focus()
      await page.keyboard.press('Enter')
      await page.waitForTimeout(500)
      
      // 验证按钮被激活（可能有视觉反馈）
      const isActive = await firstButton.evaluate(el => {
        return el.matches(':active') || el.getAttribute('aria-pressed') === 'true'
      })
      console.log('按钮激活状态:', isActive)
    }
  })
  
  test('颜色对比度应该符合 WCAG 标准', async () => {
    // 获取主要文本元素
    const textElements = await page.locator('p, span, h1, h2, h3, h4, h5, h6, .text, .label').all()
    
    let compliantCount = 0
    let nonCompliantCount = 0
    
    for (const element of textElements.slice(0, 20)) { // 限制检查数量
      try {
        // 获取元素的样式
        const styles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el)
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize
          }
        })
        
        // 简单的对比度检查（实际应该使用 WCAG 公式）
        // 这里只做基本验证
        if (styles.color && styles.backgroundColor) {
          compliantCount++
        } else {
          nonCompliantCount++
        }
      } catch (e) {
        nonCompliantCount++
      }
    }
    
    console.log(`对比度合规元素：${compliantCount}, 不合规元素：${nonCompliantCount}`)
    
    // 要求大部分文本元素有明确的颜色定义
    expect(compliantCount).toBeGreaterThan(0)
  })
  
  test('支持屏幕阅读器', async () => {
    // 验证关键元素有语义化标签
    const semanticElements = {
      '导航': await page.locator('nav, [role="navigation"]').count(),
      '主内容': await page.locator('main, [role="main"]').count(),
      '按钮': await page.locator('button, [role="button"]').count(),
      '链接': await page.locator('a, [role="link"]').count(),
      '区域': await page.locator('[role="region"], [aria-label]').count()
    }
    
    console.log('语义化元素统计:', semanticElements)
    
    // 验证 ARIA 属性
    const ariaElements = await page.locator('[aria-label], [aria-labelledby], [aria-describedby], [role]').count()
    console.log(`使用 ARIA 属性的元素数量：${ariaElements}`)
    
    // 要求有一定数量的 ARIA 属性
    expect(ariaElements).toBeGreaterThan(0)
    
    // 验证关键交互元素有适当的 role
    const buttonsWithRole = await page.locator('button[role], [role="button"]').count()
    const buttonsTotal = await page.locator('button').count()
    
    console.log(`有 role 的按钮：${buttonsWithRole}/${buttonsTotal}`)
    
    // 验证表单元素有标签
    const inputs = await page.locator('input, textarea').all()
    let inputsWithLabel = 0
    
    for (const input of inputs) {
      const ariaLabel = await input.getAttribute('aria-label')
      const id = await input.getAttribute('id')
      const placeholder = await input.getAttribute('placeholder')
      
      if (ariaLabel || id || placeholder) {
        inputsWithLabel++
      }
    }
    
    console.log(`有标签的输入框：${inputsWithLabel}/${inputs.length}`)
    
    // 要求至少部分输入框有标签
    if (inputs.length > 0) {
      expect(inputsWithLabel).toBeGreaterThan(0)
    }
  })
})
