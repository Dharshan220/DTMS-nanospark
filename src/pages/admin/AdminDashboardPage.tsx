import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bus,
  ClipboardCheck,
  MessageSquareWarning,
  Siren,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatDate, formatDateTime } from "@/lib/faculty";
import PageHeader from "@/components/faculty/PageHeader";
import StatCard from "@/components/faculty/StatCard";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  EMERGENCY_TYPE_LABELS,
  type AdminDashboardResponse,
} from "@/types/faculty";
import {
  AdminBusStatusBadge,
  EmergencyStatusBadge,
  EmergencyTypeBadge,
} from "@/components/admin/AdminBadges";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => api.get<AdminDashboardResponse>("/dashboard"),
    refetchInterval: 30000,
  });

  if (query.isLoading) return <PageSkeleton rows={6} />;
  if (query.isError) {
    return <PageError message="Could not load the admin dashboard." onRetry={() => void query.refetch()} />;
  }
  const d = query.data!;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${d.adminName}`}
        description="Overview of the entire transport operation — buses, people, safety and attendance."
      />

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Students" value={d.stats.totalStudents} icon={Users} tone="navy" />
        <StatCard label="Faculty" value={d.stats.totalTeachers} icon={Users} tone="navy" />
        <StatCard label="Parents" value={d.stats.totalParents} icon={Users} tone="navy" />
        <StatCard label="Buses in Fleet" value={d.stats.totalBuses} icon={Bus} tone="navy" />
        <StatCard
          label="Active Buses"
          value={d.stats.activeBuses}
          icon={Bus}
          tone="success"
          sub={`${d.stats.maintenanceBuses} maintenance · ${d.stats.inactiveBuses} inactive`}
        />
        <StatCard label="Drivers" value={d.stats.totalDrivers} icon={Truck} tone="gold" />
        <StatCard label="Trips Today" value={d.stats.activeTrips} icon={ClipboardCheck} tone="success" />
        <StatCard label="Present Today" value={d.stats.todayPresent} icon={Users} tone="navy" />
        <StatCard
          label="Passengers Today"
          value={d.todayPassenger.total}
          icon={ClipboardCheck}
          tone="success"
          sub={`${d.todayPassenger.boys} boys · ${d.todayPassenger.girls} girls · ${d.todayPassenger.morning} morning · ${d.todayPassenger.evening} evening`}
        />
        <StatCard
          label="Open Complaints"
          value={d.stats.pendingComplaints + d.stats.inProgressComplaints + d.stats.escalatedComplaints}
          icon={MessageSquareWarning}
          tone="warning"
          sub={`${d.stats.resolvedComplaints} resolved of ${d.stats.complaints}`}
        />
        <StatCard label="Feedback" value={d.stats.feedback} icon={MessageSquareWarning} tone="navy" />
        <StatCard
          label="Active Emergencies"
          value={d.stats.activeEmergencies}
          icon={Siren}
          tone={d.stats.activeEmergencies > 0 ? "danger" : "success"}
        />
        <StatCard label="Maintenance Records" value={d.stats.maintenanceRecords} icon={Wrench} tone="gold" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <Siren className="h-4 w-4 text-[#1a237e]" />
              Active Emergencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            {d.activeEmergencies.length === 0 ? (
              <EmptyState message="No active emergencies. All clear." />
            ) : (
              <ul className="divide-y divide-border">
                {d.activeEmergencies.map((e) => (
                  <li key={e.id} className="flex flex-col gap-1 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{e.busNumber ?? "Bus —"}</span>
                      <EmergencyTypeBadge type={e.type} />
                      <EmergencyStatusBadge status={e.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">{e.description}</p>
                    <p className="text-[11px] text-muted-foreground/80">
                      {e.reportedByName} · {e.location ?? "Location not shared"} ·{" "}
                      {formatDateTime(e.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/admin/emergency"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#1a237e] hover:underline"
            >
              Manage emergencies <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <Bus className="h-4 w-4 text-[#1a237e]" />
              Bus Fleet Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {d.buses.length === 0 ? (
              <EmptyState message="No buses in the fleet yet." />
            ) : (
              <ul className="divide-y divide-border">
                {d.buses.slice(0, 8).map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-foreground">
                        Route {b.routeNumber} · {b.vehicleNumber}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {b.driverName ?? "No driver assigned"} · {b.busAdminCount} faculty
                      </p>
                    </div>
                    <AdminBusStatusBadge status={b.status} />
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/admin/buses"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#1a237e] hover:underline"
            >
              Manage buses <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <MessageSquareWarning className="h-4 w-4 text-[#1a237e]" />
              Recent Complaints
            </CardTitle>
          </CardHeader>
          <CardContent>
            {d.recentComplaints.length === 0 ? (
              <EmptyState message="No complaints submitted yet." />
            ) : (
              <ul className="divide-y divide-border">
                {d.recentComplaints.map((c) => (
                  <li key={c.id} className="flex flex-col gap-1 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="border-[#1a237e]/20 bg-[#1a237e]/5 text-[#1a237e]">
                        {c.category}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          c.status === "resolved"
                            ? "border-green-200 bg-green-50 text-green-700"
                            : c.status === "in_progress"
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : c.status === "escalated"
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                        }
                      >
                        {c.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.name}
                      {c.routeNumber ? ` · Route ${c.routeNumber}` : ""} · {formatDate(c.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/admin/complaints"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#1a237e] hover:underline"
            >
              View all complaints <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <Users className="h-4 w-4 text-[#1a237e]" />
              Recent Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            {d.recentFeedback.length === 0 ? (
              <EmptyState message="No feedback submitted yet." />
            ) : (
              <ul className="divide-y divide-border">
                {d.recentFeedback.map((f) => (
                  <li key={f.id} className="flex flex-col gap-1 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{f.name}</span>
                      <span className="text-xs text-amber-500">{"★".repeat(f.rating)}</span>
                      {f.routeNumber ? (
                        <span className="text-[11px] text-muted-foreground">Route {f.routeNumber}</span>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">{f.message}</p>
                    <p className="text-[11px] text-muted-foreground/80">{formatDate(f.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/admin/reports"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#1a237e] hover:underline"
            >
              View reports & analytics <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        {user?.name} · {user?.email} · {formatDate(Date.now())}
      </p>
    </>
  );
}