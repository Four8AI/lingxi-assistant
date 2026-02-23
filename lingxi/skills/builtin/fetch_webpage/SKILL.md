---
name: fetch_webpage
description: "Fetch webpage content and optionally save to a local file. Use this skill when the user needs to retrieve web content, download web pages, or save web content to a file."
version: "1.0.0"
trigger_conditions: "用户请求获取网页内容、下载网页、保存网页到文件时触发"
execution_guidelines: "1. 验证url参数\n2. 使用requests库获取网页内容\n3. 使用html2text将HTML转换为Markdown\n4. 如果提供save_path，保存到文件\n5. 返回网页内容或保存结果"
author: "Lingxi Team"
license: MIT
---

# Fetch Webpage Skill

## Overview

The fetch_webpage skill allows you to fetch webpage content and optionally save it to a local file. It converts HTML content to Markdown format for easier reading.

## Usage

### Parameters

- **url** (required): Webpage URL to fetch
- **timeout** (optional): Timeout in seconds (default: 30)
- **save_path** (optional): Absolute path to save the content (if not provided, content is not saved)

### Example

```python
# Fetch webpage content
fetch_webpage(url="https://example.com")

# Fetch and save webpage
fetch_webpage(
    url="https://example.com",
    save_path="/path/to/content.md"
)

# Fetch with custom timeout
fetch_webpage(
    url="https://example.com",
    timeout=60
)
```

## Implementation Notes

- Converts HTML to Markdown format
- Uses UTF-8 encoding
- Returns webpage content or saves to file if save_path is provided
- Handles HTTP errors gracefully

## Dependencies

- `requests`: For HTTP requests
- `html2text`: For HTML to Markdown conversion
