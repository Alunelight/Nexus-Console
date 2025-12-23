#!/bin/bash

set -e

echo "🚀 Setting up Nexus Console development environment..."
echo ""

# 检查依赖
echo "📋 Checking dependencies..."

if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm not installed. Please install: npm install -g pnpm"
    exit 1
fi
echo "✅ pnpm found: $(pnpm --version)"

if ! command -v uv &> /dev/null; then
    echo "❌ uv not installed. Please install: https://docs.astral.sh/uv/getting-started/installation/"
    exit 1
fi
echo "✅ uv found: $(uv --version)"

if ! command -v docker &> /dev/null; then
    echo "⚠️  docker not found. You'll need Docker to run databases."
fi

echo ""
echo "📦 Installing dependencies..."

# 安装前端依赖
echo "  → Installing frontend dependencies..."
pnpm install --frozen-lockfile

# 安装后端依赖
echo "  → Installing backend dependencies..."
pnpm --filter api install:deps

echo ""
echo "⚙️  Setting up environment variables..."

# 复制环境变量文件
if [ ! -f apps/api/.env ]; then
    cp apps/api/.env.example apps/api/.env
    echo "  → Created apps/api/.env"
    echo "  ⚠️  Please update SECRET_KEY in apps/api/.env"
else
    echo "  → apps/api/.env already exists"
fi

if [ ! -f apps/web/.env ]; then
    if [ -f apps/web/.env.example ]; then
        cp apps/web/.env.example apps/web/.env
        echo "  → Created apps/web/.env"
    fi
else
    echo "  → apps/web/.env already exists"
fi

echo ""
echo "🐘 Starting databases..."

# 启动数据库
if command -v docker &> /dev/null; then
    docker compose -f docker-compose.dev.yml up -d postgres redis
    echo "  → PostgreSQL and Redis started"
    
    echo ""
    echo "⏳ Waiting for database to be ready..."
    sleep 5
    
    echo ""
    echo "🔄 Running database migrations..."
    pnpm --filter api db:migrate
else
    echo "  ⚠️  Docker not found. Please start PostgreSQL and Redis manually."
fi

echo ""
echo "🔄 Syncing types..."
pnpm types:sync

echo ""
echo "✅ Development environment ready!"
echo ""
echo "📝 Next steps:"
echo "  1. Update SECRET_KEY in apps/api/.env (generate with: python -c 'import secrets; print(secrets.token_urlsafe(32))')"
echo "  2. Run 'pnpm dev' to start all services"
echo "  3. Visit http://localhost:5173 for frontend"
echo "  4. Visit http://localhost:8000/docs for API docs"
echo ""
