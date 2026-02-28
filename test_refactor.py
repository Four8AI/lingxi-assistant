#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试重构后的代码是否正常工作
"""

import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath('.'))


def test_imports():
    """测试所有模块是否能正确导入"""
    print("测试模块导入...")
    
    try:
        from lingxi.core.engine import (
            BaseEngine,
            ReActEngine,
            PlanReActEngine,
            PlanReActCore,
            ReActCore,
            parse_llm_response,
            parse_action_parameters,
            process_parameters,
            calculate_expression,
            parse_plan
        )
        print("✅ 所有引擎模块导入成功")
        print(f"✅ BaseEngine: {BaseEngine}")
        print(f"✅ ReActEngine: {ReActEngine}")
        print(f"✅ PlanReActEngine: {PlanReActEngine}")
        print(f"✅ PlanReActCore: {PlanReActCore}")
        print(f"✅ ReActCore: {ReActCore}")
        print(f"✅ parse_llm_response: {parse_llm_response}")
        print(f"✅ parse_action_parameters: {parse_action_parameters}")
        print(f"✅ process_parameters: {process_parameters}")
        print(f"✅ calculate_expression: {calculate_expression}")
        print(f"✅ parse_plan: {parse_plan}")
        return True
    except Exception as e:
        print(f"❌ 导入失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_utils():
    """测试工具函数是否正常工作"""
    print("\n测试工具函数...")
    
    try:
        from lingxi.core.engine import (
            parse_llm_response,
            parse_action_parameters,
            process_parameters,
            calculate_expression,
            parse_plan
        )
        
        # 测试 parse_llm_response
        test_response = '''
        {"thought": "用户要求创建test.txt文件", "action": "create_file", "action_input": {"file_path": "test.txt", "content": "hello world"}}
        '''
        parsed = parse_llm_response(test_response)
        print(f"✅ parse_llm_response 测试: {parsed}")
        
        # 测试 parse_action_parameters
        test_action_input = 'file_path="test.txt" content="hello world"'
        params = parse_action_parameters(test_action_input)
        print(f"✅ parse_action_parameters 测试: {params}")
        
        # 测试 process_parameters
        test_params = {'content': 'hello\\nworld'}
        processed = process_parameters(test_params)
        print(f"✅ process_parameters 测试: {processed}")
        
        # 测试 calculate_expression
        test_expr = '1 + 2 * 3'
        result = calculate_expression(test_expr)
        print(f"✅ calculate_expression 测试: {result}")
        
        # 测试 parse_plan
        test_plan = '''
        1. 创建test.txt文件
        2. 写入内容"hello world"
        3. 读取文件验证内容
        '''
        plan_steps = parse_plan(test_plan)
        print(f"✅ parse_plan 测试: {plan_steps}")
        
        return True
    except Exception as e:
        print(f"❌ 工具函数测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_engine_initialization():
    """测试引擎初始化是否正常"""
    print("\n测试引擎初始化...")
    
    try:
        from lingxi.core.engine import ReActEngine, PlanReActEngine
        
        # 创建一个简单的配置
        test_config = {
            "engine": {
                "max_steps": 5,
                "timeout": 30
            }
        }
        
        # 初始化引擎（不传入skill_caller和session_manager，应该能正常初始化）
        react_engine = ReActEngine(test_config)
        plan_react_engine = PlanReActEngine(test_config)
        
        print(f"✅ ReActEngine 初始化成功: {react_engine}")
        print(f"✅ PlanReActEngine 初始化成功: {plan_react_engine}")
        
        return True
    except Exception as e:
        print(f"❌ 引擎初始化失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """运行所有测试"""
    print("开始测试重构后的代码...\n")
    
    tests = [
        test_imports,
        test_utils,
        test_engine_initialization
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        if test():
            passed += 1
        else:
            failed += 1
    
    print(f"\n测试结果: {passed} 通过, {failed} 失败")
    
    if failed == 0:
        print("🎉 所有测试通过！重构后的代码工作正常。")
        return 0
    else:
        print("❌ 有测试失败，请检查重构后的代码。")
        return 1


if __name__ == "__main__":
    sys.exit(main())
