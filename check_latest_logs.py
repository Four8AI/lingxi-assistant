#!/usr/bin/env python3
"""检查最新的日志，查看 execution_id"""
with open("logs/debug.log", "r", encoding="utf-8") as f:
    lines = f.readlines()
    
print("【最新的 30 行日志】")
for i, line in enumerate(lines[-30:], start=max(0, len(lines)-30)):
    print(f"L{i+1}: {line.strip()}")
