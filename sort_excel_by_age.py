#!/usr/bin/env python3
"""读取Excel文件并按年龄倒序排序"""

import pandas as pd
import sys

def main():
    try:
        # 读取Excel文件
        df = pd.read_excel('员工信息表.xlsx')
        
        # 检查是否有年龄列
        if '年龄' not in df.columns:
            print('错误: Excel文件中没有"年龄"列')
            return 1
        
        # 按年龄倒序排序
        sorted_df = df.sort_values(by='年龄', ascending=False)
        
        # 输出结果
        print('按年龄倒序排序结果:')
        print('-' * 50)
        for idx, row in sorted_df.iterrows():
            # 假设文件中有姓名、年龄、婚姻状况等列
            name = row.get('姓名', '未知')
            age = row.get('年龄', '未知')
            marriage = row.get('婚姻状况', '未知')
            print(f'- {name}，{age}岁，{marriage}')
        print('-' * 50)
        
        return 0
    except Exception as e:
        print(f'错误: {str(e)}')
        return 1

if __name__ == '__main__':
    sys.exit(main())