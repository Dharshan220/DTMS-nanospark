import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, ShieldCheck, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import PageHeader from "@/components/faculty/PageHeader";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import FormDialog from "@/components/admin/FormDialog";
import DeleteConfirm from "@/components/admin/DeleteConfirm";
import type { PublicUser, RouteInfo } from "@/types/faculty";

interface StudentForm {
  id: string | null;
  name: string;
  email: string;
  phone: string;
  password: string;
  gender: string;
  rollNo: string;
  year: string;
  section: string;
  department: string;
  routeNumber: string;
  boardingStop: string;
  isBusAdmin: boolean;
}

const EMPTY: StudentForm = {
  id: null,
  name: "",
  email: "",
  phone: "",
  password: "",
  gender: "",
  rollNo: "",
  year: "",
  section: "",
  department: "",
  routeNumber: "",
  boardingStop: "",
  isBusAdmin: false,
};

/** Radix Select forbids empty-string item values; use a sentinel for "no selection". */
const NO_SELECTION = "__none__";

export default function AdminStudentsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<StudentForm>(EMPTY);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<PublicUser | null>(null);
  const [search, setSearch] = useState("");

  const studentsQuery = useQuery({
    queryKey: ["admin-students", search],
    queryFn: () => api.get<{ items: PublicUser[]; total: number }>(`/users?role=student&search=${encodeURIComponent(search)}`),
  });
  const routesQuery = useQuery({
    queryKey: ["admin-routes"],
    queryFn: () => api.get<{ items: RouteInfo[]; total: number }>("/transport"),
  });

  const saveMutation = useMutation({
    mutationFn: (f: StudentForm) => {
      const payload = {
        name: f.name,
        email: f.email,
        phone: f.phone || null,
        gender: f.gender || null,
        rollNo: f.rollNo || null,
        year: f.year || null,
        section: f.section || null,
        department: f.department || null,
        routeNumber: f.routeNumber === "" ? null : Number(f.routeNumber),
        boardingStop: f.boardingStop || null,
        isBusAdmin: f.isBusAdmin,
      };
      if (f.id) {
        return api.put<{ user: PublicUser }>(`/users/${f.id}`, payload);
      }
      return api.post<{ user: PublicUser }>("/users", { ...payload, role: "student", password: f.password });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setDialogOpen(false);
      setForm(EMPTY);
      toast.success("Student saved");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not save student"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`/users/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setDeleting(null);
      toast.success("Student deleted");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not delete student"),
  });

  if (studentsQuery.isLoading || routesQuery.isLoading) return <PageSkeleton rows={6} />;
  if (studentsQuery.isError || routesQuery.isError) {
    return <PageError message="Could not load students." onRetry={() => { void studentsQuery.refetch(); void routesQuery.refetch(); }} />;
  }

  const students = studentsQuery.data!.items;
  const routes = routesQuery.data!.items;

  const openCreate = () => {
    setForm(EMPTY);
    setDialogOpen(true);
  };
  const openEdit = (u: PublicUser) => {
    setForm({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone ?? "",
      password: "",
      gender: u.gender ?? "",
      rollNo: u.rollNo ?? "",
      year: u.year ?? "",
      section: u.section ?? "",
      department: u.department ?? "",
      routeNumber: u.routeNumber == null ? "" : String(u.routeNumber),
      boardingStop: u.boardingStop ?? "",
      isBusAdmin: Boolean(u.isBusAdmin),
    });
    setDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Students"
        description="Manage student accounts, boarding details and bus admin roles."
        actions={
          <Button className="gap-2 bg-[#1a237e] text-white hover:bg-[#283593]" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Student
          </Button>
        }
      />

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
            <Users className="h-4 w-4 text-[#1a237e]" />
            Students ({studentsQuery.data!.total})
          </CardTitle>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, roll no or phone…"
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <EmptyState message={search ? "No students match your search." : "No students yet. Add your first student."} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Year / Section</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Boarding Stop</TableHead>
                    <TableHead>Bus Admin</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <p className="font-bold">{u.name}</p>
                        <p className="text-[11px] text-muted-foreground">{u.email}</p>
                      </TableCell>
                      <TableCell>{u.rollNo ?? "—"}</TableCell>
                      <TableCell>
                        {[u.year, u.section].filter(Boolean).join(" / ") || "—"}
                      </TableCell>
                      <TableCell>{u.routeNumber ? `Route ${u.routeNumber}` : "—"}</TableCell>
                      <TableCell className="max-w-[140px] truncate">{u.boardingStop ?? "—"}</TableCell>
                      <TableCell>
                        {u.isBusAdmin ? (
                          <Badge variant="outline" className="border-[#1a237e]/20 bg-[#1a237e]/5 text-[#1a237e]">
                            <ShieldCheck className="mr-1 h-3 w-3" /> Bus Admin
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(u)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleting(u)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={form.id ? "Edit Student" : "Add Student"}
        description={form.id ? "Update the student's details." : "Create a student account with login credentials."}
        onSave={() => {
          if (!form.name.trim() || !form.email.trim()) {
            toast.error("Name and email are required.");
            return;
          }
          if (!form.id && form.password.length < 4) {
            toast.error("Password must be at least 4 characters.");
            return;
          }
          saveMutation.mutate(form);
        }}
        saving={saveMutation.isPending}
        saveLabel={form.id ? "Save Student" : "Create Student"}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Full name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Email *</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" />
          </div>
          {!form.id ? (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Password *</Label>
              <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Gender</Label>
            <Select value={form.gender || NO_SELECTION} onValueChange={(v) => setForm({ ...form, gender: v === NO_SELECTION ? "" : v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_SELECTION}>—</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Roll no</Label>
            <Input value={form.rollNo} onChange={(e) => setForm({ ...form, rollNo: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Department</Label>
            <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Year</Label>
            <Select value={form.year || NO_SELECTION} onValueChange={(v) => setForm({ ...form, year: v === NO_SELECTION ? "" : v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_SELECTION}>—</SelectItem>
                {["I", "II", "III", "IV"].map((y) => (
                  <SelectItem key={y} value={y}>{y} Year</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Section</Label>
            <Select value={form.section || NO_SELECTION} onValueChange={(v) => setForm({ ...form, section: v === NO_SELECTION ? "" : v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_SELECTION}>—</SelectItem>
                {["A", "B", "C"].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Route</Label>
            <Select
              value={form.routeNumber || NO_SELECTION}
              onValueChange={(v) => setForm({ ...form, routeNumber: v === NO_SELECTION ? "" : v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_SELECTION}>— No route —</SelectItem>
                {routes.map((r) => (
                  <SelectItem key={r.id} value={String(r.routeNumber)}>
                    Route {r.routeNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Boarding stop</Label>
            <Input value={form.boardingStop} onChange={(e) => setForm({ ...form, boardingStop: e.target.value })} />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3">
          <div>
            <p className="text-sm font-bold text-foreground">Student Bus Admin</p>
            <p className="text-[11px] text-muted-foreground">Bus admins assist faculty with attendance on the bus.</p>
          </div>
          <Switch
            checked={form.isBusAdmin}
            onCheckedChange={(v) => setForm({ ...form, isBusAdmin: v })}
            className="data-[state=checked]:bg-[#1a237e]"
          />
        </div>
      </FormDialog>

      <DeleteConfirm
        open={deleting !== null}
        onOpenChange={(o) => { if (!o) setDeleting(null); }}
        title="Delete this student?"
        description={`${deleting?.name} (${deleting?.email}) will be removed along with their account.`}
        onConfirm={() => { if (deleting) deleteMutation.mutate(deleting.id); }}
        deleting={deleteMutation.isPending}
      />
    </>
  );
}