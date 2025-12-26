import { useMemo, useState } from "react";

import {
  useGetAuditLogApiV1AuditLogsLogIdGet,
  useListAuditLogsApiV1AuditLogsGet,
} from "@/api/endpoints/audit/audit";
import type { AuditLogResponse } from "@/api/models";
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

export const Route = createFileRoute("/admin/audit")({
  beforeLoad: async ({ location }) => {
    await requirePermission("rbac:read", location.href);
  },
  component: AdminAuditPage,
});

function AdminAuditPage() {
  const { handleError } = useErrorHandler();

  const [page, setPage] = useState(1);
  const limit = 50;

  const [actorUserId, setActorUserId] = useState("");
  const [action, setAction] = useState("");
  const [targetType, setTargetType] = useState("");
  const [targetId, setTargetId] = useState("");
  const [requestId, setRequestId] = useState("");

  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [uiError, setUiError] = useState("");

  const parsedFilters = useMemo(() => {
    const actor =
      actorUserId.trim() === "" ? undefined : Number(actorUserId.trim());
    const tid = targetId.trim() === "" ? undefined : Number(targetId.trim());
    return { actor, tid };
  }, [actorUserId, targetId]);

  const params = useMemo(() => {
    const p: Record<string, unknown> = {
      skip: (page - 1) * limit,
      limit,
    };

    if (parsedFilters.actor !== undefined)
      p.actor_user_id = parsedFilters.actor;
    if (action.trim()) p.action = action.trim();
    if (targetType.trim()) p.target_type = targetType.trim();
    if (parsedFilters.tid !== undefined) p.target_id = parsedFilters.tid;
    if (requestId.trim()) p.request_id = requestId.trim();

    return p;
  }, [
    action,
    limit,
    page,
    parsedFilters.actor,
    parsedFilters.tid,
    requestId,
    targetType,
  ]);

  const listQuery = useListAuditLogsApiV1AuditLogsGet(params, {
    query: {
      refetchOnWindowFocus: false,
      retry: false,
      onError: (err) => {
        const info = handleError(err, {
          showToast: false,
          defaultMessage: "加载审计日志失败",
        });
        setUiError(info.message);
      },
    },
  });

  const items = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const hasMore = listQuery.data?.has_more ?? false;

  const detailQuery = useGetAuditLogApiV1AuditLogsLogIdGet(selectedLogId ?? 0, {
    query: {
      enabled: selectedLogId !== null,
      refetchOnWindowFocus: false,
      retry: false,
    },
  });

  const onApplyFilters = () => {
    setUiError("");
    if (
      parsedFilters.actor !== undefined &&
      !Number.isFinite(parsedFilters.actor)
    ) {
      setUiError("actor_user_id 必须是数字");
      return;
    }
    if (
      parsedFilters.tid !== undefined &&
      !Number.isFinite(parsedFilters.tid)
    ) {
      setUiError("target_id 必须是数字");
      return;
    }
    setPage(1);
    listQuery.refetch();
  };

  const onClearFilters = () => {
    setActorUserId("");
    setAction("");
    setTargetType("");
    setTargetId("");
    setRequestId("");
    setUiError("");
    setPage(1);
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">审计日志</h1>
        <p className="text-muted-foreground mt-2">查询系统关键操作记录</p>
      </div>

      {uiError ? (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {uiError}
        </div>
      ) : null}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>筛选</CardTitle>
          <CardDescription>
            支持按操作者、动作、目标、request_id 过滤
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="actor_user_id（数字）"
              value={actorUserId}
              onChange={(e) => setActorUserId(e.target.value)}
              disabled={listQuery.isFetching}
            />
            <Input
              placeholder="action（例如 rbac.role.create）"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              disabled={listQuery.isFetching}
            />
            <Input
              placeholder="target_type（例如 role / user）"
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              disabled={listQuery.isFetching}
            />
            <Input
              placeholder="target_id（数字）"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              disabled={listQuery.isFetching}
            />
            <Input
              placeholder="request_id（例如 req-2）"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              disabled={listQuery.isFetching}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={onApplyFilters} disabled={listQuery.isFetching}>
              {listQuery.isFetching ? "查询中..." : "查询"}
            </Button>
            <Button
              variant="outline"
              onClick={onClearFilters}
              disabled={listQuery.isFetching}
            >
              清空
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>日志列表</CardTitle>
          <CardDescription>共 {total} 条</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {listQuery.isPending ? (
            <p className="text-sm text-muted-foreground">加载中...</p>
          ) : null}
          {listQuery.isError ? (
            <p className="text-sm text-destructive">加载失败</p>
          ) : null}
          {!listQuery.isPending && items.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无数据</p>
          ) : null}

          {items.map((l) => (
            <AuditRow
              key={l.id}
              log={l}
              onOpen={() => setSelectedLogId(l.id)}
            />
          ))}

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">第 {page} 页</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || listQuery.isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                上一页
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!hasMore || listQuery.isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedLogId !== null ? (
        <AuditDrawer
          logId={selectedLogId}
          onClose={() => setSelectedLogId(null)}
          isLoading={detailQuery.isFetching}
          error={detailQuery.isError ? "加载详情失败" : null}
          log={detailQuery.data ?? null}
        />
      ) : null}
    </div>
  );
}

function AuditRow({
  log,
  onOpen,
}: {
  log: AuditLogResponse;
  onOpen: () => void;
}) {
  const time = useMemo(() => {
    try {
      return new Date(log.created_at as unknown as string).toLocaleString();
    } catch {
      return String(log.created_at);
    }
  }, [log.created_at]);

  return (
    <button
      type="button"
      className="w-full text-left rounded-md border p-3 hover:bg-muted"
      onClick={onOpen}
    >
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div className="font-mono text-xs text-muted-foreground">{time}</div>
        <div className="font-medium">{log.action}</div>
      </div>
      <div className="mt-1 text-sm text-muted-foreground">
        actor: {log.actor_user_id ?? "—"} | target: {log.target_type}#
        {log.target_id ?? "—"}
        {log.request_id ? ` | request_id: ${log.request_id}` : ""}
      </div>
    </button>
  );
}

function AuditDrawer({
  logId,
  onClose,
  isLoading,
  error,
  log,
}: {
  logId: number;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
  log: AuditLogResponse | null;
}) {
  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="关闭"
      />
      <div className="absolute inset-y-0 right-0 w-full max-w-xl bg-background border-l shadow-xl p-6 overflow-y-auto">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-lg font-semibold">详情</div>
            <div className="text-sm text-muted-foreground font-mono">
              id: {logId}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            关闭
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">加载中...</p>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {log ? (
            <>
              <div className="rounded-md border p-3 space-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">action:</span>{" "}
                  <span className="font-mono">{log.action}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">actor_user_id:</span>{" "}
                  <span className="font-mono">{log.actor_user_id ?? "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">target:</span>{" "}
                  <span className="font-mono">
                    {log.target_type}#{log.target_id ?? "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">request_id:</span>{" "}
                  <span className="font-mono">{log.request_id ?? "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">ip:</span>{" "}
                  <span className="font-mono">{log.ip ?? "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">user_agent:</span>{" "}
                  <span className="font-mono break-all">
                    {log.user_agent ?? "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">created_at:</span>{" "}
                  <span className="font-mono">{String(log.created_at)}</span>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">payload</div>
                <pre className="rounded-md border p-3 text-xs overflow-x-auto">
                  {JSON.stringify(log.payload ?? null, null, 2)}
                </pre>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
