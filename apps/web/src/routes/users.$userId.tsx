import { useMemo, useState } from "react";

import {
  useGetUserApiV1UsersUserIdGet,
  useUpdateUserApiV1UsersUserIdPatch,
} from "@/api/endpoints/users/users";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { requirePermission } from "@/utils/routeGuards";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/users/$userId")({
  beforeLoad: async ({ location }) => {
    await requirePermission("users:read", location.href);
  },
  component: UserDetailPage,
});

function UserDetailPage() {
  const { userId } = Route.useParams();
  const id = Number(userId);

  const { handleError } = useErrorHandler();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const userQuery = useGetUserApiV1UsersUserIdGet(id, {
    query: {
      enabled: Number.isFinite(id),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      onSuccess: (u) => {
        setEmail(u.email);
        setName(u.name ?? "");
        setIsActive(u.is_active);
      },
    },
  });
  const updateUser = useUpdateUserApiV1UsersUserIdPatch();

  const user = userQuery.data;

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);

  const rolesText = useMemo(() => {
    const roles = user?.roles ?? [];
    if (!roles.length) return "（无）";
    return roles.map((r) => r.name).join(", ");
  }, [user?.roles]);

  const onSave = async () => {
    if (!user) return;
    try {
      setError("");
      setSuccess("");
      await updateUser.mutateAsync({
        userId: user.id,
        data: {
          email: email.trim() || undefined,
          name: name.trim() || undefined,
          is_active: isActive,
        },
      });
      await userQuery.refetch();
      setSuccess("已保存");
    } catch (err: unknown) {
      const info = handleError(err, {
        showToast: false,
        defaultMessage: "保存失败",
      });
      setError(info.message);
    }
  };

  return (
    <div className="p-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>用户详情</CardTitle>
          <CardDescription>编辑 email / name / 状态</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600">
              {success}
            </div>
          ) : null}

          {userQuery.isPending ? (
            <p className="text-muted-foreground">加载中...</p>
          ) : null}
          {userQuery.isError ? (
            <p className="text-destructive">加载失败</p>
          ) : null}

          {user ? (
            <>
              <div className="grid gap-3">
                <div className="text-sm text-muted-foreground">
                  ID: <span className="font-mono">{user.id}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  角色: <span className="font-mono">{rolesText}</span>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">邮箱</label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={updateUser.isPending}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">名称</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={updateUser.isPending}
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={updateUser.isPending}
                />
                启用
              </label>

              <Button onClick={onSave} disabled={updateUser.isPending}>
                {updateUser.isPending ? "保存中..." : "保存"}
              </Button>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
