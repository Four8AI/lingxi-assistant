---
name: create_file
description: "Create a new file with specified content. Use this skill when the user needs to create a new file, write content to a file, or save text to a file."
version: "1.0.0"
trigger_conditions: "用户请求创建文件、保存内容到文件、写入文本到文件时触发"
execution_guidelines: "1. 验证file_path参数是否为绝对路径\n2. 自动创建父目录（如果不存在）\n3. 使用UTF-8编码写入文件\n4. 返回创建成功消息和文件大小"
author: "Lingxi Team"
license: MIT
---

# Create File Skill

## Overview

The create_file skill allows you to create new files with specified content. It automatically creates parent directories if they don't exist.

## Usage

### Parameters

- **file_path** (required): Absolute path to the file to create
- **content** (required): Content to write to the file

### Example

```python
# Create a new file
create_file(
    file_path="/path/to/file.txt",
    content="Hello, World!"
)
```

## Implementation Notes

- Automatically creates parent directories if they don't exist
- Overwrites existing files
- Uses UTF-8 encoding

## Dependencies

None
