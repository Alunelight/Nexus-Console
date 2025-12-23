# 安全政策

## 📋 支持的版本

我们为以下版本提供安全更新：

| 版本 | 支持状态 | 说明               |
| ---- | -------- | ------------------ |
| 1.x  | ✅       | 当前版本，完全支持 |
| 0.x  | ❌       | 开发版本，不再支持 |

## 🔒 报告安全漏洞

我们非常重视安全问题。如果你发现了安全漏洞，请**不要**公开披露。

### 报告流程

1. **发送邮件**

   - 邮箱：security@example.com（请替换为实际邮箱）
   - 主题：`[SECURITY] 简要描述`

2. **包含以下信息**

   - 漏洞类型（如：SQL 注入、XSS、CSRF 等）
   - 受影响的组件/文件
   - 重现步骤
   - 潜在影响
   - 建议的修复方案（如果有）

3. **响应时间**
   - 我们会在 **48 小时内**确认收到你的报告
   - 我们会在 **7 天内**提供初步评估
   - 我们会在 **30 天内**发布修复（取决于严重程度）

### 报告示例

```
主题：[SECURITY] API 端点存在 SQL 注入漏洞

漏洞描述：
在 /api/v1/users 端点中，用户输入未经过滤直接拼接到 SQL 查询中。

受影响版本：
1.0.0 - 1.2.0

重现步骤：
1. 访问 /api/v1/users?name=admin' OR '1'='1
2. 观察返回所有用户数据

潜在影响：
攻击者可以绕过认证，访问所有用户数据

建议修复：
使用参数化查询或 ORM 的安全查询方法
```

## 🛡️ 安全最佳实践

### 开发者指南

#### 1. 环境变量

✅ **正确做法**：

```python
# 从环境变量读取敏感配置
secret_key: str = Field(..., min_length=32)
database_url: str = Field(...)
```

❌ **错误做法**：

```python
# 硬编码敏感信息
SECRET_KEY = "my-secret-key"
DATABASE_URL = "postgresql://user:password@localhost/db"
```

#### 2. 密码处理

✅ **正确做法**：

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 哈希密码
hashed_password = pwd_context.hash(plain_password)

# 验证密码
pwd_context.verify(plain_password, hashed_password)
```

❌ **错误做法**：

```python
# 明文存储密码
user.password = plain_password
```

#### 3. SQL 注入防护

✅ **正确做法**：

```python
# 使用 SQLAlchemy ORM
result = await db.execute(
    select(User).where(User.email == email)
)
```

❌ **错误做法**：

```python
# 字符串拼接 SQL
query = f"SELECT * FROM users WHERE email = '{email}'"
```

#### 4. XSS 防护

✅ **正确做法**：

```typescript
// React 自动转义
<div>{user.name}</div>;

// 使用 DOMPurify 清理 HTML
import DOMPurify from "dompurify";
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
```

❌ **错误做法**：

```typescript
// 直接插入未清理的 HTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

#### 5. CSRF 防护

✅ **正确做法**：

```python
# FastAPI 自动处理 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # 明确指定
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)
```

❌ **错误做法**：

```python
# 允许所有来源
allow_origins=["*"]
allow_credentials=True  # 这个组合是危险的
```

#### 6. API 限流

✅ **正确做法**：

```python
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)

@router.post("/login")
@limiter.limit("5/minute")  # 限制登录尝试
async def login(...):
    pass
```

#### 7. 输入验证

✅ **正确做法**：

```python
from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    email: EmailStr  # 自动验证邮箱格式
    password: str = Field(min_length=8, max_length=100)
    age: int = Field(ge=0, le=150)
```

#### 8. 安全头

✅ **正确做法**：

```python
# 生产环境添加安全头
if not settings.debug:
    app.add_middleware(HTTPSRedirectMiddleware)
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.allowed_hosts
    )
```

## 🔐 已实施的安全措施

### 后端安全

- ✅ **环境变量验证**：强制从环境变量读取敏感配置
- ✅ **API 限流**：使用 slowapi 防止 DDoS 攻击
- ✅ **CORS 配置**：明确指定允许的来源和方法
- ✅ **输入验证**：使用 Pydantic 严格验证所有输入
- ✅ **错误处理**：统一错误响应，不泄露敏感信息
- ✅ **日志记录**：记录安全相关事件
- ✅ **数据库连接池**：防止连接耗尽
- ✅ **异步模式**：使用 SQLAlchemy 异步模式

### 前端安全

- ✅ **TypeScript strict mode**：类型安全
- ✅ **输入验证**：使用 Zod 验证表单输入
- ✅ **XSS 防护**：React 自动转义
- ✅ **HTTPS Only**：生产环境强制 HTTPS
- ✅ **依赖扫描**：定期更新依赖

### 基础设施安全

- ✅ **Docker 容器化**：隔离运行环境
- ✅ **健康检查**：监控服务状态
- ✅ **CI/CD 安全**：自动化测试和代码检查
- ✅ **密钥管理**：使用环境变量和密钥管理服务

## 📊 安全审计历史

### 2025-12-23 - 项目全面审计

**审计范围**：代码质量、架构设计、安全性、性能

**发现的问题**：

- 🔴 P0: SECRET_KEY 不安全（已修复）
- 🔴 P0: DEBUG 默认开启（已修复）
- ⚠️ P1: API 限流缺失（已修复）
- ⚠️ P1: CORS 配置过于宽松（已修复）

**修复措施**：

- ✅ 强制从环境变量读取 SECRET_KEY
- ✅ DEBUG 默认改为 False
- ✅ 实施 API 限流（slowapi）
- ✅ 明确 CORS 配置

**审计报告**：[docs/PROJECT_AUDIT_REPORT.md](docs/PROJECT_AUDIT_REPORT.md)

## 🔄 安全更新流程

### 依赖更新

我们定期更新依赖以修复已知漏洞：

```bash
# 后端依赖更新
cd apps/api && uv sync --upgrade

# 前端依赖更新
pnpm update -r
```

### 自动化扫描

- **Dependabot**：自动检测依赖漏洞
- **CodeQL**：代码安全扫描
- **Snyk**：依赖和容器扫描

## 📚 安全资源

### 学习资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [React Security Best Practices](https://react.dev/learn/security)

### 工具推荐

- [Bandit](https://github.com/PyCQA/bandit) - Python 安全检查
- [Safety](https://github.com/pyupio/safety) - Python 依赖漏洞扫描
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Node.js 依赖漏洞扫描

## 🙏 致谢

感谢所有报告安全问题的研究人员和贡献者。

---

**最后更新**：2025-12-23  
**下次审计**：2026-03-23（建议）
