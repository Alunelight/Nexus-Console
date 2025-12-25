# 当前任务：JWT 认证系统 - 已完成

## 任务目标
实现完整的 JWT 认证系统（Cookie + 独立认证表）

## 完成情况
✅ 所有 7 个 todos 已完成

### 后端 (FastAPI)
1. ✅ 新增 AuthIdentity 模型与 Alembic 迁移
   - auth_identities 表
   - token_version 字段用于吊销
   - provider/identifier 唯一约束
   - 与 users 表的外键关系

2. ✅ 新增 auth router（/api/v1/auth）
   - POST /register - 用户注册
   - POST /login - 用户登录（设置 httpOnly cookies）
   - GET /me - 获取当前用户
   - POST /refresh - 刷新访问令牌
   - POST /logout - 登出（递增 token_version）

3. ✅ 新增测试文件 test_auth.py
   - 注册/登录成功与失败场景
   - Token refresh 测试
   - Token version 吊销测试
   - 非活跃用户测试

### 前端 (React + TanStack)
4. ✅ 修改 customFetch 支持 credentials: 'include'

5. ✅ 新增 /login 页面
   - react-hook-form + zod 表单校验
   - 错误处理与加载状态
   - 登录后更新 authStore
   - 支持 redirect 参数回跳

6. ✅ 为 /users 添加 beforeLoad 路由守卫
   - 未登录自动跳转到 /login
   - 保留原始 URL 用于登录后回跳

7. ✅ 更新 __root.tsx
   - 应用启动时恢复登录状态（调用 /me）
   - 导航栏显示登录/登出按钮
   - 显示当前登录用户

### 类型同步
✅ 运行 `pnpm types:sync` 成功生成前端 API 类型

## 下一步
任务已完成。可以进行本地测试或部署验证。
