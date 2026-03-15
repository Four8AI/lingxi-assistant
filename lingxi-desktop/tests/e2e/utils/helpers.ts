import { Page } from '@playwright/test'

/**
 * 等待消息回复完成
 */
export async function waitForMessageResponse(page: Page, timeout = 30000) {
  await page.waitForSelector('.message.assistant', { timeout })
}

/**
 * 发送消息并等待回复
 */
export async function sendMessageAndWait(page: Page, message: string) {
  await page.locator('.chat-input textarea').fill(message)
  await page.waitForTimeout(500)
  await page.locator('button:has-text("发送")').click()
  await waitForMessageResponse(page)
}

/**
 * 截图并保存
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `test-results/e2e/${name}-${Date.now()}.png` 
  })
}
