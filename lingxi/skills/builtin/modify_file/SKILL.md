---
name: modify_file
description: "Modify file content by replacing old content with new content. Use this skill when the user needs to update, edit, or replace content in an existing file."
version: "1.0.0"
trigger_conditions: "用户请求修改文件、更新文件内容、替换文件中的文本时触发"
execution_guidelines: "1. 验证file_path参数是否为绝对路径\n2. 验证old_content和new_content参数\n3. 检查文件是否存在\n4. 替换所有匹配的文本\n5. 返回替换次数"
author: "Lingxi Team"
license: MIT
---

# Modify File Skill

## Overview

The modify_file skill allows you to modify file content by replacing specific text with new text. It supports partial replacement and reports the number of replacements made.

## Usage

### Parameters

- **file_path** (required): Absolute path to the file to modify
- **old_content** (required): Content to replace
- **new_content** (required): New content to replace with

### Example

```python
# Modify file content
modify_file(
    file_path="/path/to/file.txt",
    old_content="Hello",
    new_content="Hi"
)
```

## Implementation Notes

- Replaces all occurrences of old_content with new_content
- Returns the number of replacements made
- Uses UTF-8 encoding
- Fails if the file doesn't exist or old_content is not found

## Dependencies

None
