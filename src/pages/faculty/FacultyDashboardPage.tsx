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
import { formatDateTime, formatRelative } from "@/lib/faculty";
import StatCard from "@/components/faculty/StatCard";
import PageHeader from "@/components/faculty/PageHeader";
import { BusStatusBadge } from "@/components/faculty/Badges";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import type { FacultyProfile, NotificationItem, Paginated, EmergencyReport } from "@/types/faculty";

interface FacultyScheduleResponse {
  assignment: { busId: string; busNumber: number; registrationNumber: string };
  schedules: {
    id: string;
    tripType: "MORNING" | "EVENING";
    departureTime: string;
    expectedArrivalTime: string;
    effectiveBus: { id: string; busNumber: number };
    route: { id: string; routeCode: string; routeName: string };
  }[];
}

export default function FacultyDashboardPage() {
  const { user } = useAuth();

  const profileQuery = useQuery({
    queryKey: ["faculty-profile"],
    queryFn: () => api.get<FacultyProfile>("/faculty/profile"),
  });

  const schedulesQuery = useQuery({
    queryKey: ["faculty-schedules"],
    queryFn: () => api.get<FacultyScheduleResponse>("/faculty/schedules/my"),
  });

  const emergencyQuery = useQuery({
    queryKey: ["faculty-emergency-active"],
    queryFn: () => api.get<{ active: boolean; alert: EmergencyReport | null }>("/emergency/active"),
  });

  const notificationsQuery = useQuery({
    queryKey: ["faculty-notifications"],
    queryFn: () => api.get<Paginated<NotificationItem>>("/notifications?limit=5"),
  });

  if (profileQuery.isLoading) return <PageSkeleton />;
  if (profileQuery.isError) {
    return (
      <PageError
        message="Could not load your profile. Check that the transport server is running."
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  const profile = profileQuery.data!;
  const transport = profile.transport;
  const bus = transport?.bus;
  const route = bus?.route;
  const schedules = schedulesQuery.data?.schedules ?? [];
  const activeEmergency = emergencyQuery.data;
  const notifications = notificationsQuery.data?.data ?? [];

  const busInfo = bus
    ? {
        routeNumber: bus.busNumber,
        vehicleNumber: bus.registrationNumber,
        driverName: bus.driver?.name ?? "—",
        driverPhone: bus.driver?.phone ?? "—",
        status: bus.status,
      }
    : null;

  const routeStops = route?.stops
    ?.sort((a, b) => a.stopOrder - b.stopOrder)
    .map((s) => ({
      name: s.busStop.name,
      time: s.estimatedArrivalTime ?? "—",
      lat: s.busStop.latitude ?? undefined,
      lng: s.busStop.longitude ?? undefined,
    })) ?? [];

  const todaySchedule = schedules.find((s) => {
    const today = new Date().toISOString().slice(0, 10);
    return s.effectiveFrom <= today && (!s.effectiveUntil || s.effectiveUntil >= today);
  });

  return (
    <>
      <PageHeader
        title={`Welcome back, ${profile.name.split(" ")[0] ?? "Faculty"}`}
        description="Here is the current status of your assigned bus and students."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Assigned Bus"
          value={busInfo ? `Route ${busInfo.routeNumber}` : "—"}
          sub={busInfo?.vehicleNumber ?? "No bus assigned"}
          icon={Bus}
        />
        <StatCard
          label="Route"
          value={route ? route.routeCode : "—"}
          sub={route?.routeName ?? "No route assigned"}
          icon={GraduationCap}
          tone="gold"
        />
        <StatCard
          label="Department"
          value={profile.department ?? "—"}
          sub={profile.designation ?? ""}
          icon={UserCheck}
          tone="success"
        />
        <StatCard
          label="Active SOS"
          value={activeEmergency?.active ? "Yes" : "None"}
          sub={activeEmergency?.active ? "Emergency active" : "All clear"}
          icon={MessageSquareWarning}
          tone={activeEmergency?.active ? "danger" : "success"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <Bus className="h-4 w-4 text-[#1a237e]" />
              Assigned Bus
            </CardTitle>
            <BusStatusBadge status={busInfo?.status === "MAINTENANCE" ? "Breakdown" : busInfo ? "Running" : "Not Started"} />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a237e] to-[#283593] text-[#FFD700] shadow-md">
                <Bus className="h-7 w-7" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-foreground">
                  Route {busInfo?.routeNumber ?? "—"}
                </p>
                <p className="text-xs font-semibold text-muted-foreground">
                  {busInfo?.vehicleNumber ?? "No bus assigned"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="Driver" value={busInfo?.driverName || "—"} />
              <InfoRow label="Driver contact" value={busInfo?.driverPhone || "—"} />
              <InfoRow label="Capacity" value={bus ? "60 seats" : "—"} />
              <InfoRow
                label="Status"
                value={busInfo?.status === "MAINTENANCE" ? "In maintenance" : "In service"}
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
              Route {route?.routeCode ?? "—"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 shrink-0 text-[#1a237e]" />
              <span className="font-semibold text-foreground">{routeStops[0]?.name ?? "—"}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-semibold text-foreground">{routeStops[routeStops.length - 1]?.name ?? "College"}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="Departure" value={todaySchedule?.departureTime ?? routeStops[0]?.time ?? "—"} />
              <InfoRow label="Expected arrival" value={todaySchedule?.expectedArrivalTime ?? "—"} />
              <InfoRow label="Current status" value="Scheduled" />
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
          {notifications.length === 0 ? (
            <EmptyState message="No notifications yet" />
          ) : (
            <ul className="divide-y divide-border">
              {notifications.slice(0, 5).map((n) => (
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
