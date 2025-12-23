# 贡献指南

感谢你考虑为 Nexus Console 做出贡献！本文档将帮助你了解如何参与项目开发。

## 📋 目录

- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [测试要求](#测试要求)
- [类型同步工作流](#类型同步工作流)
- [提交规范](#提交规范)
- [Pull Request 流程](#pull-request-流程)
- [Code Review 检查清单](#code-review-检查清单)

---

## 🚀 开发流程

### 1. Fork 项目

点击 GitHub 页面右上角的 "Fork" 按钮，将项目 fork 到你的账号下。

### 2. 克隆仓库

```bash
git clone https://github.com/YOUR_USERNAME/nexus-console.git
cd nexus-console
```

### 3. 设置开发环境

**前置要求**：

- Node.js 20+ LTS
- Python 3.13+
- pnpm 10.26+
- uv (Python 包管理器)
- PostgreSQL 16+
- Redis 7+
- Docker (可选)

**快速启动**：

```bash
# 使用自动化脚本
chmod +x scripts/dev-setup.sh
./scripts/dev-setup.sh

# 或手动设置
pnpm install
cd apps/api && uv sync --extra dev && cd ../..
pnpm types:sync
```

### 4. 创建特性分支

```bash
git checkout -b feat/your-feature-name
# 或
git checkout -b fix/your-bug-fix
```

### 5. 开发和测试

```bash
# 启动开发服务器
pnpm dev

# 运行测试
pnpm test

# 运行代码检查
pnpm lint
```

### 6. 提交代码

```bash
git add .
git commit -m "feat(scope): your commit message"
git push origin feat/your-feature-name
```

### 7. 创建 Pull Request

在 GitHub 上创建 Pull Request，填写 PR 模板中的信息。

---

## 📝 代码规范

### 后端规范（Python）

遵循 `.kiro/steering/backend-rules.md` 中的规则：

**核心原则**：

- ✅ 必须使用异步模式（AsyncSession, async/await）
- ✅ 必须使用类型注解
- ✅ 使用 Python 3.13+ 特性

**示例**：

```python
# ✅ 正确
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated
from fastapi import Depends

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)]
) -> UserResponse:
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ❌ 错误：同步模式
def get_user(user_id: int, db: Session):
    return db.query(User).filter(User.id == user_id).first()
```

**代码检查**：

```bash
cd apps/api
uv run ruff check .      # 代码检查
uv run ruff format .     # 代码格式化
uv run mypy app          # 类型检查
```

### 前端规范（TypeScript/React）

遵循 `.kiro/steering/frontend-rules.md` 中的规则：

**核心原则**：

- ✅ TypeScript strict mode
- ✅ 使用 TanStack Router（禁止 React Router）
- ✅ 使用 TanStack Query（禁止 Redux）
- ✅ 使用 Tailwind CSS（禁止 CSS-in-JS）

**示例**：

```typescript
// ✅ 正确：TanStack Router + Query
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/users/$userId")({
  component: UserDetail,
});

function UserDetail() {
  const { userId } = Route.useParams();
  const { data: user } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUser(userId),
  });

  return <div>{user?.name}</div>;
}

// ❌ 错误：React Router + Redux
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
```

**代码检查**：

```bash
cd apps/web
pnpm lint           # ESLint 检查
pnpm type-check     # TypeScript 检查
```

### 命名约定

**后端（Python）**：

- 文件名：`snake_case.py`
- 类名：`PascalCase`
- 函数名：`snake_case`
- 变量名：`snake_case`
- 常量：`UPPER_SNAKE_CASE`

**前端（TypeScript/React）**：

- 组件文件：`PascalCase.tsx`
- 工具/hooks 文件：`camelCase.ts`
- 组件名：`PascalCase`
- 函数名：`camelCase`
- 变量名：`camelCase`
- 常量：`UPPER_SNAKE_CASE`

---

## ✅ 测试要求

### 后端测试

**覆盖率要求**：≥ 90%

**测试类型**：

- 单元测试：测试单个函数/类
- 集成测试：测试 API 端点
- 数据库测试：测试数据库操作

**运行测试**：

```bash
cd apps/api
uv run pytest                    # 运行所有测试
uv run pytest --cov              # 运行测试并生成覆盖率报告
uv run pytest tests/test_users.py  # 运行特定测试文件
```

**测试示例**：

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_user(client: AsyncClient):
    response = await client.post(
        "/api/v1/users/",
        json={"email": "test@example.com", "name": "Test User"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test User"
```

### 前端测试

**覆盖率要求**：≥ 80%

**测试类型**：

- 组件测试：测试 UI 组件
- Hook 测试：测试自定义 Hooks
- 工具函数测试：测试工具函数

**运行测试**：

```bash
cd apps/web
pnpm test              # 运行所有测试
pnpm test:ui           # 运行测试并打开 UI
pnpm test:coverage     # 生成覆盖率报告
```

**测试示例**：

```typescript
import { render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
  it("renders correctly", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("handles click events", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await userEvent.click(screen.getByText("Click me"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

---

## 🔄 类型同步工作流

**重要**：修改后端 API 后，必须同步前端类型！

### 工作流程

1. **修改后端 Pydantic 模型**

```python
# apps/api/app/schemas/user.py
class UserCreate(BaseModel):
    email: EmailStr
    name: str | None = None
    age: int  # 新增字段
```

2. **运行类型同步**

```bash
pnpm types:sync
```

这个命令会：

- 导出 OpenAPI 规范（`apps/api/openapi/openapi.json`）
- 生成前端类型和 Hooks（`apps/web/src/api/`）

3. **使用生成的类型**

```typescript
import { useCreateUserApiV1UsersPost } from "@/api/endpoints/users/users";
import type { UserCreate } from "@/api/models";

const createUser = useCreateUserApiV1UsersPost();

createUser.mutate({
  data: {
    email: "test@example.com",
    name: "Test User",
    age: 25, // 新字段
  },
});
```

### 禁止事项

❌ **禁止手动编写 API 调用**

```typescript
// ❌ 错误
const response = await fetch("/api/v1/users");
const users = await response.json();
```

❌ **禁止手动定义类型**

```typescript
// ❌ 错误
interface User {
  id: number;
  email: string;
}
```

❌ **禁止修改生成的文件**

```typescript
// ❌ 禁止修改 apps/web/src/api/ 下的文件
```

详细文档：[docs/TYPE_SYNC.md](docs/TYPE_SYNC.md)

---

## 📦 提交规范

本项目使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 提交消息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行）
- `refactor`: 重构（既不是新增功能，也不是修复 Bug）
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动
- `perf`: 性能优化

### Scope 范围

- `api`: 后端 API
- `web`: 前端 Web
- `docker`: Docker 配置
- `ci`: CI/CD 配置
- `docs`: 文档
- `deps`: 依赖更新

### 示例

```bash
# 新功能
git commit -m "feat(api): 添加用户认证功能"

# 修复 Bug
git commit -m "fix(web): 修复登录表单验证问题"

# 文档更新
git commit -m "docs(readme): 更新安装说明"

# 重构
git commit -m "refactor(api): 优化数据库查询性能"

# 测试
git commit -m "test(web): 添加 Button 组件测试"
```

### 提交前检查

项目配置了 Git hooks，会自动运行：

- **pre-commit**: 运行 lint-staged（代码检查和格式化）
- **commit-msg**: 验证提交消息格式

如果检查失败，提交会被阻止。

---

## 🔍 Pull Request 流程

### 1. PR 标题

使用与提交消息相同的格式：

```
feat(api): 添加用户认证功能
```

### 2. PR 描述

使用 PR 模板，包含以下信息：

```markdown
## 变更类型

- [ ] 新功能
- [ ] Bug 修复
- [ ] 文档更新
- [ ] 重构
- [ ] 性能优化

## 变更说明

简要描述你的变更内容

## 测试

- [ ] 添加了新的测试
- [ ] 所有测试通过
- [ ] 测试覆盖率达标

## 检查清单

- [ ] 代码遵循项目规范
- [ ] 运行了 `pnpm lint` 并通过
- [ ] 运行了 `pnpm test` 并通过
- [ ] 更新了相关文档
- [ ] 运行了 `pnpm types:sync`（如果修改了后端 API）
```

### 3. CI 检查

PR 会自动触发 CI 流程，检查：

- ✅ 后端代码检查（Ruff, MyPy）
- ✅ 后端测试（pytest）
- ✅ 前端代码检查（ESLint, TypeScript）
- ✅ 前端测试（Vitest）
- ✅ 前端构建（Vite）
- ✅ Docker 镜像构建

所有检查必须通过才能合并。

### 4. Code Review

至少需要 1 位维护者的批准。

---

## 📋 Code Review 检查清单

### 代码质量

- [ ] 代码遵循项目规范
- [ ] 有适当的类型注解
- [ ] 有必要的注释（复杂逻辑）
- [ ] 没有硬编码的值
- [ ] 没有调试代码（console.log, print）

### 功能实现

- [ ] 功能符合需求
- [ ] 边界情况处理正确
- [ ] 错误处理完善
- [ ] 性能考虑合理

### 测试

- [ ] 有对应的测试
- [ ] 测试覆盖率达标
- [ ] 测试用例完整（正常、异常、边界）
- [ ] 所有测试通过

### 安全性

- [ ] 没有安全漏洞
- [ ] 输入验证完善
- [ ] 敏感信息不在代码中
- [ ] 使用环境变量配置

### 文档

- [ ] 更新了相关文档
- [ ] API 变更更新了 OpenAPI
- [ ] 运行了类型同步（如果需要）
- [ ] 更新了 CHANGELOG.md

### 后端特定检查

- [ ] 使用异步模式
- [ ] 数据库查询优化
- [ ] 有适当的缓存
- [ ] API 限流配置

### 前端特定检查

- [ ] 使用 TanStack Router
- [ ] 使用 TanStack Query
- [ ] 使用 Tailwind CSS
- [ ] 组件可复用
- [ ] 无性能问题（不必要的重渲染）

---

## 🤝 获取帮助

如果你有任何问题：

1. 查看项目文档：

   - [README.md](README.md)
   - [docs/TYPE_SYNC.md](docs/TYPE_SYNC.md)
   - [.kiro/steering/](./kiro/steering/)

2. 查看现有代码示例

3. 提出 Issue 或在 PR 中询问

---

## 📄 许可证

通过贡献代码，你同意你的贡献将在 [LICENSE](LICENSE) 文件中指定的许可证下发布。

---

感谢你的贡献！🎉
