import asyncio
import json
import websockets
from typing import Optional, Dict, Any


class LingxiWebSocketClient:
    """灵犀助手WebSocket客户端"""

    def __init__(self, uri: str = "ws://localhost:5000/ws"):
        """初始化WebSocket客户端

        Args:
            uri: WebSocket服务器地址
        """
        self.uri = uri
        self.websocket: Optional[websockets.WebSocketClientProtocol] = None
        self.session_id = "default"

    async def connect(self) -> bool:
        """连接到WebSocket服务器

        Returns:
            是否连接成功
        """
        try:
            self.websocket = await websockets.connect(self.uri)
            print(f"已连接到服务器: {self.uri}")
            welcome_msg = await self.websocket.recv()
            print(f"欢迎消息: {welcome_msg}")
            return True
        except Exception as e:
            print(f"连接失败: {e}")
            return False

    async def disconnect(self):
        """断开WebSocket连接"""
        if self.websocket:
            await self.websocket.close()
            print("已断开连接")

    async def send_chat(self, message: str, session_id: str = None) -> Dict[str, Any]:
        """发送聊天消息

        Args:
            message: 消息内容
            session_id: 会话ID

        Returns:
            服务器响应
        """
        if not self.websocket:
            raise RuntimeError("未连接到服务器")

        if session_id:
            self.session_id = session_id

        request = {
            "type": "chat",
            "content": message,
            "session_id": self.session_id
        }

        await self.websocket.send(json.dumps(request))
        response = await self.websocket.recv()
        return json.loads(response)

    async def send_stream_chat(self, message: str, session_id: str = None):
        """发送流式聊天消息

        Args:
            message: 消息内容
            session_id: 会话ID
        """
        if not self.websocket:
            raise RuntimeError("未连接到服务器")

        if session_id:
            self.session_id = session_id

        request = {
            "type": "stream_chat",
            "content": message,
            "session_id": self.session_id
        }

        await self.websocket.send(json.dumps(request))

        while True:
            response = await self.websocket.recv()
            data = json.loads(response)

            if data.get("type") == "stream_start":
                print("\n[流式响应开始]")
            elif data.get("type") == "stream_chunk":
                print(data.get("content", ""), end="", flush=True)
            elif data.get("type") == "stream_end":
                print("\n[流式响应结束]")
                break
            elif data.get("type") == "error":
                print(f"\n错误: {data.get('error')}")
                break

    async def send_command(self, command: str, args: Dict = None, session_id: str = None) -> Dict[str, Any]:
        """发送命令

        Args:
            command: 命令名称
            args: 命令参数
            session_id: 会话ID

        Returns:
            服务器响应
        """
        if not self.websocket:
            raise RuntimeError("未连接到服务器")

        if session_id:
            self.session_id = session_id

        request = {
            "type": "command",
            "command": command,
            "args": args or {},
            "session_id": self.session_id
        }

        await self.websocket.send(json.dumps(request))
        response = await self.websocket.recv()
        return json.loads(response)

    async def get_checkpoint_status(self, session_id: str = None) -> Dict[str, Any]:
        """获取检查点状态

        Args:
            session_id: 会话ID

        Returns:
            检查点状态
        """
        if not self.websocket:
            raise RuntimeError("未连接到服务器")

        request = {
            "type": "checkpoint",
            "action": "status",
            "session_id": session_id or self.session_id
        }

        await self.websocket.send(json.dumps(request))
        response = await self.websocket.recv()
        return json.loads(response)

    async def list_skills(self) -> Dict[str, Any]:
        """列出可用技能

        Returns:
            技能列表
        """
        if not self.websocket:
            raise RuntimeError("未连接到服务器")

        request = {
            "type": "skill",
            "action": "list"
        }

        await self.websocket.send(json.dumps(request))
        response = await self.websocket.recv()
        return json.loads(response)

    async def get_context_stats(self, session_id: str = None) -> Dict[str, Any]:
        """获取上下文统计信息

        Args:
            session_id: 会话ID

        Returns:
            上下文统计信息
        """
        if not self.websocket:
            raise RuntimeError("未连接到服务器")

        request = {
            "type": "context",
            "action": "stats",
            "session_id": session_id or self.session_id
        }

        await self.websocket.send(json.dumps(request))
        response = await self.websocket.recv()
        return json.loads(response)

    async def interactive_mode(self):
        """交互式模式"""
        if not await self.connect():
            return

        print("\n=== 灵犀智能助手 - WebSocket客户端 ===")
        print("输入 'exit' 退出")
        print("输入 'stream <消息>' 使用流式输出")
        print("输入 'help' 查看可用命令")
        print("=" * 50)

        try:
            while True:
                user_input = input("\n用户: ").strip()

                if user_input.lower() == "exit":
                    print("再见！")
                    break

                if not user_input:
                    continue

                if user_input == "help":
                    await self._show_help()
                    continue

                if user_input.startswith("stream "):
                    message = user_input[7:].strip()
                    await self.send_stream_chat(message)
                    continue

                if user_input.startswith("/"):
                    await self._handle_command(user_input)
                    continue

                response = await self.send_chat(user_input)
                self._print_response(response)

        except KeyboardInterrupt:
            print("\n\n再见！")
        finally:
            await self.disconnect()

    async def _show_help(self):
        """显示帮助信息"""
        help_text = """
可用命令:
  /help              显示帮助
  /new               创建新会话
  /clear             清空当前会话
  /status            显示检查点状态
  /skills            列出可用技能
  /context-stats     显示上下文统计
  /compress          手动触发上下文压缩
  /search <query>    检索相关历史
  /session [id]      切换到指定会话
  stream <message>   使用流式输出
  exit               退出客户端
        """
        print(help_text)

    async def _handle_command(self, command: str):
        """处理命令

        Args:
            command: 命令字符串
        """
        cmd_parts = command.split()
        cmd = cmd_parts[0].lower()

        if cmd == "/help":
            await self._show_help()
        elif cmd == "/new":
            import time
            new_session_id = f"session_{int(time.time() * 1000)}"
            self.session_id = new_session_id
            print(f"✓ 已创建新会话: {new_session_id}")
        elif cmd == "/clear":
            response = await self.send_command("clear")
            print(f"灵犀: {response.get('data', {}).get('result', '操作完成')}")
        elif cmd == "/status":
            response = await self.send_command("status")
            status = response.get('data', {}).get('result', {})
            print(f"检查点状态: {json.dumps(status, indent=2, ensure_ascii=False)}")
        elif cmd == "/skills":
            response = await self.list_skills()
            skills = response.get('data', {}).get('skills', [])
            print(f"可用技能（共{len(skills)}个）:")
            for skill in skills:
                print(f"  - {skill.get('name')}: {skill.get('description')}")
        elif cmd == "/context-stats":
            response = await self.get_context_stats()
            stats = response.get('data', {}).get('context_stats', {})
            print(f"上下文统计: {json.dumps(stats, indent=2, ensure_ascii=False)}")
        elif cmd == "/compress":
            response = await self.send_command("compress")
            stats = response.get('data', {}).get('result', {})
            print(f"压缩统计: {json.dumps(stats, indent=2, ensure_ascii=False)}")
        elif cmd == "/search":
            if len(cmd_parts) < 2:
                print("请提供查询文本")
                return
            query = " ".join(cmd_parts[1:])
            response = await self.send_command("search", {"query": query})
            results = response.get('data', {}).get('result', [])
            print(f"搜索结果（共{len(results)}条）:")
            for result in results:
                print(f"  - {result.get('summary')}")
        elif cmd == "/session":
            if len(cmd_parts) > 1:
                new_session_id = cmd_parts[1]
                response = await self.send_command("session", {"session_id": new_session_id})
                self.session_id = new_session_id
            else:
                response = await self.send_command("session")
                result = response.get('data', {}).get('result', '')
                self.session_id = result.split(": ")[1] if ": " in result else self.session_id
            print(f"灵犀: {response.get('data', {}).get('result', '操作完成')}")
        else:
            print(f"未知命令: {cmd}")

    def _print_response(self, response: Dict[str, Any]):
        """打印响应

        Args:
            response: 响应数据
        """
        if response.get("type") == "chat":
            content = response.get("data", {}).get("content", "")
            print(f"灵犀: {content}")
        elif response.get("type") == "error":
            error = response.get("error", "未知错误")
            details = response.get("details", "")
            print(f"错误: {error}")
            if details:
                print(f"详情: {details}")
        else:
            print(f"响应: {json.dumps(response, indent=2, ensure_ascii=False)}")


async def main():
    """主函数"""
    import sys

    uri = sys.argv[1] if len(sys.argv) > 1 else "ws://localhost:5000/ws"

    client = LingxiWebSocketClient(uri)
    await client.interactive_mode()


if __name__ == "__main__":
    asyncio.run(main())
