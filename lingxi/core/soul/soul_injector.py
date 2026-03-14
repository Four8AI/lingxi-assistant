"""SOUL 提示词注入器 - 核心注入逻辑"""

import os
from typing import Optional, List, Dict
try:
    from .soul_parser import SoulParser
    from .soul_cache import SoulCache
except ImportError:
    from soul_parser import SoulParser
    from soul_cache import SoulCache


class SoulInjector:
    """SOUL 提示词注入器"""
    
    def __init__(self, workspace_path: str):
        self.workspace_path = workspace_path
        self.soul_path = os.path.join(workspace_path, "SOUL.md")
        self.parser = SoulParser()
        self.cache = SoulCache()
        self.soul_content: Optional[str] = None
        self.soul_data: Optional[dict] = None
    
    def load(self) -> bool:
        """
        加载 SOUL.md
        1. 先检查缓存
        2. 缓存未命中则读取文件
        3. 解析并缓存
        
        Returns:
            bool: 加载是否成功
        """
        # 检查文件是否存在
        if not os.path.exists(self.soul_path):
            return False
        
        # 读取文件内容
        try:
            with open(self.soul_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"[SoulInjector] 读取 SOUL.md 失败：{e}")
            return False
        
        # 检查缓存
        cached_data = self.cache.get(self.workspace_path)
        if cached_data is not None:
            # 缓存命中，验证内容是否变化
            if self.cache.is_valid(self.workspace_path, content):
                self.soul_content = content
                self.soul_data = cached_data
                return True
        
        # 缓存未命中或内容已变化，重新解析
        try:
            data = self.parser.parse(content)
            self.cache.set(self.workspace_path, content, data)
            self.soul_content = content
            self.soul_data = data
            return True
        except Exception as e:
            print(f"[SoulInjector] 解析 SOUL.md 失败：{e}")
            return False
    
    def parse(self) -> dict:
        """
        解析 SOUL.md 为结构化数据
        
        Returns:
            dict: 解析后的结构化数据
        """
        if self.soul_data is None:
            if not self.load():
                return {}
        return self.soul_data or {}
    
    def build_system_prompt(self, base_prompt: str = "") -> str:
        """
        构建完整的系统提示词
        
        格式：
        ```
        [基础系统提示词]
        
        ---
        
        # 你的身份 (SOUL.md)
        
        ## 核心身份
        - Name: xxx
        - Creature: xxx
        ...
        
        ## 核心原则
        - 原则 1
        - 原则 2
        ...
        
        ## 边界
        - 边界 1
        - 边界 2
        ...
        
        ## 记忆与上下文
        [用户记忆和当前上下文]
        ```
        
        Args:
            base_prompt: 基础系统提示词
            
        Returns:
            str: 完整的系统提示词
        """
        if self.soul_data is None:
            if not self.load():
                return base_prompt
        
        parts = []
        
        # 添加基础提示词
        if base_prompt:
            parts.append(base_prompt)
        
        # 添加分隔符
        parts.append("---")
        parts.append("")
        parts.append("# 你的身份 (SOUL.md)")
        parts.append("")
        
        # 添加核心身份
        identity = self.soul_data.get("identity", {})
        if identity:
            parts.append("## 核心身份")
            if identity.get("name"):
                parts.append(f"- Name: {identity['name']}")
            if identity.get("creature"):
                parts.append(f"- Creature: {identity['creature']}")
            if identity.get("vibe"):
                parts.append(f"- Vibe: {identity['vibe']}")
            if identity.get("emoji"):
                parts.append(f"- Emoji: {identity['emoji']}")
            parts.append("")
        
        # 添加核心原则
        core_truths = self.soul_data.get("core_truths", [])
        if core_truths:
            parts.append("## 核心原则")
            for truth in core_truths:
                parts.append(f"- {truth}")
            parts.append("")
        
        # 添加边界
        boundaries = self.soul_data.get("boundaries", [])
        if boundaries:
            parts.append("## 边界")
            for boundary in boundaries:
                parts.append(f"- {boundary}")
            parts.append("")
        
        # 添加记忆
        memory = self.soul_data.get("memory", [])
        if memory:
            parts.append("## 记忆")
            for item in memory:
                parts.append(f"- {item}")
            parts.append("")
        
        # 添加上下文
        context = self.soul_data.get("context", "")
        if context:
            parts.append("## 上下文")
            parts.append(context)
            parts.append("")
        
        # 添加记忆与上下文占位符
        parts.append("## 记忆与上下文")
        parts.append("[用户记忆和当前上下文将在此处动态注入]")
        
        return "\n".join(parts)
    
    def inject(self, messages: list) -> list:
        """
        注入到消息列表
        在系统消息中追加 SOUL 内容
        
        Args:
            messages: 消息列表，每个消息是 {"role": str, "content": str} 格式
            
        Returns:
            list: 注入后的消息列表
        """
        if not messages:
            return messages
        
        # 构建完整的系统提示词
        # 查找现有的系统消息
        system_prompt = self.build_system_prompt("")
        
        # 创建新的消息列表
        new_messages = []
        system_added = False
        
        for msg in messages:
            role = msg.get("role", "")
            content = msg.get("content", "")
            
            if role == "system":
                if not system_added:
                    # 合并到第一个系统消息
                    new_messages.append({
                        "role": "system",
                        "content": f"{content}\n\n{system_prompt}"
                    })
                    system_added = True
                else:
                    new_messages.append(msg)
            else:
                new_messages.append(msg)
        
        # 如果没有系统消息，在开头添加
        if not system_added:
            new_messages.insert(0, {
                "role": "system",
                "content": system_prompt
            })
        
        return new_messages
    
    def reload(self) -> bool:
        """
        强制重新加载 SOUL.md
        清除缓存并重新读取文件
        
        Returns:
            bool: 重新加载是否成功
        """
        # 清除缓存
        self.cache.invalidate(self.workspace_path)
        
        # 重置状态
        self.soul_content = None
        self.soul_data = None
        
        # 重新加载
        return self.load()
    
    def get_identity_summary(self) -> str:
        """
        获取身份摘要（用于显示）
        
        Returns:
            str: 身份摘要字符串
        """
        if self.soul_data is None:
            if not self.load():
                return "未加载 SOUL.md"
        
        identity = self.soul_data.get("identity", {})
        parts = []
        
        if identity.get("name"):
            parts.append(f"Name: {identity['name']}")
        if identity.get("creature"):
            parts.append(f"Creature: {identity['creature']}")
        if identity.get("vibe"):
            parts.append(f"Vibe: {identity['vibe']}")
        if identity.get("emoji"):
            parts.append(f"Emoji: {identity['emoji']}")
        
        if not parts:
            return "无身份信息"
        
        return " | ".join(parts)
    
    def get_soul_path(self) -> str:
        """获取 SOUL.md 文件路径"""
        return self.soul_path
    
    def has_soul(self) -> bool:
        """检查是否存在 SOUL.md 文件"""
        return os.path.exists(self.soul_path)
    
    def get_cache_status(self) -> dict:
        """获取缓存状态（用于调试）"""
        cache_info = self.cache.get_cache_info(self.workspace_path)
        if cache_info:
            return {
                "cached": True,
                **cache_info
            }
        return {
            "cached": False
        }
