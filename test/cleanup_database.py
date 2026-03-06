#!/usr/bin/env python3
"""
清理数据库中的所有历史会话记录
"""
import sqlite3
import os

# 数据库路径
db_path = "data/assistant.db"

print("=" * 60)
print("清理数据库中的历史会话记录")
print("=" * 60)
print()

# 检查数据库文件是否存在
if not os.path.exists(db_path):
    print(f"❌ 数据库文件不存在：{db_path}")
    exit(1)

print(f"数据库路径：{db_path}")
print()

# 连接数据库
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 统计清理前的数据量
print("【清理前的数据统计】")
cursor.execute('SELECT COUNT(*) FROM sessions')
session_count_before = cursor.fetchone()[0]
print(f"  会话记录数：{session_count_before}")

cursor.execute('SELECT COUNT(*) FROM tasks')
task_count_before = cursor.fetchone()[0]
print(f"  任务记录数：{task_count_before}")

cursor.execute('SELECT COUNT(*) FROM steps')
step_count_before = cursor.fetchone()[0]
print(f"  步骤记录数：{step_count_before}")
print()

# 按照外键约束顺序删除数据（先删除子表，再删除主表）
print("【开始清理数据】")

# 1. 删除步骤记录
cursor.execute('DELETE FROM steps')
deleted_steps = cursor.rowcount
print(f"  ✓ 已删除 {deleted_steps} 条步骤记录")

# 2. 删除任务记录
cursor.execute('DELETE FROM tasks')
deleted_tasks = cursor.rowcount
print(f"  ✓ 已删除 {deleted_tasks} 条任务记录")

# 3. 删除会话记录
cursor.execute('DELETE FROM sessions')
deleted_sessions = cursor.rowcount
print(f"  ✓ 已删除 {deleted_sessions} 条会话记录")

# 提交事务
conn.commit()
print()

# 统计清理后的数据量
print("【清理后的数据统计】")
cursor.execute('SELECT COUNT(*) FROM sessions')
session_count_after = cursor.fetchone()[0]
print(f"  会话记录数：{session_count_after}")

cursor.execute('SELECT COUNT(*) FROM tasks')
task_count_after = cursor.fetchone()[0]
print(f"  任务记录数：{task_count_after}")

cursor.execute('SELECT COUNT(*) FROM steps')
step_count_after = cursor.fetchone()[0]
print(f"  步骤记录数：{step_count_after}")
print()

# 关闭连接
conn.close()

print("=" * 60)
print("✅ 数据库清理完成！")
print("=" * 60)
print()
print(f"清理摘要：")
print(f"  - 删除会话：{deleted_sessions} 个")
print(f"  - 删除任务：{deleted_tasks} 个")
print(f"  - 删除步骤：{deleted_steps} 个")
print()
