# 灵犀助手架构文档

## 架构概述

灵犀助手采用 **Web + Electron 混合架构**，实现了跨平台桌面应用与纯 Web 应用的无缝切换。

### 核心设计理念

1. **前后端分离**：渲染进程与主进程职责清晰，业务逻辑集中在渲染进程
2. **API 驱动**：通过 RESTful API 与后端服务通信，支持独立部署
3. **实时通信**：WebSocket 实现 Agent 执行状态的实时推送
4. **环境适配**：统一的 Electron API 适配层，自动检测运行环境

## 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | Electron | ^28.0.0 | 跨平台桌面应用框架 |
| 前端 | Vue 3 | ^3.3.4 | Composition API |
| 语言 | TypeScript | ^5.3.3 | 严格类型检查 |
| 构建 | Vite | ^5.0.10 | 快速开发服务器 |
| 状态 | Pinia | ^2.1.7 | Vue 状态管理 |
| HTTP | Axios | ^1.6.2 | API 客户端 |
| 路由 | Vue Router | ^4.2.5 | 单页应用路由 |
| UI | Element Plus | ^2.4.4 | 组件库 |

## 项目结构

```
lingxi-desktop/
├── electron/                    # Electron 主进程
│   ├── main/
│   │   ├── index.ts            # 主进程入口（窗口管理、IPC）
│   │   ├── windowManager.ts    # 窗口生命周期管理
│   │   ├── fileManager.ts      # 文件操作
│   │   ├── wsClient.ts         # WebSocket 客户端
│   │   └── logger.ts           # 日志模块
│   └── preload/
│       └── index.ts            # 预加载脚本（contextBridge）
├── src/
│   ├── api/                    # API 客户端
│   │   ├── client.ts           # Axios 实例配置
│   │   ├── chat.ts             # 聊天相关 API
│   │   ├── session.ts          # 会话管理 API
│   │   └── file.ts             # 文件操作 API
│   ├── stores/                 # Pinia 状态管理
│   │   ├── chat.ts             # 聊天状态
│   │   ├── session.ts          # 会话状态
│   │   ├── app.ts              # 应用全局状态
│   │   └── workspace.ts        # 工作区状态
│   ├── components/             # Vue 组件
│   │   ├── chat/              # 聊天相关组件
│   │   ├── workspace/         # 工作区组件
│   │   └── ...
│   ├── views/                  # 页面级组件
│   ├── router/                 # 路由配置
│   ├── utils/                  # 工具函数
│   │   └── electron.ts         # Electron 环境适配
│   ├── types/                  # TypeScript 类型
│   ├── styles/                 # 全局样式
│   ├── App.vue                 # 根组件
│   └── main.ts                 # 渲染进程入口
├── tests/                      # 测试文件
│   ├── unit/                   # 单元测试
│   └── e2e/                    # E2E 测试
├── docs/                       # 文档
└── vite.config.ts              # Vite 配置
```

## Web + Electron 混合模式

### 运行模式检测

```typescript
// src/utils/electron.ts
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof (window as any).electronAPI !== 'undefined'
}
```

### Electron 模式
- 通过 `electronAPI` 访问原生功能（文件对话框、窗口控制）
- 支持完整的桌面应用体验
- 使用 IPC 与主进程通信

### Web 模式
- 自动降级为 Web API（如 `<input type="file">`）
- 功能受限但核心功能可用
- 可直接部署到 Web 服务器

## 数据流

### API 调用流程

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Vue       │      │   Store     │      │   API       │
│  Component  │ ──►  │  (Pinia)    │ ──►  │   Client    │
└─────────────┘      └─────────────┘      └──────┬──────┘
                                                  │
                                                  ▼
                                         ┌─────────────┐
                                         │   Axios     │
                                         └──────┬──────┘
                                                  │
                                                  ▼
                                         ┌─────────────┐
                                         │  Backend    │
                                         │   API       │
                                         └─────────────┘
```

### 状态更新流程

```
1. 用户操作 → 触发 Store Action
2. Store Action → 调用 API
3. API 响应 → 更新 Store State
4. State 变化 → 组件自动重新渲染
```

### WebSocket 实时推送

```
┌─────────────┐      WebSocket      ┌─────────────┐
│   Frontend  │ ◄─────────────────►  │   Backend   │
│  (Renderer) │                     │   Service   │
└──────┬──────┘                     └─────────────┘
       │
       ▼
┌─────────────┐
│   Store     │
│  (Update)   │
└─────────────┘
```

## 代码分割策略

### Vite 构建优化

```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['vue', 'pinia', 'vue-router', 'axios'],
        element: ['element-plus'],
        electron: ['./src/utils/electron']
      }
    }
  },
  chunkSizeWarningLimit: 1000
}
```

### 懒加载

- **路由懒加载**：页面级组件按需加载
- **组件异步加载**：大型组件动态导入

```typescript
// router/index.ts
const routes = [
  {
    path: '/settings',
    component: () => import('@/views/Settings.vue')
  }
]
```

## IPC 通信

### 主进程职责

- 窗口管理（创建、最小化、最大化、关闭）
- 原生对话框（文件选择、保存）
- 系统功能（版本信息、平台检测）
- 文件读写（必要时）

### 渲染进程职责

- 所有业务逻辑
- API 调用
- 状态管理
- UI 渲染

### IPC 处理器列表

| IPC Handler | 方向 | 用途 |
|-------------|------|------|
| `window:minimize` | R→M | 最小化窗口 |
| `window:maximize` | R→M | 最大化/还原窗口 |
| `window:close` | R→M | 关闭窗口 |
| `dialog:open` | R→M | 打开文件对话框 |
| `dialog:save` | R→M | 保存文件对话框 |
| `file:read` | R→M | 读取文件 |
| `file:write` | R→M | 写入文件 |
| `app:getVersion` | R→M | 获取应用版本 |

R→M: Renderer to Main

## 最佳实践

### 1. 状态管理

- 使用 Pinia 管理全局状态
- 避免组件间直接传递复杂状态
- 异步操作在 Store 中处理

### 2. API 调用

- 统一使用 `src/api/` 下的 API 模块
- 错误处理在 API 层统一进行
- 使用 TypeScript 类型保证接口一致性

### 3. 组件设计

- 使用 Composition API（`<script setup>`）
- 保持组件单一职责
- 复杂逻辑抽取为 Composables

### 4. 性能优化

- 大列表使用虚拟滚动
- 图片资源懒加载
- 避免不必要的重新渲染

### 5. 测试

- Store 逻辑编写单元测试
- API 模块编写单元测试
- 关键用户流程编写 E2E 测试

## 安全考虑

### Context Isolation

```typescript
// electron/main/index.ts
webPreferences: {
  preload: path.join(__dirname, 'preload.js'),
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true
}
```

### Preload 脚本

- 仅暴露必要的 API
- 使用 `contextBridge` 安全桥接
- 不直接暴露 Node.js API

## 开发指南

### 启动开发环境

```bash
# 安装依赖
pnpm install

# 启动开发服务器（Web 模式）
npm run dev

# 启动 Electron 应用
npm run electron:dev
```

### 构建生产版本

```bash
# 构建前端资源
npm run build

# 打包 Electron 应用
npm run electron:build
```

### 运行测试

```bash
# 单元测试
npm run test:unit

# E2E 测试
npm run test:e2e

# 生成覆盖率报告
npm run test:unit -- --coverage
```

## 故障排查

### 常见问题

1. **WebSocket 连接失败**
   - 检查后端服务是否运行（端口 5000）
   - 检查网络配置

2. **IPC 调用无响应**
   - 确认 preload 脚本正确加载
   - 检查 contextBridge 暴露的 API

3. **构建后路径错误**
   - 使用 `__dirname` 获取绝对路径
   - 检查 Vite 配置的输出目录

## 版本历史

- **v2.0** - 纯客户端架构重构
  - 业务逻辑迁移到渲染进程
  - 移除主进程业务逻辑
  - 添加单元测试

- **v1.x** - 初始版本
  - Electron 主进程处理业务逻辑
  - 通过 IPC 与渲染进程通信
