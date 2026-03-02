import logging
import sqlite3
import json
import time
from typing import Dict, List, Optional, Any
from datetime import datetime
from dataclasses import dataclass, field

from pydantic_core.core_schema import nullable_schema
from lingxi.core.classifier import TaskClassifier
from lingxi.core.llm_client import LLMClient
from lingxi.context.manager import ContextManager, ContentType


@dataclass
class Step:
    """任务步骤实体类（使用dataclass）"""
    step_id: str
    step_type: str
    description: str = ""
    status: str = "completed"
    thought: str = ""
    result: str = ""
    skill_call: str = ""
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()        


@dataclass
class Task:
    """任务实体类（使用dataclass）"""
    task_id: str
    task_type: str
    plan: str = "[]"
    steps: List[Step] = field(default_factory=list)
    user_input: str = ""
    result: str = ""
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()    


@dataclass
class Session:
    """会话实体类（使用dataclass）"""
    session_id: str
    user_name: str = "default"
    title: str = "新会话"
    checkpoint_json: str = "{}"
    token_count: int = 0
    task_list: Dict[str, Task] = field(default_factory=dict)
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()
    
    def get_info(self):
        return f"{self.session_id}，{self.user_name}，{self.created_at}，{self.updated_at}"


class SessionManager:
    """会话管理器，实现SQLite存储、检查点功能和上下文管理"""

    def __init__(self, config: Dict[str, Any], session_id: str = "default"):
        """初始化会话管理器

        Args:
            config: 系统配置
            session_id: 会话ID
        """
        self.config = config
        self.session_id = session_id
        self.db_path = config.get("session", {}).get("db_path", "data/assistant.db")
        self.max_history_turns = config.get("session", {}).get("max_history_turns", 50)
        self.memory_cache = {}

        self._init_db()

        self.context_manager = ContextManager(config, session_id)

        self.logger = logging.getLogger(__name__)
        self.logger.debug(f"初始化会话管理器，数据库: {self.db_path}")

    def _init_db(self):
        """初始化SQLite数据库"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                user_name TEXT DEFAULT 'default',
                title TEXT DEFAULT '新会话',
                checkpoint_json TEXT,
                task_list TEXT,
                token_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        conn.close()

    def get_history(self, session_id: str, max_turns: int = None) -> List[Dict[str, Any]]:
        """获取会话历史

        Args:
            session_id: 会话ID
            max_turns: 最大返回轮次

        Returns:
            会话历史记录
        """
        # 确保会话在缓存中
        if session_id not in self.memory_cache:
            self.memory_cache[session_id] = Session(session_id=session_id)

        # 从数据库加载 task_list（如果缓存中没有）
        if not hasattr(self.memory_cache[session_id], 'task_list') or not self.memory_cache[session_id].task_list:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT task_list FROM sessions WHERE session_id = ?", (session_id,))
            row = cursor.fetchone()
            conn.close()

            task_list = {}
            if row and row[0]:
                try:
                    task_list = json.loads(row[0])
                    if task_list and not isinstance(task_list, dict):
                        task_list = {}
                except json.JSONDecodeError:
                    task_list = {}

            self.memory_cache[session_id].task_list = task_list

        # 从 task_list 组装 history
        task_list = self.memory_cache[session_id].task_list

        # 遍历任务，按时间顺序排序
        sorted_tasks = sorted(task_list.values(), key=lambda t: t.get('created_at', 0) if isinstance(t, dict) else getattr(t, 'created_at', datetime.now()).timestamp())

    

        # 将组装好的历史记录转换为 JSON 字符串并更新到缓存

        return sorted_tasks

    def get_task(self, session_id: str, task_id: str) -> Optional[Task]:
        """获取任务

        Args:
            session_id: 会话ID
            task_id: 任务ID

        Returns:
            任务实体类
        """
        # 确保会话在缓存中且类型正确
        if session_id not in self.memory_cache or not hasattr(self.memory_cache[session_id], 'task_list'):
            self.memory_cache[session_id] = Session(session_id=session_id)
        
        if task_id in self.memory_cache[session_id].task_list:
            return self.memory_cache[session_id].task_list.get(task_id)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT task_list FROM sessions WHERE session_id = ?", (session_id,))
        row = cursor.fetchone()
        conn.close()

        task_list = {}
        if row and row[0]:
            try:
                task_list = json.loads(row[0])
                if task_list and not isinstance(task_list, dict):
                    task_list = {}
            except json.JSONDecodeError:
                task_list = {}
        
        self.memory_cache[session_id].task_list = task_list
        
        return task_list.get(task_id)
        
    def add_step(self, session_id: str, task_id: str, step_index: int, result: str, status: str = None, thought: str = None, action: str = None, action_input: str = None, description: str = None):
        """添加任务步骤

        Args:
            session_id: 会话ID
            task_id: 任务ID
            step_index: 步骤索引
            result: 步骤结果（字符串格式）
            thought: 思考过程
            action: 执行行动
            action_input: 行动输入
        """
        # 确保会话在缓存中
        if session_id not in self.memory_cache or not hasattr(self.memory_cache[session_id], 'task_list'):
            self.memory_cache[session_id] = Session(session_id=session_id)
        
        # 确保任务存在
        if task_id not in self.memory_cache[session_id].task_list:
            self.memory_cache[session_id].task_list[task_id] = {
                "task_id": task_id,
                "task_type": "unknown",
                "plan": "[]",
                "steps": [],
                "user_input": "",
                "result": "",
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            self.logger.debug(f"创建新任务，session_id: {session_id}, task_id: {task_id}")
        
        # 获取任务信息
        task_info = self.memory_cache[session_id].task_list.get(task_id)
        
        # 确保 steps 字段存在
        if "steps" not in task_info:
            task_info["steps"] = []
        
        # 扩展列表长度以容纳新步骤
        while len(task_info["steps"]) <= step_index:
            task_info["steps"].append({})
        
        # 构建步骤信息（使用字典格式，避免创建Step对象时的字段缺失问题）
        step_info = {
            "step_id": str(step_index),
            "step_type": action or "unknown",
            "thought": thought or "",
            "result": result,
            "status": status or "completed",
            "skill_call": action or "",
            "skill_input": action_input or "",
            "description": description or "",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # 更新步骤信息
        task_info["steps"][step_index] = step_info
        
        # 更新内存中的任务列表
        self.memory_cache[session_id].task_list[task_id] = task_info
        
        # 保存到数据库
        self._save_task_list_to_db(session_id, self.memory_cache[session_id].task_list)
        
        self.logger.debug(f"步骤已添加，session_id: {session_id}, task_id: {task_id}, step_index: {step_index}")

    def set_task_result(self, session_id: str, task_id: str, result: str = None ,user_input: str = None):
        """设置任务结果

        Args:
            session_id: 会话ID
            task_id: 任务ID
            task_info: 任务信息（字典格式）
        """
        # 确保会话在缓存中
        if session_id not in self.memory_cache or not hasattr(self.memory_cache[session_id], 'task_list'):
            self.memory_cache[session_id] = Session(session_id=session_id)
        
        # 确保任务存在
        if task_id not in self.memory_cache[session_id].task_list:
            self.memory_cache[session_id].task_list[task_id] = {
                "task_id": task_id,
                "task_type": "unknown",
                "plan": "[]",
                "steps": [],
                "user_input": user_input or "",
                "result": result or "",
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            self.logger.debug(f"创建新任务，session_id: {session_id}, task_id: {task_id}")
        else:
            # 获取任务信息
            task_info = self.memory_cache[session_id].task_list.get(task_id)
            
            # 更新任务结果
            if result is not None:
                task_info["result"] = result
            if user_input is not None:
                task_info["user_input"] = user_input
            
            task_info["updated_at"] = datetime.now().isoformat()
        
        # 保存到数据库
        self._save_task_list_to_db(session_id, self.memory_cache[session_id].task_list)
        self.logger.debug(f"任务结果已保存，session_id: {session_id}, task_id: {task_id}")
    
    def save_plan(self, session_id: str, task_id: str, plan: str):
        """保存任务计划

        Args:
            session_id: 会话ID
            task_id: 任务ID
            plan: 任务计划（JSON字符串）
        """
        # 确保会话在缓存中
        if session_id not in self.memory_cache:
            self.memory_cache[session_id] = Session(session_id=session_id)
        
        # 确保任务存在
        if task_id not in self.memory_cache[session_id].task_list:
            self.memory_cache[session_id].task_list[task_id] = {
                "task_id": task_id,
                "task_type": "unknown",
                "plan": "[]",
                "steps": [],
                "user_input": "",
                "result": "",
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
        
        # 更新任务计划
        self.memory_cache[session_id].task_list[task_id]["plan"] = plan
        self.memory_cache[session_id].task_list[task_id]["updated_at"] = datetime.now().isoformat()
        
        # 保存到数据库
        self._save_task_list_to_db(session_id, self.memory_cache[session_id].task_list)
        self.logger.debug(f"任务计划已保存，session_id: {session_id}, task_id: {task_id}")


    def _save_to_db(self, session_id: str, history: List[Dict[str, Any]]):
        """保存会话历史到数据库

        Args:
            session_id: 会话ID
            history: 会话历史
        """
        # 注意：由于我们现在从 task_list 组装历史记录，
        # 这个方法主要用于向后兼容，实际保存应该通过 _save_task_list_to_db
        pass

    def _save_task_list_to_db(self, session_id: str, task_list: Dict[str, Any]):
        """保存任务列表到数据库

        Args:
            session_id: 会话ID
            task_list: 任务列表
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO sessions (session_id, user_name, title, task_list, token_count, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (
            session_id,
            self.memory_cache[session_id].user_name if session_id in self.memory_cache else "default",
            self.memory_cache[session_id].title if session_id in self.memory_cache else "新会话",
            json.dumps(task_list, ensure_ascii=False, default=str),
            self.memory_cache[session_id].token_count if session_id in self.memory_cache else 0
        ))
        conn.commit()
        conn.close()

    def save_checkpoint(self, session_id: str, state: Dict[str, Any]):
        """保存执行检查点

        Args:
            session_id: 会话ID
            state: 检查点状态
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO sessions (session_id, checkpoint_json, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
        """, (session_id, json.dumps(state, ensure_ascii=False)))
        conn.commit()
        conn.close()

    def restore_checkpoint(self, session_id: str) -> Optional[Dict[str, Any]]:
        """恢复检查点

        Args:
            session_id: 会话ID

        Returns:
            检查点状态，如果不存在则返回None
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT checkpoint_json FROM sessions WHERE session_id = ?", (session_id,))
        row = cursor.fetchone()
        conn.close()

        if row and row[0]:
            return json.loads(row[0])
        return None

    def clear_session(self, session_id: str):
        """清空会话

        Args:
            session_id: 会话ID
        """
        if session_id in self.memory_cache:
            del self.memory_cache[session_id]

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sessions WHERE session_id = ?", (session_id,))
        conn.commit()
        conn.close()

    def clear_session_history(self, session_id: str):
        """清除会话历史记录，但保留会话本身

        Args:
            session_id: 会话ID
        """
        if session_id in self.memory_cache:
            # 只清除任务列表，不覆盖整个Session对象
            self.memory_cache[session_id].task_list = {}

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE sessions SET task_list = '{}', updated_at = CURRENT_TIMESTAMP
            WHERE session_id = ?
        """, (session_id,))
        conn.commit()
        conn.close()

    def get_checkpoint_status(self, session_id: str) -> Dict[str, Any]:
        """获取检查点状态信息

        Args:
            session_id: 会话ID

        Returns:
            检查点状态信息
        """
        checkpoint = self.restore_checkpoint(session_id)
        if not checkpoint:
            return {"has_checkpoint": False}

        return {
            "has_checkpoint": True,
            "task": checkpoint.get("task"),
            "current_step": checkpoint.get("current_step_idx", 0),
            "total_steps": len(checkpoint.get("plan", [])),
            "execution_status": checkpoint.get("execution_status"),
            "replan_count": checkpoint.get("replan_count", 0),
            "timestamp": checkpoint.get("timestamp"),
            "error_info": checkpoint.get("error_info")
        }

    def clear_checkpoint(self, session_id: str):
        """清除指定会话的检查点

        Args:
            session_id: 会话ID
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE sessions SET checkpoint_json = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE session_id = ?
        """, (session_id,))
        conn.commit()
        conn.close()

    def cleanup_expired_checkpoints(self, ttl_hours: int = 24) -> int:
        """清理过期的检查点

        Args:
            ttl_hours: 生存时间（小时）

        Returns:
            清理的检查点数量
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("SELECT session_id, checkpoint_json, updated_at FROM sessions")
        sessions = cursor.fetchall()

        current_time = time.time()
        ttl_seconds = ttl_hours * 3600
        cleaned_count = 0

        for session_id, checkpoint_json, updated_at in sessions:
            if checkpoint_json:
                try:
                    checkpoint = json.loads(checkpoint_json)
                    checkpoint_time = checkpoint.get("timestamp", updated_at)

                    if current_time - checkpoint_time > ttl_seconds:
                        cursor.execute("""
                            UPDATE sessions SET checkpoint_json = NULL, updated_at = CURRENT_TIMESTAMP
                            WHERE session_id = ?
                        """, (session_id,))
                        cleaned_count += 1
                        self.logger.debug(f"清除过期检查点：{session_id}")
                except Exception as e:
                    self.logger.error(f"处理检查点{session_id}时出错：{e}")

        conn.commit()
        conn.close()

        if cleaned_count > 0:
            self.logger.debug(f"清理了{cleaned_count}个过期检查点")

        return cleaned_count

    def list_active_checkpoints(self) -> List[Dict[str, Any]]:
        """列出所有活跃的检查点

        Returns:
            检查点列表
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT session_id, checkpoint_json, updated_at
            FROM sessions
            WHERE checkpoint_json IS NOT NULL
        """)
        rows = cursor.fetchall()
        conn.close()

        checkpoints = []
        for session_id, checkpoint_json, updated_at in rows:
            try:
                checkpoint = json.loads(checkpoint_json)
                checkpoints.append({
                    "session_id": session_id,
                    "task": checkpoint.get("task"),
                    "current_step": checkpoint.get("current_step_idx", 0),
                    "total_steps": len(checkpoint.get("plan", [])),
                    "execution_status": checkpoint.get("execution_status"),
                    "updated_at": updated_at
                })
            except Exception as e:
                self.logger.error(f"解析检查点{session_id}时出错：{e}")

        return checkpoints

    def process_input(self, user_input: str, session_id: str = "default") -> str:
        """处理用户输入（简化版，仅用于测试）

        Args:
            user_input: 用户输入
            session_id: 会话ID

        Returns:
            响应
        """
        
        classifier = TaskClassifier(self.config)
        history = self.get_history(session_id)
        task_info = classifier.classify(user_input, history)

        response = f"任务级别: {task_info['level']}\n置信度: {task_info['confidence']}\n理由: {task_info['reason']}"

        return response

    def get_context_for_llm(self) -> List[Dict[str, str]]:
        """获取发送给LLM的上下文

        Returns:
            上下文列表
        """
        return self.context_manager.get_context_for_llm()

    def get_context_stats(self) -> Dict[str, Any]:
        """获取上下文统计信息

        Returns:
            统计信息
        """
        return self.context_manager.get_stats()

    def set_current_task(self, task_id: str):
        """设置当前任务ID

        Args:
            task_id: 任务ID
        """
        self.context_manager.set_current_task(task_id)

    def compress_context(self, strategy: str = None) -> Dict[str, Any]:
        """手动触发上下文压缩

        Args:
            strategy: 压缩策略

        Returns:
            压缩统计信息
        """
        return self.context_manager.compress(strategy)

    def retrieve_relevant_history(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """检索相关历史记忆

        Args:
            query: 查询文本
            top_k: 返回数量

        Returns:
            相关历史记录
        """
        return self.context_manager.retrieve_relevant_history(query, top_k)

    def list_all_sessions(self) -> List[Dict[str, Any]]:
        """列出所有会话

        Returns:
            会话列表，包含session_id、创建时间、更新时间、消息数量等信息
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT session_id, title, task_list, created_at, updated_at
            FROM sessions
            ORDER BY updated_at DESC
        """)
        rows = cursor.fetchall()
        conn.close()

        sessions = []
        for session_id, title, task_list_json, created_at, updated_at in rows:
            try:
                # 从 task_list 组装历史记录以获取消息数量
                task_list = json.loads(task_list_json) if task_list_json else {}
                message_count = 0
                first_message = ""
                
                # 遍历任务计算消息数量并获取第一条用户消息
                for task in task_list.values():
                    if isinstance(task, dict):
                        if task.get('user_input'):
                            message_count += 1
                            if not first_message:
                                first_message = task.get('user_input', '')[:50]
                        if task.get('result'):
                            message_count += 1
                        if task.get('steps'):
                            message_count += len(task.get('steps', [])) * 2  # 每个步骤包含思考和结果

                sessions.append({
                    "session_id": session_id,
                    "title": title,
                    "message_count": message_count,
                    "first_message": first_message,
                    "created_at": created_at,
                    "updated_at": updated_at,
                    "has_checkpoint": False
                })
            except Exception as e:
                self.logger.error(f"解析会话{session_id}时出错：{e}")

        return sessions
    
    

    def get_session_info(self, session_id: str) -> Optional[Dict[str, Any]]:
        """获取会话详细信息

        Args:
            session_id: 会话ID

        Returns:
            会话信息
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT session_id, title, token_count, task_list, checkpoint_json, created_at, updated_at
            FROM sessions
            WHERE session_id = ?
        """, (session_id,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            return None

        session_id, title, token_count, task_list_json, checkpoint_json, created_at, updated_at = row
        
        # 从 task_list 组装历史记录
        task_list = json.loads(task_list_json) if task_list_json else {}
        
        # 遍历任务，按时间顺序排序
        sorted_tasks = sorted(task_list.values(), key=lambda t: t.get('created_at', 0) if isinstance(t, dict) else getattr(t, 'created_at', datetime.now()).timestamp())


        return {
            "session_id": session_id,
            "title": title,
            "task_count": len(sorted_tasks),
            "task_list": sorted_tasks,
            "token_count": token_count,
            "created_at": created_at,
            "updated_at": updated_at,
            "has_checkpoint": checkpoint_json is not None
        }

    def rename_session(self, session_id: str, new_title: str) -> bool:
        """重命名会话

        Args:
            session_id: 会话ID
            new_title: 新标题

        Returns:
            是否成功
        """
        # 确保会话在缓存中
        if session_id not in self.memory_cache:
            self.memory_cache[session_id] = Session(session_id=session_id)

        # 更新缓存中的标题
        self.memory_cache[session_id].title = new_title

        # 更新数据库中的标题
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE sessions SET title = ?, updated_at = CURRENT_TIMESTAMP
            WHERE session_id = ?
        """, (new_title, session_id))
        conn.commit()
        conn.close()

        return True

    def delete_session(self, session_id: str) -> bool:
        """删除会话

        Args:
            session_id: 会话ID

        Returns:
            是否成功
        """
        if session_id in self.memory_cache:
            del self.memory_cache[session_id]

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sessions WHERE session_id = ?", (session_id,))
        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()

        return deleted

    def create_session(self, user_name: str = "default") -> str:
        """创建新会话

        Args:
            user_name: 用户名

        Returns:
            会话ID
        """
        import uuid
        session_id = f"session_{uuid.uuid4().hex[:8]}"
        
        # 确保user_name不是None
        user_name = user_name if user_name is not None else "default"
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO sessions (session_id, user_name, title, task_list, token_count)
            VALUES (?, ?, ?, ?, ?)
        """, (session_id, user_name, "新会话", json.dumps({}), 0))
        conn.commit()
        conn.close()
        
        self.memory_cache[session_id] = Session(session_id=session_id, user_name=user_name, title="新会话")
        return session_id
