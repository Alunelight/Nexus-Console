# 当前任务：修复本地 dev 注册失败（RBAC 表未迁移）

## 当前目标
修复 `POST /api/v1/auth/register` 500：确保本地开发数据库已应用 RBAC 相关 Alembic 迁移（创建 `roles/permissions/*_roles/*_permissions` 表），并消除前端 dev 的路由扫描警告。

## 实施进度
- ✅ 已修复 `ADMIN_EMAILS` 空值导致的 Settings 解析崩溃（后端可正常启动）
- ✅ 已处理：运行迁移后本地数据库已包含 RBAC 表（注册接口已验证不再 500）
- ✅ 已处理：将 `apps/web/src/routes/*.test.tsx` 移出路由目录，消除 dev 扫描警告（单测已验证通过）

## 下一步（短期）
1. 运行 `pnpm --filter api migration:upgrade` 将数据库升级到最新迁移（包含 RBAC 表）。
2. 验证注册接口不再报 `roles` 表不存在（最小化请求验证即可）。
3. 将 `apps/web/src/routes/login.test.tsx`、`register.test.tsx` 移到非路由目录（例如 `apps/web/src/test/routes/`），消除 dev 警告并保证单测继续通过。
