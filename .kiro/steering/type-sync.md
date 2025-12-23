# 前后端类型同步规则

> 本文档定义前后端类型同步的工作流程和最佳实践

## 核心原则

1. **单一数据源**: 后端 Pydantic 模型是唯一的类型定义来源
2. **自动化优先**: 禁止手动编写前端 API 调用代码
3. **类型安全**: 前后端接口必须保持完全一致

## 工作流程

### 1. 后端定义 API

```python
# apps/api/app/schemas/user.py
from pydantic import BaseModel, EmailStr, ConfigDict

class UserCreate(BaseModel):
    email: EmailStr
    name: str | None = None

    model_config = ConfigDict(strict=True)

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: str | None

    model_config = ConfigDict(from_attributes=True)
```

```python
# apps/api/app/api/v1/users.py
@router.post("/", response_model=UserResponse)
async def create_user(
    user: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)]
) -> UserResponse:
    # 实现逻辑
    pass
```

### 2. 导出 OpenAPI 规范

```bash
pnpm --filter api openapi:export
```

生成：`apps/api/openapi/openapi.json`

### 3. 生成前端代码

```bash
pnpm --filter web api:generate
```

生成：

- `apps/web/src/api/endpoints/` - TanStack Query Hooks
- `apps/web/src/api/models/` - TypeScript 类型

### 4. 前端使用

```typescript
import { useCreateUserApiV1UsersPost } from "@/api/endpoints/users/users";
import type { UserCreate } from "@/api/models";

const createUser = useCreateUserApiV1UsersPost();

createUser.mutate({
  data: {
    email: "test@example.com",
    name: "Test User",
  },
});
```

## 一键同步命令

```bash
# 在项目根目录执行
pnpm types:sync
```

此命令会自动完成步骤 2 和 3。

## 开发规范

### ✅ 正确做法

1. **修改后端后立即同步**

   ```bash
   # 修改 Pydantic 模型后
   pnpm types:sync
   ```

2. **使用生成的 Hooks**

   ```typescript
   // ✅ 使用 Orval 生成的 Hook
   import { useListUsersApiV1UsersGet } from "@/api/endpoints/users/users";

   const { data: users } = useListUsersApiV1UsersGet();
   ```

3. **使用生成的类型**

   ```typescript
   // ✅ 使用生成的类型
   import type { UserCreate, UserResponse } from "@/api/models";

   const newUser: UserCreate = {
     email: "test@example.com",
     name: "Test",
   };
   ```

### ❌ 禁止做法

1. **手动编写 API 调用**

   ```typescript
   // ❌ 禁止手动 fetch
   const response = await fetch("/api/v1/users");
   const users = await response.json();
   ```

2. **手动定义类型**

   ```typescript
   // ❌ 禁止手动定义类型
   interface User {
     id: number;
     email: string;
     name?: string;
   }
   ```

3. **修改生成的文件**
   ```typescript
   // ❌ 禁止修改 apps/web/src/api/ 下的文件
   // 这些文件会被下次生成覆盖
   ```

## 团队协作

### 拉取代码后

```bash
# 1. 安装依赖
pnpm install

# 2. 同步类型
pnpm types:sync
```

### 提交代码前

```bash
# 1. 同步类型
pnpm types:sync

# 2. 类型检查
pnpm --filter web build
```

### Code Review 检查点

- [ ] 后端 API 修改是否更新了 Pydantic 模型
- [ ] 是否运行了 `pnpm types:sync`
- [ ] 前端是否使用生成的 Hooks 和类型
- [ ] 是否有手动编写的 API 调用代码

## 自定义配置

### 修改 Base URL

```typescript
// apps/web/orval.config.ts
export default defineConfig({
  api: {
    output: {
      baseUrl: process.env.VITE_API_BASE_URL || "http://localhost:8000",
    },
  },
});
```

### 添加认证 Token

```typescript
// apps/web/src/api/client.ts
export const customFetch = async <T>(
  config: RequestInit & { url: string }
): Promise<T> => {
  const { url, ...rest } = config;

  const response = await fetch(url, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...rest.headers,
    },
  });

  // 错误处理
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: response.statusText,
    }));
    throw error;
  }

  return response.json();
};
```

## 故障排查

### 类型不匹配

**问题**: 前端类型与后端不一致

**解决**:

```bash
pnpm types:sync
```

### 生成失败

**问题**: Orval 生成失败

**检查**:

1. `apps/api/openapi/openapi.json` 是否存在
2. Orval 配置路径是否正确
3. 后端 API 是否可以正常启动

### 导入错误

**问题**: 无法导入生成的类型

**解决**:

```typescript
// 确保使用正确的导入路径
import { useListUsersApiV1UsersGet } from "@/api/endpoints/users/users";
import type { UserResponse } from "@/api/models";
```

## 版本控制

### .gitignore 配置

生成的文件已添加到 `.gitignore`:

```gitignore
# OpenAPI 生成的文件
apps/api/openapi/
apps/web/src/api/endpoints/
apps/web/src/api/models/
```

### 为什么不提交生成的文件？

1. **可重现**: 任何人都可以通过 `pnpm types:sync` 重新生成
2. **减少冲突**: 避免合并冲突
3. **保持同步**: 强制开发者使用最新的 API 定义

## CI/CD 集成

### GitHub Actions 示例

```yaml
name: CI

on: [push, pull_request]

jobs:
  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.13"

      - name: Install dependencies
        run: pnpm install

      - name: Sync types
        run: pnpm types:sync

      - name: Type check
        run: pnpm --filter web build
```

## 相关文档

- [详细文档](../../docs/TYPE_SYNC.md)
- [使用示例](../../apps/web/src/examples/UserList.tsx)
- [后端规则](./backend-rules.md)
- [前端规则](./frontend-rules.md)
