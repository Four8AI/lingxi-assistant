#!/usr/bin/env python3
"""
测试任务描述传递逻辑的修复
"""

import time
from lingxi.utils.config import load_config
from lingxi.core.skill_caller import SkillCaller
from lingxi.core.session import SessionManager
from lingxi.core.engine.react import ReActEngine

# 加载配置
config = load_config()

# 初始化技能调用器
skill_caller = SkillCaller(config)

# 初始化会话管理器
session_manager = SessionManager(config)

# 初始化ReAct引擎
engine = ReActEngine(config, skill_caller, session_manager)

# 测试任务：读取员工信息表.xlsx,按照年龄倒排序查看
task = "读取员工信息表.xlsx,按照年龄倒排序查看"
session_id = f"test_session_{int(time.time())}"

print(f"测试任务: {task}")
print(f"会话ID: {session_id}")
print("=" * 60)

# 执行任务
try:
    # 非流式执行
    result = engine.process(
        user_input=task,
        task_info={"level": "simple", "reason": "读取Excel文件并按年龄排序，属于单一步骤的文件操作任务"},
        session_history=[],
        session_id=session_id,
        stream=False
    )
    print(f"执行结果: {result}")
    print("✅ 任务执行成功")
except Exception as e:
    print(f"❌ 任务执行失败: {e}")
    import traceback
    traceback.print_exc()

print("\n测试完成！")