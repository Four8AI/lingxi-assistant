#!/usr/bin/env python3
"""Delete file skill implementation"""

import logging
import os
from typing import Dict, Any


def execute(parameters: Dict[str, Any]) -> str:
    """Execute delete file

    Args:
        parameters: Parameters dictionary
            - file_path: Absolute path to the file (required)

    Returns:
        Deletion result
    """
    logger = logging.getLogger(__name__)

    file_path = parameters.get("file_path")

    if not file_path:
        return "错误: 缺少文件路径"

    logger.info(f"删除文件: {file_path}")

    try:
        if not os.path.exists(file_path):
            return f"错误: 文件不存在 - {file_path}"

        os.remove(file_path)
        return f"文件删除成功: {file_path}"
    except Exception as e:
        logger.error(f"删除文件失败: {e}")
        return f"删除文件失败: {str(e)}"
