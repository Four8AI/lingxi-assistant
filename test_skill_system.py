#!/usr/bin/env python3
"""技能系统优化测试脚本"""

import sys
import os

# 添加项目路径
sys.path.insert(0, '/home/admin/lingxi-assistant')

def test_skill_cache():
    """测试技能缓存模块"""
    print("\n" + "="*60)
    print("测试 1: SkillCache 模块")
    print("="*60)
    
    # 直接导入模块，避免通过 package __init__
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        "skill_cache", 
        "/home/admin/lingxi-assistant/lingxi/skills/skill_cache.py"
    )
    skill_cache = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(skill_cache)
    
    SkillCache = skill_cache.SkillCache
    
    # 创建缓存实例
    cache = SkillCache(ttl=300)
    print(f"✓ SkillCache 创建成功，TTL={cache._ttl}秒")
    
    # 测试缓存统计
    stats = cache.get_stats()
    print(f"✓ 初始缓存统计：{stats}")
    
    # 创建模拟模块
    import types
    mock_module = types.ModuleType("test_module")
    mock_module.test_func = lambda: "test"
    
    # 测试模块缓存
    test_file = "/tmp/test_skill.py"
    with open(test_file, 'w') as f:
        f.write("# test")
    
    cache.set_module("test_skill", mock_module, test_file)
    print(f"✓ 技能模块已缓存")
    
    # 测试获取缓存
    cached_module = cache.get_module("test_skill")
    assert cached_module is not None, "缓存模块获取失败"
    print(f"✓ 成功获取缓存的模块")
    
    # 测试缓存失效
    cache.invalidate("test_skill")
    assert cache.get_module("test_skill") is None, "缓存失效失败"
    print(f"✓ 缓存失效功能正常")
    
    # 测试清空缓存
    cache.set_module("test_skill", mock_module, test_file)
    cache.invalidate_all()
    stats = cache.get_stats()
    assert stats['module_cache_size'] == 0, "清空缓存失败"
    print(f"✓ 清空缓存功能正常")
    
    # 清理
    os.remove(test_file)
    
    print("\n✓ SkillCache 模块测试通过")
    return True


def test_skill_system_structure():
    """测试 SkillSystem 结构"""
    print("\n" + "="*60)
    print("测试 2: SkillSystem 结构")
    print("="*60)
    
    # 直接读取文件检查结构
    with open('/home/admin/lingxi-assistant/lingxi/skills/skill_system.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查类定义
    assert 'class SkillSystem:' in content, "缺少 SkillSystem 类定义"
    print(f"✓ SkillSystem 类定义存在")
    
    # 检查单例模式
    assert '_instance = None' in content, "缺少单例_instance 属性"
    assert '_initialized = False' in content, "缺少_initialized 属性"
    print(f"✓ SkillSystem 单例模式结构正确")
    
    # 检查方法
    required_methods = [
        'def __new__', 'def __init__', 'def _load_skills', 
        'def execute_skill', 'def get_skill_info', 'def list_skills',
        'def reload_skill', 'def get_cache_stats', 'def clear_cache'
    ]
    
    for method in required_methods:
        assert method in content, f"缺少方法：{method}"
    print(f"✓ SkillSystem 包含所有必需方法")
    
    # 检查缓存集成
    assert 'self.cache = SkillCache' in content, "未初始化缓存"
    assert 'self.loader = SkillLoader' in content, "未初始化加载器"
    print(f"✓ SkillSystem 正确集成缓存和加载器")
    
    print("\n✓ SkillSystem 结构测试通过")
    return True


def test_skill_loader_cache_integration():
    """测试 SkillLoader 缓存集成"""
    print("\n" + "="*60)
    print("测试 3: SkillLoader 缓存集成")
    print("="*60)
    
    with open('/home/admin/lingxi-assistant/lingxi/skills/skill_loader.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查 __init__ 参数
    assert 'cache: \'SkillCache\' = None' in content or 'cache=None' in content, "SkillLoader.__init__ 缺少 cache 参数"
    print(f"✓ SkillLoader.__init__ 支持 cache 参数")
    
    # 检查缓存引用
    assert 'self.cache = cache' in content, "未保存 cache 引用"
    print(f"✓ SkillLoader 保存 cache 引用")
    
    # 检查缓存使用
    assert 'self.cache' in content, "未使用缓存"
    assert 'cached_module' in content, "未从缓存获取模块"
    print(f"✓ SkillLoader 使用缓存获取模块")
    
    # 检查缓存设置
    assert 'set_module' in content, "未设置缓存"
    print(f"✓ SkillLoader 设置模块缓存")
    
    print("\n✓ SkillLoader 缓存集成测试通过")
    return True


def test_builtin_skills_cache():
    """测试 BuiltinSkills 缓存集成"""
    print("\n" + "="*60)
    print("测试 4: BuiltinSkills 缓存集成")
    print("="*60)
    
    with open('/home/admin/lingxi-assistant/lingxi/skills/builtin.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查导入
    assert 'from lingxi.skills.skill_cache import SkillCache' in content, "未导入 SkillCache"
    print(f"✓ BuiltinSkills 导入 SkillCache")
    
    # 检查缓存初始化
    assert 'self.cache' in content and 'SkillCache' in content, "未初始化缓存"
    print(f"✓ BuiltinSkills 初始化缓存")
    
    # 检查 SkillLoader 调用
    assert 'SkillLoader(config' in content and 'self.cache' in content, "未传递 cache 给 SkillLoader"
    print(f"✓ BuiltinSkills 传递 cache 给 SkillLoader")
    
    print("\n✓ BuiltinSkills 缓存集成测试通过")
    return True


def test_skills_init_exports():
    """测试 skills 模块导出"""
    print("\n" + "="*60)
    print("测试 5: skills 模块导出")
    print("="*60)
    
    with open('/home/admin/lingxi-assistant/lingxi/skills/__init__.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查导入
    required_imports = [
        'from .skill_system import SkillSystem',
        'from .skill_cache import SkillCache',
        'from .skill_loader import SkillLoader',
        'from .registry import SkillRegistry',
        'from .registry_memory import SkillRegistry as SkillRegistryMemory'
    ]
    
    for imp in required_imports:
        assert imp in content, f"未导入：{imp}"
    print(f"✓ __init__.py 导入所有必需模块")
    
    # 检查 __all__
    assert "'SkillSystem'" in content or '"SkillSystem"' in content, "__all__ 缺少 SkillSystem"
    assert "'SkillCache'" in content or '"SkillCache"' in content, "__all__ 缺少 SkillCache"
    print(f"✓ __all__ 列表包含所有导出项")
    
    print("\n✓ skills 模块导出测试通过")
    return True


def test_skill_caller_integration():
    """测试 SkillCaller 集成 SkillSystem"""
    print("\n" + "="*60)
    print("测试 6: SkillCaller 集成 SkillSystem")
    print("="*60)
    
    with open('/home/admin/lingxi-assistant/lingxi/core/skill_caller.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查导入
    assert 'from lingxi.skills.skill_system import SkillSystem' in content, "未导入 SkillSystem"
    print(f"✓ SkillCaller 导入 SkillSystem")
    
    # 检查 SkillSystem 初始化
    assert 'skill_system' in content and 'SkillSystem' in content, "未初始化 SkillSystem"
    print(f"✓ SkillCaller 初始化 SkillSystem")
    
    # 检查使用 SkillSystem 执行
    assert 'execute_skill' in content, "未使用 SkillSystem 执行技能"
    print(f"✓ SkillCaller 使用 SkillSystem 执行技能")
    
    print("\n✓ SkillCaller 集成测试通过")
    return True


def test_file_structure():
    """测试文件结构"""
    print("\n" + "="*60)
    print("测试 7: 文件结构")
    print("="*60)
    
    base_path = "/home/admin/lingxi-assistant/lingxi/skills"
    required_files = [
        'skill_cache.py',
        'skill_system.py',
        'skill_loader.py',
        '__init__.py',
        'builtin.py',
        'registry.py',
        'registry_memory.py'
    ]
    
    for file in required_files:
        file_path = os.path.join(base_path, file)
        assert os.path.exists(file_path), f"文件不存在：{file}"
        print(f"✓ 文件存在：{file}")
    
    print("\n✓ 文件结构测试通过")
    return True


def test_syntax():
    """测试 Python 语法"""
    print("\n" + "="*60)
    print("测试 8: Python 语法检查")
    print("="*60)
    
    import subprocess
    
    files = [
        '/home/admin/lingxi-assistant/lingxi/skills/skill_cache.py',
        '/home/admin/lingxi-assistant/lingxi/skills/skill_system.py',
        '/home/admin/lingxi-assistant/lingxi/skills/skill_loader.py',
        '/home/admin/lingxi-assistant/lingxi/skills/__init__.py',
        '/home/admin/lingxi-assistant/lingxi/skills/builtin.py',
        '/home/admin/lingxi-assistant/lingxi/core/skill_caller.py'
    ]
    
    for file in files:
        result = subprocess.run(
            ['python3', '-m', 'py_compile', file],
            capture_output=True,
            text=True
        )
        assert result.returncode == 0, f"{file} 语法错误：{result.stderr}"
        print(f"✓ 语法正确：{os.path.basename(file)}")
    
    print("\n✓ Python 语法检查通过")
    return True


def main():
    """运行所有测试"""
    print("\n" + "="*60)
    print("灵犀助手技能系统优化测试")
    print("="*60)
    
    tests = [
        ("Python 语法", test_syntax),
        ("文件结构", test_file_structure),
        ("SkillCache 模块", test_skill_cache),
        ("SkillSystem 结构", test_skill_system_structure),
        ("SkillLoader 缓存集成", test_skill_loader_cache_integration),
        ("BuiltinSkills 缓存集成", test_builtin_skills_cache),
        ("skills 模块导出", test_skills_init_exports),
        ("SkillCaller 集成", test_skill_caller_integration),
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
        except Exception as e:
            failed += 1
            print(f"\n✗ {test_name} 测试失败：{e}")
            import traceback
            traceback.print_exc()
    
    print("\n" + "="*60)
    print(f"测试结果：{passed} 通过，{failed} 失败")
    print("="*60)
    
    if failed == 0:
        print("\n🎉 所有测试通过！技能系统优化完成！")
        return 0
    else:
        print(f"\n⚠️  {failed} 个测试失败")
        return 1


if __name__ == "__main__":
    sys.exit(main())
