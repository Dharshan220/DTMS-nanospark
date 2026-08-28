import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellRing, Megaphone, Send } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import PageHeader from "@/components/faculty/PageHeader";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime, formatRelative } from "@/lib/faculty";
import type { BusInfo, NotificationItem, RouteInfo } from "@/types/faculty";

type Target = "ALL_USERS" | "ALL_STUDENTS" | "ALL_FACULTY" | "SPECIFIC_ROUTE" | "SPECIFIC_BUS";

export default function AdminNotificationsPage() {
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<Target>("ALL_USERS");
  const [routeId, setRouteId] = useState("");
  const [busId, setBusId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const notificationsQuery = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => api.get<{ data: NotificationItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>("/admin/notifications?page=1&limit=20"),
    refetchInterval: 30000,
  });
  const routesQuery = useQuery({
    queryKey: ["admin-routes"],
    queryFn: () => api.get<{ data: RouteInfo[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>("/admin/routes?page=1&limit=100"),
  });
  const busesQuery = useQuery({
    queryKey: ["admin-buses"],
    queryFn: () => api.get<{ data: BusInfo[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>("/admin/buses?page=1&limit=100"),
  });

  const sendMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        message: body.trim(),
        target,
      };
      if (target === "SPECIFIC_ROUTE") payload.targetId = routeId;
      if (target === "SPECIFIC_BUS") payload.targetId = busId;
      return api.post<{ message: string }>("/admin/notifications/announcement", payload);
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      setTitle("");
      setBody("");
      toast.success(data.message, { description: "The notification is now live for recipients." });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not send notification"),
  });

  if (notificationsQuery.isLoading || routesQuery.isLoading || busesQuery.isLoading) return <PageSkeleton rows={6} />;
  if (notificationsQuery.isError || routesQuery.isError || busesQuery.isError) {
    return (
      <PageError
        message="Could not load notifications."
        onRetry={() => { void notificationsQuery.refetch(); void routesQuery.refetch(); void busesQuery.refetch(); }}
      />
    );
  }

  const items = notificationsQuery.data!.data;
  const unread = items.filter((n) => !n.readAt).length;

  const isTargetRoute = target === "SPECIFIC_ROUTE";
  const isTargetBus = target === "SPECIFIC_BUS";

  const valid =
    title.trim().length > 2 &&
    body.trim().length > 2 &&
    (!isTargetRoute || routeId !== "") &&
    (!isTargetBus || busId !== "");

  return (
    <>
      <PageHeader
        title="Notifications"
        description={`${unread} unread for you — broadcast announcements to students, faculty or routes.`}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <Send className="h-4 w-4 text-[#1a237e]" />
              Send Notification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Recipients
              </Label>
              <Select value={target} onValueChange={(v) => setTarget(v as Target)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_USERS">Everyone (all users)</SelectItem>
                  <SelectItem value="ALL_STUDENTS">All Students</SelectItem>
                  <SelectItem value="ALL_FACULTY">All Faculty</SelectItem>
                  <SelectItem value="SPECIFIC_ROUTE">One route</SelectItem>
                  <SelectItem value="SPECIFIC_BUS">One bus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isTargetRoute ? (
              <Select value={routeId} onValueChange={setRouteId}>
                <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                <SelectContent>
                  {routesQuery.data!.data.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.routeCode} — {r.routeName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            {isTargetBus ? (
              <Select value={busId} onValueChange={setBusId}>
                <SelectTrigger><SelectValue placeholder="Select bus" /></SelectTrigger>
                <SelectContent>
                  {busesQuery.data!.data.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.busNumber} · {b.registrationNumber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Bus 25 delay" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Message *</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Write the announcement…" />
            </div>
            <Button
              className="w-full gap-2 bg-[#1a237e] text-white hover:bg-[#283593]"
              disabled={!valid || sendMutation.isPending}
              onClick={() => sendMutation.mutate()}
            >
              <Megaphone className="h-4 w-4" />
              {sendMutation.isPending ? "Sending…" : "Send Notification"}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <BellRing className="h-4 w-4 text-[#1a237e]" />
              All Notifications ({items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <EmptyState message="No notifications sent yet." />
            ) : (
              <ul className="max-h-[560px] divide-y divide-border overflow-y-auto pr-1">
                {items.map((n) => (
                  <li key={n.id} className="flex flex-col gap-1 py-3">
                    <div className="flex items-center gap-2">
                      <Bell className={`h-3.5 w-3.5 ${n.readAt ? "text-muted-foreground/50" : "text-[#FFD700]"}`} />
                      <span className={`text-xs font-bold ${n.readAt ? "text-muted-foreground" : "text-foreground"}`}>
                        {n.title}
                      </span>
                      <Badge variant="outline" className="ml-auto border-[#1a237e]/20 bg-[#1a237e]/5 text-[#1a237e]">
                        {n.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                    <p className="text-[11px] text-muted-foreground/70">
                      {n.readAt ? "Read" : "Unread"} · {formatRelative(n.createdAt)} · {formatDateTime(n.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
