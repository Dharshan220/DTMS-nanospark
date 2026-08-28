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
  NotificationItem,
  Paginated,
  StudentProfile,
  StudentSchedule,
} from "@/types/faculty";

export default function StudentDashboardPage() {
  const { user } = useAuth();

  const profileQuery = useQuery({
    queryKey: ["student-profile"],
    queryFn: () => api.get<StudentProfile>("/student/profile"),
  });

  const schedulesQuery = useQuery({
    queryKey: ["student-schedules"],
    queryFn: () => api.get<StudentSchedule>("/student/schedules/my"),
  });

  const complaintsQuery = useQuery({
    queryKey: ["student-complaints"],
    queryFn: () => api.get<Paginated<Complaint>>("/student/complaints?page=1&limit=50"),
  });

  const notificationsQuery = useQuery({
    queryKey: ["student-notifications"],
    queryFn: () => api.get<Paginated<NotificationItem>>("/notifications?page=1&limit=20"),
  });

  if (profileQuery.isLoading) return <PageSkeleton />;
  if (profileQuery.isError) {
    return (
      <PageError
        message="Could not load your transport summary. Check that the transport server is running."
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  const profile = profileQuery.data!;
  const transport = profile.transport;
  const bus = transport?.bus ?? null;
  const busStop = transport?.busStop ?? null;
  const route = bus?.route ?? null;
  const stops = route?.stops ?? [];
  const firstStop = stops[0];
  const collegeStop = stops.find(
    (s) => s.busStop.name.toUpperCase() === "COLLEGE"
  );

  const complaints = complaintsQuery.data;
  const notifications = notificationsQuery.data;
  const complaintItems = complaints?.data ?? [];
  const notificationItems = notifications?.data ?? [];
  const pendingCount = complaintItems.filter((c) => c.status === "OPEN").length;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${profile.name.split(" ")[0] ?? "Student"}`}
        description="Here is your transport information and recent activity."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="My Bus"
          value={bus ? `Route ${bus.busNumber}` : "—"}
          sub={bus?.registrationNumber ?? "No bus assigned"}
          icon={Bus}
        />
        <StatCard
          label="Boarding Stop"
          value={busStop?.name ?? "—"}
          sub={route ? `Route ${route.routeCode}` : "no route assigned"}
          icon={MapPin}
          tone="gold"
        />
        <StatCard
          label="My Complaints"
          value={complaints?.pagination.total ?? complaintItems.length}
          sub={`${pendingCount} pending`}
          icon={MessageSquareWarning}
          tone="warning"
        />
        <StatCard
          label="Notifications"
          value={notifications?.pagination.total ?? notificationItems.length}
          sub={notificationItems.some((n) => !n.readAt) ? "unread" : "all caught up"}
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
              {bus?.status === "MAINTENANCE" ? "In maintenance" : "In service"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a237e] to-[#283593] text-[#FFD700] shadow-md">
                <Bus className="h-7 w-7" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-foreground">
                  Route {bus?.busNumber ?? "—"}
                </p>
                <p className="text-xs font-semibold text-muted-foreground">
                  {bus?.registrationNumber ?? "No bus assigned"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="Driver" value={bus?.driver?.name || "—"} />
              <InfoRow label="Driver contact" value={bus?.driver?.phone || "—"} />
              <InfoRow label="My boarding stop" value={busStop?.name || "—"} />
              <InfoRow label="Department" value={profile.department || "—"} />
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
              Route {route?.routeCode ?? "—"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 shrink-0 text-[#1a237e]" />
              <span className="font-semibold text-foreground">
                {firstStop?.busStop.name ?? "—"}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="font-semibold text-foreground">
                {collegeStop?.busStop.name ?? "College"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow
                label="Departure"
                value={firstStop?.estimatedArrivalTime ?? "—"}
              />
              <InfoRow
                label="College arrival"
                value={
                  collegeStop?.estimatedArrivalTime ?? "—"
                }
              />
              <InfoRow label="Boarding stop" value={busStop?.name || "—"} />
              <InfoRow label="Stops on route" value={String(stops.length)} />
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
            {complaintItems.length === 0 ? (
              <EmptyState message="No complaints yet" hint="Report an issue from the Complaints page." />
            ) : (
              <ul className="divide-y divide-border">
                {complaintItems.slice(0, 5).map((c) => (
                  <li key={c.id} className="flex items-center gap-3 py-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a237e]/10 text-[10px] font-bold text-[#1a237e]">
                      {initials(c.student?.name ?? profile.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-foreground">{c.subject}</p>
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
            {notificationItems.length === 0 ? (
              <EmptyState message="No notifications yet" />
            ) : (
              <ul className="divide-y divide-border">
                {notificationItems.slice(0, 5).map((n) => (
                  <li key={n.id} className="flex items-start gap-3 py-2.5">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.readAt ? "bg-slate-300" : "bg-[#FFD700] ring-1 ring-[#caa200]"}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground">{n.title}</p>
                      <p className="line-clamp-1 text-[11px] text-muted-foreground">{n.message}</p>
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
