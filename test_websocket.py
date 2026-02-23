#!/usr/bin/env python3
"""
WebSocket功能测试脚本
"""
import asyncio
import json
import websockets


async def test_websocket():
    """测试WebSocket连接和基本功能"""
    uri = "ws://localhost:5000/ws"

    print("=" * 60)
    print("WebSocket功能测试")
    print("=" * 60)

    try:
        async with websockets.connect(uri) as websocket:
            print("\n✓ 成功连接到服务器")

            # 接收欢迎消息
            welcome = await websocket.recv()
            welcome_data = json.loads(welcome)
            print(f"✓ 收到欢迎消息: {welcome_data.get('data', {}).get('message')}")

            # 测试1: 发送简单聊天消息
            print("\n[测试1] 发送简单聊天消息...")
            request = {
                "type": "chat",
                "content": "你好",
                "session_id": "test_session"
            }
            await websocket.send(json.dumps(request))
            response = await websocket.recv()
            response_data = json.loads(response)
            print(f"✓ 收到响应: {response_data.get('type')}")

            # 测试2: 发送ping
            print("\n[测试2] 发送ping消息...")
            ping_request = {"type": "ping"}
            await websocket.send(json.dumps(ping_request))
            ping_response = await websocket.recv()
            ping_data = json.loads(ping_response)
            print(f"✓ 收到pong: {ping_data.get('data', {}).get('pong')}")

            # 测试3: 执行help命令
            print("\n[测试3] 执行help命令...")
            command_request = {
                "type": "command",
                "command": "help",
                "args": {},
                "session_id": "test_session"
            }
            await websocket.send(json.dumps(command_request))
            command_response = await websocket.recv()
            command_data = json.loads(command_response)
            print(f"✓ 收到命令响应，包含 {len(command_data.get('data', {}).get('result', {}).get('available_commands', []))} 个命令")

            # 测试4: 列出技能
            print("\n[测试4] 列出可用技能...")
            skill_request = {
                "type": "skill",
                "action": "list"
            }
            await websocket.send(json.dumps(skill_request))
            skill_response = await websocket.recv()
            skill_data = json.loads(skill_response)
            skills = skill_data.get('data', {}).get('skills', [])
            print(f"✓ 找到 {len(skills)} 个可用技能")

            # 测试5: 获取检查点状态
            print("\n[测试5] 获取检查点状态...")
            checkpoint_request = {
                "type": "checkpoint",
                "action": "status",
                "session_id": "test_session"
            }
            await websocket.send(json.dumps(checkpoint_request))
            checkpoint_response = await websocket.recv()
            checkpoint_data = json.loads(checkpoint_response)
            print(f"✓ 检查点状态: {checkpoint_data.get('data', {}).get('checkpoint_status', {}).get('has_checkpoint')}")

            # 测试6: 获取上下文统计
            print("\n[测试6] 获取上下文统计...")
            context_request = {
                "type": "context",
                "action": "stats",
                "session_id": "test_session"
            }
            await websocket.send(json.dumps(context_request))
            context_response = await websocket.recv()
            context_data = json.loads(context_response)
            stats = context_data.get('data', {}).get('context_stats', {})
            print(f"✓ 总消息数: {stats.get('total_messages', 0)}")

            print("\n" + "=" * 60)
            print("✓ 所有测试通过！")
            print("=" * 60)

    except ConnectionRefusedError:
        print("\n✗ 无法连接到服务器，请确保服务器正在运行")
        print("  启动命令: python start_web_server.py")
    except Exception as e:
        print(f"\n✗ 测试失败: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_websocket())
