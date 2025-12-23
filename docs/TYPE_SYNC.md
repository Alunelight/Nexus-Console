# 前后端类型同步自动化

本项目实现了基于 OpenAPI 规范的前后端类型自动同步机制，确保前后端接口定义始终保持一致。

## 工作流程

```
后端 FastAPI + Pydantic
        ↓
   导出 OpenAPI 规范
        ↓
   openapi.json
        ↓
   Orval 代码生成
        ↓
前端 TypeScript Hooks + 类型
```

## 核心组件

### 1. 后端 OpenAPI 导出

**脚本位置**: `apps/api/scripts/export_openapi.py`

FastAPI 自动从 Pydantic 模型和路由定义生成 OpenAPI 规范。

```bash
# 导出 OpenAPI 规范
pnpm --filter api openapi:export
```

生成文件：`apps/api/openapi/openapi.json`

### 2. Orval 配置

**配置文件**: `apps/web/orval.config.ts`

```typescript
import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: {
      target: "../api/openapi/openapi.json",
    },
    output: {
      mode: "tags-split",
      target: "src/api/endpoints",
      schemas: "src/api/models",
      client: "react-query",
      baseUrl: "http://localhost:8000",
      override: {
        mutator: {
          path: "src/api/client.ts",
          name: "customFetch",
        },
      },
    },
  },
});
```

### 3. 前端代码生成

```bash
# 生成前端 API 客户端
pnpm --filter web api:generate
```

生成内容：

- `apps/web/src/api/endpoints/` - API Hooks（按 tag 分组）
- `apps/web/src/api/models/` - TypeScript 类型定义

## 使用方法

### 一键同步

```bash
# 在项目根目录执行
pnpm types:sync
```

此命令会：

1. 导出后端 OpenAPI 规范
2. 生成前端类型和 Hooks

### 开发流程

1. **修改后端 API**

   ```python
   # apps/api/app/schemas/user.py
   class UserCreate(BaseModel):
       email: EmailStr
       name: str | None = None
       age: int  # 新增字段
   ```

2. **同步类型**

   ```bash
   pnpm types:sync
   ```

3. **前端自动获得类型支持**

   ```typescript
   import { useCreateUserApiV1UsersPost } from "@/api/endpoints/users/users";
   import type { UserCreate } from "@/api/models";

   const newUser: UserCreate = {
     email: "test@example.com",
     name: "Test",
     age: 25, // TypeScript 会提示此字段
   };
   ```

## 前端使用示例

### 查询数据

```typescript
import { useListUsersApiV1UsersGet } from "@/api/endpoints/users/users";

function UserList() {
  const {
    data: users,
    isPending,
    isError,
  } = useListUsersApiV1UsersGet({
    skip: 0,
    limit: 10,
  });

  if (isPending) return <div>加载中...</div>;
  if (isError) return <div>加载失败</div>;

  return (
    <ul>
      {users?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### 创建数据

```typescript
import { useCreateUserApiV1UsersPost } from "@/api/endpoints/users/users";
import type { UserCreate } from "@/api/models";

function CreateUserForm() {
  const createUser = useCreateUserApiV1UsersPost();

  const handleSubmit = (data: UserCreate) => {
    createUser.mutate(
      { data },
      {
        onSuccess: () => {
          console.log("创建成功");
        },
      }
    );
  };

  return <form onSubmit={handleSubmit}>{/* 表单内容 */}</form>;
}
```

### 更新数据

```typescript
import { useUpdateUserApiV1UsersUserIdPatch } from "@/api/endpoints/users/users";
import type { UserUpdate } from "@/api/models";

function UpdateUser({ userId }: { userId: number }) {
  const updateUser = useUpdateUserApiV1UsersUserIdPatch();

  const handleUpdate = (data: UserUpdate) => {
    updateUser.mutate({
      userId,
      data,
    });
  };

  return (
    <button onClick={() => handleUpdate({ name: "New Name" })}>更新</button>
  );
}
```

## 自定义 Fetch 客户端

**位置**: `apps/web/src/api/client.ts`

所有生成的 API 调用都通过此客户端，可以在这里添加：

- 认证 Token
- 错误处理
- 请求拦截
- 响应转换

```typescript
export const customFetch = async <T>(
  config: RequestInit & { url: string }
): Promise<T> => {
  const { url, ...rest } = config;

  const response = await fetch(url, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      // 添加认证 Token
      Authorization: `Bearer ${getToken()}`,
      ...rest.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: response.statusText,
    }));
    throw error;
  }

  return response.json();
};
```

## 集成到构建流程

### 开发环境

建议在后端 API 修改后手动运行 `pnpm types:sync`。

### CI/CD

在 CI 流程中添加类型检查：

```yaml
# .github/workflows/ci.yml
- name: 同步类型
  run: pnpm types:sync

- name: 类型检查
  run: pnpm --filter web build
```

## 优势

1. **类型安全**: 前后端接口定义完全一致，编译时发现错误
2. **自动化**: 无需手动编写 API 调用代码
3. **文档同步**: OpenAPI 规范即文档
4. **开发效率**: 自动补全、类型提示
5. **重构友好**: 后端修改后前端立即感知

## 注意事项

1. **生成的文件不要手动修改** - 会被下次生成覆盖
2. **已添加到 .gitignore** - 生成的文件不提交到版本控制
3. **团队协作** - 拉取代码后需运行 `pnpm types:sync`
4. **API 版本管理** - 重大变更时考虑 API 版本化

## 相关命令

```bash
# 后端导出 OpenAPI
pnpm --filter api openapi:export

# 前端生成代码
pnpm --filter web api:generate

# 一键同步
pnpm types:sync

# 查看生成的文件
ls apps/web/src/api/endpoints/
ls apps/web/src/api/models/
```

## 故障排查

### 生成失败

1. 确保后端 API 服务可以正常启动
2. 检查 `apps/api/openapi/openapi.json` 是否生成
3. 查看 Orval 配置路径是否正确

### 类型错误

1. 运行 `pnpm types:sync` 重新生成
2. 检查后端 Pydantic 模型定义
3. 清理并重新安装依赖

### 导入路径问题

生成的文件使用相对路径，确保从正确位置导入：

```typescript
// ✅ 正确
import { useListUsersApiV1UsersGet } from "@/api/endpoints/users/users";

// ❌ 错误
import { useListUsersApiV1UsersGet } from "api/endpoints/users/users";
```
