#!/usr/bin/env python3
"""检查最新的订阅者初始化"""
with open("logs/assistant.log", "r", encoding="utf-8") as f:
    lines = f.readlines()
    
print("【最新的订阅者初始化日志】")
for i, line in enumerate(lines[-50:], start=max(0, len(lines)-50)):
    if "订阅者" in line or "初始化" in line:
        print(f"L{i+1}: {line.strip()}")
