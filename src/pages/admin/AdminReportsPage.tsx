import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, FileBarChart2, MessageSquareWarning, Star, Users } from "lucide-react";
import { api } from "@/lib/api";
import PageHeader from "@/components/faculty/PageHeader";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import type {
  AnalyticsDashboard,
  ComplaintAnalytics,
  FeedbackAnalytics,
  DailyAttendance,
} from "@/types/faculty";

function downloadCsv(filename: string, header: string[], rows: string[][]) {
  const csv = [header, ...rows]
    .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const STATUS_COLORS: Record<string, string> = {
  open: "#f59e0b",
  in_review: "#2563eb",
  resolved: "#16a34a",
  rejected: "#6b7280",
};

export default function AdminReportsPage() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  const dashboardQuery = useQuery({
    queryKey: ["admin-analytics-dashboard"],
    queryFn: () => api.get<AnalyticsDashboard>("/admin/analytics/dashboard"),
  });
  const complaintsQuery = useQuery({
    queryKey: ["admin-analytics-complaints", dateFrom, dateTo],
    queryFn: () => api.get<ComplaintAnalytics>(`/admin/analytics/complaints?from=${dateFrom}&to=${dateTo}`),
  });
  const complaintsDailyQuery = useQuery({
    queryKey: ["admin-analytics-complaints-daily", dateFrom, dateTo],
    queryFn: () => api.get<{ date: string; total: number; resolved: number; open: number }[]>(`/admin/analytics/complaints/daily?from=${dateFrom}&to=${dateTo}`),
  });
  const feedbackQuery = useQuery({
    queryKey: ["admin-analytics-feedback", dateFrom, dateTo],
    queryFn: () => api.get<FeedbackAnalytics>(`/admin/analytics/feedback?from=${dateFrom}&to=${dateTo}`),
  });
  const attendanceDailyQuery = useQuery({
    queryKey: ["admin-analytics-attendance-daily", dateFrom, dateTo],
    queryFn: () => api.get<DailyAttendance[]>(`/admin/analytics/attendance/daily?from=${dateFrom}&to=${dateTo}`),
  });
  const attendanceSummaryQuery = useQuery({
    queryKey: ["admin-analytics-attendance-summary", dateFrom, dateTo],
    queryFn: () => api.get<{ dateRange: { from: string; to: string }; totalRecords: number; totalPassengers: number; totalBoys: number; totalGirls: number; averagePassengers: number | null }>(`/admin/analytics/attendance?from=${dateFrom}&to=${dateTo}`),
  });

  const isLoading = dashboardQuery.isLoading || complaintsQuery.isLoading || complaintsDailyQuery.isLoading || feedbackQuery.isLoading || attendanceDailyQuery.isLoading || attendanceSummaryQuery.isLoading;
  const isError = dashboardQuery.isError || complaintsQuery.isError || complaintsDailyQuery.isError || feedbackQuery.isError || attendanceDailyQuery.isError || attendanceSummaryQuery.isError;

  if (isLoading) return <PageSkeleton rows={6} />;
  if (isError) {
    return (
      <PageError
        message="Could not load reports."
        onRetry={() => {
          void dashboardQuery.refetch();
          void complaintsQuery.refetch();
          void complaintsDailyQuery.refetch();
          void feedbackQuery.refetch();
          void attendanceDailyQuery.refetch();
          void attendanceSummaryQuery.refetch();
        }}
      />
    );
  }

  const dashboard = dashboardQuery.data!;
  const complaints = complaintsQuery.data!;
  const complaintsDaily = complaintsDailyQuery.data!;
  const feedback = feedbackQuery.data!;
  const dailyAttendance = attendanceDailyQuery.data!;
  const attendanceSummary = attendanceSummaryQuery.data!;

  const categoryData = complaints.byCategory.map((c) => ({ name: c.category, count: c.count }));
  const statusData = [
    { name: "Open", value: complaints.open, color: STATUS_COLORS.open },
    { name: "In Review", value: complaints.inReview, color: STATUS_COLORS.in_review },
    { name: "Resolved", value: complaints.resolved, color: STATUS_COLORS.resolved },
    { name: "Rejected", value: complaints.rejected, color: STATUS_COLORS.rejected },
  ].filter((d) => d.value > 0);

  const dayData = dailyAttendance.slice(-14).map((d) => ({
    date: d.date.slice(5),
    boys: d.boys,
    girls: d.girls,
    total: d.total,
  }));

  const totalStudents = dashboard.users.students;
  const totalComplaints = complaints.total;
  const totalFeedback = feedback.total;
  const avgRating = feedback.averageRating != null ? feedback.averageRating.toFixed(1) : "—";

  return (
    <>
      <PageHeader
        title="Analytics & Reports"
        description="Campus-wide transport insights — complaints, feedback and attendance trends."
        actions={
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-md border border-input bg-background px-2 py-1 text-xs" />
            <span className="text-xs text-muted-foreground">to</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-md border border-input bg-background px-2 py-1 text-xs" />
            <Button
              variant="outline"
              className="gap-2"
              onClick={() =>
                downloadCsv(
                  `complaints-${Date.now()}.csv`,
                  ["Date Range", "Total", "Open", "In Review", "Resolved", "Rejected"],
                  [[`${dateFrom} to ${dateTo}`, String(complaints.total), String(complaints.open), String(complaints.inReview), String(complaints.resolved), String(complaints.rejected)]]
                )
              }
            >
              <Download className="h-4 w-4" /> Export Complaints
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Card className="shadow-card"><CardContent className="pt-6"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Students</p><p className="text-2xl font-extrabold text-[#1a237e]">{totalStudents}</p></CardContent></Card>
        <Card className="shadow-card"><CardContent className="pt-6"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Faculty</p><p className="text-2xl font-extrabold text-[#1a237e]">{dashboard.users.faculty}</p></CardContent></Card>
        <Card className="shadow-card"><CardContent className="pt-6"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Active Buses</p><p className="text-2xl font-extrabold text-[#1a237e]">{dashboard.transport.activeBuses}/{dashboard.transport.buses}</p></CardContent></Card>
        <Card className="shadow-card"><CardContent className="pt-6"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Complaints</p><p className="text-2xl font-extrabold text-amber-600">{totalComplaints}</p></CardContent></Card>
        <Card className="shadow-card"><CardContent className="pt-6"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Feedback</p><p className="text-2xl font-extrabold text-[#FFD700]">{totalFeedback}</p></CardContent></Card>
        <Card className="shadow-card"><CardContent className="pt-6"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Attendance Avg</p><p className="text-2xl font-extrabold text-green-600">{attendanceSummary.averagePassengers ?? "—"}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <FileBarChart2 className="h-4 w-4 text-[#1a237e]" />
              Complaints by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <EmptyState message="No complaints data yet." />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip cursor={{ fill: "rgba(26,35,126,0.06)" }} contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                    <Bar dataKey="count" name="Complaints" fill="#1a237e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <MessageSquareWarning className="h-4 w-4 text-[#1a237e]" />
              Complaints by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <EmptyState message="No complaints data yet." />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                      {statusData.map((s) => (
                        <Cell key={s.name} fill={s.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                  {statusData.map((s) => (
                    <span key={s.name} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                      {s.name}: {s.value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <Star className="h-4 w-4 text-[#FFD700]" />
              Feedback ({totalFeedback})
            </CardTitle>
            <Badge variant="outline" className="border-[#1a237e]/20 bg-[#1a237e]/5 text-[#1a237e]">
              Avg rating {avgRating}/5
            </Badge>
          </CardHeader>
          <CardContent>
            {feedback.byCategory.length === 0 && !feedback.averageRating ? (
              <EmptyState message="No feedback submitted yet." />
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">Submitted: {feedback.submitted}</Badge>
                  <Badge variant="outline" className="text-xs">Reviewed: {feedback.reviewed}</Badge>
                  <Badge variant="outline" className="text-xs">Resolved: {feedback.resolved}</Badge>
                </div>
                {feedback.byCategory.length > 0 && (
                  <ul className="max-h-56 divide-y divide-border overflow-y-auto pr-1">
                    {feedback.byCategory.map((c) => (
                      <li key={c.category} className="flex items-center justify-between py-2">
                        <span className="text-xs font-bold text-foreground">{c.category}</span>
                        <span className="text-xs text-muted-foreground">{c.count} feedback</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <Users className="h-4 w-4 text-[#1a237e]" />
              Attendance — last 14 days
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-[#1a237e]"
              onClick={() =>
                downloadCsv(
                  `attendance-${Date.now()}.csv`,
                  ["Date", "Boys", "Girls", "Total"],
                  dailyAttendance.map((d) => [d.date, String(d.boys), String(d.girls), String(d.total)])
                )
              }
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
          </CardHeader>
          <CardContent>
            {dayData.length === 0 ? (
              <EmptyState message="No attendance records yet." />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip cursor={{ fill: "rgba(26,35,126,0.06)" }} contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                    <Bar dataKey="boys" name="Boys" stackId="a" fill="#2563eb" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="girls" name="Girls" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
