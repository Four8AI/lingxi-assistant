---
name: xlsx
description: "Comprehensive spreadsheet creation, editing, and analysis with support for formulas, formatting, data analysis, and visualization. When Claude needs to work with spreadsheets (.xlsx, .xlsm, .csv, .tsv, etc) for: (1) Creating new spreadsheets with formulas and formatting, (2) Reading or analyzing data, (3) Modify existing spreadsheets while preserving formulas, (4) Data analysis and visualization in spreadsheets, or (5) Recalculating formulas"
version: "1.0.0"
trigger_conditions: "用户请求创建Excel表格、分析数据、重新计算公式、处理电子表格时触发"
execution_guidelines: "1. 返回xlsx技能的完整使用说明\n2. 提供公式重新计算工具\n3. 支持多种电子表格格式\n4. 支持数据分析和可视化"
author: "Anthropic"
license: Proprietary. LICENSE.txt has complete terms
---

# XLSX Skill Usage Guide

## Core Tools
- **pandas**: Data analysis, bulk operations, and simple data export
- **openpyxl**: Formulas, formatting, and Excel-specific features
- **recalc.py**: Recalculate formulas using LibreOffice (auto-configures on first run)

## Critical Requirements

### Use Excel Formulas (NOT Hardcoded Values)
Always use Excel formulas instead of calculating values in Python and hardcoding them.

❌ Wrong:
```python
total = df['Sales'].sum()
sheet['B10'] = total  # Hardcodes 5000
```

✅ Correct:
```python
sheet['B10'] = '=SUM(B2:B9)'  # Dynamic formula
```

### Formula Recalculation (MANDATORY)
After creating/editing files with formulas, you MUST recalculate:
```bash
python recalc.py output.xlsx [timeout_seconds]
```

The script returns JSON with error details. If `status` is `errors_found`, fix errors and recalculate again.

## Common Operations

### Read and Analyze Data
```python
import pandas as pd

# Read Excel
df = pd.read_excel('file.xlsx')  # First sheet
all_sheets = pd.read_excel('file.xlsx', sheet_name=None)  # All sheets

# Analyze
df.head()
df.info()
df.describe()

# Write
df.to_excel('output.xlsx', index=False)
```

### Create/Edit with Formulas
```python
from openpyxl import Workbook, load_workbook

# Create new
wb = Workbook()
sheet = wb.active
sheet['A1'] = 'Hello'
sheet['B1'] = '=SUM(A2:A10)'
wb.save('output.xlsx')

# Edit existing
wb = load_workbook('existing.xlsx')
sheet = wb.active
sheet['A1'] = 'New Value'
wb.save('modified.xlsx')
```

### Formatting
```python
from openpyxl.styles import Font, PatternFill, Alignment

sheet['A1'].font = Font(bold=True, color='FF0000')
sheet['A1'].fill = PatternFill('solid', start_color='FFFF00')
sheet['A1'].alignment = Alignment(horizontal='center')
sheet.column_dimensions['A'].width = 20
```

## Formula Verification Checklist

### Essential Checks
- [ ] Test 2-3 sample references before building full model
- [ ] Verify column mapping (column 64 = BL, not BK)
- [ ] Remember Excel rows are 1-indexed (DataFrame row 5 = Excel row 6)

### Common Pitfalls
- [ ] Handle NaN values with `pd.notna()`
- [ ] Check denominators before division to avoid #DIV/0!
- [ ] Verify all cell references exist to avoid #REF!
- [ ] Use correct format for cross-sheet references: `Sheet1!A1`

### Interpreting recalc.py Output
```json
{
  "status": "success",
  "total_errors": 0,
  "total_formulas": 42,
  "error_summary": {
    "#REF!": {"count": 2, "locations": ["Sheet1!B5"]}
  }
}
```

## Best Practices

### Library Selection
- Use **pandas** for data analysis and bulk operations
- Use **openpyxl** for complex formatting and formulas

### Working with openpyxl
- Cell indices are 1-based (row=1, column=1 = cell A1)
- Use `data_only=True` to read calculated values (warning: saves replace formulas with values)
- For large files: `read_only=True` for reading, `write_only=True` for writing

### Working with pandas
- Specify data types: `pd.read_excel('file.xlsx', dtype={'id': str})`
- Read specific columns: `pd.read_excel('file.xlsx', usecols=['A', 'C'])`
- Handle dates: `pd.read_excel('file.xlsx', parse_dates=['date_column'])`

### Code Style
- Write minimal, concise Python code without unnecessary comments
- Avoid verbose variable names and redundant operations
- Add comments to cells with complex formulas or important assumptions
- Document data sources for hardcoded values
