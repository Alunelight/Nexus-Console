# 部署文档

本文档介绍如何将 Nexus Console 部署到生产环境。

## 📋 目录

- [部署前准备](#部署前准备)
- [Docker 部署](#docker-部署)
- [环境变量配置](#环境变量配置)
- [数据库迁移](#数据库迁移)
- [监控和日志](#监控和日志)
- [故障排查](#故障排查)

---

## 🚀 部署前准备

### 系统要求

**最低配置**：

- CPU: 2 核
- 内存: 4GB
- 磁盘: 20GB
- 操作系统: Linux (Ubuntu 22.04+ 推荐)

**推荐配置**：

- CPU: 4 核
- 内存: 8GB
- 磁盘: 50GB SSD
- 操作系统: Linux (Ubuntu 22.04+ 推荐)

### 软件依赖

- Docker 24.0+
- Docker Compose 2.20+
- Git

### 安装 Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 添加当前用户到 docker 组
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# 验证安装
docker --version
docker compose version
```

---

## 🐳 Docker 部署

### 1. 克隆项目

```bash
git clone https://github.com/your-org/nexus-console.git
cd nexus-console
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp apps/api/.env.example apps/api/.env

# 编辑环境变量
nano apps/api/.env
```

**必须修改的变量**：

```bash
# 生成强密钥（至少 32 字符）
SECRET_KEY=$(openssl rand -hex 32)

# 数据库配置
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_STRONG_PASSWORD@postgres:5432/nexus_console

# Redis 配置
REDIS_URL=redis://redis:6379/0

# 关闭调试模式
DEBUG=False

# CORS 配置（替换为你的域名）
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 3. 构建和启动服务

```bash
# 构建镜像
docker compose build

# 启动服务
docker compose up -d

# 查看日志
docker compose logs -f

# 查看服务状态
docker compose ps
```

### 4. 运行数据库迁移

```bash
# 进入 API 容器
docker compose exec api bash

# 运行迁移
alembic upgrade head

# 退出容器
exit
```

### 5. 验证部署

```bash
# 检查 API 健康状态
curl http://localhost:8000/health

# 检查前端
curl http://localhost

# 查看 API 文档
open http://localhost:8000/docs
```

### 6. 停止服务

```bash
# 停止服务
docker compose down

# 停止并删除数据卷（⚠️ 会删除数据库数据）
docker compose down -v
```

---

## ⚙️ 环境变量配置

### 后端环境变量（apps/api/.env）

```bash
# === 核心配置 ===
SECRET_KEY=your-secret-key-at-least-32-characters-long
DEBUG=False
LOG_LEVEL=INFO

# === 数据库配置 ===
DATABASE_URL=postgresql+asyncpg://postgres:password@postgres:5432/nexus_console

# === Redis 配置 ===
REDIS_URL=redis://redis:6379/0

# === CORS 配置 ===
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# === Celery 配置 ===
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

# === 邮件配置（可选）===
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com

# === 文件上传配置（可选）===
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_SIZE=10485760  # 10MB
```

### 前端环境变量（apps/web/.env）

```bash
# API 基础 URL
VITE_API_BASE_URL=https://api.yourdomain.com

# 应用配置
VITE_APP_NAME=Nexus Console
VITE_APP_VERSION=1.0.0
```

### 生成安全密钥

```bash
# 生成 SECRET_KEY
openssl rand -hex 32

# 或使用 Python
python3 -c "import secrets; print(secrets.token_hex(32))"

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🗄️ 数据库迁移

### 创建新迁移

```bash
# 进入 API 容器
docker compose exec api bash

# 创建迁移
alembic revision --autogenerate -m "描述你的变更"

# 查看迁移文件
ls alembic/versions/

# 退出容器
exit
```

### 应用迁移

```bash
# 升级到最新版本
docker compose exec api alembic upgrade head

# 升级到特定版本
docker compose exec api alembic upgrade <revision_id>

# 查看当前版本
docker compose exec api alembic current

# 查看迁移历史
docker compose exec api alembic history
```

### 回滚迁移

```bash
# 回滚一个版本
docker compose exec api alembic downgrade -1

# 回滚到特定版本
docker compose exec api alembic downgrade <revision_id>

# 回滚所有迁移
docker compose exec api alembic downgrade base
```

### 数据库备份

```bash
# 备份数据库
docker compose exec postgres pg_dump -U postgres nexus_console > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复数据库
docker compose exec -T postgres psql -U postgres nexus_console < backup_20251223_120000.sql
```

---

## 📊 监控和日志

### 查看日志

```bash
# 查看所有服务日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f api
docker compose logs -f web
docker compose logs -f postgres
docker compose logs -f redis

# 查看最近 100 行日志
docker compose logs --tail=100 api

# 导出日志到文件
docker compose logs api > api_logs.txt
```

### 监控服务状态

```bash
# 查看服务状态
docker compose ps

# 查看资源使用情况
docker stats

# 查看特定容器资源使用
docker stats nexus-console-api-1
```

### 健康检查

```bash
# API 健康检查
curl http://localhost:8000/health

# 数据库健康检查
docker compose exec postgres pg_isready -U postgres

# Redis 健康检查
docker compose exec redis redis-cli ping
```

### Prometheus + Grafana（可选）

如果需要更完善的监控，可以使用 Prometheus 和 Grafana：

```bash
# 启动监控服务
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

# 访问 Prometheus
open http://localhost:9090

# 访问 Grafana
open http://localhost:3000
# 默认用户名/密码: admin/admin
```

---

## 🔧 故障排查

### 常见问题

#### 1. API 无法启动

**症状**：API 容器不断重启

**检查步骤**：

```bash
# 查看日志
docker compose logs api

# 常见原因：
# - 数据库连接失败
# - SECRET_KEY 未设置
# - 环境变量配置错误
```

**解决方案**：

```bash
# 检查数据库是否就绪
docker compose exec postgres pg_isready -U postgres

# 检查环境变量
docker compose exec api env | grep DATABASE_URL

# 重新构建并启动
docker compose down
docker compose up -d --build
```

#### 2. 数据库连接失败

**症状**：`could not connect to server`

**解决方案**：

```bash
# 检查 PostgreSQL 是否运行
docker compose ps postgres

# 检查 PostgreSQL 日志
docker compose logs postgres

# 重启 PostgreSQL
docker compose restart postgres

# 等待数据库就绪
docker compose exec postgres pg_isready -U postgres
```

#### 3. Redis 连接失败

**症状**：`Error connecting to Redis`

**解决方案**：

```bash
# 检查 Redis 是否运行
docker compose ps redis

# 测试 Redis 连接
docker compose exec redis redis-cli ping

# 重启 Redis
docker compose restart redis
```

#### 4. 前端无法访问 API

**症状**：前端显示网络错误

**检查步骤**：

```bash
# 检查 CORS 配置
docker compose exec api env | grep CORS_ORIGINS

# 检查 API 是否可访问
curl http://localhost:8000/health

# 检查前端环境变量
cat apps/web/.env | grep VITE_API_BASE_URL
```

**解决方案**：

```bash
# 更新 CORS 配置
# 编辑 apps/api/.env
CORS_ORIGINS=http://localhost,http://localhost:5173

# 重启服务
docker compose restart api
```

#### 5. 磁盘空间不足

**症状**：`no space left on device`

**解决方案**：

```bash
# 查看磁盘使用情况
df -h

# 清理 Docker 资源
docker system prune -a --volumes

# 清理旧的镜像
docker image prune -a

# 清理未使用的卷
docker volume prune
```

#### 6. 内存不足

**症状**：容器被 OOM Killer 杀死

**解决方案**：

```bash
# 查看内存使用
docker stats

# 限制容器内存（在 docker-compose.yml 中）
services:
  api:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

### 性能优化

#### 1. 数据库连接池

```python
# apps/api/app/database.py
engine = create_async_engine(
    settings.database_url,
    pool_size=20,        # 增加连接池大小
    max_overflow=10,     # 增加溢出连接
    pool_pre_ping=True,  # 启用连接健康检查
)
```

#### 2. Redis 缓存

```python
# 为频繁访问的数据添加缓存
@router.get("/users")
@cache(expire=60)  # 缓存 60 秒
async def list_users(...):
    pass
```

#### 3. 数据库索引

```python
# 为常用查询字段添加索引
class User(Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(index=True)
```

### 日志级别调整

```bash
# 开发环境：DEBUG
LOG_LEVEL=DEBUG

# 生产环境：INFO
LOG_LEVEL=INFO

# 问题排查：DEBUG
LOG_LEVEL=DEBUG

# 重启服务使配置生效
docker compose restart api
```

---

## 🔐 安全加固

### 1. 使用 HTTPS

```bash
# 使用 Nginx 反向代理 + Let's Encrypt
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

### 2. 防火墙配置

```bash
# 安装 UFW
sudo apt-get install ufw

# 允许 SSH
sudo ufw allow 22/tcp

# 允许 HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status
```

### 3. 定期更新

```bash
# 更新系统
sudo apt-get update
sudo apt-get upgrade

# 更新 Docker 镜像
docker compose pull
docker compose up -d

# 更新依赖
cd apps/api && uv sync --upgrade
pnpm update -r
```

---

## 📚 相关文档

- [README.md](../README.md) - 项目概述
- [CONTRIBUTING.md](../CONTRIBUTING.md) - 贡献指南
- [SECURITY.md](../SECURITY.md) - 安全政策
- [PROJECT_AUDIT_REPORT.md](PROJECT_AUDIT_REPORT.md) - 审计报告

---

**最后更新**：2025-12-23
