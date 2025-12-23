import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <div className="p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>欢迎来到 Nexus Console</CardTitle>
          <CardDescription>
            现代化全栈应用控制台，采用 Monorepo 架构
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            技术栈：React 19 + TypeScript + TanStack Router + shadcn/ui
          </p>
          <div className="flex gap-2">
            <Button>开始使用</Button>
            <Button variant="outline">了解更多</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
