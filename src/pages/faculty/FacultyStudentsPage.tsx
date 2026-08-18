import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, GraduationCap, Search, UserX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { boardingStatusFor, initials } from "@/lib/faculty";
import PageHeader from "@/components/faculty/PageHeader";
import { BoardingBadge } from "@/components/faculty/Badges";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import type { AttendanceRecord, DashboardResponse, Paginated, StudentProfile } from "@/types/faculty";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function FacultyStudentsPage() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [year, setYear] = useState("all");
  const [stop, setStop] = useState("all");

  const studentsQuery = useQuery({
    queryKey: ["faculty-students"],
    queryFn: () => api.get<Paginated<StudentProfile>>("/users?role=student&limit=100"),
  });
  const attendanceQuery = useQuery({
    queryKey: ["faculty-attendance"],
    queryFn: () => api.get<{ items: AttendanceRecord[] }>("/attendance"),
  });
  const dashQuery = useQuery({
    queryKey: ["faculty-dashboard"],
    queryFn: () => api.get<DashboardResponse>("/dashboard"),
  });

  const students = useMemo(() => studentsQuery.data?.items ?? [], [studentsQuery.data]);
  const records = useMemo(() => attendanceQuery.data?.items ?? [], [attendanceQuery.data]);

  const departments = useMemo(
    () => [...new Set(students.map((s) => s.department).filter(Boolean) as string[])].sort(),
    [students]
  );
  const years = useMemo(
    () => [...new Set(students.map((s) => s.year).filter(Boolean) as string[])].sort(),
    [students]
  );
  const stops = useMemo(
    () => [...new Set(students.map((s) => s.boardingStop).filter(Boolean) as string[])].sort(),
    [students]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (department !== "all" && s.department !== department) return false;
      if (year !== "all" && s.year !== year) return false;
      if (stop !== "all" && s.boardingStop !== stop) return false;
      if (q) {
        const hay = `${s.name} ${s.rollNo ?? ""} ${s.email ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [students, search, department, year, stop]);

  if (studentsQuery.isLoading || attendanceQuery.isLoading || dashQuery.isLoading) {
    return <PageSkeleton rows={6} />;
  }
  if (studentsQuery.isError || attendanceQuery.isError) {
    return <PageError message="Could not load the student list." onRetry={() => { void studentsQuery.refetch(); void attendanceQuery.refetch(); }} />;
  }

  const routeNumber = dashQuery.data?.myBus?.routeNumber;

  const handleExport = () => {
    const header = ["Register Number", "Student Name", "Department", "Year", "Boarding Stop", "Boarding Status"];
    const rows = filtered.map((s) => [
      s.rollNo ?? "",
      s.name,
      s.department ?? "",
      s.year ?? "",
      s.boardingStop ?? "",
      boardingStatusFor(s, records, today(), "morning").replace("_", " "),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `route-${routeNumber ?? "students"}-roster.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        title="Students"
        description={`Students assigned to your bus${routeNumber ? ` (Route ${routeNumber})` : ""}.`}
        actions={
          <Button variant="outline" size="sm" onClick={handleExport} disabled={filtered.length === 0}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <Card className="shadow-card">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, register number or email…"
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>Year {y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={stop} onValueChange={setStop}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Boarding stop" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stops</SelectItem>
                  {stops.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
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
                  <TableHead className="text-[11px] uppercase">Register Number</TableHead>
                  <TableHead className="text-[11px] uppercase">Department</TableHead>
                  <TableHead className="text-[11px] uppercase">Year</TableHead>
                  <TableHead className="text-[11px] uppercase">Boarding Stop</TableHead>
                  <TableHead className="text-[11px] uppercase">Boarding Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40">
                      <EmptyState message="No students match your filters." />
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((s) => (
                    <TableRow key={s.id} className="hover:bg-secondary/40">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-[#1a237e]/10 text-[10px] font-bold text-[#1a237e]">
                              {initials(s.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="whitespace-nowrap text-xs font-bold text-foreground">{s.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs font-semibold text-muted-foreground">
                        {s.rollNo ?? "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{s.department ?? "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">Year {s.year ?? "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{s.boardingStop ?? "—"}</TableCell>
                      <TableCell>
                        <BoardingBadge status={boardingStatusFor(s, records, today(), "morning")} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-2 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {filtered.length} of {students.length} students · Boarding status is for today&apos;s
              morning trip; students without an attendance record are estimated by the demo service.
            </p>
            {students.length === 0 && (
              <p className="flex items-center gap-1.5 font-semibold text-amber-700">
                <UserX className="h-3.5 w-3.5" /> No students assigned to this bus yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}