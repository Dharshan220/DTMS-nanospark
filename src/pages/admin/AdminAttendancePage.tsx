import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ClipboardCheck, Pencil } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import PageHeader from "@/components/faculty/PageHeader";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AttendanceRecord, BusInfo, Paginated } from "@/types/faculty";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminAttendancePage() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(todayKey());
  const [editing, setEditing] = useState<AttendanceRecord | null>(null);
  const [editBoys, setEditBoys] = useState("0");
  const [editGirls, setEditGirls] = useState("0");

  const countsQuery = useQuery({
    queryKey: ["admin-attendance", date],
    queryFn: () =>
      api.get<Paginated<AttendanceRecord>>(
        `/admin/attendance?startDate=${encodeURIComponent(date)}&endDate=${encodeURIComponent(date)}&page=1&limit=100`
      ),
  });
  const busesQuery = useQuery({
    queryKey: ["admin-buses"],
    queryFn: () => api.get<Paginated<BusInfo>>("/admin/buses?page=1&limit=100"),
  });

  const saveMutation = useMutation({
    mutationFn: (c: AttendanceRecord) =>
      api.patch(`/admin/attendance/${c.id}`, {
        boysCount: Number(editBoys) || 0,
        girlsCount: Number(editGirls) || 0,
        totalCount: (Number(editBoys) || 0) + (Number(editGirls) || 0),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-attendance"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setEditing(null);
      toast.success("Passenger count updated");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update count"),
  });

  if (countsQuery.isLoading || busesQuery.isLoading) return <PageSkeleton rows={6} />;
  if (countsQuery.isError || busesQuery.isError) {
    return (
      <PageError
        message="Could not load attendance data."
        onRetry={() => { void countsQuery.refetch(); void busesQuery.refetch(); }}
      />
    );
  }

  const counts = countsQuery.data!.data;
  const buses = busesQuery.data!.data;
  const totalToday = counts.reduce((s, c) => s + c.totalCount, 0);
  const boysToday = counts.reduce((s, c) => s + c.boysCount, 0);
  const girlsToday = counts.reduce((s, c) => s + c.girlsCount, 0);

  const startEdit = (c: AttendanceRecord) => {
    setEditing(c);
    setEditBoys(String(c.boysCount));
    setEditGirls(String(c.girlsCount));
  };

  return (
    <>
      <PageHeader
        title="Attendance & Passengers"
        description="Daily passenger counts per bus, and student attendance for the month."
      />

      <Card className="shadow-card">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
            <ClipboardCheck className="h-4 w-4 text-[#1a237e]" />
            Passenger Counts — {date}
          </CardTitle>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-[#1a237e]/20 bg-[#1a237e]/5 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#1a237e]">Total people</p>
              <p className="text-xl font-extrabold text-[#1a237e]">{totalToday}</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">Boys</p>
              <p className="text-xl font-extrabold text-blue-700">{boysToday}</p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-700">Girls</p>
              <p className="text-xl font-extrabold text-rose-700">{girlsToday}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Buses reported</p>
              <p className="text-xl font-extrabold text-amber-700">{counts.length} / {buses.length}</p>
            </div>
          </div>

          {counts.length === 0 ? (
            <EmptyState message="No passenger counts recorded for this date." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bus</TableHead>
                    <TableHead>Trip</TableHead>
                    <TableHead>Boys</TableHead>
                    <TableHead>Girls</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {counts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-bold">Bus {c.bus.busNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-[#1a237e]/20 bg-[#1a237e]/5 text-[#1a237e] capitalize">
                          {c.tripType.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{c.boysCount}</TableCell>
                      <TableCell>{c.girlsCount}</TableCell>
                      <TableCell className="font-extrabold">{c.totalCount}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(c)} title="Edit count">
                          <Pencil className="h-4 w-4" />
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

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <Card className="w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
                <ClipboardCheck className="h-4 w-4 text-[#1a237e]" />
                Edit Count — Bus {editing.bus.busNumber} ({editing.tripType.toLowerCase()})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Boys</Label>
                  <Input value={editBoys} onChange={(e) => setEditBoys(e.target.value)} inputMode="numeric" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Girls</Label>
                  <Input value={editGirls} onChange={(e) => setEditGirls(e.target.value)} inputMode="numeric" />
                </div>
              </div>
              <div className="rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm">
                Total people: <span className="font-extrabold text-[#1a237e]">{(Number(editBoys) || 0) + (Number(editGirls) || 0)}</span>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button
                  className="gap-2 bg-[#1a237e] text-white hover:bg-[#283593]"
                  onClick={() => saveMutation.mutate(editing)}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? "Saving…" : "Save Count"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}
