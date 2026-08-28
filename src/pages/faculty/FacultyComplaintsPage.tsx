import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquareWarning, Search } from "lucide-react";
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
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/faculty";
import PageHeader from "@/components/faculty/PageHeader";
import StatCard from "@/components/faculty/StatCard";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import type { NotificationItem, Paginated } from "@/types/faculty";

export default function FacultyComplaintsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const notificationsQuery = useQuery({
    queryKey: ["faculty-notifications"],
    queryFn: () => api.get<Paginated<NotificationItem>>("/notifications?limit=100"),
  });

  const notifications = useMemo(() => notificationsQuery.data?.data ?? [], [notificationsQuery.data]);

  const complaintNotifications = useMemo(
    () => notifications.filter((n) => n.type === "COMPLAINT" || n.title.toLowerCase().includes("complaint")),
    [notifications]
  );

  const types = useMemo(
    () => [...new Set(complaintNotifications.map((n) => n.type))].sort(),
    [complaintNotifications]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return complaintNotifications.filter((n) => {
      if (typeFilter !== "all" && n.type !== typeFilter) return false;
      if (q && !`${n.title} ${n.message}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [complaintNotifications, search, typeFilter]);

  if (notificationsQuery.isLoading) return <PageSkeleton rows={6} />;
  if (notificationsQuery.isError) {
    return <PageError message="Could not load complaints." onRetry={() => void notificationsQuery.refetch()} />;
  }

  return (
    <>
      <PageHeader
        title="Complaints & Feedback"
        description="Complaints and feedback notifications related to your bus."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Notifications" value={complaintNotifications.length} icon={MessageSquareWarning} />
        <StatCard label="Unread" value={complaintNotifications.filter((n) => !n.readAt).length} icon={MessageSquareWarning} tone="warning" />
        <StatCard label="All Notifications" value={notifications.length} icon={MessageSquareWarning} tone="navy" />
      </div>

      <Card className="shadow-card">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by subject or description…"
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 w-44 text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {types.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead className="text-[11px] uppercase">Title</TableHead>
                  <TableHead className="text-[11px] uppercase">Type</TableHead>
                  <TableHead className="text-[11px] uppercase">Message</TableHead>
                  <TableHead className="text-[11px] uppercase">Date</TableHead>
                  <TableHead className="text-[11px] uppercase">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40">
                      <EmptyState message="No complaint notifications match your filters." />
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((n) => (
                    <TableRow key={n.id} className="hover:bg-secondary/40">
                      <TableCell className="max-w-[200px]">
                        <p className="truncate text-xs font-bold text-foreground">{n.title}</p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        <Badge variant="outline" className="border-[#f0c200] bg-[#FFD700]/10 text-[#8a6d00]">
                          {n.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <p className="truncate text-xs font-semibold text-muted-foreground">{n.message}</p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateTime(n.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`whitespace-nowrap ${
                            n.readAt
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                          }`}
                        >
                          {n.readAt ? "Read" : "Unread"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Complaint-related notifications from students and the transport department.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
