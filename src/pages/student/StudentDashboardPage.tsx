import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  Bus,
  CalendarClock,
  GraduationCap,
  MapPin,
  MessageSquareWarning,
  Route as RouteIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatDateTime, formatRelative, initials } from "@/lib/faculty";
import StatCard from "@/components/faculty/StatCard";
import PageHeader from "@/components/faculty/PageHeader";
import { ComplaintStatusBadge } from "@/components/faculty/Badges";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import type {
  Complaint,
  DashboardResponse,
  NotificationItem,
  Paginated,
} from "@/types/faculty";

export default function StudentDashboardPage() {
  const { user } = useAuth();

  const dashQuery = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: () => api.get<DashboardResponse>("/dashboard"),
  });

  const complaintsQuery = useQuery({
    queryKey: ["student-complaints"],
    queryFn: () => api.get<Paginated<Complaint>>("/complaints?limit=50"),
  });

  const notificationsQuery = useQuery({
    queryKey: ["student-notifications"],
    queryFn: () => api.get<{ items: NotificationItem[]; unread: number }>("/notifications"),
  });

  if (dashQuery.isLoading) return <PageSkeleton />;
  if (dashQuery.isError) {
    return (
      <PageError
        message="Could not load your transport summary. Check that the transport server is running."
        onRetry={() => void dashQuery.refetch()}
      />
    );
  }

  const dash = dashQuery.data!;
  const complaints = complaintsQuery.data!;
  const notifications = notificationsQuery.data!;

  const route = dash.route;
  const bus = dash.myBus;
  const firstStop = route?.stops[0];
  const collegeStop = route?.stops.find((s) => s.name.toUpperCase() === "COLLEGE");

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.name.split(" ")[0] ?? "Student"}`}
        description="Here is your transport information and recent activity."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="My Bus"
          value={bus ? `Route ${bus.routeNumber}` : "—"}
          sub={bus?.vehicleNumber ?? "No bus assigned"}
          icon={Bus}
        />
        <StatCard
          label="Boarding Stop"
          value={user?.boardingStop ?? "—"}
          sub={route ? `Route ${route.routeNumber}` : "no route assigned"}
          icon={MapPin}
          tone="gold"
        />
        <StatCard
          label="My Complaints"
          value={complaints.total}
          sub={`${complaints.items.filter((c) => c.status === "pending").length} pending`}
          icon={MessageSquareWarning}
          tone="warning"
        />
        <StatCard
          label="Notifications"
          value={notifications.unread}
          sub={notifications.unread > 0 ? "unread" : "all caught up"}
          icon={Bell}
          tone="success"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <Bus className="h-4 w-4 text-[#1a237e]" />
              My Bus
            </CardTitle>
            <Badge variant="outline" className="border-[#f0c200] bg-[#FFD700]/10 text-[#8a6d00]">
              {bus?.status === "maintenance" ? "In maintenance" : "In service"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a237e] to-[#283593] text-[#FFD700] shadow-md">
                <Bus className="h-7 w-7" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-foreground">
                  Route {bus?.routeNumber ?? "—"}
                </p>
                <p className="text-xs font-semibold text-muted-foreground">
                  {bus?.vehicleNumber ?? "No bus assigned"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="Driver" value={bus?.driverName || "—"} />
              <InfoRow label="Driver contact" value={bus?.driverPhone || "—"} />
              <InfoRow label="My boarding stop" value={user?.boardingStop || "—"} />
              <InfoRow label="Department" value={user?.department || "—"} />
            </div>
            <Link
              to="/student/transport"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1a237e] hover:underline"
            >
              View transport details <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <CalendarClock className="h-4 w-4 text-[#1a237e]" />
              My Route
            </CardTitle>
            <Badge variant="outline" className="border-[#f0c200] bg-[#FFD700]/10 text-[#8a6d00]">
              Route {route?.routeNumber ?? "—"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 shrink-0 text-[#1a237e]" />
              <span className="font-semibold text-foreground">{firstStop?.name ?? "—"}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-semibold text-foreground">{collegeStop?.name ?? "College"}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="Departure" value={firstStop?.time ?? "—"} />
              <InfoRow label="College arrival" value={route?.arrivalTime ?? "—"} />
              <InfoRow label="Boarding stop" value={user?.boardingStop || "—"} />
              <InfoRow label="Stops on route" value={String(route?.stops.length ?? 0)} />
            </div>
            <Link
              to="/student/transport"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1a237e] hover:underline"
            >
              View stops &amp; timings <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <MessageSquareWarning className="h-4 w-4 text-[#1a237e]" />
              My Complaints
            </CardTitle>
            <Link to="/student/complaints" className="text-xs font-bold text-[#1a237e] hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {complaints.items.length === 0 ? (
              <EmptyState message="No complaints yet" hint="Report an issue from the Complaints page." />
            ) : (
              <ul className="divide-y divide-border">
                {complaints.items.slice(0, 5).map((c) => (
                  <li key={c.id} className="flex items-center gap-3 py-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a237e]/10 text-[10px] font-bold text-[#1a237e]">
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-foreground">{c.category}</p>
                      <p className="line-clamp-1 text-[11px] text-muted-foreground">
                        {c.description}
                      </p>
                      <p className="text-[10px] font-semibold text-muted-foreground/80">
                        {formatDateTime(c.createdAt)}
                      </p>
                    </div>
                    <ComplaintStatusBadge status={c.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <Bell className="h-4 w-4 text-[#1a237e]" />
              Notifications
            </CardTitle>
            <Link to="/student/notifications" className="text-xs font-bold text-[#1a237e] hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {notifications.items.length === 0 ? (
              <EmptyState message="No notifications yet" />
            ) : (
              <ul className="divide-y divide-border">
                {notifications.items.slice(0, 5).map((n) => (
                  <li key={n.id} className="flex items-start gap-3 py-2.5">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-slate-300" : "bg-[#FFD700] ring-1 ring-[#caa200]"}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground">{n.title}</p>
                      <p className="line-clamp-1 text-[11px] text-muted-foreground">{n.body}</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">
                      {formatRelative(n.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <RouteIcon className="h-3.5 w-3.5" />
        Transport details are provided by the transport office for your assigned route.
      </p>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}