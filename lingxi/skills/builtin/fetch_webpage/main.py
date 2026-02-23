#!/usr/bin/env python3
"""Fetch webpage skill implementation"""

import logging
import os
from typing import Dict, Any


def execute(parameters: Dict[str, Any]) -> str:
    """Execute fetch webpage

    Args:
        parameters: Parameters dictionary
            - url: Webpage URL (required)
            - timeout: Timeout in seconds (optional, default: 30)
            - save_path: Absolute path to save content (optional)

    Returns:
        Webpage content or save result
    """
    logger = logging.getLogger(__name__)

    url = parameters.get("url")
    timeout = parameters.get("timeout", 30)
    save_path = parameters.get("save_path")

    if not url:
        return "错误: 缺少URL"

    logger.info(f"获取网页: {url}")

    try:
        import requests
        import html2text

        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
        response.encoding = response.apparent_encoding

        h = html2text.HTML2Text()
        h.ignore_links = False
        h.ignore_images = False
        h.body_width = 0
        content = h.handle(response.text)

        if save_path:
            dir_path = os.path.dirname(save_path)
            if dir_path and not os.path.exists(dir_path):
                os.makedirs(dir_path, exist_ok=True)

            with open(save_path, 'w', encoding='utf-8') as f:
                f.write(content)

            return f"网页内容已保存到: {save_path}\n内容长度: {len(content)} 字符"
        else:
            return f"网页内容:\n\n{content}"

    except requests.exceptions.RequestException as e:
        logger.error(f"获取网页失败: {e}")
        return f"获取网页失败: {str(e)}"
    except Exception as e:
        logger.error(f"处理网页内容失败: {e}")
        return f"处理网页内容失败: {str(e)}"
