#!/bin/bash

echo "====================================="
echo "灵犀助手 E2E 联调测试"
echo "====================================="

# 检查后端服务
echo "检查后端服务..."
if ! curl -s http://localhost:5000/api/health > /dev/null; then
    echo "❌ 后端服务未运行，请先启动后端服务"
    echo "命令：cd /home/admin/lingxi-assistant && python3.10 -m lingxi -w"
    exit 1
fi
echo "✅ 后端服务正常"

# 运行 E2E 测试
echo "开始运行 E2E 测试..."
npx playwright test --config=playwright.e2e.config.ts \
    --reporter=list \
    --timeout=60000 \
    "$@"

# 显示测试结果
echo ""
echo "====================================="
echo "测试完成！"
echo "====================================="
echo "HTML 报告：test-results/e2e-report/index.html"
