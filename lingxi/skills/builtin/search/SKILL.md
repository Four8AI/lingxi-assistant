---
name: search
description: "Search for information on the internet. Use this skill when the user asks to search for information, look up facts, find resources, or research topics online."
version: "2.0.0"
trigger_conditions: "用户请求搜索信息、查找事实、研究主题、查询网络时触发"
execution_guidelines: "1. 验证query参数\n2. 支持多站点搜索（CSDN、百度百科、腾讯新闻）\n3. 可指定搜索站点和结果数量\n4. 返回格式化的搜索结果"
author: "Lingxi Team"
license: MIT
---

# Search Skill

## Overview

The search skill allows you to search for information on the internet and retrieve relevant results for the user. It supports multi-site search across CSDN, Baidu Baike, and Tencent News.

## Usage

### Parameters

- **query** (required): The search query string
- **sites** (optional): List of sites to search, e.g., ['csdn', 'baike', 'qqnews']. Default: search all supported sites
- **num_results** (optional): Number of results to return. Default: 10

### Supported Sites

- **csdn**: CSDN技术社区
- **baike**: 百度百科
- **qqnews**: 腾讯新闻

### Example

```python
# Search all sites
search(query="Python best practices")

# Search specific sites
search(query="人工智能", sites=['baike', 'csdn'])

# Search with custom result count
search(query="机器学习", num_results=5)
```

## Implementation Notes

This skill integrates with MultiSiteSearchAgent to provide real multi-site search functionality using Baidu search API. It:

1. Supports searching across multiple Chinese tech and information sites
2. Provides structured results with title, link, abstract, and source
3. Includes error handling for network issues and captcha detection
4. Implements rate limiting to avoid triggering anti-bot measures

## Dependencies

- `requests`: HTTP library for making search requests
- `beautifulsoup4`: HTML parsing library for extracting search results
- `MultiSiteSearchAgent`: Custom search agent class
