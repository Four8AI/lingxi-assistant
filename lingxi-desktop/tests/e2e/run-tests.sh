#!/bin/bash

echo "====================================="
echo "灵犀助手 E2E 测试套件"
echo "====================================="
echo ""

# 检查显示服务器
if [ -z "$DISPLAY" ]; then
    echo "错误：未找到 DISPLAY 环境变量"
    echo "请使用 Xvfb 或在有显示服务器的环境运行"
    echo ""
    echo "示例用法:"
    echo "  xvfb-run -a $0"
    echo "  或 export DISPLAY=:0 && $0"
    exit 1
fi

echo "✓ 显示服务器检查通过 (DISPLAY=$DISPLAY)"
echo ""

# 检查后端服务
echo "检查后端服务状态..."
if ! curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "⚠ 警告：后端服务未运行，部分测试可能失败"
    echo "  启动后端服务：cd ../lingxi-backend && npm run dev"
else
    echo "✓ 后端服务运行正常"
fi
echo ""

# 检查 Node.js 版本
echo "检查 Node.js 环境..."
NODE_VERSION=$(node -v 2>/dev/null || echo "not installed")
if [ "$NODE_VERSION" = "not installed" ]; then
    echo "错误：Node.js 未安装"
    exit 1
fi
echo "✓ Node.js 版本：$NODE_VERSION"
echo ""

# 检查依赖
echo "检查项目依赖..."
if [ ! -d "node_modules" ]; then
    echo "错误：node_modules 不存在，请先运行 npm install"
    exit 1
fi
echo "✓ 项目依赖已安装"
echo ""

# 检查 Playwright
echo "检查 Playwright 浏览器..."
if ! npx playwright --version > /dev/null 2>&1; then
    echo "错误：Playwright 未正确安装"
    exit 1
fi
echo "✓ Playwright 已安装"
echo ""

# 创建测试结果目录
mkdir -p test-results/e2e
mkdir -p test-results/visual
mkdir -p test-results/integration
mkdir -p test-results/performance
echo "✓ 测试结果目录已准备"
echo ""

# 运行测试
echo "====================================="
echo "开始运行 E2E 测试..."
echo "====================================="
echo ""

# 设置测试参数
REPORTER="${REPORTER:-list}"
TIMEOUT="${TIMEOUT:-60000}"
PROJECT="${PROJECT:-chromium}"

# 运行测试
npx playwright test tests/e2e/ \
    --reporter=$REPORTER \
    --timeout=$TIMEOUT \
    --project=$PROJECT \
    "$@"

TEST_EXIT_CODE=$?

echo ""
echo "====================================="
echo "测试完成！"
echo "====================================="
echo ""

# 显示测试结果
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ 所有测试通过！"
else
    echo "❌ 部分测试失败，请检查上方输出"
fi

echo ""
echo "查看 HTML 报告:"
echo "  npx playwright show-report"
echo ""
echo "测试结果位置:"
echo "  test-results/"
echo "  playwright-report/"
echo ""

# 退出码
exit $TEST_EXIT_CODE
