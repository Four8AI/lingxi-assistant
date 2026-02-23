#!/usr/bin/env python3
"""Create file skill implementation"""

import logging
import os
from typing import Dict, Any


def execute(parameters: Dict[str, Any]) -> str:
    """Execute create file

    Args:
        parameters: Parameters dictionary
            - file_path: Absolute path to the file (required)
            - content: Content to write to the file (required)

    Returns:
        Creation result
    """
    logger = logging.getLogger(__name__)

    file_path = parameters.get("file_path")
    content = parameters.get("content", "")

    if not file_path:
        return "错误: 缺少文件路径"

    logger.info(f"创建文件: {file_path}")

    try:
        dir_path = os.path.dirname(file_path)
        if dir_path and not os.path.exists(dir_path):
            os.makedirs(dir_path, exist_ok=True)
            logger.info(f"创建目录: {dir_path}")

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return f"文件创建成功: {file_path}\n文件大小: {len(content)} 字节"
    except Exception as e:
        logger.error(f"创建文件失败: {e}")
        return f"创建文件失败: {str(e)}"
