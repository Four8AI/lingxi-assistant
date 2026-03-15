# 灵犀助手 E2E 测试方案

**版本**: v1.0  
**创建时间**: 2026-03-15  
**测试框架**: Playwright + Electron  
**当前覆盖率**: 17 个测试用例（3 个文件）

---

## 📊 当前 E2E 测试状态

### 已有测试文件

| 文件 | 用例数 | 状态 | 说明 |
|------|--------|------|------|
| `core.spec.ts` | 7 个 | ✅ 通过 | 应用启动和基础 UI 渲染 |
| `workspace.spec.ts` | 4 个 | ✅ 通过 | 工作目录功能 |
| `integration.spec.ts` | 6 个 | ✅ 通过 | 前后端联调测试 |
| `directory-tree-refresh.spec.ts` | 约 10 个 | ✅ 通过 | 目录树刷新功能 |
| **总计** | **~27 个** | **✅ 全部通过** | - |

### 测试覆盖的功能

- ✅ 应用启动和窗口显示
- ✅ 标题栏、聊天组件、输入区域渲染
- ✅ 工作目录状态显示和切换
- ✅ 工作目录初始化和验证
- ✅ 前后端 API 通信
- ✅ 目录树刷新机制

---

## 🎯 E2E 测试目标

### 短期目标（本周）

1. **核心聊天功能测试** - 覆盖完整的消息收发流程
2. **会话管理测试** - 创建、切换、删除、重命名会话
3. **技能系统测试** - 技能加载、调用、错误处理
4. **错误处理测试** - 网络错误、API 错误、超时处理

### 中期目标（本月）

1. **工作目录完整流程** - 初始化、切换、技能隔离
2. **上下文管理** - Token 预算、历史压缩、长期记忆
3. **设置功能** - 配置修改、持久化、恢复默认
4. **性能测试** - 启动时间、响应时间、内存占用

### 长期目标（Q2）

1. **回归测试套件** - 每次发布前自动运行
2. **视觉回归测试** - UI 变化自动检测
3. **跨平台测试** - Windows、macOS、Linux 兼容性
4. **CI/CD 集成** - GitHub Actions 自动化测试

---

## 📋 测试场景规划

### 1. 核心聊天功能（优先级：P0）

**文件**: `chat-flow.spec.ts`

#### 1.1 消息发送和接收

```typescript
test.describe('消息收发流程', () => {
  test('应该能够发送文本消息并接收回复', async () => {
    // 1. 输入消息
    // 2. 点击发送按钮
    // 3. 等待思考过程显示
    // 4. 验证回复内容显示
  })
  
  test('应该显示思考链过程', async () => {
    // 1. 发送需要推理的问题
    // 2. 验证思维链面板展开
    // 3. 检查步骤执行状态
  })
  
  test('应该支持多轮对话', async () => {
    // 1. 发送第一条消息
    // 2. 等待回复
    // 3. 基于回复继续提问
    // 4. 验证上下文连续性
  })
})
```

#### 1.2 消息类型支持

```typescript
test.describe('消息类型支持', () => {
  test('应该支持代码块显示和复制', async () => {
    // 1. 请求生成代码
    // 2. 验证代码块渲染
    // 3. 点击复制按钮
    // 4. 验证剪贴板内容
  })
  
  test('应该支持 Markdown 格式渲染', async () => {
    // 1. 发送格式化文本请求
    // 2. 验证表格、列表、链接渲染
  })
  
  test('应该支持文件上传和解析', async () => {
    // 1. 拖拽文件到输入区
    // 2. 验证文件上传进度
    // 3. 验证文件内容解析
  })
})
```

---

### 2. 会话管理（优先级：P0）

**文件**: `session-management.spec.ts`

```typescript
test.describe('会话管理功能', () => {
  test('应该能够创建新会话', async () => {
    // 1. 点击新建会话按钮
    // 2. 验证新会话创建
    // 3. 检查会话列表更新
  })
  
  test('应该能够切换历史会话', async () => {
    // 1. 打开历史记录面板
    // 2. 选择历史会话
    // 3. 验证消息历史加载
  })
  
  test('应该能够重命名会话', async () => {
    // 1. 右键点击会话
    // 2. 选择重命名
    // 3. 输入新名称
    // 4. 验证名称更新
  })
  
  test('应该能够删除会话', async () => {
    // 1. 右键点击会话
    // 2. 选择删除
    // 3. 确认删除
    // 4. 验证会话从列表移除
  })
  
  test('应该能够导出会话记录', async () => {
    // 1. 选择导出功能
    // 2. 选择导出格式（JSON/Markdown）
    // 3. 验证文件下载
  })
})
```

---

### 3. 技能系统测试（优先级：P1）

**文件**: `skill-system.spec.ts`

```typescript
test.describe('技能系统功能', () => {
  test('应该能够加载工作目录技能', async () => {
    // 1. 切换到有技能的工作目录
    // 2. 验证技能列表显示
    // 3. 检查技能来源标识
  })
  
  test('应该能够调用文件读取技能', async () => {
    // 1. 输入技能调用指令
    // 2. 验证技能执行过程
    // 3. 检查结果返回
  })
  
  test('应该能够处理技能调用错误', async () => {
    // 1. 调用不存在的技能
    // 2. 验证错误提示显示
    // 3. 检查错误恢复机制
  })
  
  test('应该支持技能优先级（工作目录 > 全局）', async () => {
    // 1. 在同名技能场景下
    // 2. 验证工作目录技能优先调用
  })
})
```

---

### 4. 工作目录管理（优先级：P1）

**文件**: `workspace-full-flow.spec.ts`

```typescript
test.describe('工作目录完整流程', () => {
  test('应该能够初始化新的工作目录', async () => {
    // 1. 选择空目录
    // 2. 触发初始化向导
    // 3. 验证.lingxi 目录创建
    // 4. 检查配置文件生成
  })
  
  test('应该能够切换工作目录', async () => {
    // 1. 打开切换对话框
    // 2. 选择目标目录
    // 3. 验证目录切换
    // 4. 检查技能列表更新
  })
  
  test('应该能够验证工作目录有效性', async () => {
    // 1. 选择无效目录
    // 2. 验证错误提示
    // 3. 检查修复建议
  })
  
  test('应该支持工作目录配置覆盖', async () => {
    // 1. 配置全局设置
    // 2. 切换到有配置的工作目录
    // 3. 验证配置覆盖生效
  })
})
```

---

### 5. 上下文管理（优先级：P2）

**文件**: `context-management.spec.ts`

```typescript
test.describe('上下文管理功能', () => {
  test('应该显示 Token 使用状态', async () => {
    // 1. 发送多条消息
    // 2. 验证 Token 计数器更新
    // 3. 检查警告阈值提示
  })
  
  test('应该自动压缩超限的历史记录', async () => {
    // 1. 发送大量消息超出预算
    // 2. 验证压缩提示显示
    // 3. 检查压缩后历史保留
  })
  
  test('应该支持手动压缩历史', async () => {
    // 1. 点击压缩按钮
    // 2. 选择压缩范围
    // 3. 验证压缩结果
  })
})
```

---

### 6. 设置功能（优先级：P2）

**文件**: `settings.spec.ts`

```typescript
test.describe('设置功能测试', () => {
  test('应该能够修改模型配置', async () => {
    // 1. 打开设置页面
    // 2. 修改默认模型
    // 3. 保存配置
    // 4. 验证配置生效
  })
  
  test('应该能够修改 Token 预算', async () => {
    // 1. 打开设定页面
    // 2. 调整 Token 预算滑块
    // 3. 保存并验证
  })
  
  test('应该能够恢复默认配置', async () => {
    // 1. 修改多个配置项
    // 2. 点击恢复默认
    // 3. 验证配置重置
  })
  
  test('应该持久化配置到本地', async () => {
    // 1. 修改配置
    // 2. 重启应用
    // 3. 验证配置保留
  })
})
```

---

### 7. 错误处理（优先级：P1）

**文件**: `error-handling.spec.ts`

```typescript
test.describe('错误处理测试', () => {
  test('应该处理后端连接失败', async () => {
    // 1. 模拟后端不可用
    // 2. 验证错误提示显示
    // 3. 检查重试机制
  })
  
  test('应该处理 API 超时', async () => {
    // 1. 模拟慢响应
    // 2. 验证超时提示
    // 3. 检查取消功能
  })
  
  test('应该处理 WebSocket 断线重连', async () => {
    // 1. 模拟连接断开
    // 2. 验证重连提示
    // 3. 检查自动重连
  })
  
  test('应该处理技能执行错误', async () => {
    // 1. 触发技能错误
    // 2. 验证错误信息展示
    // 3. 检查错误恢复建议
  })
})
```

---

### 8. 性能测试（优先级：P3）

**文件**: `performance.spec.ts`

```typescript
test.describe('性能测试', () => {
  test('应用启动时间应该在 5 秒内', async () => {
    const startTime = Date.now()
    electronApp = await electron.launch({ /* ... */ })
    await electronApp.firstWindow()
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(5000)
  })
  
  test('消息响应时间应该在 3 秒内', async () => {
    // 1. 记录发送时间
    // 2. 等待回复开始显示
    // 3. 计算响应时间
  })
  
  test('内存占用应该稳定', async () => {
    // 1. 执行多个操作
    // 2. 监控内存使用
    // 3. 验证无内存泄漏
  })
})
```

---

## 🔧 测试工具函数

### 通用工具函数

创建 `tests/e2e/utils/helpers.ts`:

```typescript
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
  await page.locator('.send-button').click()
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

/**
 * 模拟网络延迟
 */
export async function simulateNetworkDelay(page: Page, delay = 1000) {
  await page.waitForTimeout(delay)
}
```

---

### Mock 数据工厂

创建 `tests/e2e/utils/factories.ts`:

```typescript
/**
 * 创建测试会话数据
 */
export function createSession(overrides = {}) {
  return {
    id: `session-${Date.now()}`,
    name: '测试会话',
    created_at: new Date().toISOString(),
    ...overrides
  }
}

/**
 * 创建测试消息数据
 */
export function createMessage(role: 'user' | 'assistant', content: string) {
  return {
    role,
    content,
    timestamp: Date.now(),
    tokens: Math.ceil(content.length / 4)
  }
}
```

---

## 📊 测试执行配置

### Playwright 配置更新

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60 * 1000,
  expect: {
    timeout: 10 * 1000
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'test-results/e2e-report' }],
    ['list'],
    ['junit', { outputFile: 'test-results/e2e/results.xml' }]
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // CI 环境下增加 macOS 和 Windows 测试
    ...(process.env.CI ? [
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      },
    ] : []),
  ],
})
```

---

## 📈 测试覆盖率目标

| 类别 | 当前 | 短期目标 | 长期目标 |
|------|------|----------|----------|
| **E2E 测试用例数** | 27 个 | 50 个 | 100+ 个 |
| **核心功能覆盖** | 30% | 70% | 95% |
| **UI 组件覆盖** | 20% | 60% | 90% |
| **错误场景覆盖** | 10% | 50% | 80% |

---

## 🚀 实施计划

### 第一周：核心功能
- [ ] 创建 `chat-flow.spec.ts`（10 个用例）
- [ ] 创建 `session-management.spec.ts`（8 个用例）
- [ ] 创建通用工具函数

### 第二周：技能和工作目录
- [ ] 创建 `skill-system.spec.ts`（8 个用例）
- [ ] 创建 `workspace-full-flow.spec.ts`（8 个用例）

### 第三周：错误处理和设置
- [ ] 创建 `error-handling.spec.ts`（10 个用例）
- [ ] 创建 `settings.spec.ts`（6 个用例）

### 第四周：性能和其他
- [ ] 创建 `context-management.spec.ts`（5 个用例）
- [ ] 创建 `performance.spec.ts`（5 个用例）
- [ ] 集成 CI/CD

---

## 📝 测试报告模板

每次测试执行后生成报告：

```markdown
## E2E 测试报告 - YYYY-MM-DD

### 测试概览
- 执行时间：XX 分钟
- 通过用例：XX/XX
- 失败用例：XX 个
- 跳过用例：XX 个

### 失败用例分析
1. **用例名称**
   - 失败原因：...
   - 解决方案：...

### 性能指标
- 平均启动时间：X.X 秒
- 平均响应时间：X.X 秒
- 内存峰值：XXX MB

### 改进建议
- ...
```

---

## 🎯 成功标准

1. **所有 P0 测试通过** - 核心功能 100% 覆盖
2. **CI/CD 集成完成** - 每次提交自动运行
3. **测试稳定性** - 误报率 < 5%
4. **执行效率** - 完整测试套件 < 30 分钟

---

**文档创建完成** 📋

下一步：按照优先级开始实施测试用例编写。
