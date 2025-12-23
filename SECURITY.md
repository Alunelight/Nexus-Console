# 安全政策

## 支持的版本

我们为以下版本提供安全更新：

| 版本  | 支持状态  |
| ----- | --------- |
| 1.x   | ✅ 支持   |
| < 1.0 | ❌ 不支持 |

## 报告漏洞

我们非常重视安全问题。如果你发现了安全漏洞，请遵循以下流程：

### 1. 不要公开披露

**请不要**在以下地方公开披露安全问题：

- GitHub Issues
- Pull Requests
- 公开论坛或社交媒体
- 任何公开渠道

### 2. 私密报告

请通过以下方式报告安全漏洞：

**邮件**: security@example.com

**报告内容应包括**：

- 漏洞的详细描述
- 复现步骤
- 受影响的版本
- 潜在的影响范围
- 你的联系方式（可选）

### 3. 响应时间

我们承诺：

- **24 小时内**确认收到报告
- **72 小时内**提供初步评估
- **7 天内**提供修复计划或补丁

### 4. 修复流程

1. 我们会验证漏洞
2. 评估影响范围和严重程度
3. 开发和测试修复方案
4. 发布安全补丁
5. 公开披露（在修复发布后）

### 5. 致谢

我们会在安全公告中感谢报告者（除非你要求匿名）。

## 安全最佳实践

### 部署安全

1. **环境变量**

   - 永远不要在代码中硬编码密钥
   - 使用强随机的 SECRET_KEY（至少 32 字符）
   - 定期轮换密钥

2. **生产环境配置**

   ```bash
   # .env
   DEBUG=False
   SECRET_KEY=<strong-random-key>
   DATABASE_URL=<production-db-url>
   CORS_ORIGINS=["https://yourdomain.com"]
   ```

3. **HTTPS**

   - 生产环境必须使用 HTTPS
   - 启用 HSTS
   - 使用有效的 SSL 证书

4. **数据库安全**

   - 使用强密码
   - 限制数据库访问权限
   - 定期备份
   - 启用 SSL 连接

5. **API 安全**
   - 启用 API 限流
   - 验证所有输入
   - 使用 CORS 白名单
   - 实施认证和授权

### 依赖安全

1. **定期更新依赖**

   ```bash
   # 检查过时的依赖
   pnpm outdated

   # 更新依赖
   pnpm update -r
   ```

2. **安全扫描**

   ```bash
   # 前端依赖扫描
   pnpm audit

   # 后端依赖扫描（在 apps/api 目录下）
   uv pip check
   ```

3. **使用 Dependabot**
   - 已配置自动依赖更新
   - 定期审查和合并安全更新

### 代码安全

1. **输入验证**

   - 使用 Pydantic 验证所有输入
   - 使用 Zod 验证前端表单
   - 防止 SQL 注入（使用 ORM）
   - 防止 XSS（React 自动转义）

2. **认证和授权**

   - 使用强密码策略
   - 实施多因素认证（MFA）
   - 使用 JWT 或 Session
   - 定期过期令牌

3. **日志安全**
   - 不要记录敏感信息（密码、令牌）
   - 使用结构化日志
   - 定期审查日志

## 已知安全特性

### 已实施的安全措施

- ✅ API 限流（200 请求/分钟）
- ✅ CORS 配置
- ✅ GZip 压缩
- ✅ 环境变量验证
- ✅ SECRET_KEY 强制要求
- ✅ DEBUG 默认关闭
- ✅ 结构化日志
- ✅ 类型安全（TypeScript + Python 类型注解）

### 计划中的安全特性

- ⏳ 安全头中间件（HSTS, CSP, X-Frame-Options）
- ⏳ 请求大小限制
- ⏳ CSRF 保护
- ⏳ 日志脱敏
- ⏳ 审计日志

## 安全审计历史

| 日期       | 类型     | 发现问题 | 状态      |
| ---------- | -------- | -------- | --------- |
| 2025-12-23 | 内部审计 | 7 个 P0  | ✅ 已修复 |

详见 [PROJECT_AUDIT_REPORT.md](docs/PROJECT_AUDIT_REPORT.md)。

## 联系方式

- **安全问题**: security@example.com
- **一般问题**: GitHub Issues
- **紧急问题**: security@example.com（标题加 [URGENT]）

## 参考资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [React Security Best Practices](https://react.dev/learn/security)

---

感谢你帮助保护 Nexus Console 的安全！🔒
