# 修复 SkillRegistry 为单例模式

with open('lingxi/skills/registry.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 替换类定义部分
old_class_def = '''class SkillRegistry:
    """本地技能注册表（SQLite）"""

    def __init__(self, config: Dict[str, Any]):
        """初始化技能注册表

        Args:
            config: 系统配置
        """
        self.logger = logging.getLogger(__name__)
        
        db_path = config.get("skills", {}).get("db_path", "data/skills.db")
        self.db_path = db_path
        self.skill_cache: Dict[str, Dict[str, Any]] = {}
        
        self._init_db()
        self._load_to_cache()
        
        self.logger.debug(f"初始化技能注册表：{db_path}")'''

new_class_def = '''class SkillRegistry:
    """本地技能注册表（SQLite）（单例模式）"""
    
    _instance = None  # 单例实例
    
    def __new__(cls, config: Dict[str, Any]):
        """单例模式：确保只创建一个实例"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            # 初始化基本属性，确保即使跳过__init__也有默认值
            cls._instance.logger = logging.getLogger(__name__)
            cls._instance.db_path = None
            cls._instance.skill_cache = {}
        return cls._instance
    
    def __init__(self, config: Dict[str, Any]):
        # 防止重复初始化
        if hasattr(self, '_initialized'):
            return
        
        """初始化技能注册表

        Args:
            config: 系统配置
        """