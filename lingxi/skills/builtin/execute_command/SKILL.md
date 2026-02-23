---
name: execute_command
description: "Execute Linux Shell or PowerShell commands. Use this skill when the user needs to run terminal commands, execute scripts, or perform system operations."
version: "1.0.0"
trigger_conditions: "用户请求执行命令、运行脚本、执行系统操作时触发"
execution_guidelines: "1. 自动检测操作系统并选择合适的shell\n2. Windows使用PowerShell，Linux/Mac使用Bash\n3. 支持指定工作目录\n4. 设置30秒超时\n5. 返回命令输出或错误信息"
author: "Lingxi Team"
license: MIT
---

# Execute Command Skill

## Overview

The execute_command skill allows you to execute Linux Shell or PowerShell commands. It automatically detects the operating system and uses the appropriate shell.

## Usage

### Parameters

- **command** (required): Command to execute
- **shell_type** (optional): Shell type (powershell/bash, default: auto-detect)
- **cwd** (optional): Working directory (default: current directory)

### Example

```python
# Execute command (auto-detect shell)
execute_command(command="ls -la")

# Execute PowerShell command
execute_command(
    command="Get-ChildItem",
    shell_type="powershell"
)

# Execute command in specific directory
execute_command(
    command="python script.py",
    cwd="/path/to/project"
)
```

## Implementation Notes

- Automatically detects OS and uses appropriate shell (PowerShell on Windows, Bash on Linux/Mac)
- Returns command output or error details
- Uses system's preferred encoding for output
- Current working directory is provided to the model for context

## Dependencies

None
