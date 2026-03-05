#!/usr/bin/env python3
"""检查 debug.log 中 task_session_cd62729d_371cbebe 相关的日志"""
with open("logs/debug.log", "r", encoding="utf-8") as f:
    lines = f.readlines()
    
print("【查找 cd62729d 相关日志】")
found_lines = []
for i, line in enumerate(lines):
    if "cd62729d" in line or "371cbebe" in line:
        found_lines.append((i, line))
        print(f"L{i+1}: {line.strip()}")

if not found_lines:
    print("未找到相关日志")
    
# 检查后续 100 行
if found_lines:
    last_line_idx = found_lines[-1][0]
    print(f"\n【后续 100 行日志（从 L{last_line_idx+1} 开始）】")
    for i in range(last_line_idx, min(last_line_idx+100, len(lines))):
        print(f"L{i+1}: {lines[i].strip()}")
