#!/usr/bin/env python3
"""
测试 SessionStoreSubscriber 和 SessionManager 的集成
"""

import sys
import os

# 添加项目路径到 sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lingxi.utils.config import load_config
from lingxi.core.session import SessionManager
from lingxi.core.event import global_event_publisher

# 删除旧的数据库文件
db_path = "data/assistant.db"
if os.path.exists(db_path):
    os.remove(db_path)
    print(f"已删除旧数据库文件: {db_path}")

# 加载配置
config = load_config()

# 初始化会话管理器
session_manager = SessionManager(config, session_id="test_session")

# 初始化会话存储订阅者
from lingxi.core.event.SessionStore_subscriber import SessionStoreSubscriber
subscriber = SessionStoreSubscriber(session_manager)

print("=== 测试 SessionStoreSubscriber ===")
print(f"会话管理器: {session_manager}")
print(f"订阅者: {subscriber}")

# 测试1：发布 plan_final 事件
print("\n测试1：发布 plan_final 事件")
try:
    global_event_publisher.publish(
        'plan_final',
        session_id="test_session",
        task_id="task_001",
        plan=[
            {"step": 1, "description": "读取Excel文件"},
            {"step": 2, "description": "排序数据"}
        ]
    )
    print("✅ plan_final 事件发布成功")
    
    # 检查任务是否保存
    task = session_manager.get_task("test_session", "task_001")
    if task:
        print(f"✅ 任务已保存，plan: {task.get('plan', 'N/A')}")
    else:
        print("❌ 任务未保存")
except Exception as e:
    print(f"❌ plan_final 事件发布失败: {e}")

# 测试2：发布 step_end 事件
print("\n测试2：发布 step_end 事件")
try:
    global_event_publisher.publish(
        'step_end',
        session_id="test_session",
        task_id="task_001",
        step_index=0,
        result="成功读取Excel文件，包含5行数据",
        thought="用户要求读取Excel文件，我需要使用xlsx技能",
        action="xlsx",
        action_input='{"operation": "read", "file_path": "data.xlsx"}'
    )
    print("✅ step_end 事件发布成功")
    
    # 检查步骤是否保存
    task = session_manager.get_task("test_session", "task_001")
    if task and task.get("steps"):
        steps = task["steps"]
        if len(steps) > 0:
            step = steps[0]
            print(f"✅ 步骤已保存，result: {step.get('result', 'N/A')}")
            print(f"   thought: {step.get('thought', 'N/A')}")
            print(f"   action: {step.get('action', 'N/A')}")
        else:
            print("❌ 步骤未保存")
    else:
        print("❌ 任务或步骤未保存")
except Exception as e:
    print(f"❌ step_end 事件发布失败: {e}")

# 测试3：发布 task_end 事件
print("\n测试3：发布 task_end 事件")
try:
    global_event_publisher.publish(
        'task_end',
        session_id="test_session",
        task_id="task_001",
        result="任务已完成，成功读取并排序了Excel文件",
        user_input="读取Excel文件并排序"
    )
    print("✅ task_end 事件发布成功")
    
    # 检查任务结果是否保存
    task = session_manager.get_task("test_session", "task_001")
    if task:
        print(f"✅ 任务结果已保存，result: {task.get('result', 'N/A')}")
        print(f"   user_input: {task.get('user_input', 'N/A')}")
    else:
        print("❌ 任务结果未保存")
except Exception as e:
    print(f"❌ task_end 事件发布失败: {e}")

print("\n=== 测试完成 ===")

# 清理
import time
time.sleep(0.5)
subscriber.__del__()