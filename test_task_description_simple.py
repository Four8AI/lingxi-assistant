#!/usr/bin/env python3
"""
测试任务描述传递逻辑的修复
"""

import sys
from lingxi.core.prompts import PromptTemplates

# 模拟任务信息
task_info = {
    "level": "simple",
    "reason": "读取Excel文件并按年龄排序，属于单一步骤的文件操作任务"
}

# 模拟系统信息
system_info = {
    "os_info": "Windows 11",
    "current_dir": "D:\resource\python\lingxi",
    "shell_type": "PowerShell"
}

# 模拟技能列表
skills_list = "1. xlsx - 处理Excel文件\n2. read_file - 读取文件"

# 构建系统提示词
system_prompt = f"""你是灵犀智能助手，使用ReAct模式解决问题。

系统环境: {system_info['os_info']}
当前工作目录: {system_info['current_dir']}
Shell类型: {system_info['shell_type']}

任务类型: {task_info.get('level', task_info.get('task_type', '未知'))}
任务描述: {task_info.get('reason', task_info.get('description', '无'))}

可用行动:
{skills_list}
"""

print("=== 测试任务描述传递 ===")
print(f"任务类型: {task_info.get('level', task_info.get('task_type', '未知'))}")
print(f"任务描述: {task_info.get('reason', task_info.get('description', '无'))}")
print("\n=== 生成的系统提示词 ===")
print(system_prompt)

# 测试build_react_messages_with_cache方法
print("\n=== 测试build_react_messages_with_cache ===")
messages = PromptTemplates.build_react_messages_with_cache(
    user_input="读取员工信息表.xlsx,按照年龄倒排序查看",
    task_info=task_info,
    history_context="无历史对话",
    skills_list=skills_list,
    steps=[],
    system_info=system_info
)

print("系统消息内容:")
system_content = messages[0]['content'][0]['text']
print(system_content)

# 检查任务描述是否正确包含
if "读取Excel文件并按年龄排序" in system_content:
    print("\n✅ 任务描述正确传递!")
else:
    print("\n❌ 任务描述未正确传递!")

print("\n测试完成!")