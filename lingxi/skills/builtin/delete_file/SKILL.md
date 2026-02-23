---
name: delete_file
description: "Delete a file. Use this skill when the user needs to remove or delete a file from the filesystem."
version: "1.0.0"
trigger_conditions: "用户请求删除文件、移除文件时触发"
execution_guidelines: "1. 验证file_path参数是否为绝对路径\n2. 检查文件是否存在\n3. 执行删除操作\n4. 返回删除结果"
author: "Lingxi Team"
license: MIT
---

# Delete File Skill

## Overview

The delete_file skill allows you to delete files from the filesystem. Use with caution as this operation cannot be undone.

## Usage

### Parameters

- **file_path** (required): Absolute path to the file to delete

### Example

```python
# Delete a file
delete_file(file_path="/path/to/file.txt")
```

## Implementation Notes

- Permanently deletes the file
- Cannot be undone
- Returns success message or error details

## Dependencies

None
