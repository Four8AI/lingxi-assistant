#!/usr/bin/env python3
"""
测试流式执行和非流式执行的区别
"""

import time
from lingxi.utils.config import load_config
from lingxi.core.skill_caller import SkillCaller
from lingxi.core.session import SessionManager
from lingxi.core.engine.plan_react import PlanReActEngine

# 加载配置
config = load_config()

# 初始化技能调用器
skill_caller = SkillCaller(config)

# 初始化会话管理器
session_manager = SessionManager(config)

# 初始化Plan-ReAct引擎
engine = PlanReActEngine(config, skill_caller, session_manager)

# 测试任务：简单的文件读取任务
task = "读取当前目录下的hello.md文件"
session_id = f"test_session_{int(time.time())}"

print(f"测试任务: {task}")
print(f"会话ID: {session_id}")
print("=" * 60)

# 测试1: 非流式执行
print("\n测试1: 非流式执行")
print("-" * 60)

try:
    # 非流式执行
    result = engine.process(
        user_input=task,
        task_info={"level": "simple"},
        session_history=[],
        session_id=session_id,
        stream=False
    )
    print(f"非流式执行结果: {result}")
    print("✅ 非流式执行成功")
except Exception as e:
    print(f"❌ 非流式执行失败: {e}")
    import traceback
    traceback.print_exc()

# 等待一下
print("\n等待2秒...")
time.sleep(2)

# 测试2: 流式执行
print("\n测试2: 流式执行")
print("-" * 60)

try:
    # 流式执行
    stream_generator = engine.process(
        user_input=task,
        task_info={"level": "simple"},
        session_history=[],
        session_id=session_id,
        stream=True
    )
    
    print("流式执行结果:")
    for chunk in stream_generator:
        print(f"  {chunk.get('type')}: {chunk.get('result', chunk.get('content', ''))}")
    print("✅ 流式执行成功")
except Exception as e:
    print(f"❌ 流式执行失败: {e}")
    import traceback
    traceback.print_exc()

print("\n测试完成！")