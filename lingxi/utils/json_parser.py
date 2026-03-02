import re
import json
from typing import Optional, Generator, Dict, Any


def extract_partial_json_field(json_string: str, field_name: str, nested_path: str = None) -> Optional[str]:
    """
    尝试从不完整的JSON字符串中提取指定字段的当前值

    Args:
        json_string: 可能不完整的JSON字符串
        field_name: 要提取的字段名
        nested_path: 嵌套路径，如 "next_action" 表示从 next_action 对象中提取字段

    Returns:
        提取的字段值，如果无法提取则返回None
    """
    search_string = json_string
    
    if nested_path:
        nested_pattern = rf'"{nested_path}"\:\s*\{{'
        nested_match = re.search(nested_pattern, json_string)
        if nested_match:
            start_idx = nested_match.end() - 1
            brace_count = 1
            end_idx = start_idx + 1
            while end_idx < len(json_string) and brace_count > 0:
                if json_string[end_idx] == '{':
                    brace_count += 1
                elif json_string[end_idx] == '}':
                    brace_count -= 1
                end_idx += 1
            search_string = json_string[start_idx:end_idx]
        else:
            nested_start_pattern = rf'"{nested_path}"\:\s*\{{'
            nested_start_match = re.search(nested_start_pattern, json_string)
            if nested_start_match:
                search_string = json_string[nested_start_match.start():]
    
    pattern = rf'"{field_name}"\:\s"(.*?)"'
    match = re.search(pattern, search_string, re.DOTALL)
    
    if match:
        return match.group(1)
    
    start_pattern = rf'"{field_name}"\:\s"'
    start_match = re.search(start_pattern, search_string)
    if start_match:
        start_idx = start_match.end()
        partial_value = search_string[start_idx:]
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
