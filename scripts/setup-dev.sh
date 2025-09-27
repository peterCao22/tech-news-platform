#!/bin/bash

# 科技新闻聚合平台 - 开发环境设置脚本
# 一键设置完整的开发环境

set -e

echo "🚀 科技新闻聚合平台 - 开发环境设置"
echo "======================================"

# 检查必要工具
check_requirements() {
    echo "📋 检查系统要求..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js 未安装。请安装 Node.js 18+ 版本"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo "❌ Node.js 版本过低。需要 18+ 版本，当前版本: $(node -v)"
        exit 1
    fi
    
    # 检查 pnpm
    if ! command -v pnpm &> /dev/null; then
        echo "📦 安装 pnpm..."
        npm install -g pnpm@8.15.0
    fi
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        echo "⚠️  Docker 未安装。某些功能可能无法使用"
    fi
    
    echo "✅ 系统要求检查完成"
}

# 安装依赖
install_dependencies() {
    echo "📦 安装项目依赖..."
    pnpm install --frozen-lockfile
    echo "✅ 依赖安装完成"
}

# 设置环境变量
setup_environment() {
    echo "🔧 设置环境变量..."
    
    if [ ! -f ".env" ]; then
        cp env.example .env
        echo "📝 已创建 .env 文件，请根据需要修改配置"
    fi
    
    if [ ! -f "apps/web/.env.local" ]; then
        cp env.example apps/web/.env.local
        echo "📝 已创建前端环境变量文件"
    fi
    
    echo "✅ 环境变量设置完成"
}

# 启动数据库服务
start_services() {
    echo "🗄️  启动数据库服务..."
    
    if command -v docker &> /dev/null; then
        if [ -f "docker-compose.yml" ]; then
            docker-compose up -d postgres redis
            echo "⏳ 等待数据库服务启动..."
            sleep 10
            echo "✅ 数据库服务已启动"
        else
            echo "⚠️  docker-compose.yml 未找到，跳过数据库启动"
        fi
    else
        echo "⚠️  Docker 未安装，请手动启动 PostgreSQL 和 Redis"
    fi
}

# 初始化数据库
init_database() {
    echo "🏗️  初始化数据库..."
    
    # 这里将来会添加数据库迁移命令
    # pnpm db:migrate
    # pnpm db:seed
    
    echo "✅ 数据库初始化完成（占位符）"
}

# 验证安装
verify_setup() {
    echo "🔍 验证开发环境..."
    
    # 类型检查
    echo "  - TypeScript 类型检查..."
    pnpm type-check || echo "⚠️  类型检查失败，请检查配置"
    
    # 代码检查
    echo "  - ESLint 代码检查..."
    pnpm lint || echo "⚠️  代码检查失败，请检查配置"
    
    echo "✅ 开发环境验证完成"
}

# 显示下一步操作
show_next_steps() {
    echo ""
    echo "🎉 开发环境设置完成！"
    echo "======================================"
    echo ""
    echo "下一步操作："
    echo "1. 检查并修改 .env 文件中的配置"
    echo "2. 启动开发服务器："
    echo "   pnpm dev"
    echo ""
    echo "3. 访问应用："
    echo "   前端: http://localhost:3000"
    echo "   API:  http://localhost:3001"
    echo ""
    echo "4. 数据库管理界面（可选）："
    echo "   pgAdmin: http://localhost:8080"
    echo "   Redis Commander: http://localhost:8081"
    echo ""
    echo "5. 其他有用命令："
    echo "   pnpm build    - 构建所有应用"
    echo "   pnpm test     - 运行测试"
    echo "   pnpm lint     - 代码检查"
    echo "   pnpm format   - 代码格式化"
    echo ""
}

# 主函数
main() {
    check_requirements
    install_dependencies
    setup_environment
    start_services
    init_database
    verify_setup
    show_next_steps
}

# 运行主函数
main
