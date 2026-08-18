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
import type { BusInfo, NotificationItem, RouteInfo, ServerRole } from "@/types/faculty";

type Target = "all" | "roles" | "route" | "bus";

export default function AdminNotificationsPage() {
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<Target>("all");
  const [roles, setRoles] = useState<string[]>([]);
  const [routeNumber, setRouteNumber] = useState("");
  const [busId, setBusId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const notificationsQuery = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => api.get<{ items: NotificationItem[]; unread: number }>("/notifications"),
    refetchInterval: 30000,
  });
  const routesQuery = useQuery({
    queryKey: ["admin-routes"],
    queryFn: () => api.get<{ items: RouteInfo[]; total: number }>("/transport"),
  });
  const busesQuery = useQuery({
    queryKey: ["admin-buses"],
    queryFn: () => api.get<{ items: BusInfo[]; total: number }>("/buses"),
  });

  const sendMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = { title: title.trim(), body: body.trim() };
      if (target === "roles") payload.roles = roles;
      if (target === "route") payload.routeNumber = Number(routeNumber);
      if (target === "bus") payload.busId = busId;
      return api.post<{ message: string; count: number }>("/notifications", payload);
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

  const items = notificationsQuery.data!.items;
  const unread = notificationsQuery.data!.unread;

  const toggleRole = (role: string) => {
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  const valid =
    title.trim().length > 2 &&
    body.trim().length > 2 &&
    (target !== "roles" || roles.length > 0) &&
    (target !== "route" || routeNumber !== "") &&
    (target !== "bus" || busId !== "");

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
                  <SelectItem value="all">Everyone (all users)</SelectItem>
                  <SelectItem value="roles">A role group</SelectItem>
                  <SelectItem value="route">One route</SelectItem>
                  <SelectItem value="bus">One bus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {target === "roles" ? (
              <div className="flex flex-wrap gap-2">
                {(["student", "teacher", "parent"] as ServerRole[]).map((r) => (
                  <Button
                    key={r}
                    variant={roles.includes(r) ? "default" : "outline"}
                    size="sm"
                    className={roles.includes(r) ? "bg-[#1a237e] text-white hover:bg-[#283593]" : ""}
                    onClick={() => toggleRole(r)}
                  >
                    {r === "teacher" ? "Faculty" : r.charAt(0).toUpperCase() + r.slice(1) + "s"}
                  </Button>
                ))}
              </div>
            ) : null}
            {target === "route" ? (
              <Select value={routeNumber} onValueChange={setRouteNumber}>
                <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                <SelectContent>
                  {routesQuery.data!.items.map((r) => (
                    <SelectItem key={r.id} value={String(r.routeNumber)}>Route {r.routeNumber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            {target === "bus" ? (
              <Select value={busId} onValueChange={setBusId}>
                <SelectTrigger><SelectValue placeholder="Select bus" /></SelectTrigger>
                <SelectContent>
                  {busesQuery.data!.items.map((b) => (
                    <SelectItem key={b.id} value={b.id}>Route {b.routeNumber} · {b.vehicleNumber}</SelectItem>
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
                      <Bell className={`h-3.5 w-3.5 ${n.read ? "text-muted-foreground/50" : "text-[#FFD700]"}`} />
                      <span className={`text-xs font-bold ${n.read ? "text-muted-foreground" : "text-foreground"}`}>
                        {n.title}
                      </span>
                      <Badge variant="outline" className="ml-auto border-[#1a237e]/20 bg-[#1a237e]/5 text-[#1a237e]">
                        {n.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{n.body}</p>
                    <p className="text-[11px] text-muted-foreground/70">
                      {n.read ? "Read" : "Unread"} · {formatRelative(n.createdAt)} · {formatDateTime(n.createdAt)}
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