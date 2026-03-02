# lingxi/core/context.py
import threading
local_context = threading.local()

def set_ids(session_id: str, task_id: str, execution_id: str,task:str=None):
    """设置会话ID、任务ID和执行ID"""
    local_context.session_id = session_id
    local_context.task_id = task_id
    local_context.execution_id = execution_id
    local_context.task = task

def clear_ids():
    """清除会话ID、任务ID和执行ID"""
    if hasattr(local_context, 'session_id'):
        del local_context.session_id
    if hasattr(local_context, 'task_id'):
        del local_context.task_id
    if hasattr(local_context, 'execution_id'):
        del local_context.execution_id
    if hasattr(local_context, 'task'):
        del local_context.task