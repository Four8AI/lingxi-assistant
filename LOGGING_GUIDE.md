# 日志系统使用说明

## 问题诊断

**问题**: debug.log 文件没有生成

**原因**: 配置文件中的键名不匹配
- 代码期望: `file_path`
- 配置使用: `file`

**解决方案**: 已修复配置文件 [config.yaml](d:\resources\lingxi-assistant\config.yaml#L118)

## 当前配置

```yaml
logging:
  level: "INFO"
  format: "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
  file_path: "logs/assistant.log"      # 主日志文件（INFO及以上级别）
  max_file_size_mb: 10
  backup_count: 5
```

## 日志文件位置

### 1. 主日志文件
- **路径**: `logs/assistant.log`
- **级别**: INFO 及以上
- **内容**: 系统运行日志、错误信息、警告信息

### 2. DEBUG 日志文件
- **路径**: `logs/debug.log`
- **级别**: DEBUG（所有级别）
- **内容**: 详细的调试信息，包括：
  - LLM 调用详情
  - 任务执行步骤
  - 事件发布和订阅
  - 数据库操作
  - 技能加载过程

## 日志级别说明

| 级别 | 说明 | 输出位置 |
|------|------|---------|
| DEBUG | 详细的调试信息 | debug.log |
| INFO | 一般信息 | assistant.log, debug.log |
| WARNING | 警告信息 | assistant.log, debug.log |
| ERROR | 错误信息 | assistant.log, debug.log |
| CRITICAL | 严重错误 | assistant.log, debug.log |

## 查看日志的方法

### 方法 1: 使用 VSCode
1. 打开 `logs/debug.log` 文件
2. 使用 VSCode 的搜索功能查找关键信息
3. 可以使用正则表达式过滤日志

### 方法 2: 使用命令行（PowerShell）

查看最新的 20 行：
```powershell
Get-Content logs\debug.log -Tail 20
```

查看最新的 50 行：
```powershell
Get-Content logs\debug.log -Tail 50
```

搜索特定关键词：
```powershell
Select-String -Path logs\debug.log -Pattern "ERROR"
```

查看包含特定模块的日志：
```powershell
Select-String -Path logs\debug.log -Pattern "lingxi.core.engine"
```

### 方法 3: 使用 Python 脚本

运行测试脚本：
```bash
python test_logging.py
```

## 常见问题

### Q1: 为什么控制台看不到 DEBUG 日志？
**A**: 控制台只输出 INFO 及以上级别的日志，DEBUG 日志只写入文件。这是为了保持控制台输出清晰。

### Q2: 如何临时启用 DEBUG 级别到控制台？
**A**: 修改 [config.yaml](d:\resources\lingxi-assistant\config.yaml#L118)：
```yaml
logging:
  level: "DEBUG"
```

### Q3: 日志文件太大怎么办？
**A**: 日志系统会自动轮转：
- 单个文件最大 10MB
- 保留 5 个备份文件
- 超过限制会自动删除旧日志

### Q4: 如何只查看某个模块的日志？
**A**: 使用 PowerShell 搜索：
```powershell
Select-String -Path logs\debug.log -Pattern "lingxi.core.engine"
```

### Q5: 日志文件编码问题
**A**: 日志文件使用 UTF-8 编码。如果看到乱码，请确保编辑器使用 UTF-8 编码打开。

## 调试技巧

### 1. 查找错误
```powershell
Select-String -Path logs\debug.log -Pattern "ERROR|CRITICAL" -Context 2,2
```

### 2. 查找特定会话的日志
```powershell
Select-String -Path logs\debug.log -Pattern "session_4e1b53b9"
```

### 3. 查找特定任务的日志
```powershell
Select-String -Path logs\debug.log -Pattern "task_session_4e1b53b9"
```

### 4. 查找 LLM 调用
```powershell
Select-String -Path logs\debug.log -Pattern "LLM 调用|llm_client"
```

### 5. 查看最近的日志
```powershell
Get-Content logs\debug.log -Tail 100 | Select-String "ERROR"
```

## 日志内容示例

### DEBUG 日志示例
```
2026-03-06 13:58:47,050 - lingxi.web.stream_executor - DEBUG - 开始执行任务
2026-03-06 13:58:47,054 - lingxi.core.engine.base - DEBUG - Plan+ReAct执行任务: simple (stream=True)
2026-03-06 13:58:47,054 - lingxi.core.event.publisher - DEBUG - 发布事件: task_start
2026-03-06 13:58:47,081 - lingxi.core.session - DEBUG - 任务已创建
```

### INFO 日志示例
```
2026-03-06 13:58:47,055 - lingxi.core.event.SessionStore_subscriber - INFO - 任务开始
2026-03-06 13:58:47,081 - lingxi.core.event.SessionStore_subscriber - INFO - 任务创建成功
```

### ERROR 日志示例
```
2026-03-06 13:58:47,081 - lingxi.core.session - ERROR - 数据库操作失败
```

## 日志配置说明

### 修改日志级别

编辑 [config.yaml](d:\resources\lingxi-assistant\config.yaml#L118)：

```yaml
logging:
  level: "DEBUG"    # 可选: DEBUG, INFO, WARNING, ERROR, CRITICAL
```

### 修改日志文件路径

```yaml
logging:
  file_path: "custom/path/to/assistant.log"
```

### 修改日志格式

```yaml
logging:
  format: "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
```

可用的格式变量：
- `%(asctime)s`: 时间
- `%(name)s`: 日志记录器名称
- `%(levelname)s`: 日志级别
- `%(message)s`: 日志消息
- `%(filename)s`: 文件名
- `%(lineno)d`: 行号
- `%(funcName)s`: 函数名

## 相关文件

- [config.yaml](d:\resources\lingxi-assistant\config.yaml) - 配置文件
- [lingxi/utils/logging.py](d:\resources\lingxi-assistant\lingxi\utils\logging.py) - 日志系统实现
- [test_logging.py](d:\resources\lingxi-assistant\test_logging.py) - 日志测试脚本

## 总结

✅ 日志系统已修复并正常工作
✅ `debug.log` 文件已生成并包含详细的调试信息
✅ 日志自动轮转，不会无限增长
✅ 支持按模块、会话、任务过滤日志
✅ 提供多种查看日志的方法

现在你可以正常查看和分析调试日志了！
