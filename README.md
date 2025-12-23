# Nexus Console

现代化全栈应用控制台，采用 Monorepo 架构。

## ✨ 特性

- 🔒 **生产就绪**: Docker 容器化、CI/CD 自动化、安全配置完善
- 🚀 **高性能**: 数据库连接池、GZip 压缩、API 限流
- ✅ **测试完善**: 前后端测试框架配置完成，覆盖率 80%+
- 🛠️ **开发体验**: Git hooks、commitlint、VSCode 配置、快速启动脚本
- 📚 **文档完整**: 贡献指南、安全政策、详细的技术文档

## 技术栈

### 后端 (apps/api)

- Python 3.13+ / FastAPI / SQLAlchemy 2.0 (异步)
- PostgreSQL 16+ / Redis 7+ / Celery 5.6+
- Pydantic v2 / Alembic / Ruff / MyPy
- structlog (结构化日志) / pytest (测试)
- slowapi (API 限流)

### 前端 (apps/web)

- React 19 / TypeScript 5 / Vite 5
- TanStack Query v5 / TanStack Router
- Zustand / Tailwind CSS 4 / shadcn/ui
- React Hook Form + Zod / Vitest (测试)
- date-fns / sonner / lucide-react

### 构建系统

- Turborepo 2.7+ / pnpm 10.26+ / uv (Python)
- Docker / docker-compose / GitHub Actions

## 快速开始

### 方式一：自动化脚本（推荐）

```bash
# 运行开发环境设置脚本
./scripts/dev-setup.sh
```

### 方式二：手动安装

#### 1. 安装依赖

```bash
# 安装前端依赖
pnpm install

# 安装后端依赖（在 apps/api 目录下）
uv sync --extra dev
```

#### 2. 配置环境变量

```bash
# 后端
cp apps/api/.env.example apps/api/.env
# 生成安全的 SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"
# 将生成的密钥填入 apps/api/.env 的 SECRET_KEY

# 前端（如果有 .env.example）
cp apps/web/.env.example apps/web/.env
```

#### 3. 启动数据库

```bash
# 使用 docker-compose 启动
docker compose -f docker-compose.dev.yml up -d
```

#### 4. 运行数据库迁移

```bash
pnpm --filter api db:migrate
```

#### 5. 同步前后端类型

```bash
pnpm types:sync
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
pnpm test             # 运行所有测试
pnpm types:sync       # 同步前后端类型（OpenAPI → TypeScript）

# 后端 (apps/api)
pnpm --filter api dev              # 启动开发服务器
pnpm --filter api test             # 运行测试
pnpm --filter api test:coverage    # 测试覆盖率
pnpm --filter api lint             # 代码检查
pnpm --filter api format           # 代码格式化
pnpm --filter api type-check       # 类型检查
pnpm --filter api openapi:export   # 导出 OpenAPI 规范
pnpm --filter api db:migrate       # 运行数据库迁移

# 前端 (apps/web)
pnpm --filter web dev              # 启动开发服务器
pnpm --filter web build            # 构建生产版本
pnpm --filter web test             # 运行测试
pnpm --filter web test:ui          # 测试 UI 模式
pnpm --filter web test:coverage    # 测试覆盖率
pnpm --filter web lint             # ESLint 检查
pnpm --filter web api:generate     # 从 OpenAPI 生成 API 客户端
```

## 前后端类型同步

本项目实现了自动化的前后端类型同步机制：

```bash
# 一键同步前后端类型
pnpm types:sync
```

工作流程：

1. 后端通过 Pydantic 模型和 FastAPI 路由定义 API
2. 导出 OpenAPI 规范 (`openapi.json`)
3. Orval 读取规范并生成类型安全的 TypeScript 客户端
4. 前端获得完整的类型支持和 TanStack Query Hooks

详细文档：[前后端类型同步](docs/TYPE_SYNC.md)

## 部署

### Docker 部署

```bash
# 开发环境
docker compose -f docker-compose.dev.yml up

# 生产环境
docker compose up -d
```

### 环境变量

生产环境必须配置的环境变量：

```bash
# apps/api/.env
SECRET_KEY=<生成的安全密钥>  # 至少 32 字符
DEBUG=False
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db
REDIS_URL=redis://host:6379/0
```

## CI/CD

项目配置了 GitHub Actions 自动化流程：

- ✅ 后端代码检查（Ruff + MyPy）
- ✅ 后端测试 + 覆盖率报告
- ✅ 前端代码检查（ESLint + TypeScript）
- ✅ 前端构建验证
- ✅ Docker 镜像构建测试

## 贡献

欢迎贡献！请阅读 [贡献指南](CONTRIBUTING.md) 了解详情。

提交代码前请确保：

- ✅ 所有测试通过
- ✅ 代码检查通过
- ✅ 提交消息符合 [Conventional Commits](https://www.conventionalcommits.org/)
- ✅ 运行了 `pnpm types:sync`（如果修改了后端 API）

## 安全

如果发现安全漏洞，请查看 [安全政策](SECURITY.md) 了解报告流程。

## 开发环境要求

- Node.js 20+ LTS
- Python 3.13+
- pnpm 10.26+
- uv (Python 包管理器)
- PostgreSQL 16+
- Redis 7+
- Docker (可选，用于容器化部署)

## 文档

- [贡献指南](CONTRIBUTING.md) 📝
- [安全政策](SECURITY.md) 🔒
- [项目审计报告](docs/PROJECT_AUDIT_REPORT.md) 📊
- [前后端类型同步](docs/TYPE_SYNC.md) ⭐
- [后端文档](apps/api/README.md)
- [前端文档](apps/web/README.md)
- [技术栈说明](.kiro/steering/tech.md)
- [项目结构](.kiro/steering/structure.md)
- [后端开发规则](.kiro/steering/backend-rules.md)
- [前端开发规则](.kiro/steering/frontend-rules.md)
- [依赖管理规范](.kiro/steering/dependency-management.md)

## License

ISC
