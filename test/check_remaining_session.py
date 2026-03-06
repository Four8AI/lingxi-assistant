#!/usr/bin/env python3
"""检查剩余的会话记录"""
import sqlite3

db_path = "data/assistant.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("【剩余的会话记录】")
cursor.execute('SELECT session_id, user_name, title, created_at FROM sessions')
sessions = cursor.fetchall()

if sessions:
    for session in sessions:
        print(f"\n  会话 ID: {session[0]}")
        print(f"  用户名：{session[1]}")
        print(f"  标题：{session[2]}")
        print(f"  创建时间：{session[3]}")
else:
    print("  没有会话记录")

conn.close()
