# Agent提示词优化方案

## 📊 当前问题分析

### 问题1：重复内容（浪费约50 tokens）
- **历史上下文**和**用户输入**重复了相同的内容
- 示例：
  ```
  历史上下文:
  用户: 按姓名字段合并'人员信息.xlsx'、'员工信息表.xlsx' 两个表格，输出到合并表格

  用户输入:
  按姓名字段合并'人员信息.xlsx'、'员工信息表.xlsx' 两个表格，输出到合并表格
  ```

### 问题2：冗长的技能列表（浪费约800+ tokens）
- 每次请求都包含完整的10个技能描述
- 每个技能描述约80 tokens，10个技能约800 tokens
- 示例：
  ```
  1. create_file - Create a new file with specified content. Use this skill when user needs to create a new file, write content to a file, or save text to a file.
  2. delete_file - Delete a file. Use this skill when user needs to remove or delete a file from the filesystem.
  ...（共10个技能）
  ```

### 问题3：冗长的历史记录（每次增加约200-500 tokens）
- 每个步骤都包含完整的思考、行动和观察
- 错误输出（20+行）在后续步骤中完整保留
- 示例：
  ```
  步骤 1:
  思考: 用户要求按姓名字段合并两个Excel文件。首先我需要检查这两个文件是否存在于当前工作目录中，然后使用xlsx技能来读取和合并它们。
  行动: execute_command - command="Get-ChildItem -Path \"D:\resource\python\lingxi\" -Filter \"*.xlsx\" | Select-Object Name"
  观察: 命令执行失败 (检测到错误输出):

  Get-ChildItem : 路径中具有非法字符。
  所在位置 C:\Users\Administrator\AppData\Local\Temp\tmp7g16bh9z.ps1:5 字符: 1
  ...（20+行错误信息）
  ```

### 问题4：重复的示例和说明（浪费约180 tokens）
- 每次都包含相同的3个示例（约100 tokens）
- finish(answer)说明、重要提示每次都重复（约80 tokens）

### 问题5：不变的系统信息（浪费约80 tokens）
- 系统环境、工作目录、Shell类型在每次请求中都相同

## 💡 优化方案

### 优化1：去重（节省约50 tokens）
**策略**：如果历史上下文已经包含用户输入，就不重复

**实现**：
```python
# 去重：如果历史上下文已经包含用户输入，就不重复
if user_input in history_context:
    user_section = ""
else:
    user_section = f"""用户输入:
{user_input}
"""
```

**效果**：每次请求节省约50 tokens

### 优化2：智能技能列表（节省约600-700 tokens）
**策略**：根据任务类型只展示相关技能

**实现**：
```python
# 根据任务类型筛选相关技能
task_skill_map = {
    "file": ["create_file", "delete_file", "modify_file", "read_file"],
    "command": ["execute_command"],
    "web": ["fetch_webpage", "search"],
    "document": ["docx", "pdf", "xlsx"],
    "excel": ["xlsx"],
    "word": ["docx"],
    "pdf": ["pdf"],
}

# 根据任务关键词判断类型并筛选
relevant_skills = [skill for skill in skills if skill.get('name') in relevant_skill_names]
```

**效果**：每次请求节省约600-700 tokens（从800 tokens减少到100-200 tokens）

### 优化3：压缩历史记录（节省约300-400 tokens）
**策略**：
- 只保留最近2个步骤（原全部保留）
- 不包含思考过程（原包含）
- 压缩观察结果（只保留前100字符）

**实现**：
```python
# 只保留最近的max_steps个步骤
recent_steps = steps[-max_steps:]  # max_steps=2

# 压缩观察：只保留前100字符
short_obs = step.get('observation')[:100] + "..." if len(step.get('observation', '')) > 100 else step.get('observation')
```

**效果**：每次请求节省约300-400 tokens

### 优化4：移除重复的示例和说明（节省约180 tokens）
**策略**：将示例和说明移至系统提示词，只在首次请求时发送

**实现**：
```python
# 系统提示词（只发送一次）
SYSTEM_PROMPT = """你是灵犀智能助手，使用ReAct模式解决问题。

可用行动:
1. create_file - Create a new file with specified content
2. delete_file - Delete a file
...

输出格式:
思考: 你的思考过程
行动: 行动名称(参数)

重要提示:
- 当任务已经完成时，必须使用finish(answer)结束任务
- 不要在任务完成后继续执行其他行动
"""
```

**效果**：每次请求节省约180 tokens

### 优化5：系统信息优化（节省约80 tokens）
**策略**：只在首次请求时包含完整系统信息

**实现**：
```python
# 只在第一步包含完整系统信息
if is_first_step:
    system_section = f"""系统环境: {system_info['os_info']}
当前工作目录: {system_info['current_dir']}
Shell类型: {system_info['shell_type']}
"""
else:
    system_section = ""
```

**效果**：每次请求节省约80 tokens

### 优化6：减少历史上下文数量（节省约20 tokens）
**策略**：从5条历史减少到3条

**实现**：
```python
def format_history_context(session_history: List[Dict[str, str]], max_count: int = 3) -> str:
    # max_count从5改为3
```

**效果**：每次请求节省约20 tokens

## 📈 优化效果预估

### 单次请求Token节省

| 优化项 | 节省Token | 累计节省 |
|--------|-----------|----------|
| 去重（历史上下文和用户输入） | 50 | 50 |
| 智能技能列表（10个→2-3个） | 600-700 | 650-750 |
| 压缩历史记录（全部→2步） | 300-400 | 950-1150 |
| 移除重复的示例和说明 | 180 | 1130-1330 |
| 系统信息优化（每次→首次） | 80 | 1210-1410 |
| 减少历史上下文数量（5→3） | 20 | 1230-1430 |

### 多步骤任务总节省

假设一个任务需要5步完成：

- **优化前**：每步约1500-1800 tokens
- **优化后**：每步约300-500 tokens
- **总节省**：约6000-6500 tokens（节省约70-80%）

### 成本节省

假设使用Qwen3.5-Plus模型（约0.002元/1K tokens）：

- **单次任务节省**：约0.012-0.013元
- **100次任务节省**：约1.2-1.3元
- **1000次任务节省**：约12-13元

## 🔧 实现方案

### 方案1：渐进式优化（推荐）

**步骤1**：实现去重和系统信息优化
- 实现简单，风险低
- 预期节省：约130 tokens/次

**步骤2**：实现智能技能列表
- 需要测试任务类型判断逻辑
- 预期节省：约650-750 tokens/次

**步骤3**：实现历史记录压缩
- 需要观察是否影响推理质量
- 预期节省：约300-400 tokens/次

**步骤4**：移除重复的示例和说明
- 需要修改系统提示词发送逻辑
- 预期节省：约180 tokens/次

### 方案2：一次性优化

直接应用所有优化，但需要充分测试。

## ⚠️ 注意事项

1. **测试验证**：优化后需要测试多个任务类型，确保推理质量不受影响
2. **渐进部署**：建议先在测试环境验证，再逐步部署到生产环境
3. **监控指标**：部署后监控任务成功率、平均步骤数、平均Token消耗等指标
4. **回滚方案**：保留原版本代码，以便快速回滚

## 📝 实现建议

### 优先级排序

1. **高优先级**：去重、系统信息优化（简单、效果明显）
2. **中优先级**：智能技能列表、历史记录压缩（中等复杂度、效果明显）
3. **低优先级**：移除重复的示例和说明（需要较大改动）

### 测试用例

1. 简单任务（1-2步）：验证基本功能
2. 中等任务（3-5步）：验证历史记录压缩效果
3. 复杂任务（5-10步）：验证多步骤任务效果
4. 不同任务类型：验证智能技能列表效果

### 监控指标

1. 任务成功率
2. 平均步骤数
3. 平均Token消耗
4. 平均响应时间
5. 用户满意度

## 🎯 总结

通过以上优化，预期可以实现：

- **Token节省**：约70-80%
- **成本节省**：约70-80%
- **响应速度**：提升约30-50%（由于Token减少）
- **推理质量**：保持不变或略有提升（由于更聚焦的上下文）

建议采用**渐进式优化**方案，逐步实施并验证效果。
