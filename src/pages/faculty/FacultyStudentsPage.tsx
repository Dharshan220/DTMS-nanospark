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
import { initials } from "@/lib/faculty";
import PageHeader from "@/components/faculty/PageHeader";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import type { FacultyProfile } from "@/types/faculty";

interface TransportStudent {
  id: string;
  name: string;
  registerNumber: string;
  email: string;
  department: string | null;
  year: string | null;
  gender: string | null;
  boardingStop: string | null;
}

export default function FacultyStudentsPage() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [year, setYear] = useState("all");

  const profileQuery = useQuery({
    queryKey: ["faculty-profile"],
    queryFn: () => api.get<FacultyProfile>("/faculty/profile"),
  });

  const studentsQuery = useQuery({
    queryKey: ["faculty-transport-students"],
    queryFn: () => api.get<{ data: TransportStudent[] }>(
      `/faculty/transport/students`
    ),
    enabled: Boolean(profileQuery.data?.transport),
  });

  const profile = profileQuery.data;
  const transport = profile?.transport;
  const bus = transport?.bus;
  const route = bus?.route;
  const students = useMemo(() => studentsQuery.data?.data ?? [], [studentsQuery.data]);

  const departments = useMemo(
    () => [...new Set(students.map((s) => s.department).filter(Boolean) as string[])].sort(),
    [students]
  );
  const years = useMemo(
    () => [...new Set(students.map((s) => s.year).filter(Boolean) as string[])].sort(),
    [students]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (department !== "all" && s.department !== department) return false;
      if (year !== "all" && s.year !== year) return false;
      if (q) {
        const hay = `${s.name} ${s.registerNumber ?? ""} ${s.email ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [students, search, department, year]);

  if (profileQuery.isLoading) return <PageSkeleton rows={6} />;
  if (profileQuery.isError) {
    return <PageError message="Could not load the student list." onRetry={() => void profileQuery.refetch()} />;
  }

  const routeNumber = bus?.busNumber;

  const handleExport = () => {
    const header = ["Register Number", "Student Name", "Department", "Year", "Boarding Stop"];
    const rows = filtered.map((s) => [
      s.registerNumber ?? "",
      s.name,
      s.department ?? "",
      s.year ?? "",
      s.boardingStop ?? "",
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
            <div className="grid grid-cols-2 gap-2">
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40">
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
                        {s.registerNumber ?? "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{s.department ?? "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">Year {s.year ?? "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{s.boardingStop ?? "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-2 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {filtered.length} of {students.length} students.
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
