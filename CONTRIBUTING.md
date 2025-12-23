# 贡献指南

感谢你对 Nexus Console 项目的关注！本文档将帮助你了解如何为项目做出贡献。

## 开发流程

### 1. Fork 和克隆项目

```bash
# Fork 项目到你的 GitHub 账号
# 然后克隆到本地
git clone https://github.com/YOUR_USERNAME/nexus-console.git
cd nexus-console
```

### 2. 设置开发环境

```bash
# 运行自动化设置脚本
./scripts/dev-setup.sh

# 或手动设置
pnpm install
pnpm --filter api install:deps
cp apps/api/.env.example apps/api/.env
# 更新 .env 中的 SECRET_KEY
docker compose -f docker-compose.dev.yml up -d
pnpm types:sync
```

### 3. 创建特性分支

```bash
git checkout -b feat/your-feature-name
# 或
git checkout -b fix/your-bug-fix
```

### 4. 开发和测试

```bash
# 启动开发服务器
pnpm dev

# 运行测试
pnpm test

# 运行代码检查
pnpm lint

# 类型同步（修改后端 API 后）
pnpm types:sync
```

### 5. 提交代码

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
# 提交格式
<type>(<scope>): <subject>

# 示例
feat(api): 添加用户认证功能
fix(web): 修复登录表单验证问题
docs(readme): 更新安装说明
refactor(api): 重构数据库连接逻辑
test(web): 添加 Button 组件测试
chore(deps): 更新依赖版本
perf(api): 优化数据库查询性能
```

**类型说明**：

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构（不是新功能也不是修复）
- `test`: 添加或修改测试
- `chore`: 构建过程或辅助工具的变动
- `perf`: 性能优化

**Scope 示例**：

- `api`: 后端 API
- `web`: 前端应用
- `db`: 数据库
- `deps`: 依赖
- `ci`: CI/CD

### 6. 推送和创建 Pull Request

```bash
git push origin feat/your-feature-name
```

然后在 GitHub 上创建 Pull Request。

## 代码规范

### 后端（Python）

遵循 [backend-rules.md](.kiro/steering/backend-rules.md)：

- ✅ 使用 SQLAlchemy 2.0 异步模式
- ✅ 使用 Pydantic v2 语法
- ✅ 所有函数必须有类型注解
- ✅ 使用 `async/await`
- ✅ 使用 Ruff 进行代码检查和格式化

```bash
# 代码检查
pnpm --filter api lint

# 格式化
pnpm --filter api format
```

### 前端（TypeScript/React）

遵循 [frontend-rules.md](.kiro/steering/frontend-rules.md)：

- ✅ TypeScript strict mode
- ✅ 使用 TanStack Router 和 TanStack Query
- ✅ 使用 Zustand 管理状态
- ✅ 使用 Tailwind CSS
- ✅ 使用 React Hook Form + Zod

```bash
# 代码检查
pnpm --filter web lint

# 类型检查
pnpm --filter web exec tsc --noEmit
```

### 依赖管理

遵循 [dependency-management.md](.kiro/steering/dependency-management.md)：

```bash
# ✅ 正确：安装前端依赖
pnpm --filter web add <package>
pnpm --filter web add -D <package>

# ✅ 正确：安装后端依赖（在 apps/api 目录下）
uv add <package>
uv add --dev <package>

# ❌ 错误：不要在根目录安装应用依赖
pnpm add <package> -w
```

## 测试要求

### 后端测试

- 目标覆盖率：90%+
- 使用 pytest + pytest-asyncio
- 测试文件命名：`test_*.py`

```bash
# 运行测试
pnpm --filter api test

# 查看覆盖率
pnpm --filter api test:coverage
```

### 前端测试

- 目标覆盖率：80%+
- 使用 Vitest + Testing Library
- 测试文件命名：`*.test.tsx`

```bash
# 运行测试
pnpm --filter web test

# 查看覆盖率
pnpm --filter web test:coverage

# UI 模式
pnpm --filter web test:ui
```

## 类型同步工作流

修改后端 API 后，必须同步类型：

```bash
# 1. 修改后端 Pydantic 模型
# 2. 运行类型同步
pnpm types:sync

# 3. 前端使用生成的类型和 Hooks
```

详见 [type-sync.md](.kiro/steering/type-sync.md)。

## Pull Request 检查清单

提交 PR 前，请确保：

- [ ] 代码遵循项目规范
- [ ] 所有测试通过
- [ ] 代码覆盖率达标
- [ ] 提交消息符合 Conventional Commits
- [ ] 更新了相关文档
- [ ] 运行了 `pnpm types:sync`（如果修改了后端 API）
- [ ] 没有遗留的 console.log 或调试代码
- [ ] 没有未使用的导入

## Code Review 流程

1. 提交 PR 后，CI 会自动运行测试和检查
2. 至少需要 1 位维护者的批准
3. 所有讨论必须解决
4. CI 必须通过
5. 维护者会合并 PR

## 报告问题

发现 bug 或有功能建议？请创建 Issue：

1. 使用清晰的标题
2. 提供详细的描述
3. 包含复现步骤（如果是 bug）
4. 附上相关的日志或截图

## 安全问题

如果发现安全漏洞，请不要公开披露。请发送邮件至 security@example.com。

详见 [SECURITY.md](SECURITY.md)。

## 获取帮助

- 📖 查看 [README.md](README.md)
- 📚 阅读 [文档](docs/)
- 💬 在 Issue 中提问
- 🔧 查看 [Steering 规则](.kiro/steering/)

## 许可证

通过贡献代码，你同意你的贡献将在 [LICENSE](LICENSE) 下发布。

---

再次感谢你的贡献！🎉
