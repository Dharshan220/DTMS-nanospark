import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  Bus,
  CalendarClock,
  ClipboardCheck,
  GraduationCap,
  MapPin,
  MessageSquareWarning,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  boardingStatusFor,
  deriveBusStatus,
  formatDateTime,
  formatRelative,
  initials,
  nowMinutes,
  timeToMinutes,
} from "@/lib/faculty";
import { demoTripState } from "@/data/facultyDemo";
import StatCard from "@/components/faculty/StatCard";
import PageHeader from "@/components/faculty/PageHeader";
import { BusStatusBadge, ComplaintStatusBadge } from "@/components/faculty/Badges";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import type {
  AttendanceRecord,
  Complaint,
  DashboardResponse,
  NotificationItem,
  Paginated,
  StudentProfile,
} from "@/types/faculty";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function FacultyDashboardPage() {
  const { user } = useAuth();

  const dashQuery = useQuery({
    queryKey: ["faculty-dashboard"],
    queryFn: () => api.get<DashboardResponse>("/dashboard"),
  });

  const studentsQuery = useQuery({
    queryKey: ["faculty-students"],
    queryFn: () => api.get<Paginated<StudentProfile>>("/users?role=student&limit=100"),
  });

  const attendanceQuery = useQuery({
    queryKey: ["faculty-attendance"],
    queryFn: () => api.get<{ items: AttendanceRecord[]; present: number; absent: number; total: number }>("/attendance"),
  });

  const complaintsQuery = useQuery({
    queryKey: ["faculty-complaints"],
    queryFn: () => api.get<Paginated<Complaint>>("/complaints?limit=50"),
  });

  const notificationsQuery = useQuery({
    queryKey: ["faculty-notifications"],
    queryFn: () => api.get<{ items: NotificationItem[]; unread: number }>("/notifications"),
  });

  if (dashQuery.isLoading || studentsQuery.isLoading || attendanceQuery.isLoading) {
    return <PageSkeleton />;
  }
  if (dashQuery.isError || studentsQuery.isError || attendanceQuery.isError) {
    return <PageError message="Could not load your transport summary. Check that the transport server is running." onRetry={() => { void dashQuery.refetch(); void studentsQuery.refetch(); void attendanceQuery.refetch(); }} />;
  }

  const dash = dashQuery.data!;
  const students = studentsQuery.data!;
  const attendance = attendanceQuery.data!;
  const complaints = complaintsQuery.data!;
  const notifications = notificationsQuery.data!;

  const totalStudents = students.total;
  const todayRecords = attendance.items.filter((a) => a.date === today());
  const presentToday = todayRecords.filter((a) => a.status === "present").length;
  const pendingComplaints = complaints.items.filter((c) => c.status === "pending").length;

  const route = dash.route
    ? {
        boardingPoints: dash.route.stops,
        arrivalTime: dash.route.arrivalTime,
      }
    : null;

  const trip = demoTripState(dash.myBus?.routeNumber ?? 0, today());
  const busStatus = deriveBusStatus(dash.myBus, route, trip.delayed);

  const firstStop = dash.route?.stops[0];
  const collegeStop = dash.route?.stops.find((s) => s.name.toUpperCase() === "COLLEGE");
  const departure = firstStop ? firstStop.time : "—";
  const now = nowMinutes();
  const arrivalMins = timeToMinutes(dash.route?.arrivalTime ?? "8:05 AM");

  const attendanceRows = [
    { label: "Present", value: presentToday, tone: "bg-green-500" },
    { label: "Absent", value: todayRecords.filter((a) => a.status === "absent").length, tone: "bg-red-500" },
    {
      label: "Not recorded",
      value: Math.max(0, totalStudents - todayRecords.length),
      tone: "bg-amber-400",
    },
  ];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.name.split(" ")[0] ?? "Faculty"}`}
        description="Here is the current status of your assigned bus and students."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Assigned Bus"
          value={dash.myBus ? `Route ${dash.myBus.routeNumber}` : "—"}
          sub={dash.myBus?.vehicleNumber ?? "No bus assigned"}
          icon={Bus}
        />
        <StatCard
          label="Total Students"
          value={totalStudents}
          sub={dash.myBus ? `on Route ${dash.myBus.routeNumber}` : "no route assigned"}
          icon={GraduationCap}
          tone="gold"
        />
        <StatCard
          label="Present Today"
          value={presentToday}
          sub={`of ${totalStudents} students`}
          icon={UserCheck}
          tone="success"
        />
        <StatCard
          label="Pending Complaints"
          value={pendingComplaints}
          sub="on your route"
          icon={MessageSquareWarning}
          tone="warning"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <Bus className="h-4 w-4 text-[#1a237e]" />
              Assigned Bus
            </CardTitle>
            <BusStatusBadge status={busStatus} />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a237e] to-[#283593] text-[#FFD700] shadow-md">
                <Bus className="h-7 w-7" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-foreground">
                  Route {dash.myBus?.routeNumber ?? "—"}
                </p>
                <p className="text-xs font-semibold text-muted-foreground">
                  {dash.myBus?.vehicleNumber ?? "No bus assigned"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="Driver" value={dash.myBus?.driverName || "—"} />
              <InfoRow label="Driver contact" value={dash.myBus?.driverPhone || "—"} />
              <InfoRow label="Capacity" value={dash.myBus ? "60 seats" : "—"} />
              <InfoRow
                label="Status"
                value={dash.myBus?.status === "maintenance" ? "In maintenance" : "In service"}
              />
            </div>
            <Link
              to="/faculty/my-bus"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1a237e] hover:underline"
            >
              View bus details <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <CalendarClock className="h-4 w-4 text-[#1a237e]" />
              Today&apos;s Trip
            </CardTitle>
            <Badge variant="outline" className="border-[#f0c200] bg-[#FFD700]/10 text-[#8a6d00]">
              Route {dash.route?.routeNumber ?? "—"}
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
              <InfoRow label="Departure" value={departure} />
              <InfoRow label="Expected arrival" value={dash.route?.arrivalTime ?? "—"} />
              <InfoRow
                label="Current status"
                value={now > arrivalMins + 45 ? "Trip completed" : "Trip scheduled"}
              />
              {trip.delayed ? <InfoRow label="Note" value="Delayed by traffic (demo data)" /> : null}
            </div>
            <Link
              to="/faculty/live-tracking"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1a237e] hover:underline"
            >
              Open live tracking <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <ClipboardCheck className="h-4 w-4 text-[#1a237e]" />
              Attendance Summary
            </CardTitle>
            <Link to="/faculty/attendance" className="text-xs font-bold text-[#1a237e] hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-5">
              {attendanceRows.map((row) => (
                <div key={row.label}>
                  <p className="text-2xl font-extrabold text-foreground">{row.value}</p>
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                    <span className={`h-2 w-2 rounded-full ${row.tone}`} />
                    {row.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-secondary">
              {attendanceRows.map((row) => (
                <div
                  key={row.label}
                  className={`${row.tone} h-full`}
                  style={{ width: totalStudents ? `${(row.value / totalStudents) * 100}%` : 0 }}
                />
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Boarding status for students without an attendance record is demo data until check-in is connected.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <MessageSquareWarning className="h-4 w-4 text-[#1a237e]" />
              Recent Complaints
            </CardTitle>
            <Link to="/faculty/complaints" className="text-xs font-bold text-[#1a237e] hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {complaints.items.length === 0 ? (
              <EmptyState message="No complaints yet" />
            ) : (
              <ul className="divide-y divide-border">
                {complaints.items.slice(0, 5).map((c) => (
                  <li key={c.id} className="flex items-center gap-3 py-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a237e]/10 text-[10px] font-bold text-[#1a237e]">
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-foreground">
                        {c.name} · <span className="font-semibold text-muted-foreground">{c.category}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {c.busVehicleNumber ?? `Route ${c.routeNumber ?? "—"}`} · {formatDateTime(c.createdAt)}
                      </p>
                    </div>
                    <ComplaintStatusBadge status={c.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
            <Bell className="h-4 w-4 text-[#1a237e]" />
            Notifications
          </CardTitle>
          <Link to="/faculty/notifications" className="text-xs font-bold text-[#1a237e] hover:underline">
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