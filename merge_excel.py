import pandas as pd

# 读取两个Excel文件
df1 = pd.read_excel('D:\\resource\\python\\lingxi\\人员信息.xlsx')
df2 = pd.read_excel('D:\\resource\\python\\lingxi\\员工信息表.xlsx')

print('=== 人员信息.xlsx ===')
print(df1)
print()
print('=== 员工信息表.xlsx ===')
print(df2)
print()

# 检查重复字段（除了合并键）
common_cols = set(df1.columns) & set(df2.columns)
merge_key = '姓名'
other_common_cols = common_cols - {merge_key}

if other_common_cols:
    print(f'发现重复字段（除合并键外）: {other_common_cols}')
else:
    print('除合并键外，无其他重复字段')

print()
print('正在执行合并操作...')

# 执行合并（横向合并，以姓名为键）
merged_df = df1.merge(df2, on='姓名', how='outer')

print()
print('=== 合并后的数据 ===')
print(merged_df)

# 保存到Excel文件
output_path = 'D:\\resource\\python\\lingxi\\合并后的人员信息.xlsx'
merged_df.to_excel(output_path, index=False)
print()
print(f'合并完成！已保存到: {output_path}')
