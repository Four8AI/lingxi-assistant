#!/usr/bin/env python3
"""Read file skill implementation"""

import logging
from typing import Dict, Any


def execute(parameters: Dict[str, Any]) -> str:
    """Execute read file

    Args:
        parameters: Parameters dictionary
            - file_path: Absolute path to the file (required)
            - search_text: Text to search for (optional)
            - context_lines: Number of context lines (optional, default: 5)

    Returns:
        File content or search results
    """
    logger = logging.getLogger(__name__)

    file_path = parameters.get("file_path")
    search_text = parameters.get("search_text")
    context_lines = parameters.get("context_lines", 5)

    if not file_path:
        return "错误: 缺少文件路径"

    logger.info(f"读取文件: {file_path}")

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        if not search_text:
            return f"文件内容 ({len(lines)} 行):\n\n{''.join(lines)}"

        search_text_lower = search_text.lower()
        results = []

        for i, line in enumerate(lines, 1):
            if search_text_lower in line.lower():
                start = max(0, i - context_lines - 1)
                end = min(len(lines), i + context_lines)
                context = ''.join(lines[start:end])
                results.append(f"--- 第 {i} 行 ---\n{context}")

        if not results:
            return f"未找到搜索文本: {search_text}"

        return f"搜索结果 (共 {len(results)} 处匹配):\n\n" + "\n\n".join(results)

    except FileNotFoundError:
        return f"错误: 文件不存在 - {file_path}"
    except Exception as e:
        logger.error(f"读取文件失败: {e}")
        return f"读取文件失败: {str(e)}"
