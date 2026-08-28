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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatRelative } from "@/lib/faculty";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/faculty/PageHeader";
import StatCard from "@/components/faculty/StatCard";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import type {
  AttendanceRecord,
  FacultyProfile,
  Paginated,
  TripKind,
} from "@/types/faculty";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const TRIP_LABELS: Record<TripKind, string> = {
  morning: "Morning",
  evening: "Evening",
};

const TRIP_API_MAP: Record<TripKind, "MORNING" | "EVENING"> = {
  morning: "MORNING",
  evening: "EVENING",
};

export default function FacultyAttendancePage() {
  const { user } = useAuth();
  const [trip, setTrip] = useState<TripKind>("morning");
  const [date, setDate] = useState<string>(today());
  const [boys, setBoys] = useState("");
  const [girls, setGirls] = useState("");

  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["faculty-profile"],
    queryFn: () => api.get<FacultyProfile>("/faculty/profile"),
  });

  const attendanceQuery = useQuery({
    queryKey: ["faculty-attendance", date],
    queryFn: () =>
      api.get<Paginated<AttendanceRecord>>(
        `/faculty/attendance?page=1&limit=100&date=${date}`
      ),
  });

  const bus = profileQuery.data?.transport?.bus;
  const records = useMemo(() => attendanceQuery.data?.data ?? [], [attendanceQuery.data]);

  const currentRecord = useMemo(
    () => records.find((r) => r.tripType === TRIP_API_MAP[trip]),
    [records, trip]
  );

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
    if (currentRecord) {
      setBoys(String(currentRecord.boysCount));
      setGirls(String(currentRecord.girlsCount));
    } else {
      setBoys("");
      setGirls("");
    }
  }, [currentRecord, date, trip]);

  const summary = useMemo(() => {
    let totalBoys = 0;
    let totalGirls = 0;
    let totalAll = 0;
    for (const r of records) {
      totalBoys += r.boysCount;
      totalGirls += r.girlsCount;
      totalAll += r.totalCount;
    }
    return { totalBoys, totalGirls, totalAll, records: records.length };
  }, [records]);

  const history = useMemo(() => {
    return [...records].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 10);
  }, [records]);

  const saveMutation = useMutation({
    mutationFn: (payload: { boysCount: number; girlsCount: number; totalCount: number; date?: string; tripType: "MORNING" | "EVENING" }) =>
      api.post<AttendanceRecord>("/faculty/attendance", payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["faculty-attendance"] });
      toast.success(
        currentRecord
          ? `Passenger count updated for ${TRIP_LABELS[trip]} Trip`
          : `Passenger count saved for ${TRIP_LABELS[trip]} Trip`
      );
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not save passenger count"),
  });

  const handleSave = () => {
    if (!canSave) return;
    saveMutation.mutate({
      boysCount: boysNum,
      girlsCount: girlsNum,
      totalCount: totalNum,
      date: date !== today() ? date : undefined,
      tripType: TRIP_API_MAP[trip],
    });
  };

  const loading = profileQuery.isLoading || attendanceQuery.isLoading;
  const failed = profileQuery.isError || attendanceQuery.isError;

  if (loading) return <PageSkeleton rows={6} />;
  if (failed) {
    return (
      <PageError
        message="Could not load attendance data."
        onRetry={() => {
          void profileQuery.refetch();
          void attendanceQuery.refetch();
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
        <StatCard label="Total Records" value={summary.records} icon={ClipboardCheck} />
        <StatCard label="Total Boys" value={summary.totalBoys} sub={`${trip} trip`} icon={ClipboardCheck} tone="success" />
        <StatCard label="Total Girls" value={summary.totalGirls} sub={`${trip} trip`} icon={ClipboardCheck} tone="danger" />
        <StatCard label="Total People" value={summary.totalAll} sub={`${trip} trip`} icon={ClipboardCheck} tone="warning" />
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
              {bus ? `Bus ${bus.registrationNumber} · Route ${bus.busNumber}` : "Bus —"}
            </span>
            <span>Recorded by {user?.email ?? "Faculty"}</span>
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
              {currentRecord ? "Update Count" : "Save Count"}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Total People is calculated automatically as Boys + Girls and validated on the server.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-4 sm:p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-foreground">
            <Users className="h-4 w-4 text-[#1a237e]" />
            Passenger Count History
          </h3>
          {history.length === 0 ? (
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
                  {history.map((r) => (
                    <TableRow key={r.id} className="hover:bg-secondary/40">
                      <TableCell className="whitespace-nowrap text-xs font-semibold text-foreground">
                        {formatDate(r.date)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`whitespace-nowrap ${
                            r.tripType === "MORNING"
                              ? "border-sky-200 bg-sky-50 text-sky-700"
                              : "border-indigo-200 bg-indigo-50 text-indigo-700"
                          }`}
                        >
                          {r.tripType === "MORNING" ? "Morning" : "Evening"} Trip
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{bus?.registrationNumber ?? `Route ${bus?.busNumber ?? "—"}`}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs font-bold text-foreground">{r.totalCount}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{r.boysCount}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{r.girlsCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
