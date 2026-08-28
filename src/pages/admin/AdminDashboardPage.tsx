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
import { formatDate } from "@/lib/faculty";
import PageHeader from "@/components/faculty/PageHeader";
import StatCard from "@/components/faculty/StatCard";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsDashboard, EmergencyReport, BusInfo, Complaint, Feedback } from "@/types/faculty";
import { EMERGENCY_STATUS_LABELS } from "@/types/faculty";
import {
  EmergencyStatusBadge,
  EmergencyTypeBadge,
} from "@/components/admin/AdminBadges";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const dashboardQuery = useQuery({
    queryKey: ["admin-analytics-dashboard"],
    queryFn: () => api.get<AnalyticsDashboard>("/admin/analytics/dashboard"),
    refetchInterval: 30000,
  });
  const emergenciesQuery = useQuery({
    queryKey: ["admin-emergencies-active"],
    queryFn: () => api.get<{ data: EmergencyReport[]; pagination: { total: number } }>("/admin/emergency?page=1&limit=10"),
    refetchInterval: 20000,
  });
  const complaintsQuery = useQuery({
    queryKey: ["admin-complaints-recent"],
    queryFn: () => api.get<{ data: Complaint[]; pagination: { total: number } }>("/admin/complaints?page=1&limit=5"),
  });
  const feedbackQuery = useQuery({
    queryKey: ["admin-feedback-recent"],
    queryFn: () => api.get<{ data: Feedback[]; pagination: { total: number } }>("/admin/feedback?page=1&limit=5"),
  });

  if (dashboardQuery.isLoading) return <PageSkeleton rows={6} />;
  if (dashboardQuery.isError) {
    return <PageError message="Could not load the admin dashboard." onRetry={() => void dashboardQuery.refetch()} />;
  }
  const d = dashboardQuery.data!;
  const emergencies = emergenciesQuery.data?.data ?? [];
  const activeEmergencies = emergencies.filter((e) => e.status === "ACTIVE");
  const complaints = complaintsQuery.data?.data ?? [];
  const feedback = feedbackQuery.data?.data ?? [];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.email ?? "Admin"}`}
        description="Overview of the entire transport operation — buses, people, safety and attendance."
      />

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Students" value={d.users.students} icon={Users} tone="navy" />
        <StatCard label="Faculty" value={d.users.faculty} icon={Users} tone="navy" />
        <StatCard label="Buses in Fleet" value={d.transport.buses} icon={Bus} tone="navy" />
        <StatCard
          label="Active Buses"
          value={d.transport.activeBuses}
          icon={Bus}
          tone="success"
          sub={`${d.transport.routes} routes`}
        />
        <StatCard label="Active Routes" value={d.transport.routes} icon={Truck} tone="gold" />
        <StatCard label="Student Assignments" value={d.transport.activeStudentAssignments} icon={ClipboardCheck} tone="success" />
        <StatCard label="Faculty Assignments" value={d.transport.activeFacultyAssignments} icon={ClipboardCheck} tone="success" />
        <StatCard label="Present Today" value={d.attendance.today.present} icon={Users} tone="navy" />
        <StatCard
          label="Passengers Today"
          value={d.attendance.today.boys + d.attendance.today.girls}
          icon={ClipboardCheck}
          tone="success"
          sub={`${d.attendance.today.boys} boys · ${d.attendance.today.girls} girls`}
        />
        <StatCard
          label="Open Complaints"
          value={d.operations.openComplaints}
          icon={MessageSquareWarning}
          tone="warning"
        />
        <StatCard label="Pending Feedback" value={d.operations.pendingFeedback} icon={MessageSquareWarning} tone="navy" />
        <StatCard
          label="Active Emergencies"
          value={d.operations.activeEmergencies}
          icon={Siren}
          tone={d.operations.activeEmergencies > 0 ? "danger" : "success"}
        />
        <StatCard label="Active Schedules" value={d.schedules.active} icon={ClipboardCheck} tone="navy" />
        <StatCard label="Notifications" value={d.notifications.total} icon={MessageSquareWarning} tone="gold" sub={`${d.notifications.failed} failed`} />
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
            {activeEmergencies.length === 0 ? (
              <EmptyState message="No active emergencies. All clear." />
            ) : (
              <ul className="divide-y divide-border">
                {activeEmergencies.slice(0, 5).map((e) => (
                  <li key={e.id} className="flex flex-col gap-1 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {e.bus ? `Bus ${e.bus.busNumber}` : "No bus"}
                      </span>
                      <EmergencyTypeBadge type={e.type} />
                      <EmergencyStatusBadge status={e.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">{e.message}</p>
                    <p className="text-[11px] text-muted-foreground/80">
                      {e.student?.name ?? e.faculty?.name ?? "Unknown"} ·{" "}
                      {e.latitude != null ? `${e.latitude.toFixed(4)}, ${e.longitude?.toFixed(4)}` : "Location not shared"} ·{" "}
                      {formatDate(e.createdAt)}
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
              <MessageSquareWarning className="h-4 w-4 text-[#1a237e]" />
              Recent Complaints
            </CardTitle>
          </CardHeader>
          <CardContent>
            {complaints.length === 0 ? (
              <EmptyState message="No complaints submitted yet." />
            ) : (
              <ul className="divide-y divide-border">
                {complaints.map((c) => (
                  <li key={c.id} className="flex flex-col gap-1 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{c.subject}</span>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          c.status === "RESOLVED"
                            ? "border border-green-200 bg-green-50 text-green-700"
                            : c.status === "IN_REVIEW"
                              ? "border border-blue-200 bg-blue-50 text-blue-700"
                              : "border border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {c.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.category} · {formatDate(c.createdAt)}
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
            {feedback.length === 0 ? (
              <EmptyState message="No feedback submitted yet." />
            ) : (
              <ul className="divide-y divide-border">
                {feedback.map((f) => (
                  <li key={f.id} className="flex flex-col gap-1 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{f.student?.name ?? "Student"}</span>
                      <span className="text-xs text-amber-500">{"★".repeat(f.rating)}</span>
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
        {user?.email} · {formatDate(new Date().toISOString())}
      </p>
    </>
  );
}
