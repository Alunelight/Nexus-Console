# 数据库配置指南

本文档介绍如何配置和管理 Nexus Console 的 PostgreSQL 和 Redis 数据库。

## 📋 配置说明

### 端口配置

为避免与其他项目（如 Dify）的数据库冲突，本项目使用以下端口：

| 服务       | 默认端口 | 本项目端口 | 说明                     |
| ---------- | -------- | ---------- | ------------------------ |
| PostgreSQL | 5432     | **5433**   | 避免与 Dify 的 5432 冲突 |
| Redis      | 6379     | **6380**   | 避免与现有 Redis 冲突    |

### 环境变量

配置文件：`apps/api/.env`

```bash
# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5433/nexus_console

# Redis
REDIS_URL=redis://localhost:6380/0

# Celery
CELERY_BROKER_URL=redis://localhost:6380/1
CELERY_RESULT_BACKEND=redis://localhost:6380/2
```

---

## 🚀 快速开始

### 1. 启动数据库服务

```bash
# 启动 PostgreSQL 和 Redis
docker compose -f docker-compose.dev.yml up -d

# 查看服务状态
docker ps --filter "name=nexus"
```

**预期输出**：

```
NAMES                STATUS                    PORTS
nexus-postgres-dev   Up X seconds (healthy)    0.0.0.0:5433->5432/tcp
nexus-redis-dev      Up X seconds (healthy)    0.0.0.0:6380->6379/tcp
```

### 2. 运行数据库迁移

```bash
cd apps/api
uv run alembic upgrade head
```

### 3. 启动 API 服务器

```bash
cd apps/api
uv run uvicorn app.main:app --reload
```

### 4. 验证连接

```bash
# 测试 API 健康检查
curl http://localhost:8000/health

# 预期输出
{"status":"healthy"}
```

---

## 🛠️ 常用命令

### Docker 容器管理

```bash
# 启动服务
docker compose -f docker-compose.dev.yml up -d

# 停止服务
docker compose -f docker-compose.dev.yml down

# 查看日志
docker compose -f docker-compose.dev.yml logs -f

# 查看 PostgreSQL 日志
docker logs nexus-postgres-dev -f

# 查看 Redis 日志
docker logs nexus-redis-dev -f

# 重启服务
docker compose -f docker-compose.dev.yml restart

# 停止并删除数据卷（⚠️ 会删除所有数据）
docker compose -f docker-compose.dev.yml down -v
```

### 数据库操作

```bash
# 进入 PostgreSQL 容器
docker exec -it nexus-postgres-dev psql -U postgres -d nexus_console

# 常用 SQL 命令
\dt              # 列出所有表
\d users         # 查看 users 表结构
SELECT * FROM users;  # 查询用户
\q               # 退出

# 进入 Redis 容器
docker exec -it nexus-redis-dev redis-cli

# 常用 Redis 命令
PING             # 测试连接
KEYS *           # 列出所有键
GET key          # 获取键值
FLUSHALL         # 清空所有数据（⚠️ 慎用）
exit             # 退出
```

### 数据库迁移

```bash
cd apps/api

# 查看当前迁移状态
uv run alembic current

# 查看迁移历史
uv run alembic history

# 升级到最新版本
uv run alembic upgrade head

# 升级到特定版本
uv run alembic upgrade <revision_id>

# 回滚一个版本
uv run alembic downgrade -1

# 回滚到特定版本
uv run alembic downgrade <revision_id>

# 创建新迁移
uv run alembic revision --autogenerate -m "描述你的变更"
```

---

## 🔍 故障排查

### 问题 1：端口已被占用

**错误信息**：

```
Error starting userland proxy: listen tcp4 0.0.0.0:5432: bind: address already in use
```

**解决方案**：

1. 检查端口占用：

   ```bash
   lsof -i :5432
   lsof -i :6379
   ```

2. 修改 `docker-compose.dev.yml` 中的端口映射：

   ```yaml
   ports:
     - "5433:5432" # 使用不同的主机端口
   ```

3. 更新 `apps/api/.env` 中的连接字符串

### 问题 2：数据库连接失败

**错误信息**：

```
asyncpg.exceptions.InvalidPasswordError: password authentication failed
```

**解决方案**：

1. 检查容器是否运行：

   ```bash
   docker ps --filter "name=nexus-postgres"
   ```

2. 检查环境变量配置：

   ```bash
   cat apps/api/.env | grep DATABASE_URL
   ```

3. 验证数据库连接：
   ```bash
   docker exec nexus-postgres-dev psql -U postgres -c "SELECT 1"
   ```

### 问题 3：Redis 连接失败

**错误信息**：

```
redis.exceptions.ConnectionError: Error connecting to Redis
```

**解决方案**：

1. 检查 Redis 容器：

   ```bash
   docker ps --filter "name=nexus-redis"
   ```

2. 测试 Redis 连接：

   ```bash
   docker exec nexus-redis-dev redis-cli ping
   ```

3. 检查环境变量：
   ```bash
   cat apps/api/.env | grep REDIS_URL
   ```

### 问题 4：迁移失败

**错误信息**：

```
alembic.util.exc.CommandError: Can't locate revision identified by 'xxx'
```

**解决方案**：

1. 查看迁移历史：

   ```bash
   cd apps/api
   uv run alembic history
   ```

2. 重置数据库（⚠️ 会删除所有数据）：
   ```bash
   docker compose -f docker-compose.dev.yml down -v
   docker compose -f docker-compose.dev.yml up -d
   cd apps/api
   uv run alembic upgrade head
   ```

---

## 📊 数据库备份和恢复

### 备份数据库

```bash
# 备份到文件
docker exec nexus-postgres-dev pg_dump -U postgres nexus_console > backup_$(date +%Y%m%d_%H%M%S).sql

# 压缩备份
docker exec nexus-postgres-dev pg_dump -U postgres nexus_console | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### 恢复数据库

```bash
# 从备份恢复
docker exec -i nexus-postgres-dev psql -U postgres nexus_console < backup_20251223_120000.sql

# 从压缩备份恢复
gunzip -c backup_20251223_120000.sql.gz | docker exec -i nexus-postgres-dev psql -U postgres nexus_console
```

---

## 🔐 生产环境配置

### 安全建议

1. **修改默认密码**：

   ```yaml
   # docker-compose.yml
   environment:
     POSTGRES_PASSWORD: ${POSTGRES_PASSWORD} # 使用环境变量
   ```

2. **限制网络访问**：

   ```yaml
   # 不暴露端口到主机
   expose:
     - "5432"
   # 而不是
   ports:
     - "5432:5432"
   ```

3. **使用密钥管理**：

   - 使用 AWS Secrets Manager
   - 使用 HashiCorp Vault
   - 使用 Kubernetes Secrets

4. **启用 SSL 连接**：
   ```bash
   DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db?ssl=require
   ```

---

## 📚 相关文档

- [部署文档](DEPLOYMENT.md)
- [开发环境设置](../scripts/dev-setup.sh)
- [Alembic 文档](https://alembic.sqlalchemy.org/)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [Redis 文档](https://redis.io/documentation)

---

**最后更新**：2025-12-23
