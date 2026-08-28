import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UsersRound } from "lucide-react";
import { api } from "@/lib/api";
import PageHeader from "@/components/faculty/PageHeader";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StudentListItem {
  id: string;
  userId: string;
  email: string;
  registerNumber: string;
  name: string;
  phone: string;
  department: string;
  year: number;
  section: string;
  gender: string;
  status: string;
}

interface FacultyListItem {
  id: string;
  userId: string;
  email: string;
  facultyId: string;
  name: string;
  phone: string;
  department: string;
  designation: string;
  status: string;
}

interface CombinedUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "student" | "faculty";
  status: string;
  department?: string;
}

const ROLE_LABELS: Record<string, string> = {
  student: "Student",
  faculty: "Faculty",
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");

  const studentsQuery = useQuery({
    queryKey: ["admin-students"],
    queryFn: () =>
      api.get<{ data: StudentListItem[]; pagination: { total: number } }>(
        "/admin/students?page=1&limit=100"
      ),
  });

  const facultyQuery = useQuery({
    queryKey: ["admin-faculty"],
    queryFn: () =>
      api.get<{ data: FacultyListItem[]; pagination: { total: number } }>(
        "/admin/faculty?page=1&limit=100"
      ),
  });

  if (studentsQuery.isLoading || facultyQuery.isLoading) return <PageSkeleton rows={6} />;
  if (studentsQuery.isError || facultyQuery.isError) {
    return <PageError message="Could not load users." onRetry={() => { void studentsQuery.refetch(); void facultyQuery.refetch(); }} />;
  }

  const students: StudentListItem[] = studentsQuery.data?.data ?? [];
  const faculties: FacultyListItem[] = facultyQuery.data?.data ?? [];

  const combined: CombinedUser[] = [
    ...students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone ?? "",
      role: "student" as const,
      status: s.status,
      department: s.department,
    })),
    ...faculties.map((f) => ({
      id: f.id,
      name: f.name,
      email: f.email,
      phone: f.phone ?? "",
      role: "faculty" as const,
      status: f.status,
      department: f.department,
    })),
  ];

  const q = search.toLowerCase().trim();
  const filtered = q
    ? combined.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.includes(q) ||
          (u.department ?? "").toLowerCase().includes(q)
      )
    : combined;

  const studentsCount = filtered.filter((u) => u.role === "student").length;
  const facultiesCount = filtered.filter((u) => u.role === "faculty").length;

  return (
    <>
      <PageHeader
        title="User Accounts"
        description="A combined view of all student and faculty accounts in the system."
      />

      <Card className="shadow-card">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
            <UsersRound className="h-4 w-4 text-[#1a237e]" />
            Accounts ({students.length + faculties.length})
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {combined.length === 0 ? (
            <EmptyState message={search ? "No users match your search." : "No accounts yet."} />
          ) : (
            <>
              {studentsCount > 0 && (
                <UserGroup
                  title={`Students · ${studentsCount}`}
                  items={filtered.filter((u) => u.role === "student")}
                />
              )}
              {facultiesCount > 0 && (
                <UserGroup
                  title={`Faculty · ${facultiesCount}`}
                  items={filtered.filter((u) => u.role === "faculty")}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function UserGroup({ title, items }: { title: string; items: CombinedUser[] }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <p className="font-bold">{u.name}</p>
                  <p className="text-[11px] text-muted-foreground">{u.email}</p>
                </TableCell>
                <TableCell>{u.department ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-[#1a237e]/20 bg-[#1a237e]/5 text-[#1a237e]">
                    {ROLE_LABELS[u.role]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      u.status === "ACTIVE"
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-red-200 bg-red-50 text-red-700"
                    }
                  >
                    {u.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
