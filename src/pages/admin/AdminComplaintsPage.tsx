import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MessageSquareWarning, Star } from "lucide-react";
import { api } from "@/lib/api";
import PageHeader from "@/components/faculty/PageHeader";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ComplaintStatusBadge } from "@/components/faculty/Badges";
import { formatDateTime } from "@/lib/faculty";
import type { Complaint, ComplaintStatus, Feedback } from "@/types/faculty";

const TABS: { value: ComplaintStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "OPEN", label: "Pending" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "REJECTED", label: "Rejected" },
];

const CATEGORIES = ["BUS", "DRIVER", "ROUTE", "BUS_STOP", "ATTENDANCE", "SAFETY", "OTHER"];

const ALL_CATEGORIES = "__all__";

export default function AdminComplaintsPage() {
  const [tab, setTab] = useState<ComplaintStatus | "all">("all");
  const [category, setCategory] = useState("");

  const complaintsQuery = useQuery({
    queryKey: ["admin-complaints", tab, category],
    queryFn: () =>
      api.get<{ data: Complaint[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
        `/admin/complaints?page=1&limit=20&status=${tab === "all" ? "" : tab}&category=${encodeURIComponent(category)}`
      ),
  });

  const feedbackQuery = useQuery({
    queryKey: ["admin-feedback"],
    queryFn: () =>
      api.get<{ data: Feedback[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
        "/admin/feedback?page=1&limit=10"
      ),
  });

  if (complaintsQuery.isLoading || feedbackQuery.isLoading) {
    return <PageSkeleton rows={6} />;
  }
  if (complaintsQuery.isError || feedbackQuery.isError) {
    return (
      <PageError
        message="Could not load complaints."
        onRetry={() => { void complaintsQuery.refetch(); void feedbackQuery.refetch(); }}
      />
    );
  }

  const complaints = complaintsQuery.data!.data;
  const totalComplaints = complaintsQuery.data!.pagination.total;
  const feedback = feedbackQuery.data!.data;

  return (
    <>
      <PageHeader
        title="Complaints & Feedback"
        description="Student complaints and feedback from the whole campus — respond and resolve."
      />

      <Card className="shadow-card">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
            <MessageSquareWarning className="h-4 w-4 text-[#1a237e]" />
            Complaints ({totalComplaints})
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-border bg-secondary/40 p-1">
              {TABS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTab(t.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    tab === t.value ? "bg-[#1a237e] text-white shadow" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <Select value={category || ALL_CATEGORIES} onValueChange={(v) => setCategory(v === ALL_CATEGORIES ? "" : v)}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {complaints.length === 0 ? (
            <EmptyState message="No complaints match these filters." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <p className="font-bold">{c.student?.name ?? "—"}</p>
                        <p className="text-[11px] text-muted-foreground">{c.student?.registerNumber ?? "—"}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-[#1a237e]/20 bg-[#1a237e]/5 text-[#1a237e]">
                          {c.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[260px]">
                        <p className="line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
                      </TableCell>
                      <TableCell>{c.route?.routeCode ? `Route ${c.route.routeCode}` : "—"}</TableCell>
                      <TableCell><ComplaintStatusBadge status={c.status} /></TableCell>
                      <TableCell className="text-xs">{formatDateTime(c.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/admin/complaints/${c.id}`}>Open</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
            <Star className="h-4 w-4 text-[#FFD700]" />
            Recent Feedback ({feedback.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feedback.length === 0 ? (
            <EmptyState message="No feedback submitted yet." />
          ) : (
            <ul className="divide-y divide-border">
              {feedback.map((f) => (
                <li key={f.id} className="flex flex-col gap-1 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-foreground">{f.student?.name ?? "—"}</span>
                    <span className="text-xs text-amber-500">{"★".repeat(f.rating)}</span>
                    <span className="ml-auto text-[11px] text-muted-foreground">{formatDateTime(f.createdAt)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{f.message}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
