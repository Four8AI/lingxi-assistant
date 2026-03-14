#!/usr/bin/env python3
"""技能系统统一入口，管理所有技能相关组件"""

import logging
from typing import Dict, List, Optional, Any
from lingxi.skills.registry import SkillRegistry
from lingxi.skills.registry_memory import SkillRegistry as SkillRegistryMemory
from lingxi.skills.skill_loader import SkillLoader
from lingxi.skills.skill_cache import SkillCache
from lingxi.core.utils.security import SecuritySandbox


class SkillSystem:
    """技能系统统一入口（单例模式）"""
    
    _instance = None
    _initialized = False
    
    def __new__(cls, config: Dict[str, Any]):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self, config: Dict[str, Any]):
        # 防止重复初始化
        if self._initialized:
            return
        
        self.config = config
        self.logger = logging.getLogger(__name__)
        self.logger.info("初始化技能系统...")
        
        # 1. 初始化注册表
        skills_config = config.get("skills", {})
        use_memory = skills_config.get("use_memory_registry", True)
        
        if use_memory:
            self.logger.debug("使用纯内存注册表")
            self.registry = SkillRegistryMemory(config)
        else:
            self.logger.debug("使用 SQLite 数据库注册表")
            self.registry = SkillRegistry(config)
        
        # 2. 初始化缓存
        cache_ttl = skills_config.get("cache_ttl", 300)
        self.cache = SkillCache(ttl=cache_ttl)
        self.logger.debug(f"技能缓存已初始化，TTL={cache_ttl}秒")
        
        # 3. 初始化技能加载器（使用统一的注册表和缓存）
        self.loader = SkillLoader(config, self.registry, self.cache)
        
        # 4. 初始化安全沙箱
        security_config = config.get("security", {})
        self.sandbox = SecuritySandbox(
            workspace_root=security_config.get("workspace_root", "./workspace"),
            max_file_size=security_config.get("max_file_size", 10 * 1024 * 1024),
            allowed_commands=security_config.get("allowed_commands"),
            safety_mode=security_config.get("safety_mode", True)
        )
        self.logger.debug("安全沙箱已初始化")
        
        # 5. 扫描并注册技能
        self._load_skills()
        
        self._initialized = True
        self.logger.info(f"技能系统初始化完成，已注册 {len(self.registry.list_skills())} 个技能")
    
    def _load_skills(self):
        """加载并注册所有技能"""
        self.logger.info("开始扫描和注册技能...")
        count = self.loader.scan_and_register(self.registry)
        self.logger.info(f"技能加载完成，成功注册 {count} 个技能")
    
    def execute_skill(self, skill_name: str, parameters: Dict[str, Any] = None) -> str:
        """执行技能（统一入口）"""
        if parameters is None:
            parameters = {}
        
        self.logger.debug(f"执行技能：{skill_name}")
        
        # 1. 检查技能是否存在
        skill_info = self.registry.get_skill(skill_name)
        if not skill_info:
            return f"错误：技能不存在 - {skill_name}"
        
        # 2. 检查技能是否启用
        if not skill_info.get("enabled", True):
            return f"错误：技能未启用 - {skill_name}"
        
        # 3. 执行技能
        try:
            result = self.loader.execute_local_skill(skill_name, parameters)
            self.logger.debug(f"技能执行成功：{skill_name}")
            return result
        except Exception as e:
            self.logger.error(f"技能执行失败：{skill_name} - {e}")
            return f"错误：技能执行失败 - {str(e)}"
    
    def get_skill_info(self, skill_name: str) -> Optional[Dict[str, Any]]:
        """获取技能信息"""
        return self.registry.get_skill(skill_name)
    
    def list_skills(self, enabled_only: bool = True) -> List[Dict[str, Any]]:
        """列出所有技能"""
        return self.registry.list_skills(enabled_only=enabled_only)
    
    def reload_skill(self, skill_name: str) -> bool:
        """重新加载技能（用于热重载）"""
        self.logger.info(f"重新加载技能：{skill_name}")
        self.cache.invalidate(skill_name)
        
        # 重新扫描注册
        skill_info = self.registry.get_skill(skill_name)
        if skill_info:
            self.registry.unregister_skill(skill_name)
        
        self._load_skills()
        return True
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """获取缓存统计信息"""
        return self.cache.get_stats()
    
    def clear_cache(self):
        """清空缓存"""
        self.cache.invalidate_all()
