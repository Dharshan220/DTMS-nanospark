import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, ShieldCheck, Trash2, Users } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { BusInfo, BusStop, RouteInfo } from "@/types/faculty";

interface StudentListItem {
  id: string;
  userId: string;
  email: string;
  registerNumber: string;
  name: string;
  phone: string | null;
  department: string | null;
  year: string | null;
  section: string | null;
  gender: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

interface StudentForm {
  id: string | null;
  name: string;
  email: string;
  phone: string;
  password: string;
  gender: string;
  registerNumber: string;
  year: string;
  section: string;
  department: string;
}

const EMPTY: StudentForm = {
  id: null,
  name: "",
  email: "",
  phone: "",
  password: "",
  gender: "",
  registerNumber: "",
  year: "",
  section: "",
  department: "",
};

interface TransportForm {
  studentId: string | null;
  studentName: string;
  busId: string;
  busStopId: string;
  startDate: string;
}

const EMPTY_TRANSPORT: TransportForm = {
  studentId: null,
  studentName: "",
  busId: "",
  busStopId: "",
  startDate: "",
};

/** Radix Select forbids empty-string item values; use a sentinel for "no selection". */
const NO_SELECTION = "__none__";

export default function AdminStudentsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<StudentForm>(EMPTY);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<StudentListItem | null>(null);
  const [search, setSearch] = useState("");

  const [transportForm, setTransportForm] = useState<TransportForm>(EMPTY_TRANSPORT);
  const [transportDialogOpen, setTransportDialogOpen] = useState(false);

  const studentsQuery = useQuery({
    queryKey: ["admin-students", search],
    queryFn: () =>
      api.get<{ data: StudentListItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
        `/admin/students?limit=100&search=${encodeURIComponent(search)}`
      ),
  });

  const busesQuery = useQuery({
    queryKey: ["admin-buses"],
    queryFn: () =>
      api.get<{ data: BusInfo[]; pagination: { total: number } }>("/admin/buses?limit=100"),
  });

  const busStopsQuery = useQuery({
    queryKey: ["admin-bus-stops"],
    queryFn: () =>
      api.get<{ data: BusStop[]; pagination: { total: number } }>("/admin/bus-stops?limit=100"),
  });

  const saveMutation = useMutation({
    mutationFn: (f: StudentForm) => {
      if (f.id) {
        return api.patch<{ id: string }>(`/admin/students/${f.id}`, {
          name: f.name,
          phone: f.phone || null,
          gender: f.gender || null,
          registerNumber: f.registerNumber || null,
          year: f.year || null,
          section: f.section || null,
          department: f.department || null,
        });
      }
      return api.post<{ id: string }>("/admin/students", {
        email: f.email,
        password: f.password,
        registerNumber: f.registerNumber,
        name: f.name,
        phone: f.phone || null,
        gender: f.gender || null,
        year: f.year || null,
        section: f.section || null,
        department: f.department || null,
      });
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

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "INACTIVE" }) =>
      api.patch(`/admin/students/${id}/status`, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setDeleting(null);
      toast.success("Student deactivated");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update student status"),
  });

  const transportMutation = useMutation({
    mutationFn: (f: TransportForm) =>
      api.post(`/admin/students/${f.studentId}/transport`, {
        busId: f.busId,
        busStopId: f.busStopId,
        startDate: f.startDate || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      setTransportDialogOpen(false);
      setTransportForm(EMPTY_TRANSPORT);
      toast.success("Transport assigned");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not assign transport"),
  });

  if (studentsQuery.isLoading || busesQuery.isLoading || busStopsQuery.isLoading) return <PageSkeleton rows={6} />;
  if (studentsQuery.isError || busesQuery.isError || busStopsQuery.isError) {
    return (
      <PageError
        message="Could not load students."
        onRetry={() => {
          void studentsQuery.refetch();
          void busesQuery.refetch();
          void busStopsQuery.refetch();
        }}
      />
    );
  }

  const students = studentsQuery.data!.data;
  const totalStudents = studentsQuery.data!.pagination.total;
  const buses = busesQuery.data!.data;
  const busStops = busStopsQuery.data!.data;

  const openCreate = () => {
    setForm(EMPTY);
    setDialogOpen(true);
  };
  const openEdit = (s: StudentListItem) => {
    setForm({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone ?? "",
      password: "",
      gender: s.gender ?? "",
      registerNumber: s.registerNumber ?? "",
      year: s.year ?? "",
      section: s.section ?? "",
      department: s.department ?? "",
    });
    setDialogOpen(true);
  };

  const openTransport = (s: StudentListItem) => {
    setTransportForm({
      studentId: s.id,
      studentName: s.name,
      busId: "",
      busStopId: "",
      startDate: "",
    });
    setTransportDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Students"
        description="Manage student accounts and transport assignments."
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
            Students ({totalStudents})
          </CardTitle>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, register number…"
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
                    <TableHead>Register No</TableHead>
                    <TableHead>Year / Section</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <p className="font-bold">{s.name}</p>
                        <p className="text-[11px] text-muted-foreground">{s.email}</p>
                      </TableCell>
                      <TableCell>{s.registerNumber ?? "—"}</TableCell>
                      <TableCell>
                        {[s.year, s.section].filter(Boolean).join(" / ") || "—"}
                      </TableCell>
                      <TableCell>{s.department ?? "—"}</TableCell>
                      <TableCell>
                        {s.status === "ACTIVE" ? (
                          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(s)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-orange-600 hover:text-orange-700"
                            onClick={() => openTransport(s)}
                            title="Assign Transport"
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </Button>
                          {s.status === "ACTIVE" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleting(s)}
                              title="Deactivate"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
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
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Register number</Label>
            <Input value={form.registerNumber} onChange={(e) => setForm({ ...form, registerNumber: e.target.value })} />
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
        </div>
      </FormDialog>

      <Dialog open={transportDialogOpen} onOpenChange={setTransportDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#1a237e]">Assign Transport</DialogTitle>
            <DialogDescription>
              Assign a bus and boarding stop to {transportForm.studentName}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Bus *</Label>
              <Select
                value={transportForm.busId || NO_SELECTION}
                onValueChange={(v) => setTransportForm({ ...transportForm, busId: v === NO_SELECTION ? "" : v })}
              >
                <SelectTrigger><SelectValue placeholder="Select bus" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SELECTION}>— Select bus —</SelectItem>
                  {buses.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.busNumber ?? b.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Boarding Stop *</Label>
              <Select
                value={transportForm.busStopId || NO_SELECTION}
                onValueChange={(v) => setTransportForm({ ...transportForm, busStopId: v === NO_SELECTION ? "" : v })}
              >
                <SelectTrigger><SelectValue placeholder="Select stop" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SELECTION}>— Select stop —</SelectItem>
                  {busStops.map((bs) => (
                    <SelectItem key={bs.id} value={bs.id}>
                      {bs.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Start date (optional)</Label>
              <Input
                type="date"
                value={transportForm.startDate}
                onChange={(e) => setTransportForm({ ...transportForm, startDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransportDialogOpen(false)} disabled={transportMutation.isPending}>
              Cancel
            </Button>
            <Button
              className="gap-2 bg-[#1a237e] text-white hover:bg-[#283593]"
              onClick={() => {
                if (!transportForm.busId || !transportForm.busStopId) {
                  toast.error("Bus and boarding stop are required.");
                  return;
                }
                transportMutation.mutate(transportForm);
              }}
              disabled={transportMutation.isPending}
            >
              {transportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {transportMutation.isPending ? "Assigning…" : "Assign Transport"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirm
        open={deleting !== null}
        onOpenChange={(o) => { if (!o) setDeleting(null); }}
        title="Deactivate this student?"
        description={`${deleting?.name} (${deleting?.email}) will be marked as inactive and will no longer be able to log in.`}
        onConfirm={() => { if (deleting) statusMutation.mutate({ id: deleting.id, status: "INACTIVE" }); }}
        deleting={statusMutation.isPending}
      />
    </>
  );
}
