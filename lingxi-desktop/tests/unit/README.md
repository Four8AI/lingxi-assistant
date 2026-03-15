# 单元测试指南

本目录包含灵犀前端项目的单元测试用例，使用 [Vitest](https://vitest.dev/) 作为测试框架。

## 技术栈

- **测试框架**: Vitest
- **Vue 测试工具**: @vue/test-utils
- **DOM 环境**: happy-dom
- **状态管理**: Pinia
- **UI 组件库**: Element Plus

## 目录结构

```
tests/unit/
├── setup.ts              # 测试配置文件
├── README.md             # 本文件
├── components/           # 组件测试
│   ├── InputArea.test.ts
│   ├── WorkspaceStatus.test.ts
│   └── MessageList.test.ts
├── stores/               # Store 测试
│   ├── app.test.ts
│   └── workspace.test.ts
└── utils/                # 工具函数测试
```

## 运行测试

### 运行所有单元测试

```bash
npm run test:unit
```

### 生成覆盖率报告

```bash
npm run test:coverage
```

覆盖率报告将生成在 `coverage/` 目录下，打开 `coverage/index.html` 可查看可视化报告。

### 监听模式（开发时使用）

```bash
npx vitest
```

### 运行特定测试文件

```bash
npx vitest run tests/unit/stores/app.test.ts
```

### 运行匹配特定名称的测试

```bash
npx vitest run -t "App Store"
```

## 编写测试

### Store 测试示例

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAppStore } from '@/stores/app'

describe('App Store', () => {
  let pinia
  let store

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    store = useAppStore()
  })

  it('should initialize with default state', () => {
    expect(store.loading).toBe(false)
  })

  it('should set loading state', () => {
    store.setLoading(true)
    expect(store.loading).toBe(true)
  })
})
```

### 组件测试示例

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import MyComponent from '@/components/MyComponent.vue'

describe('MyComponent', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
  })

  it('should render correctly', () => {
    const wrapper = mount(MyComponent, {
      global: {
        plugins: [pinia]
      }
    })
    
    expect(wrapper.find('.my-component').exists()).toBe(true)
  })

  it('should handle click event', async () => {
    const wrapper = mount(MyComponent, {
      global: {
        plugins: [pinia]
      }
    })
    
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeDefined()
  })
})
```

## 测试最佳实践

### 1. 测试命名

- 使用描述性的测试名称
- 格式：`should [预期行为] when [条件]`
- 示例：`should set loading state when action starts`

### 2. 测试独立性

- 每个测试应该是独立的
- 使用 `beforeEach` 重置状态
- 避免测试之间的依赖

### 3. Mock 外部依赖

```typescript
// Mock electronAPI
window.electronAPI.api.executeTask = vi.fn().mockResolvedValue({ success: true })

// Mock API error
window.electronAPI.api.executeTask = vi.fn().mockRejectedValue(new Error('Failed'))
```

### 4. 异步测试

```typescript
it('should handle async operation', async () => {
  await wrapper.find('button').trigger('click')
  await vi.runAllTimers()
  expect(...).toBe(...)
})
```

### 5. 测试覆盖率目标

- **语句覆盖率**: > 80%
- **分支覆盖率**: > 70%
- **函数覆盖率**: > 80%
- **行覆盖率**: > 80%

## 常见问题

### Q: 如何处理 Vue 组件中的 Pinia store？

A: 在 mount 时通过 `global.plugins` 注入 Pinia：

```typescript
const wrapper = mount(MyComponent, {
  global: {
    plugins: [createPinia()]
  }
})
```

### Q: 如何测试使用了 Composition API 的组件？

A: 直接测试，Vitest 和 @vue/test-utils 完全支持 Composition API。

### Q: 如何处理异步组件？

A: 使用 `await wrapper.vm.$nextTick()` 等待组件更新。

### Q: 如何测试 emits 事件？

A: 检查 `wrapper.emitted()`:

```typescript
await wrapper.find('button').trigger('click')
expect(wrapper.emitted('click')).toHaveLength(1)
```

## 配置说明

Vitest 配置在 `vitest.config.ts` 中：

- **环境**: happy-dom（轻量级 DOM 实现）
- **覆盖率**: 使用 v8 提供者，生成 text/json/html 报告
- **别名**: `@` 指向 `src` 目录
- **测试文件**: `tests/unit/**/*.test.{ts,js}`

## 持续集成

在 CI/CD 流程中运行测试：

```bash
# 安装依赖
npm install

# 运行测试并生成覆盖率
npm run test:coverage

# 检查覆盖率是否达标（可在 vitest.config.ts 中配置阈值）
```

## 参考资料

- [Vitest 文档](https://vitest.dev/)
- [@vue/test-utils 文档](https://test-utils.vuejs.org/)
- [Pinia 测试指南](https://pinia.vuejs.org/cookbook/testing.html)
- [Happy DOM](https://github.com/capricorn86/happy-dom)
