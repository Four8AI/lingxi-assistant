# MCP技能使用指南

## 概述

灵犀个人智能助手现在采用统一的MCP技能协议管理所有技能。所有技能（包括内置技能和外部技能）都使用相同的MCP格式实现。

## MCP技能协议

### 技能目录结构

每个MCP技能必须包含以下文件：

```
.lingxi/skills/<skill_name>/
├── SKILL.md          # 技能配置和文档（必需）
└── main.py           # 技能实现（必需）
```

### SKILL.md格式

SKILL.md文件使用YAML frontmatter定义技能元数据：

```markdown
---
name: skill_name
description: "Skill description"
version: "1.0.0"
trigger_conditions: "触发条件描述"
execution_guidelines: "执行指引"
author: "Author Name"
license: MIT
---

# Skill Documentation

## Overview
...

## Usage
...
```

**必填字段**：
- `name`: 技能唯一标识名
- `description`: 技能描述
- `version`: 版本号
- `trigger_conditions`: 触发条件
- `execution_guidelines`: 执行指引

**可选字段**：
- `author`: 作者信息
- `license`: 许可证

### main.py格式

main.py文件必须实现`execute`函数：

```python
#!/usr/bin/env python3
"""Skill implementation"""

import logging
from typing import Dict, Any


def execute(parameters: Dict[str, Any]) -> str:
    """Execute skill

    Args:
        parameters: Parameters dictionary

    Returns:
        Execution result
    """
    logger = logging.getLogger(__name__)

    # 技能实现逻辑
    # 可以直接导入所需的依赖，不需要检查
    try:
        import requests  # 直接使用依赖
        result = requests.get("...")
        return str(result)
    except ImportError as e:
        # 让Agent发现并处理依赖问题
        raise e
    except Exception as e:
        logger.error(f"技能执行失败: {e}")
        return f"错误: 技能执行失败 - {str(e)}"
```

**依赖处理原则**：
- ✅ 技能只关注核心功能
- ✅ 直接导入所需的依赖
- ✅ 让Agent自主发现和解决依赖问题
- ✅ 不需要实现check_dependencies函数
- ✅ 不需要在SKILL.md中声明dependencies字段

## 已注册的MCP技能

### 文件操作技能

#### 1. create_file

**功能**：创建新文件并写入内容

**适用场景**：
- 创建新文件
- 保存文本内容到文件

**参数**：
- `file_path` (required): 文件路径（绝对路径）
- `content` (required): 文件内容

**使用示例**：
```python
create_file(
    file_path="/path/to/file.txt",
    content="Hello, World!"
)
```

#### 2. modify_file

**功能**：修改文件内容，支持部分替换

**适用场景**：
- 更新文件内容
- 替换文件中的特定文本

**参数**：
- `file_path` (required): 文件路径（绝对路径）
- `old_content` (required): 要替换的旧内容
- `new_content` (required): 新内容

**使用示例**：
```python
modify_file(
    file_path="/path/to/file.txt",
    old_content="Hello",
    new_content="Hi"
)
```

#### 3. read_file

**功能**：读取文件内容，支持搜索

**适用场景**：
- 读取文件内容
- 搜索文件中的特定文本

**参数**：
- `file_path` (required): 文件路径（绝对路径）
- `search_text` (optional): 搜索文本
- `context_lines` (optional): 搜索前后显示的行数（默认5行）

**使用示例**：
```python
# 读取整个文件
read_file(file_path="/path/to/file.txt")

# 搜索特定文本
read_file(
    file_path="/path/to/file.txt",
    search_text="Python",
    context_lines=3
)
```

#### 4. delete_file

**功能**：删除文件

**适用场景**：
- 删除不需要的文件

**参数**：
- `file_path` (required): 文件路径（绝对路径）

**使用示例**：
```python
delete_file(file_path="/path/to/file.txt")
```

### 系统操作技能

#### 5. execute_command

**功能**：执行Linux Shell或PowerShell命令

**适用场景**：
- 运行终端命令
- 执行脚本
- 执行系统操作

**参数**：
- `command` (required): 要执行的命令
- `shell_type` (optional): Shell类型（powershell/bash，默认自动检测）
- `cwd` (optional): 工作目录（默认当前目录）

**使用示例**：
```python
# 自动检测shell
execute_command(command="ls -la")

# 指定shell类型
execute_command(
    command="Get-ChildItem",
    shell_type="powershell"
)

# 指定工作目录
execute_command(
    command="python script.py",
    cwd="/path/to/project"
)
```

### 网络操作技能

#### 6. search

**功能**：搜索网络信息

**适用场景**：
- 搜索在线信息
- 查找事实
- 研究主题

**参数**：
- `query` (required): 搜索查询词

**使用示例**：
```python
search(query="Python best practices")
```

#### 7. fetch_webpage

**功能**：获取网页内容并保存到本地文件

**适用场景**：
- 获取网页内容
- 下载网页
- 保存网页内容到文件

**参数**：
- `url` (required): 网页URL
- `timeout` (optional): 超时时间（秒，默认30）
- `save_path` (optional): 保存路径（绝对路径，如不提供则不保存）

**使用示例**：
```python
# 获取网页内容
fetch_webpage(url="https://example.com")

# 获取并保存网页
fetch_webpage(
    url="https://example.com",
    save_path="/path/to/content.md"
)
```

### 文档处理技能

#### 8. pdf_parser

**功能**：解析PDF文件并提取文本、元数据和内容

**适用场景**：
- 读取PDF文件
- 提取PDF文本
- 分析PDF文档结构

**参数**：
- `file_path` (required): PDF文件路径
- `pages` (optional): 页面范围（如'1-3'或'1,3,5'，默认所有页面）
- `extract_metadata` (optional): 提取PDF元数据（默认false）
- `output_format` (optional): 输出格式（'text'或'markdown'，默认'text'）

**使用示例**：
```python
# 提取所有页面
pdf_parser(file_path="/path/to/document.pdf")

# 提取特定页面和元数据
pdf_parser(
    file_path="/path/to/document.pdf",
    pages="1-3",
    extract_metadata=True
)

# 提取为Markdown格式
pdf_parser(
    file_path="/path/to/document.pdf",
    output_format="markdown"
)
```

#### 9. docx

**功能**：全面的文档创建、编辑和分析，支持修订、注释、格式保留和文本提取

**适用场景**：
- 创建新的Word文档
- 修改或编辑内容
- 处理修订（tracked changes）
- 添加注释
- 其他文档任务

**技能目录**：`.lingxi/skills/docx/`

**主要工具**：
- `ooxml/scripts/unpack.py` - 解包DOCX文件
- `ooxml/scripts/pack.py` - 打包DOCX文件
- `ooxml/scripts/validate.py` - 验证文档
- `scripts/document.py` - 文档处理脚本

**使用示例**：
```python
# 获取docx技能使用说明
docx()
```

#### 10. pdf

**功能**：全面的PDF操作工具包，支持提取文本和表格、创建新PDF、合并/拆分文档以及处理表单

**适用场景**：
- 填写PDF表单
- 程序化处理、生成或分析PDF文档
- 批量PDF操作

**技能目录**：`.lingxi/skills/pdf/`

**主要工具**：
- `scripts/convert_pdf_to_images.py` - 将PDF转换为图像
- `scripts/extract_form_field_info.py` - 提取表单字段信息
- `scripts/fill_fillable_fields.py` - 填写可填写字段
- `scripts/check_bounding_boxes.py` - 检查边界框

**使用示例**：
```python
# 获取pdf技能使用说明
pdf()
```

#### 11. xlsx

**功能**：全面的电子表格创建、编辑和分析，支持公式、格式化、数据分析和可视化

**适用场景**：
- 创建带有公式和格式的新电子表格
- 读取或分析数据
- 修改现有电子表格同时保留公式
- 电子表格中的数据分析和可视化
- 重新计算公式

**技能目录**：`.lingxi/skills/xlsx/`

**主要工具**：
- `recalc.py` - 重新计算Excel公式

**使用示例**：
```python
# 获取xlsx技能使用说明
xlsx()
```

## MCP技能的特点

### 1. 统一配置格式

所有技能使用`SKILL.md`文件的YAML frontmatter来定义技能信息：

```markdown
---
name: skill_name
description: "Skill description"
license: MIT
---

# Skill Documentation
...
```

### 2. 统一实现方式

所有技能都通过`main.py`文件实现，包含`execute`函数：

```python
def execute(parameters: Dict[str, Any]) -> str:
    """Execute skill"""
    # 技能实现
    return result
```

### 3. 自动加载

系统启动时自动扫描`.lingxi/skills/`目录：
- 检测包含`SKILL.md`文件的目录
- 解析YAML frontmatter获取技能信息
- 加载`main.py`模块
- 自动注册到技能注册表

### 4. 统一执行接口

所有技能通过统一的接口执行：

```python
result = builtin_skills.execute_skill(skill_name, parameters)
```

## 在ReAct模式中使用

### 示例1：创建和修改文件

```
用户: 请帮我创建一个Python脚本文件

思考: 用户需要创建Python脚本文件，我应该使用create_file技能
行动: create_file(file_path="/path/to/script.py", content="print('Hello, World!')")

观察: 文件创建成功: /path/to/script.py

思考: 文件已创建成功，任务完成
行动: finish(已成功创建Python脚本文件)
```

### 示例2：读取和搜索文件

```
用户: 请帮我查找文件中包含"import"的行

思考: 用户需要搜索文件内容，我应该使用read_file技能
行动: read_file(file_path="/path/to/script.py", search_text="import", context_lines=2)

观察: 文件内容（搜索 'import'，前后2行）:
...
import os
import sys
...

思考: 已找到包含"import"的行，任务完成
行动: finish(已找到文件中包含"import"的行)
```

### 示例3：执行命令

```
用户: 请帮我运行测试脚本

思考: 用户需要执行命令，我应该使用execute_command技能
行动: execute_command(command="python test.py")

观察: 命令执行成功:
...

思考: 测试脚本已成功执行，任务完成
行动: finish(测试脚本执行成功)
```

## 添加新的MCP技能

### 步骤1：创建技能目录

```bash
mkdir .lingxi/skills/MySkill
```

### 步骤2：创建SKILL.md文件

```markdown
---
name: my_skill
description: "My custom skill for specific tasks"
license: MIT
---

# My Skill

## Overview
This skill provides specific functionality for...

## Usage
...

## Dependencies
...
```

### 步骤3：创建main.py文件

```python
#!/usr/bin/env python3
"""My skill implementation"""

import logging
from typing import Dict, Any


def execute(parameters: Dict[str, Any]) -> str:
    """Execute skill

    Args:
        parameters: Parameters dictionary

    Returns:
        Execution result
    """
    logger = logging.getLogger(__name__)

    # 技能实现逻辑
    result = "..."

    return result
```

### 步骤4：重启系统

```bash
python -m lingxi
```

系统会自动检测并注册新的MCP技能。

## 测试

运行测试脚本验证MCP技能加载：

```bash
python test_all_mcp_skills.py
```

测试输出应该显示：
- ✓ 共注册 11 个技能
- ✓ 所有MCP技能已成功加载
- ✓ 所有技能执行测试通过

## 注意事项

1. **技能命名**：技能名称应使用下划线分隔的小写字母（如`create_file`）
2. **参数验证**：在`execute`函数中验证必需参数
3. **错误处理**：使用try-except捕获异常并返回友好的错误信息
4. **日志记录**：使用`logging`模块记录技能执行过程
5. **依赖管理**：在SKILL.md中列出所有依赖项
6. **编码规范**：遵循PEP8编码规范，使用类型注解

## 总结

MCP技能协议为灵犀个人智能助手提供了统一的技能管理框架：

- ✅ **统一格式**：所有技能使用相同的配置和实现格式
- ✅ **自动加载**：系统启动时自动扫描和注册技能
- ✅ **统一接口**：所有技能通过相同的接口执行
- ✅ **易于扩展**：添加新技能只需创建目录和文件
- ✅ **完整文档**：每个技能都包含详细的使用说明

只需按照MCP协议创建技能，即可轻松扩展灵犀的功能！
