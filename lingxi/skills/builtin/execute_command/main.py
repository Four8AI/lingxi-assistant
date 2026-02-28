#!/usr/bin/env python3
"""Execute command skill implementation"""

import logging
import locale
import os
import platform
import subprocess
import tempfile
import re
from typing import Dict, Any


def _fix_over_escaped_paths(command: str) -> str:
    """修复过度转义的路径

    Args:
        command: 原始命令字符串

    Returns:
        修复后的命令字符串
    """
    import re
    
    # 修复 Python 字符串中的过度转义路径
    # 问题：LLM 生成的命令在 JSON 传输过程中被过度转义
    # 例如：'D:\\\\resource\\\\python\\\\lingxi' 应该是 'D:\\resource\\python\\lingxi'
    
    # 使用更精确的修复策略：匹配整个路径中的过度转义
    # 路径模式：D:\\\\resource\\\\python\\\\lingxi -> D:\\resource\\python\\lingxi
    
    # 匹配 Windows 路径模式（驱动器字母 + 冒号 + 反斜杠 + 路径）
    # 使用 [^"\'\s\\]* 来匹配路径中的非特殊字符部分
    path_pattern = r'([A-Za-z]):(\\\\+)((?:[^"\'\s\\]+(?:\\\\+)?)+)'
    
    def fix_path(match):
        drive = match.group(1)
        backslashes = match.group(2)
        rest = match.group(3)
        
        # 计算需要的反斜杠数量（2个反斜杠 = 1个实际反斜杠）
        # 如果有4个或更多反斜杠，将其减半
        while len(backslashes) > 2:
            backslashes = backslashes[:len(backslashes)//2]
        
        # 确保至少有2个反斜杠（表示1个实际反斜杠）
        if len(backslashes) < 2:
            backslashes = '\\\\'
        
        # 修复路径中间的过度转义
        # 将 rest 中的 \\\\ 替换为 \\
        rest = re.sub(r'\\\\+', lambda m: '\\\\' if len(m.group()) > 2 else m.group(), rest)
        
        return f'{drive}:{backslashes}{rest}'
    
    # 应用修复
    command = re.sub(path_pattern, fix_path, command)
    
    return command


def execute(parameters: Dict[str, Any]) -> str:
    """Execute command

    Args:
        parameters: Parameters dictionary
            - command: Command to execute (required)
            - shell_type: Shell type (optional, default: auto-detect)
            - cwd: Working directory (optional, default: current directory)

    Returns:
        Command output
    """
    logger = logging.getLogger(__name__)

    command = parameters.get("command")
    shell_type = parameters.get("shell_type")
    cwd = parameters.get("cwd")

    if not command:
        return "错误: 缺少命令"

    # 修复过度转义的路径
    command = _fix_over_escaped_paths(command)

    logger.debug(f"执行命令: {command}")

    try:
        if shell_type is None:
            shell_type = "powershell" if platform.system() == "Windows" else "bash"

        if cwd is None:
            cwd = os.getcwd()

        encoding = 'utf-8'
        if shell_type == "powershell":
            encoding = locale.getpreferredencoding() or 'gbk'
            
            # 检查是否是 Python 代码（以 python -c 开头）
            python_match = re.match(r'^python\s+-c\s+(["\'])(.*?)\1\s*$', command, re.DOTALL)
            if python_match:
                quote_char = python_match.group(1)
                python_code = python_match.group(2)
                
                # 将 Python 代码写入临时文件
                with tempfile.NamedTemporaryFile(mode='w', suffix='.py', encoding='utf-8', delete=False) as f:
                    f.write(python_code)
                    temp_python_file = f.name
                
                try:
                    # 执行临时 Python 文件
                    process = subprocess.Popen(
                        ["python", temp_python_file],
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        cwd=cwd
                    )
                    stdout_bytes, stderr_bytes = process.communicate(timeout=30)
                    
                    # 尝试用 UTF-8 解码，如果失败则用 GBK
                    try:
                        stdout = stdout_bytes.decode('utf-8')
                        stderr = stderr_bytes.decode('utf-8')
                    except UnicodeDecodeError:
                        stdout = stdout_bytes.decode('gbk', errors='replace')
                        stderr = stderr_bytes.decode('gbk', errors='replace')
                    
                    # 合并 stdout 和 stderr 以便检查错误
                    full_output = stdout + stderr
                    
                    # 检查输出中是否包含 Python 错误信息
                    python_error_indicators = ['ModuleNotFoundError', 'ImportError', 'SyntaxError', 'NameError', 'Traceback', 'File "<string>"']
                    if any(indicator in full_output for indicator in python_error_indicators):
                        # 如果输出中包含 Python 错误信息，即使返回码为0也视为失败
                        return f"命令执行失败 (检测到错误):\n\n{full_output}"
                    
                    # 检查是否有 stderr 输出
                    if stderr.strip():
                        return f"命令执行失败 (检测到错误输出):\n\n{full_output}"
                    
                    if process.returncode == 0:
                        return f"命令执行成功:\n\n{stdout}"
                    else:
                        return f"命令执行失败 (返回码: {process.returncode}):\n\n{stderr}"
                finally:
                    # 清理临时文件
                    try:
                        os.unlink(temp_python_file)
                    except:
                        pass
            else:
                # 使用临时文件来避免转义问题
                # 使用 UTF-8 BOM 编码以确保 PowerShell 正确识别中文
                with tempfile.NamedTemporaryFile(mode='w', suffix='.ps1', encoding='utf-8-sig', delete=False) as f:
                    # 设置输出编码为 UTF-8
                    f.write('[Console]::OutputEncoding = [System.Text.Encoding]::UTF8\n')
                    f.write('$OutputEncoding = [System.Text.Encoding]::UTF8\n')
                    f.write('[Console]::InputEncoding = [System.Text.Encoding]::UTF8\n')
                    f.write('chcp 65001 | Out-Null\n')
                    f.write(command)
                    f.write('\n')
                    f.write('if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }\n')
                    f.write('if ($error.Count -gt 0) { exit 1 }\n')
                    temp_file = f.name
                
                try:
                    process = subprocess.Popen(
                        ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", temp_file],
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        cwd=cwd
                    )
                    stdout_bytes, stderr_bytes = process.communicate(timeout=30)
                    
                    # 尝试用 UTF-8 解码，如果失败则用 GBK
                    try:
                        stdout = stdout_bytes.decode('utf-8')
                        stderr = stderr_bytes.decode('utf-8')
                    except UnicodeDecodeError:
                        stdout = stdout_bytes.decode('gbk', errors='replace')
                        stderr = stderr_bytes.decode('gbk', errors='replace')
                    
                    # 合并 stdout 和 stderr 以便检查错误
                    full_output = stdout + stderr
                    
                    # 检查输出中是否包含 Python 错误信息
                    python_error_indicators = ['ModuleNotFoundError', 'ImportError', 'SyntaxError', 'NameError', 'Traceback', 'File "<string>"']
                    if any(indicator in full_output for indicator in python_error_indicators):
                        # 如果输出中包含 Python 错误信息，即使返回码为0也视为失败
                        return f"命令执行失败 (检测到错误):\n\n{full_output}"
                    
                    # 检查是否有 stderr 输出
                    if stderr.strip():
                        return f"命令执行失败 (检测到错误输出):\n\n{full_output}"
                finally:
                    # 清理临时文件
                    try:
                        os.unlink(temp_file)
                    except:
                        pass
        else:
            process = subprocess.Popen(
                ["bash", "-c", command],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=cwd
            )
            stdout_bytes, stderr_bytes = process.communicate(timeout=30)
            
            # 尝试用 UTF-8 解码，如果失败则用系统默认编码
            try:
                stdout = stdout_bytes.decode('utf-8')
                stderr = stderr_bytes.decode('utf-8')
            except UnicodeDecodeError:
                stdout = stdout_bytes.decode(locale.getpreferredencoding(), errors='replace')
                stderr = stderr_bytes.decode(locale.getpreferredencoding(), errors='replace')

        # 合并 stdout 和 stderr 以便检查错误
        full_output = stdout + stderr
        
        # 检查输出中是否包含 Python 错误信息
        python_error_indicators = ['ModuleNotFoundError', 'ImportError', 'SyntaxError', 'NameError', 'Traceback', 'File "<string>"']
        if any(indicator in full_output for indicator in python_error_indicators):
            # 如果输出中包含 Python 错误信息，即使返回码为0也视为失败
            return f"命令执行失败 (检测到错误):\n\n{full_output}"
        
        # 检查是否有 stderr 输出
        if stderr.strip():
            return f"命令执行失败 (检测到错误输出):\n\n{full_output}"

        if process.returncode == 0:
            return f"命令执行成功:\n\n{stdout}"
        else:
            return f"命令执行失败 (返回码: {process.returncode}):\n\n{stderr}"
    except subprocess.TimeoutExpired:
        return "错误: 命令执行超时（30秒）"
    except Exception as e:
        logger.error(f"执行命令失败: {e}")
        return f"执行命令失败: {str(e)}"
