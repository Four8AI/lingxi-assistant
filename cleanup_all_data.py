#!/usr/bin/env python3
"""
完全清理数据库中的所有会话记录（包括内存缓存）
"""
import sqlite3
import os
import sys

# 添加项目路径
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

from lingxi.web.state import get_assistant

db_path = "data/assistant.db"

print("=" * 60)
print("完全清理数据库和历史缓存")
print("=" * 60)
print()

# 1. 清理数据库
print("【1. 清理数据库表】")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 删除所有数据
cursor.execute('DELETE FROM steps')
print(f"  ✓ 已删除 {cursor.rowcount} 条步骤记录")

cursor.execute('DELETE FROM tasks')
print(f"  ✓ 已删除 {cursor.rowcount} 条任务记录")

cursor.execute('DELETE FROM sessions')
print(f"  ✓ 已删除 {cursor.rowcount} 条会话记录")

conn.commit()
conn.close()
print()

# 2. 清理内存缓存
print("【2. 清理内存缓存】")
try:
    assistant = get_assistant()
    if assistant and hasattr(assistant, 'session_manager'):
        # 清空 session_manager 的内存缓存
        assistant.session_manager.memory_cache.clear()
        print("  ✓ 已清空会话管理器的内存缓存")
    else:
        print("  ⚠ 助手未初始化，跳过内存缓存清理")
except Exception as e:
    print(f"  ⚠ 清理内存缓存失败：{e}")
print()

# 3. 验证清理结果
print("【3. 验证清理结果】")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute('SELECT COUNT(*) FROM sessions')
session_count = cursor.fetchone()[0]
print(f"  数据库会话记录数：{session_count}")

cursor.execute('SELECT COUNT(*) FROM tasks')
task_count = cursor.fetchone()[0]
print(f"  数据库任务记录数：{task_count}")

cursor.execute('SELECT COUNT(*) FROM steps')
step_count = cursor.fetchone()[0]
print(f"  数据库步骤记录数：{step_count}")

conn.close()
print()

if session_count == 0 and task_count == 0 and step_count == 0:
    print("=" * 60)
    print("✅ 数据库已完全清理干净！")
    print("=" * 60)
else:
    print("=" * 60)
    print("⚠️  数据库中仍有残留数据，请检查")
    print("=" * 60)
