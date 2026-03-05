#!/usr/bin/env python3
"""检查 task_session_cd62729d_371cbebe 相关的所有日志"""
with open("logs/assistant.log", "r", encoding="utf-8") as f:
    lines = f.readlines()
    
print("【查找 task_session_cd62729d_371cbebe 相关日志】")
found = False
for i, line in enumerate(lines):
    if "cd62729d" in line or "371cbebe" in line:
        print(f"L{i+1}: {line.strip()}")
        found = True

if not found:
    print("未找到相关日志")
    
print("\n【最新的 50 行日志】")
for i, line in enumerate(lines[-50:], start=max(0, len(lines)-50)):
    print(f"L{i+1}: {line.strip()}")
