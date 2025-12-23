import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/about')({
  component: About,
});

function About() {
  return (
    <div className="p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>关于 Nexus Console</CardTitle>
          <CardDescription>技术栈信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">前端技术栈</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>React 19 + TypeScript 5</li>
              <li>TanStack Router + TanStack Query v5</li>
              <li>shadcn/ui + Tailwind CSS 4</li>
              <li>Zustand + React Hook Form + Zod</li>
              <li>Orval (API 代码生成)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">后端技术栈</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Python 3.13 + FastAPI</li>
              <li>SQLAlchemy 2.0 (异步) + Alembic</li>
              <li>Pydantic v2 + Ruff + MyPy</li>
              <li>PostgreSQL 16 + Redis 7</li>
              <li>Celery 5.6 (任务队列)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
