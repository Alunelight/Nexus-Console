# Nexus Console API

基于 FastAPI 的高性能异步 Python 后端。

## 技术栈

- **Python**: 3.13+
- **FastAPI**: 0.127+
- **SQLAlchemy**: 2.0+ (异步模式)
- **Pydantic**: v2
- **PostgreSQL**: 16+ (通过 asyncpg)
- **Redis**: 7+
- **Celery**: 5.6+
- **Alembic**: 数据库迁移
- **Ruff**: 代码检查和格式化
- **MyPy**: 静态类型检查

## 快速开始

### 安装依赖

```bash
uv sync
uv sync --extra dev  # 安装开发依赖
```

### 配置环境变量

复制 `.env.example` 到 `.env` 并修改配置：

```bash
cp .env.example .env
```

### 运行开发服务器

```bash
pnpm dev
# 或
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API 将在 http://localhost:8000 运行

- API 文档: http://localhost:8000/docs
- 健康检查: http://localhost:8000/health

### 数据库迁移

```bash
# 生成迁移文件
pnpm migration:generate -m "描述"

# 应用迁移
pnpm migration:upgrade

# 回滚迁移
pnpm migration:downgrade
```

## 开发命令

```bash
pnpm dev              # 启动开发服务器
pnpm start            # 启动生产服务器
pnpm lint             # 代码检查
pnpm format           # 代码格式化
pnpm type-check       # 类型检查
```

## 项目结构

```
app/
├── main.py           # FastAPI 应用入口
├── config.py         # 配置管理
├── database.py       # 数据库连接
├── models/           # SQLAlchemy 模型
├── schemas/          # Pydantic 模型
├── api/              # API 路由
│   └── v1/
├── core/             # 核心功能
└── tests/            # 测试
```

## 代码规范

- 使用 SQLAlchemy 2.0 异步模式
- 所有函数必须有类型注解
- 使用 Pydantic v2 语法
- 遵循 Ruff 代码规范
- 使用 `async/await` 异步模式
