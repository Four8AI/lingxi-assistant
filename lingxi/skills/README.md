# 技能目录结构说明

## 目录结构

```
lingxi/
├── skills/
│   └── builtin/              # 内置技能目录（系统自带，更新时会被覆盖）
│       ├── search/           # 网络搜索技能
│       ├── calculator/       # 数学计算技能
│       ├── weather/          # 天气查询技能
│       ├── time/             # 时间查询技能
│       ├── date/             # 日期查询技能
│       ├── create_file/      # 创建文件技能
│       ├── delete_file/      # 删除文件技能
│       ├── execute_command/  # 执行命令技能
│       ├── modify_file/      # 修改文件技能
│       ├── fetch_webpage/    # 获取网页技能
│       └── read_file/        # 读取文件技能
│
.lingxi/
└── skills/                   # 用户技能目录（用户自定义，更新时不会被覆盖）
    ├── docx/                # DOCX文档处理技能
    ├── pdf/                 # PDF文档处理技能
    ├── xlsx/                # Excel表格处理技能
    └── ...                  # 用户自定义技能
```

## 技能分类

### 内置技能
- **位置**: `lingxi/skills/builtin/`
- **特点**: 系统自带，随版本更新
- **用途**: 提供基础功能，如搜索、计算、时间查询、文件操作等
- **管理**: 由系统维护，用户不应修改

### 用户技能
- **位置**: `.lingxi/skills/`
- **特点**: 用户自定义，独立于系统更新
- **用途**: 扩展功能，如文档处理、数据分析等
- **管理**: 用户可自由添加、修改、删除

## 配置说明

在 `config.yaml` 中配置技能目录：

```yaml
skills:
  registry_path: "data/skills.db"
  builtin_skills_dir: "lingxi/skills/builtin"
  user_skills_dir: ".lingxi/skills"
  builtin_skills: ["search", "calculator", "weather", "time", "date", 
                   "create_file", "delete_file", "execute_command", 
                   "modify_file", "fetch_webpage", "read_file"]
```

## 添加用户技能

1. 在 `.lingxi/skills/` 目录下创建新技能目录
2. 创建 `SKILL.md` 文件（MCP格式）或 `skill.json` 文件（传统格式）
3. 创建 `main.py` 文件实现技能逻辑（可选）
4. 重启系统，技能会自动注册

## 技能格式

### MCP格式（推荐）
- 使用 `SKILL.md` 文件
- 支持 YAML frontmatter 配置
- 适合复杂技能

### 传统格式
- 使用 `skill.json` 文件
- JSON 格式配置
- 适合简单技能

## 注意事项

1. **不要修改内置技能**: 内置技能会随系统更新被覆盖
2. **用户技能独立**: 用户技能不会被系统更新影响
3. **技能命名**: 避免与内置技能重名
4. **依赖管理**: 每个技能可包含 `requirements.txt` 文件
