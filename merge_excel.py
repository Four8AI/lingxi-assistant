import pandas as pd

# 读取两个 Excel 文件
df1 = pd.read_excel('员工信息表.xlsx')
df2 = pd.read_excel('人员信息.xlsx')

# 按姓名列合并
result = pd.merge(df1, df2, on='姓名', how='left')

# 保存结果
result.to_excel('合并结果.xlsx', index=False)

print('合并完成！')
print(f'结果行数：{len(result)}')
print(f'结果列名：{list(result.columns)}')
print(result)