# 灵犀个人智能助手

一个基于Python的智能个人助手系统，支持多任务处理、技能扩展和会话管理。

## 功能特性

- **多级任务处理**：支持trivial/simple/complex三种任务级别
- **智能执行引擎**：Direct、ReAct、Plan+ReAct三种执行模式
- **技能扩展系统**：支持MCP格式和传统格式的技能
- **会话管理**：支持多会话、检查点恢复、上下文压缩
- **自然语言交互**：支持自然语言命令安装技能、管理会话
- **长短期记忆**：结合向量检索和滑动窗口的混合记忆机制

## 快速开始

### 安装依赖

```bash
pip install -r requirements.txt
```

### 配置

复制配置文件模板并填写必要的配置：

```bash
cp config.yaml.example config.yaml
# 编辑 config.yaml，填写API密钥等配置
```

### 运行

```bash
# 交互模式
python -m lingxi

# 单次任务
python -m lingxi --task "你的问题"

# 指定会话
python -m lingxi --session my_session

# 列出可用技能
python -m lingxi --list-skills

# 安装技能
python -m lingxi --install-skill /path/to/skill/directory
```

## 交互模式命令

- `/help` - 显示帮助信息
- `/session [id]` - 创建新会话或切换到指定会话
- `/clear` - 清空当前会话
- `/status` - 显示检查点状态
- `/skills` - 列出可用技能
- `/install <path>` - 安装技能
- `/context-stats` - 显示上下文统计
- `/compress` - 手动触发上下文压缩
- `/search <query>` - 检索相关历史
- `/exit` - 退出系统

## 技能开发

### 快速开始

1. 在 `.lingxi/skills/` 目录下创建技能目录
2. 创建配置文件（`SKILL.md` 或 `skill.json`）
3. 重启系统，技能会自动注册

### MCP格式技能

```yaml
---
skill_id: my_skill
skill_name: My Skill
description: 技能描述
version: 1.0.0
author: Your Name
---

技能说明...
```

### 安装技能

```bash
# 命令行安装
python -m lingxi --install-skill /path/to/skill

# 交互模式安装
/install /path/to/skill

# 自然语言安装
安装技能 /path/to/skill
```

## 项目结构

```
lingxi/
├── lingxi/
│   ├── core/           # 核心模块
│   │   ├── engine/    # 执行引擎
│   │   ├── llm_client.py
│   │   ├── session.py
│   │   └── ...
│   ├── skills/          # 技能管理
│   ├── context/         # 上下文管理
│   ├── utils/           # 工具函数
│   └── __main__.py
├── docs/               # 文档
├── tests/              # 测试
├── config.yaml         # 配置文件
└── requirements.txt    # 依赖
```

## 配置说明

主要配置项：

- `llm`: LLM配置（API密钥、模型等）
- `execution_mode`: 执行模式配置
- `task_classification`: 任务分类配置
- `context_management`: 上下文管理配置
- `skills`: 技能扫描路径

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！
