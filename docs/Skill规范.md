📋 2026 Skill定义规范概览

一、Skill的本质
维度   说明
定义   给AI Agent使用的"可复用专业能力包"或"标准化SOP工具包"

核心理念   不是让AI变聪明，而是让AI变得可控

演进关系   2024提示词工程 → 2025上下文工程 → 2026技能工程

意义   标志AI应用从"对话交互"向"任务执行"的关键跃迁

二、标准目录结构

skill-folder-name/              # 技能根目录（小写下划线或短横线命名）
├── SKILL.md                    # ✅ 必选核心文件（固定命名，大写）
├── scripts/                    # 可选：自动化脚本目录
│   ├── data_processor.py       # Python数据处理脚本
│   └── format_checker.py       # 格式检查脚本
├── references/                 # 可选：参考文档目录
│   ├── api_reference.md        # API参考文档
│   └── data_schema.json        # 数据结构定义
└── assets/                     # 可选：资源文件目录
    └── templates/              # 模板文件

三、SKILL.md 核心字段规范
字段   必填   说明
name   ✅   技能唯一标识名

description   ✅   技能描述，决定技能能否被准确触发（语义理解，非关键词匹配）

version   ✅   版本号

trigger_conditions   ✅   触发条件

execution_guidelines   ✅   执行指引

author   ⭕   作者信息

references   ⭕   参考文档路径

⚠️ 注意：Agent Skills开放标准与不同平台实现在name字段上可能存在差异

四、主要平台支持情况
平台   支持情况   备注
Anthropic   ✅ 原生支持   开放标准制定者

Claude   ✅ 原生支持   Claude Skills

字节Coze   ✅ 支持   扣子Skill

谷歌Antigravity   ✅ 支持   2026年1月加入

Cursor   ✅ 支持   跟随标准

部分OpenAI生态   ⭕ 跟进中   -

五、Skill类型分类

纯提示词型 - 仅包含Prompt指令
资源辅助型 - 包含参考文档和数据结构
脚本运行型 - 包含可执行代码脚本

六、发展时间线
时间   事件
2025年10月16日   Anthropic发布Agent Skills开放标准

2025年11-12月   技能规范开放，生态快速扩展

2026年1月   产品更新+非编程场景落地，病毒式传播

2026年2月   GitHub官方Skills库近5万星标，技能商店超4800人安装的爆款应用

七、最佳实践建议

命名规范：使用小写下划线或短横线命名技能文件夹
描述质量：description字段质量直接决定技能触发准确率
模块化设计：能力原子化，可插拔、可移植
渐进式披露：突破Token限制的终极解决方案
