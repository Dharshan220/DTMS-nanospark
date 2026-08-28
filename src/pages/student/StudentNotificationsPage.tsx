import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, CheckCheck, MailOpen } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/faculty";
import PageHeader from "@/components/faculty/PageHeader";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import type { NotificationItem, NotificationType, Paginated } from "@/types/faculty";

const CATEGORY_TONE: Record<NotificationType, string> = {
  EMERGENCY: "border-red-200 bg-red-50 text-red-700",
  COMPLAINT: "border-sky-200 bg-sky-50 text-sky-700",
  FEEDBACK: "border-amber-200 bg-amber-50 text-amber-700",
  TRANSPORT: "border-indigo-200 bg-indigo-50 text-indigo-700",
  SYSTEM: "border-slate-200 bg-slate-100 text-slate-600",
};

const CATEGORY_LABELS: Record<NotificationType, string> = {
  EMERGENCY: "Emergency",
  COMPLAINT: "Complaint Update",
  FEEDBACK: "Feedback",
  TRANSPORT: "Transport",
  SYSTEM: "System",
};

function resolveNotificationType(n: NotificationItem): NotificationType {
  const raw = (n.type ?? "").toUpperCase() as NotificationType;
  if (raw in CATEGORY_LABELS) return raw;
  if (raw.includes("EMERGENCY")) return "EMERGENCY";
  if (raw.includes("COMPLAINT")) return "COMPLAINT";
  if (raw.includes("FEEDBACK")) return "FEEDBACK";
  if (raw.includes("TRANSPORT")) return "TRANSPORT";
  return "SYSTEM";
}

export default function StudentNotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | NotificationType>("all");
  const [page, setPage] = useState(1);

  const notificationsQuery = useQuery({
    queryKey: ["student-notifications", page],
    queryFn: () =>
      api.get<Paginated<NotificationItem>>(`/notifications?page=${page}&limit=20`),
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["student-notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update notification"),
  });

  const readAllMutation = useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["student-notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      toast.success("All notifications marked as read");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update notifications"),
  });

  const items = useMemo(() => notificationsQuery.data?.data ?? [], [notificationsQuery.data]);
  const pagination = notificationsQuery.data?.pagination;
  const unreadCount = items.filter((n) => !n.readAt).length;

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((n) => resolveNotificationType(n) === filter)),
    [items, filter]
  );

  if (notificationsQuery.isLoading) return <PageSkeleton rows={5} />;
  if (notificationsQuery.isError) {
    return (
      <PageError
        message="Could not load notifications."
        onRetry={() => void notificationsQuery.refetch()}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Transport alerts and updates for your route."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => readAllMutation.mutate()}
            disabled={unreadCount === 0 || readAllMutation.isPending}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        </p>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="h-9 w-52 text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="EMERGENCY">Emergency</SelectItem>
            <SelectItem value="COMPLAINT">Complaint Update</SelectItem>
            <SelectItem value="FEEDBACK">Feedback</SelectItem>
            <SelectItem value="TRANSPORT">Transport</SelectItem>
            <SelectItem value="SYSTEM">System</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="shadow-card">
          <CardContent>
            <EmptyState
              message="No notifications here yet."
              hint="Transport alerts and complaint updates will appear in this list."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((n) => {
            const cat = resolveNotificationType(n);
            const isRead = !!n.readAt;
            return (
              <Card
                key={n.id}
                className={`shadow-card transition ${isRead ? "opacity-75" : "border-l-4 border-l-[#caa200]"}`}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <span
                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${isRead ? "bg-slate-300" : "bg-[#FFD700] ring-2 ring-[#caa200]/40"}`}
                    title={isRead ? "Read" : "Unread"}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`text-sm ${isRead ? "font-semibold" : "font-extrabold"} text-foreground`}>
                        {n.title}
                      </p>
                      <Badge variant="outline" className={`text-[10px] ${CATEGORY_TONE[cat] ?? CATEGORY_TONE.SYSTEM}`}>
                        {CATEGORY_LABELS[cat] ?? cat}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-[11px] font-semibold text-muted-foreground/80">
                      {formatDateTime(n.createdAt)}
                    </p>
                  </div>
                  {!isRead ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 gap-1.5 text-xs"
                      onClick={() => readMutation.mutate(n.id)}
                      disabled={readMutation.isPending}
                    >
                      <MailOpen className="h-3.5 w-3.5" />
                      Mark read
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <BellOff className="h-3.5 w-3.5" />
        Notifications are delivered by the transport server to your student account.
      </p>
    </>
  );
}
