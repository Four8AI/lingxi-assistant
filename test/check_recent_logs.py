#!/usr/bin/env python3
"""检查最近的请求日志"""
with open("logs/assistant.log", "r", encoding="utf-8") as f:
    lines = f.readlines()
    
# 查找最近的 task_start 相关日志
print("【最近的 task_start 事件】")
for i, line in enumerate(lines[-200:], start=max(0, len(lines)-200)):
    if "task_start" in line or "POST" in line or "stream" in line:
        print(f"L{i+1}: {line.strip()}")
