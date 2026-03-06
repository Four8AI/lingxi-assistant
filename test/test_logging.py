import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from lingxi.utils.logging import setup_logging, get_logger
from lingxi.utils.config import get_config

print("开始测试日志功能...")

# 加载配置
config = get_config()
print(f"配置加载完成")

# 设置日志
setup_logging(config)
print("日志系统初始化完成")

# 获取日志记录器
logger = get_logger(__name__)

# 测试不同级别的日志
logger.debug("这是一条 DEBUG 日志")
logger.info("这是一条 INFO 日志")
logger.warning("这是一条 WARNING 日志")
logger.error("这是一条 ERROR 日志")
logger.critical("这是一条 CRITICAL 日志")

# 检查日志文件
log_config = config.get("logging", {})
log_file = log_config.get("file_path", "logs/assistant.log")
debug_log_file = os.path.join(os.path.dirname(log_file), "debug.log")

print(f"\n日志文件路径:")
print(f"  主日志: {log_file}")
print(f"  DEBUG日志: {debug_log_file}")

print(f"\n日志文件状态:")
print(f"  主日志存在: {os.path.exists(log_file)}")
print(f"  DEBUG日志存在: {os.path.exists(debug_log_file)}")

if os.path.exists(debug_log_file):
    print(f"\nDEBUG日志文件大小: {os.path.getsize(debug_log_file)} bytes")
    print(f"\nDEBUG日志最后10行:")
    with open(debug_log_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        for line in lines[-10:]:
            print(f"  {line.rstrip()}")

print("\n日志测试完成！")
