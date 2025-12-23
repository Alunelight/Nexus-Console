# 性能优化指南

本文档介绍 Nexus Console 项目的性能优化策略和最佳实践。

## 📋 目录

- [前端性能优化](#前端性能优化)
- [后端性能优化](#后端性能优化)
- [数据库优化](#数据库优化)
- [缓存策略](#缓存策略)
- [性能监控](#性能监控)
- [性能测试](#性能测试)

---

## 🎨 前端性能优化

### 1. 代码分割

**已实施**：TanStack Router 自动代码分割

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    TanStackRouterVite({
      autoCodeSplitting: true, // 自动按路由分割代码
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 手动分割第三方库
          "react-vendor": ["react", "react-dom"],
          "tanstack-vendor": [
            "@tanstack/react-query",
            "@tanstack/react-router",
          ],
          "ui-vendor": ["@radix-ui/react-slot", "lucide-react", "sonner"],
          "form-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],
          "utils-vendor": ["clsx", "tailwind-merge", "date-fns"],
        },
      },
    },
  },
});
```

**效果**：

- 减少初始加载时间
- 按需加载路由组件
- 第三方库单独打包，利用浏览器缓存

### 2. Bundle 分析

**工具**：rollup-plugin-visualizer

```bash
# 构建并生成分析报告
pnpm --filter web build

# 查看报告
open apps/web/dist/stats.html
```

**分析指标**：

- 各模块大小
- Gzip 压缩后大小
- Brotli 压缩后大小
- 依赖关系图

### 3. 图片优化

**建议**：

```typescript
// 使用 lazy loading
<img src="image.jpg" loading="lazy" alt="description" />

// 使用现代图片格式
<picture>
  <source srcset="image.webp" type="image/webp" />
  <source srcset="image.jpg" type="image/jpeg" />
  <img src="image.jpg" alt="description" />
</picture>

// 响应式图片
<img
  srcset="small.jpg 480w, medium.jpg 800w, large.jpg 1200w"
  sizes="(max-width: 600px) 480px, (max-width: 900px) 800px, 1200px"
  src="medium.jpg"
  alt="description"
/>
```

### 4. React 性能优化

**避免不必要的重渲染**：

```typescript
// 使用 React.memo
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});

// 使用 useMemo 缓存计算结果
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// 使用 useCallback 缓存函数
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

**Zustand 优化**：

```typescript
// 使用 useShallow 避免不必要的重渲染
import { useShallow } from "zustand/react/shallow";

const { user, isAuthenticated } = useAuthStore(
  useShallow((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
  }))
);
```

### 5. TanStack Query 优化

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 分钟
      gcTime: 1000 * 60 * 10, // 10 分钟
      retry: 3, // 重试 3 次
      refetchOnWindowFocus: false, // 窗口聚焦时不重新获取
    },
  },
});
```

### 6. 性能指标

**Core Web Vitals**：

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

**测量工具**：

- Chrome DevTools Lighthouse
- WebPageTest
- Google PageSpeed Insights

---

## ⚡ 后端性能优化

### 1. 数据库连接池

**已实施**：

```python
# apps/api/app/database.py
engine = create_async_engine(
    settings.database_url,
    pool_size=20,              # 连接池大小
    max_overflow=10,           # 最大溢出连接
    pool_pre_ping=True,        # 连接健康检查
    pool_recycle=3600,         # 连接回收时间（秒）
)
```

**效果**：

- 减少数据库连接开销
- 提高并发处理能力
- 避免连接泄漏

### 2. 异步处理

**已实施**：全部使用异步模式

```python
# ✅ 正确：异步处理
@router.get("/users")
async def list_users(
    db: Annotated[AsyncSession, Depends(get_db)]
) -> list[UserResponse]:
    result = await db.execute(select(User))
    return result.scalars().all()
```

**效果**：

- 提高并发处理能力
- 减少线程开销
- 更好的资源利用

### 3. 响应压缩

**已实施**：GZip 压缩

```python
# apps/api/app/main.py
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)
```

**效果**：

- 减少传输数据量
- 提高响应速度
- 降低带宽成本

### 4. API 限流

**已实施**：slowapi

```python
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)

@router.get("/users")
@limiter.limit("200/minute")
async def list_users(...):
    pass
```

**效果**：

- 防止 DDoS 攻击
- 保护服务器资源
- 提高服务稳定性

---

## 🗄️ 数据库优化

### 1. 索引优化

**已实施**：

```python
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(unique=True, index=True)
    name: Mapped[str | None] = mapped_column(index=True)  # 支持按名称搜索
    is_active: Mapped[bool] = mapped_column(index=True)  # 支持按状态过滤
    created_at: Mapped[datetime] = mapped_column(index=True)  # 支持按时间排序
    updated_at: Mapped[datetime] = mapped_column(index=True)
```

**索引策略**：

- 主键自动索引
- 唯一约束自动索引
- 频繁查询的字段添加索引
- 排序字段添加索引
- 避免过多索引（影响写入性能）

### 2. 查询优化

**使用 selectinload 避免 N+1 查询**：

```python
from sqlalchemy.orm import selectinload

# ❌ N+1 查询问题
users = await db.execute(select(User))
for user in users.scalars():
    posts = await db.execute(select(Post).where(Post.user_id == user.id))

# ✅ 使用 selectinload
result = await db.execute(
    select(User).options(selectinload(User.posts))
)
users = result.scalars().all()
```

**使用分页**：

```python
# 使用 offset 和 limit
result = await db.execute(
    select(User)
    .offset(skip)
    .limit(limit)
)
```

### 3. 数据库配置

**PostgreSQL 优化**：

```sql
-- 增加共享缓存
shared_buffers = 256MB

-- 增加工作内存
work_mem = 16MB

-- 增加维护工作内存
maintenance_work_mem = 128MB

-- 启用查询计划缓存
plan_cache_mode = auto
```

---

## 💾 缓存策略

### 1. Redis 缓存

**已实施**：fastapi-cache2

```python
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache

# 初始化
FastAPICache.init(RedisBackend(redis), prefix="fastapi-cache")

# 使用缓存
@router.get("/users")
@cache(expire=60)  # 缓存 60 秒
async def list_users(...):
    pass
```

**缓存策略**：

- GET 请求缓存
- 频繁访问的数据缓存
- 计算密集型结果缓存
- 合理设置过期时间

### 2. 缓存失效

```python
from fastapi_cache import FastAPICache

# 手动清除缓存
await FastAPICache.clear()

# 清除特定键
await FastAPICache.clear(namespace="users")
```

### 3. 缓存预热

```python
# 应用启动时预热缓存
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 预热常用数据
    await warm_up_cache()
    yield
```

---

## 📊 性能监控

### 1. Prometheus 指标

**关键指标**：

```promql
# 请求速率
rate(http_requests_total[5m])

# 响应时间 P95
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# 错误率
rate(http_requests_total{status=~"5.."}[5m])

# 数据库连接数
pg_stat_database_numbackends

# Redis 内存使用
redis_memory_used_bytes
```

### 2. 性能告警

**告警规则**：

```yaml
# 高响应时间
- alert: HighResponseTime
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "95% 请求响应时间超过 1 秒"

# 高错误率
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "5xx 错误率超过 5%"
```

---

## 🧪 性能测试

### 1. 负载测试

**工具**：Apache Bench, wrk, k6

```bash
# Apache Bench
ab -n 10000 -c 100 http://localhost:8000/api/v1/users

# wrk
wrk -t12 -c400 -d30s http://localhost:8000/api/v1/users

# k6
k6 run load-test.js
```

### 2. 压力测试

```javascript
// k6 压力测试脚本
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "2m", target: 100 }, // 2 分钟内增加到 100 用户
    { duration: "5m", target: 100 }, // 保持 100 用户 5 分钟
    { duration: "2m", target: 200 }, // 增加到 200 用户
    { duration: "5m", target: 200 }, // 保持 200 用户 5 分钟
    { duration: "2m", target: 0 }, // 逐渐减少到 0
  ],
};

export default function () {
  const res = http.get("http://localhost:8000/api/v1/users");
  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

### 3. 性能基准

**目标指标**：

| 指标           | 目标值   | 说明             |
| -------------- | -------- | ---------------- |
| 响应时间 P50   | < 100ms  | 50% 请求响应时间 |
| 响应时间 P95   | < 500ms  | 95% 请求响应时间 |
| 响应时间 P99   | < 1000ms | 99% 请求响应时间 |
| 吞吐量         | > 1000/s | 每秒处理请求数   |
| 错误率         | < 0.1%   | 错误请求占比     |
| 并发用户数     | > 500    | 同时在线用户数   |
| 数据库查询时间 | < 50ms   | 平均查询时间     |
| 缓存命中率     | > 80%    | Redis 缓存命中率 |

---

## 📚 相关文档

- [监控文档](MONITORING.md)
- [部署文档](DEPLOYMENT.md)
- [审计报告](PROJECT_AUDIT_REPORT.md)

---

**最后更新**：2025-12-23
