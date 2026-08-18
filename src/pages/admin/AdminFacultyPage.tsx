import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import PageHeader from "@/components/faculty/PageHeader";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface FacultyForm {
  id: string | null;
  name: string;
  email: string;
  phone: string;
  password: string;
  gender: string;
  department: string;
  routeNumber: string;
}

const EMPTY: FacultyForm = {
  id: null,
  name: "",
  email: "",
  phone: "",
  password: "",
  gender: "",
  department: "",
  routeNumber: "",
};

/** Radix Select forbids empty-string item values; use a sentinel for "no selection". */
const NO_SELECTION = "__none__";

export default function AdminFacultyPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FacultyForm>(EMPTY);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<PublicUser | null>(null);
  const [search, setSearch] = useState("");

  const facultyQuery = useQuery({
    queryKey: ["admin-faculty", search],
    queryFn: () => api.get<{ items: PublicUser[]; total: number }>(`/users?role=teacher&search=${encodeURIComponent(search)}`),
  });
  const routesQuery = useQuery({
    queryKey: ["admin-routes"],
    queryFn: () => api.get<{ items: RouteInfo[]; total: number }>("/transport"),
  });

  const saveMutation = useMutation({
    mutationFn: (f: FacultyForm) => {
      const payload = {
        name: f.name,
        email: f.email,
        phone: f.phone || null,
        gender: f.gender || null,
        department: f.department || null,
        routeNumber: f.routeNumber === "" ? null : Number(f.routeNumber),
      };
      if (f.id) {
        return api.put<{ user: PublicUser }>(`/users/${f.id}`, payload);
      }
      return api.post<{ user: PublicUser }>("/users", { ...payload, role: "teacher", password: f.password });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-faculty"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setDialogOpen(false);
      setForm(EMPTY);
      toast.success("Faculty member saved");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not save faculty member"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`/users/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-faculty"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setDeleting(null);
      toast.success("Faculty member deleted");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not delete faculty member"),
  });

  if (facultyQuery.isLoading || routesQuery.isLoading) return <PageSkeleton rows={6} />;
  if (facultyQuery.isError || routesQuery.isError) {
    return <PageError message="Could not load faculty data." onRetry={() => { void facultyQuery.refetch(); void routesQuery.refetch(); }} />;
  }

  const faculty = facultyQuery.data!.items;
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
      department: u.department ?? "",
      routeNumber: u.routeNumber == null ? "" : String(u.routeNumber),
    });
    setDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Faculty"
        description="Manage faculty accounts and their assigned bus routes."
        actions={
          <Button className="gap-2 bg-[#1a237e] text-white hover:bg-[#283593]" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Faculty
          </Button>
        }
      />

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
            <UserRound className="h-4 w-4 text-[#1a237e]" />
            Faculty ({facultyQuery.data!.total})
          </CardTitle>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          {faculty.length === 0 ? (
            <EmptyState message={search ? "No faculty match your search." : "No faculty yet. Add your first faculty member."} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Assigned Route</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faculty.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-bold">{u.name}</TableCell>
                      <TableCell className="text-xs">{u.email}</TableCell>
                      <TableCell>{u.phone ?? "—"}</TableCell>
                      <TableCell>{u.department ?? "—"}</TableCell>
                      <TableCell>{u.routeNumber ? `Route ${u.routeNumber}` : "—"}</TableCell>
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
        title={form.id ? "Edit Faculty" : "Add Faculty"}
        description={form.id ? "Update the faculty member's details." : "Create a faculty account with login credentials."}
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
        saveLabel={form.id ? "Save Faculty" : "Create Faculty"}
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
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Department</Label>
            <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Assigned route</Label>
            <Select value={form.routeNumber || NO_SELECTION} onValueChange={(v) => setForm({ ...form, routeNumber: v === NO_SELECTION ? "" : v })}>
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
        </div>
      </FormDialog>

      <DeleteConfirm
        open={deleting !== null}
        onOpenChange={(o) => { if (!o) setDeleting(null); }}
        title="Delete this faculty member?"
        description={`${deleting?.name} (${deleting?.email}) will be removed along with their account.`}
        onConfirm={() => { if (deleting) deleteMutation.mutate(deleting.id); }}
        deleting={deleteMutation.isPending}
      />
    </>
  );
}