import pandas as pd
import os

# 创建测试数据
data = {
    '姓名': ['张三', '李四', '王五', '赵六', '钱七'],
    '年龄': [25, 30, 28, 35, 22],
    '部门': ['技术部', '市场部', '技术部', '人力资源部', '市场部'],
    '工资': [8000, 9000, 8500, 10000, 7500]
}

# 创建DataFrame
df = pd.DataFrame(data)

# 保存为Excel文件
file_path = '员工信息表.xlsx'
df.to_excel(file_path, index=False)

print(f"已创建测试Excel文件: {os.path.abspath(file_path)}")