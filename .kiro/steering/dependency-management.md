# 依赖管理规范

> 本文档定义 Monorepo 中的依赖安装和管理规范

## 核心原则

1. **就近原则**: 依赖应安装在实际使用它的包中
2. **避免重复**: 共享依赖应提升到根目录
3. **明确范围**: 区分开发依赖和生产依赖

## pnpm Workspace 架构

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*" # 应用包（api, web）
  - "packages/*" # 共享包（api-client 等）
```

## 依赖安装位置

### ✅ 正确做法

#### 1. 子包专用依赖

安装在实际使用的子包中：

```bash
# 前端专用依赖 - 安装到 apps/web
pnpm --filter web add react
pnpm --filter web add -D orval

# 后端专用依赖 - 使用 uv（不是 pnpm）
cd apps/api && uv add fastapi
cd apps/api && uv add --dev ruff
```

**示例**：

- `orval` → `apps/web/package.json` ✅（仅前端使用）
- `@tanstack/react-query` → `apps/web/package.json` ✅（仅前端使用）
- `vite` → `apps/web/package.json` ✅（仅前端构建工具）

#### 2. 根目录依赖

仅安装 Monorepo 管理工具：

```bash
# 在根目录安装
pnpm add -D turbo -w
pnpm add -D typescript -w  # 如果所有子包都需要
```

**示例**：

- `turbo` → `package.json` ✅（Monorepo 构建工具）
- `typescript` → 根目录或各子包 ✅（取决于是否共享配置）

#### 3. 共享包依赖

如果创建了共享包（如 `packages/api-client`）：

```bash
# 安装到共享包
pnpm --filter @nexus/api-client add axios
```

### ❌ 错误做法

#### 1. 在根目录安装子包专用依赖

```bash
# ❌ 错误：在根目录安装前端依赖
pnpm add -D orval -w

# ❌ 错误：在根目录安装 React
pnpm add react -w
```

**问题**：

- 污染根目录 `node_modules`
- 依赖关系不清晰
- 可能导致版本冲突

#### 2. 在错误的子包中安装

```bash
# ❌ 错误：在 API 包中安装前端依赖
pnpm --filter api add react

# ❌ 错误：在 Web 包中安装后端依赖
pnpm --filter web add fastapi
```

#### 3. 使用 cd 切换目录

```bash
# ❌ 错误：切换目录后安装
cd apps/web && pnpm add orval

# ✅ 正确：使用 --filter
pnpm --filter web add orval
```

**原因**：

- 破坏 pnpm workspace 的依赖提升机制
- 可能创建重复的 `node_modules`
- 不符合 Monorepo 最佳实践

## 依赖安装命令

### 前端依赖（apps/web）

```bash
# 生产依赖
pnpm --filter web add <package>

# 开发依赖
pnpm --filter web add -D <package>

# 示例
pnpm --filter web add @tanstack/react-query
pnpm --filter web add -D orval
pnpm --filter web add -D @types/node
```

### 后端依赖（apps/api）

```bash
# Python 使用 uv，不是 pnpm
cd apps/api

# 生产依赖
uv add <package>

# 开发依赖
uv add --dev <package>

# 示例
uv add fastapi
uv add --dev ruff
uv add --dev mypy
```

### 根目录依赖

```bash
# 仅限 Monorepo 工具
pnpm add -D <package> -w

# 示例
pnpm add -D turbo -w
```

## 依赖类型分类

### 前端（apps/web）

| 类型     | 示例                           | 位置       |
| -------- | ------------------------------ | ---------- |
| UI 框架  | react, react-dom               | `apps/web` |
| 状态管理 | zustand, @tanstack/react-query | `apps/web` |
| 路由     | @tanstack/react-router         | `apps/web` |
| 表单     | react-hook-form, zod           | `apps/web` |
| 样式     | tailwindcss                    | `apps/web` |
| 构建工具 | vite, typescript               | `apps/web` |
| 代码生成 | orval                          | `apps/web` |

### 后端（apps/api）

| 类型     | 示例                | 位置       |
| -------- | ------------------- | ---------- |
| Web 框架 | fastapi, uvicorn    | `apps/api` |
| ORM      | sqlalchemy, alembic | `apps/api` |
| 验证     | pydantic            | `apps/api` |
| 任务队列 | celery              | `apps/api` |
| 代码检查 | ruff, mypy          | `apps/api` |

### 根目录

| 类型          | 示例  | 位置   |
| ------------- | ----- | ------ |
| Monorepo 工具 | turbo | 根目录 |

## 检查依赖位置

### 查看已安装依赖

```bash
# 查看所有包的依赖
pnpm list --depth 0

# 查看特定包的依赖
pnpm --filter web list --depth 0
pnpm --filter api list --depth 0

# 查看根目录依赖
pnpm list --depth 0 --filter .
```

### 验证依赖位置

```bash
# 检查 orval 是否在正确位置
cat apps/web/package.json | grep orval  # 应该有输出
cat package.json | grep orval            # 应该无输出
```

## 依赖更新

### 更新子包依赖

```bash
# 更新前端依赖
pnpm --filter web update <package>

# 更新所有前端依赖
pnpm --filter web update

# 更新后端依赖
cd apps/api && uv sync --upgrade
```

### 更新所有依赖

```bash
# 更新所有 workspace 的依赖
pnpm update -r
```

## 依赖清理

### 清理 node_modules

```bash
# 清理所有 node_modules
pnpm clean

# 或手动删除
rm -rf node_modules apps/*/node_modules packages/*/node_modules

# 重新安装
pnpm install
```

### 清理 Python 虚拟环境

```bash
cd apps/api
rm -rf .venv
uv sync
```

## 常见问题

### Q: 为什么不在根目录安装所有依赖？

**A**:

1. **依赖隔离**: 每个包只包含自己需要的依赖
2. **构建优化**: 减少不必要的依赖打包
3. **版本管理**: 不同包可以使用不同版本
4. **清晰度**: 依赖关系一目了然

### Q: 什么时候应该在根目录安装？

**A**: 仅当依赖是 Monorepo 管理工具时：

- `turbo` - Monorepo 构建工具
- `pnpm` - 包管理器（通过 packageManager 字段）

### Q: 如何处理共享依赖？

**A**:

1. **创建共享包**: `packages/shared`
2. **在共享包中安装**: `pnpm --filter @nexus/shared add <package>`
3. **其他包引用**: `pnpm --filter web add @nexus/shared`

### Q: pnpm workspace 会自动提升依赖吗？

**A**: 是的，pnpm 会自动提升公共依赖到根目录的 `node_modules`，但：

- 依赖仍然声明在各自的 `package.json` 中
- 这是 pnpm 的内部优化，不影响我们的安装规范

## 最佳实践总结

1. ✅ **使用 `--filter` 安装依赖**，不要 `cd` 切换目录
2. ✅ **依赖安装在使用它的包中**
3. ✅ **后端使用 `uv`，前端使用 `pnpm`**
4. ✅ **根目录只安装 Monorepo 工具**
5. ❌ **不要在根目录安装应用依赖**
6. ❌ **不要在错误的包中安装依赖**

## 相关文档

- [pnpm Workspace 文档](https://pnpm.io/workspaces)
- [Turborepo 文档](https://turbo.build/repo/docs)
- [项目结构](./structure.md)
- [技术栈说明](./tech.md)
