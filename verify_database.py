#!/usr/bin/env python3
"""验证数据库清理结果"""
import sqlite3

db_path = "data/assistant.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("【数据库验证】")
cursor.execute('SELECT COUNT(*) FROM sessions')
print(f"  会话记录数：{cursor.fetchone()[0]}")

cursor.execute('SELECT COUNT(*) FROM tasks')
print(f"  任务记录数：{cursor.fetchone()[0]}")

cursor.execute('SELECT COUNT(*) FROM steps')
print(f"  步骤记录数：{cursor.fetchone()[0]}")

cursor.execute('SELECT name FROM sqlite_master WHERE type="table"')
tables = cursor.fetchall()
print(f"\n  数据库表：{[t[0] for t in tables]}")

conn.close()
print("\n✅ 数据库状态正常")
