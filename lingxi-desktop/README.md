# Lingxi Desktop

Lingxi Agent 终端助手 - V2.0 纯客户端架构

## 技术栈

- **Electron** ^28.0.0 - 跨平台桌面应用框架
- **Vue 3** ^3.3.4 - 渐进式 JavaScript 框架
- **TypeScript** ^5.3.3 - JavaScript 的超集
- **Vite** ^5.0.10 - 下一代前端构建工具
- **Element Plus** ^2.4.4 - Vue 3 组件库
- **Pinia** ^2.1.7 - Vue 状态管理库
- **Axios** ^1.6.2 - HTTP 客户端

## 项目结构

```
lingxi-desktop/
├── electron/              # Electron 主线程代码
│   ├── main/             # 主进程模块
│   │   ├── index.ts      # 主进程入口
│   │   ├── windowManager.ts   # 窗口管理
│   │   ├── apiClient.ts       # HTTP 客户端
│   │   ├── wsClient.ts        # WebSocket 客户端
│   │   └── fileManager.ts     # 文件管理
│   └── preload/          # 预加载脚本
│       └── index.ts      # IPC 桥接
├── src/                  # 渲染进程代码
│   ├── components/       # Vue 组件
│   │   ├── chat/        # 聊天相关组件
│   │   ├── workspace/   # 工作区组件
│   │   └── ...
│   ├── stores/          # Pinia 状态管理
│   ├── router/          # Vue Router 路由
│   ├── styles/          # 全局样式
│   ├── types/           # TypeScript 类型定义
│   ├── views/           # 页面组件
│   ├── App.vue          # 根组件
│   └── main.ts          # 渲染进程入口
├── index.html           # HTML 模板
├── package.json         # 项目配置
├── tsconfig.json        # TypeScript 配置
└── vite.config.ts       # Vite 配置
```

## 开发

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
npm run dev
```

### 启动 Electron 应用

```bash
npm run electron:dev
```

## 构建

### 构建前端资源

```bash
npm run build
```

### 打包 Electron 应用

```bash
npm run electron:build
```

### 打包特定平台

```bash
npm run electron:build:win    # Windows
npm run electron:build:mac    # macOS
npm run electron:build:linux  # Linux
```

## 核心特性

- **纯客户端架构**：通过 HTTP/WebSocket 与后端服务通信，前后端彻底解耦
- **透明化交互**：实时展示 Agent 思考路径、任务分级及模型路由策略
- **状态可控**：支持断点续传、步骤级重试、人工干预与多断点并行管理
- **能力可视**：动态展示技能加载/调用状态，提供异常诊断与自愈引导
- **资源感知**：实时监控 Token 水位、本地系统资源，支持精细化资源管理
- **跨平台一致**：兼容 Windows/macOS/Linux，保证各平台交互体验无差异

## 许可证

MIT
