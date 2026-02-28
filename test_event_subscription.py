#!/usr/bin/env python3
"""
验证 SessionStoreSubscriber 是否正确订阅事件
"""

import sys
import os
import asyncio

# 添加项目路径到 sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lingxi.web.fastapi_server import startup_event
from lingxi.core.event import global_event_publisher

async def main():
    """测试事件订阅"""
    # 触发启动事件
    print("=== 初始化应用 ===")
    try:
        await startup_event()
        print("✅ 应用初始化成功")
    except Exception as e:
        print(f"❌ 应用初始化失败: {e}")
        return
    
    # 打印所有事件的订阅者
    print("\n=== 验证 SessionStoreSubscriber 订阅 ===")
    print("事件订阅者列表:")
    
    event_names = ['plan_start', 'plan_final', 'step_end', 'task_end']
    for event_name in event_names:
        subscribers = global_event_publisher._subscribers.get(event_name, [])
        print(f"\n{event_name} 订阅者:")
        for i, subscriber in enumerate(subscribers):
            print(f"  {i+1}. {subscriber.__qualname__}")
        
        if subscribers:
            print(f"  ✅ 有 {len(subscribers)} 个订阅者")
        else:
            print(f"  ❌ 没有订阅者")
    
    # 测试发布事件
    print("\n=== 测试发布事件 ===")
    
    try:
        print("发布 plan_final 事件...")
        global_event_publisher.publish(
            'plan_final',
            session_id="test_session",
            task_id="task_001",
            plan=[{"step": 1, "description": "测试步骤"}]
        )
        print("✅ plan_final 事件发布成功")
        
    except Exception as e:
        print(f"❌ plan_final 事件发布失败: {e}")
    
    try:
        print("\n发布 step_end 事件...")
        global_event_publisher.publish(
            'step_end',
            session_id="test_session",
            task_id="task_001",
            step_index=0,
            result="测试结果"
        )
        print("✅ step_end 事件发布成功")
        
    except Exception as e:
        print(f"❌ step_end 事件发布失败: {e}")
    
    try:
        print("\n发布 task_end 事件...")
        global_event_publisher.publish(
            'task_end',
            session_id="test_session",
            task_id="task_001",
            result="测试任务结果"
        )
        print("✅ task_end 事件发布成功")
        
    except Exception as e:
        print(f"❌ task_end 事件发布失败: {e}")

if __name__ == "__main__":
    asyncio.run(main())