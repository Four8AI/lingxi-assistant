#!/usr/bin/env python3
"""Modify file skill implementation"""

import logging
from typing import Dict, Any


def execute(parameters: Dict[str, Any]) -> str:
    """Execute modify file

    Args:
        parameters: Parameters dictionary
            - file_path: Absolute path to the file (required)
            - old_content: Content to replace (required)
            - new_content: New content to replace with (required)

    Returns:
        Modification result
    """
    logger = logging.getLogger(__name__)

    file_path = parameters.get("file_path")
    old_content = parameters.get("old_content")
    new_content = parameters.get("new_content")

    if not file_path:
        return "错误: 缺少文件路径"
    if old_content is None:
        return "错误: 缺少要替换的旧内容"
    if new_content is None:
        return "错误: 缺少新内容"

    logger.info(f"修改文件: {file_path}")

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            file_content = f.read()

        if old_content not in file_content:
            return f"错误: 文件中未找到要替换的内容"

        new_file_content = file_content.replace(old_content, new_content)
        replacement_count = file_content.count(old_content)

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_file_content)

        return f"文件修改成功: {file_path}\n替换次数: {replacement_count}"
    except FileNotFoundError:
        return f"错误: 文件不存在 - {file_path}"
    except Exception as e:
        logger.error(f"修改文件失败: {e}")
        return f"修改文件失败: {str(e)}"
