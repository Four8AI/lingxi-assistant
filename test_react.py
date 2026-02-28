#!/usr/bin/env python3
"""测试 ReAct 引擎处理 Excel 排序任务"""

import json
import sys
from lingxi.core.engine.react import ReActEngine
from lingxi.utils.config import load_config


def main():
    try:
        # 加载配置
        config = load_config()
        
        # 初始化 ReAct 引擎
        engine = ReActEngine(config)
        
        # 测试任务
        task = "读取员工信息表.xlsx，按年龄倒序排序输出"
        task_info = {"level": "simple"}
        
        print(f"测试任务: {task}")
        print("=" * 60)
        
        # 执行任务（流式）
        result = engine.process(task, task_info, stream=True)
        
        # 处理流式输出
        if hasattr(result, '__iter__'):
            for chunk in result:
                if chunk.get("type") == "stream":
                    print(chunk.get("content", ""), end="", flush=True)
                elif chunk.get("type") == "step_complete":
                    print("\n\n步骤完成:")
                    print(f"  思考: {chunk.get('thought')}")
                    print(f"  行动: {chunk.get('action')} - {chunk.get('action_input')}")
                    print(f"  观察: {chunk.get('observation')}")
                elif chunk.get("type") == "finish":
                    print("\n\n最终结果:")
                    print(chunk.get('result', ''))
                elif chunk.get("type") == "error":
                    print("\n\n错误:")
                    print(chunk.get('message', ''))
        else:
            print("\n\n最终结果:")
            print(result)
        
        print("\n" + "=" * 60)
        print("测试完成")
        
    except Exception as e:
        print(f"测试失败: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()