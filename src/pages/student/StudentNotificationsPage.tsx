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
import { formatDateTime, notificationCategory } from "@/lib/faculty";
import PageHeader from "@/components/faculty/PageHeader";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import type { NotificationItem, NotificationType } from "@/types/faculty";

const CATEGORY_TONE: Record<NotificationType, string> = {
  "Bus Delay": "border-amber-200 bg-amber-50 text-amber-700",
  "Route Change": "border-indigo-200 bg-indigo-50 text-indigo-700",
  "Bus Replacement": "border-purple-200 bg-purple-50 text-purple-700",
  Emergency: "border-red-200 bg-red-50 text-red-700",
  "Complaint Update": "border-sky-200 bg-sky-50 text-sky-700",
  "Transport Announcement": "border-[#f0c200] bg-[#FFD700]/10 text-[#8a6d00]",
  General: "border-slate-200 bg-slate-100 text-slate-600",
};

export default function StudentNotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | NotificationType>("all");

  const notificationsQuery = useQuery({
    queryKey: ["student-notifications"],
    queryFn: () => api.get<{ items: NotificationItem[]; unread: number }>("/notifications"),
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["student-notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update notification"),
  });

  const readAllMutation = useMutation({
    mutationFn: () => api.put("/notifications/read-all"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["student-notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      toast.success("All notifications marked as read");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update notifications"),
  });

  const items = useMemo(() => notificationsQuery.data?.items ?? [], [notificationsQuery.data]);
  const unread = notificationsQuery.data?.unread ?? 0;

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((n) => notificationCategory(n) === filter)),
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
            disabled={unread === 0 || readAllMutation.isPending}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Bell className="h-4 w-4" />
          {unread > 0 ? `${unread} unread` : "All caught up"}
        </p>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="h-9 w-52 text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="Bus Delay">Bus Delay</SelectItem>
            <SelectItem value="Route Change">Route Change</SelectItem>
            <SelectItem value="Bus Replacement">Bus Replacement</SelectItem>
            <SelectItem value="Emergency">Emergency</SelectItem>
            <SelectItem value="Complaint Update">Complaint Update</SelectItem>
            <SelectItem value="Transport Announcement">Transport Announcement</SelectItem>
            <SelectItem value="General">General</SelectItem>
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
            const cat = notificationCategory(n);
            return (
              <Card
                key={n.id}
                className={`shadow-card transition ${n.read ? "opacity-75" : "border-l-4 border-l-[#caa200]"}`}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <span
                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${n.read ? "bg-slate-300" : "bg-[#FFD700] ring-2 ring-[#caa200]/40"}`}
                    title={n.read ? "Read" : "Unread"}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`text-sm ${n.read ? "font-semibold" : "font-extrabold"} text-foreground`}>
                        {n.title}
                      </p>
                      <Badge variant="outline" className={`text-[10px] ${CATEGORY_TONE[cat]}`}>
                        {cat}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-[11px] font-semibold text-muted-foreground/80">
                      {formatDateTime(n.createdAt)}
                    </p>
                  </div>
                  {!n.read ? (
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

      <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <BellOff className="h-3.5 w-3.5" />
        Notifications are delivered by the transport server to your student account.
      </p>
    </>
  );
}