# Nexus Console

现代化全栈应用控制台，采用 Monorepo 架构。

## 技术栈

### 后端 (apps/api)

- Python 3.13+ / FastAPI / SQLAlchemy 2.0 (异步)
- PostgreSQL 16+ / Redis 7+ / Celery 5.6+
- Pydantic v2 / Alembic / Ruff / MyPy

### 前端 (apps/web)

- React 19 / TypeScript 5 / Vite 5
- TanStack Query v5 / TanStack Router
- Zustand / Tailwind CSS / React Hook Form + Zod

### 构建系统

- Turborepo 2.7+ / pnpm 10.26+ / uv (Python)

## 快速开始

### 安装依赖

```bash
# 安装前端依赖
pnpm install

# 安装后端依赖
cd apps/api && uv sync && uv sync --extra dev
```

### 配置环境变量

```bash
# 后端
cp apps/api/.env.example apps/api/.env

# 前端
cp apps/web/.env.example apps/web/.env
```

### 启动开发服务器

```bash
# 启动所有服务（需要 Turborepo）
pnpm dev

# 或分别启动
cd apps/api && pnpm dev    # 后端: http://localhost:8000
cd apps/web && pnpm dev    # 前端: http://localhost:5173
```

## 项目结构

```
nexus-console/
├── apps/
│   ├── api/              # FastAPI 后端
│   │   ├── app/          # 应用代码
│   │   ├── alembic/      # 数据库迁移
│   │   └── pyproject.toml
│   └── web/              # React 前端
│       ├── src/          # 源代码
│       └── package.json
├── .kiro/steering/       # AI 开发规则
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## 开发命令

```bash
# 根目录
pnpm dev              # 启动所有应用
pnpm build            # 构建所有应用
pnpm lint             # 检查所有应用

# 后端 (apps/api)
pnpm dev              # 启动开发服务器
pnpm lint             # 代码检查
pnpm format           # 代码格式化
pnpm type-check       # 类型检查

# 前端 (apps/web)
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本
pnpm lint             # ESLint 检查
```

## 开发环境要求

- Node.js 20+ LTS
- Python 3.13+
- pnpm 10.26+
- uv (Python 包管理器)
- PostgreSQL 16+
- Redis 7+

## 文档

- [后端文档](apps/api/README.md)
- [前端文档](apps/web/README.md)
- [技术栈说明](.kiro/steering/tech.md)
- [项目结构](.kiro/steering/structure.md)

## License

ISC
