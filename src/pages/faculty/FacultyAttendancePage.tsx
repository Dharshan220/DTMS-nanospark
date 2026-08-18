import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Bus, CalendarDays, ClipboardCheck, Clock, CircleUserRound, Loader2, PersonStanding, Save, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { api, ApiError } from "@/lib/api";
import { boardingStatusFor, formatDate, formatRelative } from "@/lib/faculty";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/faculty/PageHeader";
import StatCard from "@/components/faculty/StatCard";
import { BoardingBadge } from "@/components/faculty/Badges";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import type {
  AttendanceRecord,
  BoardingStatus,
  BusPassengerCount,
  DashboardResponse,
  Paginated,
  PassengerCountResponse,
  StudentProfile,
  TripKind,
} from "@/types/faculty";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const TRIP_LABELS: Record<TripKind, string> = {
  morning: "Morning",
  evening: "Evening",
};

export default function FacultyAttendancePage() {
  const { user } = useAuth();
  const [trip, setTrip] = useState<TripKind>("morning");
  const [date, setDate] = useState<string>(today());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | BoardingStatus>("all");
  const [boys, setBoys] = useState("");
  const [girls, setGirls] = useState("");

  const queryClient = useQueryClient();

  const studentsQuery = useQuery({
    queryKey: ["faculty-students"],
    queryFn: () => api.get<Paginated<StudentProfile>>("/users?role=student&limit=100"),
  });
  const attendanceQuery = useQuery({
    queryKey: ["faculty-attendance"],
    queryFn: () => api.get<{ items: AttendanceRecord[] }>("/attendance"),
  });
  const countsQuery = useQuery({
    queryKey: ["faculty-passenger-counts"],
    queryFn: () => api.get<PassengerCountResponse>("/attendance/passenger-counts"),
  });
  const dashQuery = useQuery({
    queryKey: ["faculty-dashboard"],
    queryFn: () => api.get<DashboardResponse>("/dashboard"),
  });

  const students = useMemo(() => studentsQuery.data?.items ?? [], [studentsQuery.data]);
  const records = useMemo(() => attendanceQuery.data?.items ?? [], [attendanceQuery.data]);
  const counts = useMemo(() => countsQuery.data?.items ?? [], [countsQuery.data]);

  const statusFor = useCallback(
    (student: StudentProfile) => boardingStatusFor(student, records, date, trip),
    [records, date, trip]
  );

  const summary = useMemo(() => {
    let boarded = 0;
    let notBoarded = 0;
    let notRecorded = 0;
    for (const s of students) {
      const st = statusFor(s);
      if (st === "boarded") boarded += 1;
      else if (st === "not_boarded") notBoarded += 1;
      else notRecorded += 1;
    }
    return { total: students.length, boarded, notBoarded, notRecorded };
  }, [students, statusFor]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (statusFilter !== "all" && statusFor(s) !== statusFilter) return false;
      if (q && !`${s.name} ${s.rollNo ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [students, search, statusFilter, statusFor]);

  const history = useMemo(() => {
    const byDate = new Map<string, { present: number; absent: number; records: number }>();
    for (const r of records) {
      const e = byDate.get(r.date) ?? { present: 0, absent: 0, records: 0 };
      e.records += 1;
      if (r.status === "present") e.present += 1;
      else e.absent += 1;
      byDate.set(r.date, e);
    }
    return [...byDate.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 10);
  }, [records]);

  const currentCount = useMemo(
    () => counts.find((c) => c.date === date && c.tripType === trip),
    [counts, date, trip]
  );
  const myBus = dashQuery.data?.myBus ?? null;

  const boysNum = boys === "" ? 0 : Number(boys);
  const girlsNum = girls === "" ? 0 : Number(girls);
  const totalNum = boysNum + girlsNum;

  const boysError =
    boys !== "" && (!Number.isInteger(boysNum) || boysNum < 0)
      ? "Boys must be a non-negative whole number"
      : null;
  const girlsError =
    girls !== "" && (!Number.isInteger(girlsNum) || girlsNum < 0)
      ? "Girls must be a non-negative whole number"
      : null;
  const canSave = boysError === null && girlsError === null;

  useEffect(() => {
    if (currentCount) {
      setBoys(String(currentCount.boys));
      setGirls(String(currentCount.girls));
    } else {
      setBoys("");
      setGirls("");
    }
  }, [currentCount, date, trip]);

  const saveMutation = useMutation({
    mutationFn: (payload: { date: string; tripType: TripKind; total: number; boys: number; girls: number }) =>
      api.put<{ count: BusPassengerCount; created: boolean }>("/attendance/passenger-counts", payload),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ["faculty-passenger-counts"] });
      toast.success(
        res.created
          ? `Passenger count saved for ${TRIP_LABELS[trip]} Trip`
          : `Passenger count updated for ${TRIP_LABELS[trip]} Trip`
      );
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not save passenger count"),
  });

  const handleSave = () => {
    if (!canSave) return;
    saveMutation.mutate({ date, tripType: trip, total: totalNum, boys: boysNum, girls: girlsNum });
  };

  const loading = studentsQuery.isLoading || attendanceQuery.isLoading || countsQuery.isLoading;
  const failed = studentsQuery.isError || attendanceQuery.isError || countsQuery.isError;

  if (loading) return <PageSkeleton rows={6} />;
  if (failed) {
    return (
      <PageError
        message="Could not load attendance data."
        onRetry={() => {
          void studentsQuery.refetch();
          void attendanceQuery.refetch();
          void countsQuery.refetch();
        }}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Track boarding for the morning and evening trips and record the passenger count."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Students" value={summary.total} icon={ClipboardCheck} />
        <StatCard label="Present" value={summary.boarded} sub={`${trip} trip`} icon={ClipboardCheck} tone="success" />
        <StatCard label="Absent" value={summary.notBoarded} sub={`${trip} trip`} icon={ClipboardCheck} tone="danger" />
        <StatCard label="Not Recorded" value={summary.notRecorded} sub={`${trip} trip`} icon={ClipboardCheck} tone="warning" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total People" value={currentCount ? currentCount.total : "—"} sub={`${trip} trip`} icon={Users} tone="gold" />
        <StatCard label="Boys" value={currentCount ? currentCount.boys : "—"} sub={`${trip} trip`} icon={PersonStanding} />
        <StatCard label="Girls" value={currentCount ? currentCount.girls : "—"} sub={`${trip} trip`} icon={CircleUserRound} />
        <StatCard
          label="Last Saved"
          value={currentCount?.updatedAt ? formatRelative(currentCount.updatedAt) : "—"}
          sub={currentCount ? `${TRIP_LABELS[trip]} trip` : "not saved yet"}
          icon={Clock}
        />
      </div>

      <Card className="shadow-card">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
            <Users className="h-4 w-4 text-[#1a237e]" />
            Bus Passenger Count
          </CardTitle>
          <Badge variant="outline" className="border-[#f0c200] bg-[#FFD700]/10 px-2.5 py-1 text-[#8a6d00]">
            {TRIP_LABELS[trip]} Trip · {formatDate(date)}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <Bus className="h-3.5 w-3.5 text-[#1a237e]" />
              {myBus ? `Bus ${myBus.vehicleNumber} · Route ${myBus.routeNumber}` : "Bus —"}
            </span>
            <span>Recorded by {user?.name ?? "Faculty"}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="count-boys" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Boys
              </Label>
              <Input
                id="count-boys"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={boys}
                onChange={(e) => setBoys(e.target.value)}
                placeholder="0"
                className={boysError ? "border-red-300 focus-visible:ring-red-200" : undefined}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="count-girls" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Girls
              </Label>
              <Input
                id="count-girls"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={girls}
                onChange={(e) => setGirls(e.target.value)}
                placeholder="0"
                className={girlsError ? "border-red-300 focus-visible:ring-red-200" : undefined}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="count-total" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Total People
              </Label>
              <Input id="count-total" type="number" value={totalNum} readOnly disabled className="font-bold" />
            </div>
          </div>

          {(boysError || girlsError) && (
            <p className="flex items-start gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {boysError ?? girlsError}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button size="sm" className="gap-2 bg-[#1a237e] text-white hover:bg-[#283593]" onClick={handleSave} disabled={!canSave || saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {currentCount ? "Update Count" : "Save Count"}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Total People is calculated automatically as Boys + Girls and validated on the server.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Tabs value={trip} onValueChange={(v) => setTrip(v as TripKind)}>
              <TabsList className="bg-secondary/60">
                <TabsTrigger value="morning">Morning Trip</TabsTrigger>
                <TabsTrigger value="evening">Evening Trip</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student…"
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                type="date"
                value={date}
                max={today()}
                onChange={(e) => setDate(e.target.value || today())}
                className="w-auto"
              />
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger className="w-40 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="boarded">Boarded</SelectItem>
                  <SelectItem value="not_boarded">Not Boarded</SelectItem>
                  <SelectItem value="not_scanned">Not Recorded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead className="text-[11px] uppercase">Register Number</TableHead>
                  <TableHead className="text-[11px] uppercase">Student Name</TableHead>
                  <TableHead className="text-[11px] uppercase">Boarding Stop</TableHead>
                  <TableHead className="text-[11px] uppercase">Morning Status</TableHead>
                  <TableHead className="text-[11px] uppercase">Evening Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40">
                      <EmptyState message="No students found for the selected filters." />
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((s) => (
                    <TableRow key={s.id} className="hover:bg-secondary/40">
                      <TableCell className="whitespace-nowrap text-xs font-semibold text-muted-foreground">
                        {s.rollNo ?? "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs font-bold text-foreground">{s.name}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{s.boardingStop ?? "—"}</TableCell>
                      <TableCell>
                        <BoardingBadge status={boardingStatusFor(s, records, date, "morning")} />
                      </TableCell>
                      <TableCell>
                        <BoardingBadge status={boardingStatusFor(s, records, date, "evening")} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Boarding status is derived from recorded attendance; students without a record are estimated by the
            demo service until check-in is connected.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-4 sm:p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-foreground">
            <Users className="h-4 w-4 text-[#1a237e]" />
            Passenger Count History
          </h3>
          {counts.length === 0 ? (
            <EmptyState message="No passenger counts recorded yet." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead className="text-[11px] uppercase">Date</TableHead>
                    <TableHead className="text-[11px] uppercase">Trip</TableHead>
                    <TableHead className="text-[11px] uppercase">Bus</TableHead>
                    <TableHead className="text-[11px] uppercase">Total</TableHead>
                    <TableHead className="text-[11px] uppercase">Boys</TableHead>
                    <TableHead className="text-[11px] uppercase">Girls</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {counts.slice(0, 10).map((c) => (
                    <TableRow key={c.id} className="hover:bg-secondary/40">
                      <TableCell className="whitespace-nowrap text-xs font-semibold text-foreground">
                        {formatDate(c.date)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`whitespace-nowrap ${
                            c.tripType === "morning"
                              ? "border-sky-200 bg-sky-50 text-sky-700"
                              : "border-indigo-200 bg-indigo-50 text-indigo-700"
                          }`}
                        >
                          {TRIP_LABELS[c.tripType]} Trip
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{myBus?.vehicleNumber ?? `Route ${c.routeNumber ?? "—"}`}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs font-bold text-foreground">{c.total}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{c.boys}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{c.girls}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-4 sm:p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-foreground">
            <CalendarDays className="h-4 w-4 text-[#1a237e]" />
            Attendance History
          </h3>
          {history.length === 0 ? (
            <EmptyState message="No attendance history yet." />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {history.map(([d, e]) => (
                <div key={d} className="rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
                  <p className="text-[11px] font-bold text-foreground">{formatDate(d)}</p>
                  <div className="mt-1 flex items-center gap-2 text-[11px]">
                    <span className="font-bold text-green-700">{e.present} present</span>
                    <span className="font-bold text-red-600">{e.absent} absent</span>
                    <span className="font-semibold text-muted-foreground">· {e.records} records</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}