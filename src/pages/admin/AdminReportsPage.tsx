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
import { formatDate, formatDateTime } from "@/lib/faculty";
import type { Complaint } from "@/types/faculty";

interface ReportSummary {
  totals: { students: number; teachers: number; parents: number; complaints: number; feedback: number };
  complaintsByStatus: { pending: number; in_progress: number; resolved: number };
  complaintsByCategory: Record<string, number>;
  attendanceRate: number;
}

interface FeedbackItem {
  id: string;
  name: string;
  routeNumber: number | null;
  rating: number;
  message: string;
  createdAt: number;
}

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
  pending: "#f59e0b",
  in_progress: "#2563eb",
  resolved: "#16a34a",
};

export default function AdminReportsPage() {
  const summaryQuery = useQuery({
    queryKey: ["admin-report-summary"],
    queryFn: () => api.get<ReportSummary>("/reports/summary"),
  });
  const complaintsQuery = useQuery({
    queryKey: ["admin-report-complaints"],
    queryFn: () => api.get<{ items: Complaint[]; total: number }>("/reports/complaints"),
  });
  const feedbackQuery = useQuery({
    queryKey: ["admin-report-feedback"],
    queryFn: () => api.get<{ items: FeedbackItem[]; total: number }>("/reports/feedback"),
  });
  const attendanceQuery = useQuery({
    queryKey: ["admin-report-attendance"],
    queryFn: () => api.get<{ byDay: Record<string, { present: number; absent: number }>; total: number }>("/reports/attendance"),
  });

  if (summaryQuery.isLoading || complaintsQuery.isLoading || feedbackQuery.isLoading || attendanceQuery.isLoading) {
    return <PageSkeleton rows={6} />;
  }
  if (
    summaryQuery.isError || complaintsQuery.isError || feedbackQuery.isError || attendanceQuery.isError
  ) {
    return (
      <PageError
        message="Could not load reports."
        onRetry={() => {
          void summaryQuery.refetch();
          void complaintsQuery.refetch();
          void feedbackQuery.refetch();
          void attendanceQuery.refetch();
        }}
      />
    );
  }

  const summary = summaryQuery.data!;
  const complaints = complaintsQuery.data!.items;
  const feedback = feedbackQuery.data!.items;
  const byDay = attendanceQuery.data!.byDay;

  const categoryData = Object.entries(summary.complaintsByCategory).map(([name, count]) => ({
    name,
    count,
  }));
  const statusData = [
    { name: "Pending", value: summary.complaintsByStatus.pending, color: STATUS_COLORS.pending },
    { name: "In Progress", value: summary.complaintsByStatus.in_progress, color: STATUS_COLORS.in_progress },
    { name: "Resolved", value: summary.complaintsByStatus.resolved, color: STATUS_COLORS.resolved },
  ].filter((d) => d.value > 0);
  const dayData = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, v]) => ({ date: date.slice(5), present: v.present, absent: v.absent }));
  const avgRating = feedback.length
    ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1)
    : "—";

  return (
    <>
      <PageHeader
        title="Analytics & Reports"
        description="Campus-wide transport insights — complaints, feedback and attendance trends."
        actions={
          <Button
            variant="outline"
            className="gap-2"
            onClick={() =>
              downloadCsv(
                `complaints-${Date.now()}.csv`,
                ["Date", "Student", "Category", "Route", "Status", "Description"],
                complaints.map((c) => [formatDateTime(c.createdAt), c.name, c.category, String(c.routeNumber ?? ""), c.status, c.description])
              )
            }
          >
            <Download className="h-4 w-4" /> Export Complaints
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Card className="shadow-card"><CardContent className="pt-6"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Students</p><p className="text-2xl font-extrabold text-[#1a237e]">{summary.totals.students}</p></CardContent></Card>
        <Card className="shadow-card"><CardContent className="pt-6"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Faculty</p><p className="text-2xl font-extrabold text-[#1a237e]">{summary.totals.teachers}</p></CardContent></Card>
        <Card className="shadow-card"><CardContent className="pt-6"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Parents</p><p className="text-2xl font-extrabold text-[#1a237e]">{summary.totals.parents}</p></CardContent></Card>
        <Card className="shadow-card"><CardContent className="pt-6"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Complaints</p><p className="text-2xl font-extrabold text-amber-600">{summary.totals.complaints}</p></CardContent></Card>
        <Card className="shadow-card"><CardContent className="pt-6"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Feedback</p><p className="text-2xl font-extrabold text-[#FFD700]">{summary.totals.feedback}</p></CardContent></Card>
        <Card className="shadow-card"><CardContent className="pt-6"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Attendance rate</p><p className="text-2xl font-extrabold text-green-600">{summary.attendanceRate}%</p></CardContent></Card>
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
              Feedback ({feedback.length})
            </CardTitle>
            <Badge variant="outline" className="border-[#1a237e]/20 bg-[#1a237e]/5 text-[#1a237e]">
              Avg rating {avgRating}/5
            </Badge>
          </CardHeader>
          <CardContent>
            {feedback.length === 0 ? (
              <EmptyState message="No feedback submitted yet." />
            ) : (
              <ul className="max-h-72 divide-y divide-border overflow-y-auto pr-1">
                {feedback.map((f) => (
                  <li key={f.id} className="flex flex-col gap-1 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{f.name}</span>
                      <span className="text-xs text-amber-500">{"★".repeat(f.rating)}</span>
                      {f.routeNumber ? <span className="text-[11px] text-muted-foreground">Route {f.routeNumber}</span> : null}
                      <span className="ml-auto text-[11px] text-muted-foreground">{formatDate(f.createdAt)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{f.message}</p>
                  </li>
                ))}
              </ul>
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
                  ["Date", "Present", "Absent"],
                  Object.entries(byDay)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([date, v]) => [date, String(v.present), String(v.absent)])
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
                    <Bar dataKey="present" name="Present" stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="absent" name="Absent" stackId="a" fill="#dc2626" radius={[4, 4, 0, 0]} />
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