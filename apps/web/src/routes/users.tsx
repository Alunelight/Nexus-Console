import { useListUsersPageApiV1UsersPageGet } from "@/api/endpoints/users/users";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requirePermission } from "@/utils/routeGuards";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/users")({
  beforeLoad: async ({ location }) => {
    await requirePermission("users:read", location.href);
  },
  component: Users,
});

function Users() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const params = useMemo(() => {
    const isActive =
      status === "all" ? undefined : status === "active" ? true : false;
    return {
      skip: (page - 1) * limit,
      limit,
      q: q.trim() || undefined,
      is_active: isActive,
    };
  }, [page, limit, q, status]);

  const { data, isPending, isError } =
    useListUsersPageApiV1UsersPageGet(params);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasMore = data?.has_more ?? false;

  return (
    <div className="p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
          <CardDescription>支持服务端分页 / 搜索 / 状态筛选</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="搜索邮箱/名称"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant={status === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setStatus("all");
                  setPage(1);
                }}
              >
                全部
              </Button>
              <Button
                type="button"
                variant={status === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setStatus("active");
                  setPage(1);
                }}
              >
                启用
              </Button>
              <Button
                type="button"
                variant={status === "inactive" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setStatus("inactive");
                  setPage(1);
                }}
              >
                禁用
              </Button>
            </div>
          </div>

          {isPending && <p className="text-muted-foreground">加载中...</p>}
          {isError && <p className="text-destructive">加载失败</p>}
          {!isPending && items.length === 0 && (
            <p className="text-muted-foreground">暂无用户</p>
          )}
          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{user.name || "未命名"}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    to="/users/$userId"
                    params={{ userId: String(user.id) }}
                  >
                    <Button variant="outline" size="sm">
                      查看详情
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              共 {total} 条，当前第 {page} 页
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || isPending}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                上一页
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!hasMore || isPending}
                onClick={() => setPage((p) => p + 1)}
              >
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
