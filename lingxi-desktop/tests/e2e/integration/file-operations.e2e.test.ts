import { test, expect } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

test.describe('文件操作联调测试', () => {
  test('应该能够上传文件', async ({ page }) => {
    // 创建测试文件
    const testFilePath = path.join(__dirname, '../../fixtures/test-file.txt')
    fs.writeFileSync(testFilePath, '这是一个测试文件')
    
    // 触发文件上传
    const fileInput = await page.locator('input[type="file"]')
    await fileInput.setInputFiles(testFilePath)
    
    // 验证上传成功
    await page.waitForSelector('.file-upload-success', { timeout: 10000 })
    
    // 清理测试文件
    fs.unlinkSync(testFilePath)
  })

  test('应该能够打开文件', async ({ page }) => {
    // 点击打开文件按钮
    await page.locator('button:has-text("打开文件")').click()
    
    // 验证文件对话框出现（或 Web input 触发）
    // 这里根据实际实现调整
  })
})
