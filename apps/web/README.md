# Nexus Console Web

基于 React 19 + TypeScript 的现代化前端应用。

## 技术栈

- **React**: 19.x
- **TypeScript**: 5.x (strict mode)
- **Vite**: 5.x (使用 Rolldown)
- **TanStack Query**: v5 (数据获取)
- **TanStack Router**: latest (路由)
- **Zustand**: latest (状态管理)
- **Tailwind CSS**: 3.x/4.x (样式)
- **React Hook Form**: 7.x (表单)
- **Zod**: 3.x (验证)

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

复制 `.env.example` 到 `.env`：

```bash
cp .env.example .env
```

### 运行开发服务器

```bash
pnpm dev
```

应用将在 http://localhost:5173 运行

## 开发命令

```bash
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本
pnpm preview          # 预览生产构建
pnpm lint             # 运行 ESLint
```

## 项目结构

```
src/
├── main.tsx          # 应用入口
├── App.tsx           # 根组件
├── routes/           # TanStack Router 路由
├── components/       # React 组件
│   └── ui/           # UI 组件
├── lib/              # 工具函数
├── stores/           # Zustand 状态
├── hooks/            # 自定义 Hooks
└── types/            # TypeScript 类型
```

## 代码规范

- TypeScript strict mode 启用
- 使用 TanStack Query 进行数据获取
- 使用 Zustand 管理客户端状态
- 使用 Tailwind CSS 编写样式
- 使用 React Hook Form + Zod 处理表单
- 禁止使用 Redux、Axios、CSS-in-JS
