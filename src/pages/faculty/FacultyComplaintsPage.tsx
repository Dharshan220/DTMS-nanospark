import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ChevronRight, MessageSquareWarning, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { formatDateTime, initials } from "@/lib/faculty";
import PageHeader from "@/components/faculty/PageHeader";
import StatCard from "@/components/faculty/StatCard";
import { ComplaintStatusBadge } from "@/components/faculty/Badges";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import {
  COMPLAINT_CATEGORIES,
  type Complaint,
  type ComplaintStatus,
} from "@/types/faculty";

export default function FacultyComplaintsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | ComplaintStatus>("all");
  const [category, setCategory] = useState("all");

  const complaintsQuery = useQuery({
    queryKey: ["faculty-complaints"],
    queryFn: () => api.get<{ items: Complaint[]; total: number }>("/complaints?limit=100"),
  });

  const complaints = useMemo(() => complaintsQuery.data?.items ?? [], [complaintsQuery.data]);

  const counts = useMemo(() => {
    const c: Record<ComplaintStatus | "all", number> = {
      all: complaints.length,
      pending: 0,
      under_review: 0,
      in_progress: 0,
      resolved: 0,
      escalated: 0,
    };
    for (const x of complaints) c[x.status] += 1;
    return c;
  }, [complaints]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return complaints.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (category !== "all" && c.category !== category) return false;
      if (q && !`${c.name} ${c.description} ${c.category}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [complaints, search, status, category]);

  if (complaintsQuery.isLoading) return <PageSkeleton rows={6} />;
  if (complaintsQuery.isError) {
    return <PageError message="Could not load complaints." onRetry={() => void complaintsQuery.refetch()} />;
  }

  return (
    <>
      <PageHeader
        title="Complaints & Feedback"
        description="Complaints and feedback raised by students on your bus, plus your own submissions."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total" value={counts.all} icon={MessageSquareWarning} />
        <StatCard label="Pending" value={counts.pending} icon={MessageSquareWarning} tone="warning" />
        <StatCard label="In Progress" value={counts.in_progress} icon={MessageSquareWarning} tone="navy" />
        <StatCard label="Resolved" value={counts.resolved} icon={MessageSquareWarning} tone="success" />
        <StatCard label="Escalated" value={counts.escalated} icon={MessageSquareWarning} tone="danger" />
      </div>

      <Card className="shadow-card">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by student, subject or category…"
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {COMPLAINT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead className="text-[11px] uppercase">Student</TableHead>
                  <TableHead className="text-[11px] uppercase">Register No</TableHead>
                  <TableHead className="text-[11px] uppercase">Bus</TableHead>
                  <TableHead className="text-[11px] uppercase">Category</TableHead>
                  <TableHead className="text-[11px] uppercase">Subject</TableHead>
                  <TableHead className="text-[11px] uppercase">Date</TableHead>
                  <TableHead className="text-[11px] uppercase">Status</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-40">
                      <EmptyState message="No complaints match your filters." />
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer hover:bg-secondary/40"
                      onClick={() => navigate(`/faculty/complaints/${c.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-[#1a237e]/10 text-[10px] font-bold text-[#1a237e]">
                              {initials(c.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="whitespace-nowrap text-xs font-bold text-foreground">{c.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {c.studentRollNo ?? "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {c.busVehicleNumber ?? `Route ${c.routeNumber ?? "—"}`}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        <Badge variant="outline" className="border-[#f0c200] bg-[#FFD700]/10 text-[#8a6d00]">
                          {c.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <p className="truncate text-xs font-semibold text-foreground">{c.description}</p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateTime(c.createdAt)}
                      </TableCell>
                      <TableCell>
                        <ComplaintStatusBadge status={c.status} />
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Students cannot edit or delete their submissions. Faculty respond, update status and escalate;
            permanent deletion is reserved for the transport department.
          </p>
        </CardContent>
      </Card>
    </>
  );
}