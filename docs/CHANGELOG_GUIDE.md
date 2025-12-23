# CHANGELOG 自动化使用指南

## 📚 什么是 CHANGELOG 自动化？

CHANGELOG 自动化使用 **standard-version** 工具，基于 Git 提交历史自动生成版本号和更新日志。

---

## 🔄 工作原理

### 1. 读取提交历史

```bash
# standard-version 会分析自上次发布以来的所有提交
git log v1.0.0..HEAD
```

### 2. 解析提交类型

根据 Conventional Commits 规范：

| 提交类型           | 说明       | 版本影响              | CHANGELOG 分类      |
| ------------------ | ---------- | --------------------- | ------------------- |
| `feat:`            | 新功能     | Minor (1.0.0 → 1.1.0) | ✨ Features         |
| `fix:`             | Bug 修复   | Patch (1.0.0 → 1.0.1) | 🐛 Bug Fixes        |
| `perf:`            | 性能优化   | Patch                 | ⚡ Performance      |
| `refactor:`        | 重构       | -                     | ♻️ Refactoring      |
| `docs:`            | 文档       | -                     | 📚 Documentation    |
| `style:`           | 代码格式   | -                     | 💄 Styles           |
| `test:`            | 测试       | -                     | ✅ Tests            |
| `chore:`           | 杂项       | -                     | 🔧 Chores           |
| `BREAKING CHANGE:` | 破坏性变更 | Major (1.0.0 → 2.0.0) | ⚠️ BREAKING CHANGES |

### 3. 自动生成 CHANGELOG

生成格式化的 CHANGELOG.md：

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2025-12-23

### ✨ Features

- **api**: 添加用户登录功能 ([abc123](https://github.com/user/repo/commit/abc123))
- **web**: 实现响应式布局 ([def456](https://github.com/user/repo/commit/def456))

### 🐛 Bug Fixes

- **web**: 修复按钮样式问题 ([ghi789](https://github.com/user/repo/commit/ghi789))

### 📚 Documentation

- 更新 README ([jkl012](https://github.com/user/repo/commit/jkl012))
```

### 4. 更新版本号

自动更新 `package.json`:

```json
{
  "version": "1.1.0" // 从 1.0.0 自动更新
}
```

### 5. 创建 Git 标签

```bash
git tag v1.1.0
git commit -m "chore(release): 1.1.0"
```

---

## 🚀 使用方法

### 基础用法

```bash
# 1. 确保所有改动已提交
git status

# 2. 运行自动发布（自动判断版本类型）
pnpm release

# 3. 推送到远程（包括标签）
git push --follow-tags origin main
```

### 指定版本类型

```bash
# 补丁版本（修复 Bug）
pnpm release:patch    # 1.0.0 → 1.0.1

# 次版本（新功能）
pnpm release:minor    # 1.0.0 → 1.1.0

# 主版本（破坏性变更）
pnpm release:major    # 1.0.0 → 2.0.0
```

### 预发布版本

```bash
# 创建预发布版本
pnpm release -- --prerelease alpha
# 1.0.0 → 1.0.1-alpha.0

pnpm release -- --prerelease beta
# 1.0.0 → 1.0.1-beta.0
```

### 首次发布

```bash
# 首次发布（创建初始版本）
pnpm release -- --first-release
```

---

## 📝 提交规范

### 基本格式

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### 示例

#### 1. 新功能

```bash
git commit -m "feat(api): 添加用户登录功能"
git commit -m "feat(web): 实现响应式布局"
```

#### 2. Bug 修复

```bash
git commit -m "fix(api): 修复用户注册验证问题"
git commit -m "fix(web): 修复按钮样式在移动端的显示"
```

#### 3. 文档更新

```bash
git commit -m "docs: 更新 README 安装说明"
git commit -m "docs(api): 添加 API 使用示例"
```

#### 4. 破坏性变更

```bash
git commit -m "feat(api): 重构用户认证系统

BREAKING CHANGE: 旧的 token 格式不再支持，需要重新登录"
```

#### 5. 多行提交

```bash
git commit -m "feat(api): 添加用户权限系统

- 实现角色管理
- 实现权限检查中间件
- 添加权限装饰器

Closes #123"
```

---

## 🎯 完整工作流示例

### 场景：开发新功能并发布

```bash
# 1. 创建功能分支
git checkout -b feature/user-profile

# 2. 开发并提交（符合规范）
git add .
git commit -m "feat(web): 添加用户个人资料页面"

git add .
git commit -m "feat(api): 添加用户资料更新接口"

git add .
git commit -m "test(web): 添加个人资料页面测试"

# 3. 合并到主分支
git checkout main
git merge feature/user-profile

# 4. 运行自动发布
pnpm release
# 输出：
# ✔ bumping version in package.json from 1.0.0 to 1.1.0
# ✔ outputting changes to CHANGELOG.md
# ✔ committing package.json and CHANGELOG.md
# ✔ tagging release v1.1.0

# 5. 推送到远程
git push --follow-tags origin main

# 6. 查看生成的 CHANGELOG
cat CHANGELOG.md
```

---

## 🔍 CHANGELOG 示例

### 生成前（手动维护）

```markdown
- [2025-12-23] feat(api): 添加用户登录功能
- [2025-12-23] fix(web): 修复按钮样式问题
- [2025-12-22] docs: 更新 README
```

### 生成后（自动化）

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2025-12-23

### ✨ Features

- **api**: 添加用户登录功能 ([abc123](https://github.com/Alunelight/Nexus-Console/commit/abc123))
- **web**: 实现响应式布局 ([def456](https://github.com/Alunelight/Nexus-Console/commit/def456))

### 🐛 Bug Fixes

- **web**: 修复按钮样式问题 ([ghi789](https://github.com/Alunelight/Nexus-Console/commit/ghi789))

### 📚 Documentation

- 更新 README ([jkl012](https://github.com/Alunelight/Nexus-Console/commit/jkl012))

## [1.0.0] - 2025-12-22

### ✨ Features

- **api**: 初始化 FastAPI 项目
- **web**: 初始化 React 项目
```

---

## ⚙️ 配置说明

### .versionrc.json

```json
{
  "types": [
    { "type": "feat", "section": "✨ Features" },
    { "type": "fix", "section": "🐛 Bug Fixes" },
    { "type": "perf", "section": "⚡ Performance" },
    { "type": "refactor", "section": "♻️ Refactoring" },
    { "type": "docs", "section": "📚 Documentation" },
    { "type": "style", "section": "💄 Styles" },
    { "type": "test", "section": "✅ Tests" },
    { "type": "chore", "section": "🔧 Chores" }
  ],
  "skip": {
    "changelog": false
  },
  "releaseCommitMessageFormat": "chore(release): {{currentTag}}"
}
```

---

## 💡 最佳实践

### 1. 提交频率

- ✅ 每个功能/修复一个提交
- ✅ 提交信息清晰描述变更
- ❌ 避免 "WIP" 或 "update" 等模糊提交

### 2. Scope 使用

```bash
# 好的 scope
feat(api): ...      # 后端 API
feat(web): ...      # 前端
feat(docs): ...     # 文档
feat(ci): ...       # CI/CD

# 避免过于具体
feat(user-login-button): ...  # 太具体
```

### 3. 提交信息

```bash
# ✅ 好的提交信息
feat(api): 添加用户登录功能
fix(web): 修复按钮在移动端的样式问题

# ❌ 不好的提交信息
feat: update
fix: bug fix
chore: changes
```

### 4. 破坏性变更

```bash
# 必须在提交信息中明确标注
feat(api): 重构认证系统

BREAKING CHANGE: 旧的 token 格式不再支持
```

---

## 🐛 常见问题

### Q1: 如何跳过某些提交？

A: 使用 `chore` 类型，不会影响版本号：

```bash
git commit -m "chore: 更新依赖"
```

### Q2: 如何修改已生成的 CHANGELOG？

A: 可以手动编辑 CHANGELOG.md，下次发布会追加新内容。

### Q3: 如何回退版本？

```bash
# 删除标签
git tag -d v1.1.0
git push origin :refs/tags/v1.1.0

# 回退提交
git reset --hard HEAD~1
```

### Q4: 首次使用如何迁移？

```bash
# 1. 备份当前 CHANGELOG
mv CHANGELOG.md CHANGELOG.old.md

# 2. 首次发布
pnpm release -- --first-release

# 3. 手动合并旧内容（如果需要）
```

---

## 📚 相关资源

- [Conventional Commits](https://www.conventionalcommits.org/)
- [SemVer 语义化版本](https://semver.org/)
- [standard-version 文档](https://github.com/conventional-changelog/standard-version)
- [commitlint 文档](https://commitlint.js.org/)

---

## 🎯 快速参考

```bash
# 查看当前版本
cat package.json | grep version

# 预览将要生成的 CHANGELOG（不实际发布）
pnpm release -- --dry-run

# 发布并跳过 Git 操作（仅更新文件）
pnpm release -- --skip.commit --skip.tag

# 发布特定版本
pnpm release -- --release-as 2.0.0
```
