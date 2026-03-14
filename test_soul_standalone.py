#!/usr/bin/env python3
"""SOUL 模块独立测试（不依赖 lingxi 包）"""

import sys
import os
import tempfile
import shutil

# Add the soul module directory
sys.path.insert(0, '/home/admin/lingxi-assistant/lingxi/core/soul')

# Import modules directly
from soul_parser import SoulParser
from soul_injector import SoulInjector
from soul_cache import SoulCache

print('=' * 60)
print('SOUL 模块独立测试')
print('=' * 60)

print('\n=== Test 1: SOUL Parser ===')
parser = SoulParser()
test_content = '''# SOUL.md - Who You Are

## Core Identity
- **Name:** 灵犀
- **Creature:** AI 助手
- **Vibe:** 温暖、专业、幽默
- **Emoji:** 🦋

## Core Truths
- Be genuinely helpful
- Have opinions
- Be resourceful

## Boundaries
- Private things stay private
- Ask before acting externally

## Memory
- 用户偏好：喜欢简洁的回复
- 当前项目：灵犀助手开发
'''

data = parser.parse(test_content)
assert data is not None, "解析失败"
assert "灵犀" in data["identity"]["name"], "身份名称不匹配"
assert len(data["core_truths"]) > 0, "核心原则为空"
assert len(data["boundaries"]) > 0, "边界为空"
print(f'✅ 解析成功')
print(f'   身份：{data.get("identity", {})}')
print(f'   核心原则数量：{len(data.get("core_truths", []))}')
print(f'   边界数量：{len(data.get("boundaries", []))}')

print('\n=== Test 2: SOUL Injector Load ===')
temp_dir = tempfile.mkdtemp()
soul_path = os.path.join(temp_dir, 'SOUL.md')
with open(soul_path, 'w', encoding='utf-8') as f:
    f.write(test_content)

injector = SoulInjector(temp_dir)
success = injector.load()
assert success is True, "加载失败"
assert injector.soul_content is not None, "内容为空"
assert injector.soul_data is not None, "数据为空"
print(f'✅ 加载成功')
print(f'   身份摘要：{injector.get_identity_summary()}')

print('\n=== Test 3: Build System Prompt ===')
base_prompt = '你是灵犀智能助手。'
system_prompt = injector.build_system_prompt(base_prompt)
assert "灵犀" in system_prompt, "系统提示词中缺少灵犀"
assert "AI 助手" in system_prompt, "系统提示词中缺少 AI 助手"
assert "温暖、专业、幽默" in system_prompt, "系统提示词中缺少 Vibe"
print(f'✅ 系统提示词构建成功')
print(f'   长度：{len(system_prompt)} 字符')
print(f'   预览 (前 400 字符):\n{system_prompt[:400]}...')

print('\n=== Test 4: Inject Messages ===')
messages = [{'role': 'user', 'content': '你好'}]
injected = injector.inject(messages)
assert len(injected) > len(messages), "消息未注入"
assert injected[0]["role"] == "system", "第一条消息不是系统消息"
print(f'✅ 消息注入成功')
print(f'   注入前：{len(messages)} 条消息')
print(f'   注入后：{len(injected)} 条消息')
print(f'   第一条消息角色：{injected[0]["role"]}')
print(f'   系统消息长度：{len(injected[0]["content"])} 字符')

print('\n=== Test 5: Load from Workspace ===')
workspace_injector = SoulInjector('/home/admin/.openclaw/workspace')
workspace_success = workspace_injector.load()
if workspace_success:
    print(f'✅ Workspace SOUL 加载成功')
    print(f'   身份：{workspace_injector.get_identity_summary()}')
else:
    print(f'⚠️  Workspace SOUL.md 不存在或加载失败')

shutil.rmtree(temp_dir)

print('\n' + '=' * 60)
print('✅ All SOUL module tests passed!')
print('=' * 60)
