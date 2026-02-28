import re
import json
from typing import Optional, Generator, Dict, Any


def extract_partial_json_field(json_string: str, field_name: str) -> Optional[str]:
    """
    尝试从不完整的JSON字符串中提取指定字段的当前值

    Args:
        json_string: 可能不完整的JSON字符串
        field_name: 要提取的字段名

    Returns:
        提取的字段值，如果无法提取则返回None
    """
    # 简单匹配 "field": "value" 或 "field": { ... }
    # 针对字段是字符串的情况
    pattern = f'"{field_name}"\:\s"(.*?)"'
    match = re.search(pattern, json_string, re.DOTALL)
    
    if match:
        return match.group(1)
    
    # 如果字段值还没闭合（流式中常见），尝试返回已知的部分
    start_pattern = f'"{field_name}"\:\s"'
    start_match = re.search(start_pattern, json_string)
    if start_match:
        start_idx = start_match.end()
        # 截取从字段值开始到字符串末尾的内容
        partial_value = json_string[start_idx:]
        # 去掉末尾可能出现的非字符（如逗号、括号的前兆）
        if partial_value.endswith('"'):
             return partial_value[:-1]
        return partial_value
    
    return None


def stream_with_thought_only(stream_response: Any) -> Generator[Dict[str, Any], None, None]:
    """
    处理流式响应，只提取并返回thought字段的内容

    Args:
        stream_response: 原始的流式响应对象

    Yields:
        包含thought字段内容的字典
    """
    full_response = ""
    
    for chunk in stream_response:
        if hasattr(chunk, 'choices') and chunk.choices:
            delta = chunk.choices[0].delta
            if hasattr(delta, 'content') and delta.content:
                full_response += delta.content
                
                # 尝试提取thought字段
                thought = extract_partial_json_field(full_response, "thought")
                
                if thought is not None:
                    yield {
                        "type": "thought",
                        "content": thought,
                        "is_partial": True
                    }
    
    # 最后返回完整的JSON
    try:
        final_json = json.loads(full_response)
        yield {
            "type": "complete",
            "content": final_json,
            "is_partial": False
        }
    except json.JSONDecodeError:
        pass
