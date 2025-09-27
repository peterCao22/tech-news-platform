#!/bin/bash

# 科技新闻聚合平台 - 构建脚本
# 构建所有应用和包

set -e

echo "🏗️  科技新闻聚合平台 - 构建脚本"
echo "=================================="

# 清理之前的构建
clean_build() {
    echo "🧹 清理之前的构建..."
    pnpm clean
    echo "✅ 清理完成"
}

# 类型检查
type_check() {
    echo "🔍 TypeScript 类型检查..."
    pnpm type-check
    echo "✅ 类型检查通过"
}

# 代码检查
lint_check() {
    echo "📝 ESLint 代码检查..."
    pnpm lint
    echo "✅ 代码检查通过"
}

# 构建共享包
build_packages() {
    echo "📦 构建共享包..."
    pnpm build --filter="./packages/*"
    echo "✅ 共享包构建完成"
}

# 构建应用
build_apps() {
    echo "🚀 构建应用..."
    pnpm build --filter="./apps/*"
    echo "✅ 应用构建完成"
}

# 运行测试
run_tests() {
    echo "🧪 运行测试..."
    pnpm test
    echo "✅ 测试通过"
}

# 生成构建报告
generate_report() {
    echo "📊 生成构建报告..."
    
    BUILD_TIME=$(date)
    BUILD_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    
    cat > build-report.txt << EOF
科技新闻聚合平台 - 构建报告
================================

构建时间: $BUILD_TIME
Git 提交: $BUILD_HASH
Node.js 版本: $(node -v)
pnpm 版本: $(pnpm -v)

构建产物:
- apps/web/.next/
- apps/api/dist/
- apps/functions/dist/
- packages/*/dist/

构建状态: ✅ 成功
EOF
    
    echo "✅ 构建报告已生成: build-report.txt"
}

# 主函数
main() {
    clean_build
    type_check
    lint_check
    build_packages
    build_apps
    run_tests
    generate_report
    
    echo ""
    echo "🎉 构建完成！"
    echo "所有应用和包已成功构建"
}

# 检查参数
if [ "$1" = "--skip-tests" ]; then
    run_tests() {
        echo "⏭️  跳过测试"
    }
fi

if [ "$1" = "--skip-lint" ]; then
    lint_check() {
        echo "⏭️  跳过代码检查"
    }
fi

# 运行主函数
main
