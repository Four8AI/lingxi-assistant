---
name: read_file
description: "Read text-based file content with optional search functionality. Use this skill when the user needs to read plain text files (.txt, .py, .js, .md, .json, .yaml, .csv, etc.) or search for specific text within them. Note: This skill CANNOT read binary formats or other specialized file formats"
version: "1.0.0"
trigger_conditions: "用户请求读取文件、查看文件内容、搜索文件中的文本时触发"
execution_guidelines: "1. 验证file_path参数是否为绝对路径\n2. 如果提供search_text，执行搜索并返回上下文\n3. 如果未提供search_text，返回整个文件内容\n4. 使用UTF-8编码读取文件"
author: "Lingxi Team"
license: MIT
---

# Read File Skill

## Overview

The read_file skill allows you to read file contents with optional text search functionality. When searching, it returns the matching text along with specified context lines before and after.

## Usage

### Parameters

- **file_path** (required): Absolute path to the file to read
- **search_text** (optional): Text to search for in the file
- **context_lines** (optional): Number of lines to show before and after search results (default: 5)

### Example

```python
# Read entire file
read_file(file_path="/path/to/file.txt")

# Search for specific text
read_file(
    file_path="/path/to/file.txt",
    search_text="Python",
    context_lines=3
)
```

## Implementation Notes

- Uses UTF-8 encoding
- When searching, shows context lines before and after matches
- Returns all matches if search_text is provided
- Returns entire file content if search_text is not provided

## Dependencies

None
