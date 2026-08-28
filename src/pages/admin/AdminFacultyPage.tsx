import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, UserRound } from "lucide-react";
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

interface FacultyListItem {
  id: string;
  userId: string;
  email: string;
  facultyId: string;
  name: string;
  phone: string | null;
  department: string | null;
  designation: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

interface FacultyForm {
  id: string | null;
  name: string;
  email: string;
  phone: string;
  password: string;
  facultyId: string;
  department: string;
  designation: string;
}

const EMPTY: FacultyForm = {
  id: null,
  name: "",
  email: "",
  phone: "",
  password: "",
  facultyId: "",
  department: "",
  designation: "",
};

const NO_SELECTION = "__none__";

export default function AdminFacultyPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FacultyForm>(EMPTY);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deactivating, setDeactivating] = useState<FacultyListItem | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const facultyQuery = useQuery({
    queryKey: ["admin-faculty", search, page],
    queryFn: () =>
      api.get<{ data: FacultyListItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
        `/admin/faculty?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
      ),
  });

  const createMutation = useMutation({
    mutationFn: (f: FacultyForm) =>
      api.post<FacultyListItem>("/admin/faculty", {
        email: f.email,
        password: f.password,
        facultyId: f.facultyId,
        name: f.name,
        phone: f.phone || undefined,
        department: f.department || undefined,
        designation: f.designation || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-faculty"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setDialogOpen(false);
      setForm(EMPTY);
      toast.success("Faculty member created");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not create faculty member"),
  });

  const updateMutation = useMutation({
    mutationFn: (f: FacultyForm) =>
      api.patch<FacultyListItem>(`/admin/faculty/${f.id}`, {
        name: f.name,
        phone: f.phone || undefined,
        department: f.department || undefined,
        designation: f.designation || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-faculty"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setDialogOpen(false);
      setForm(EMPTY);
      toast.success("Faculty member updated");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update faculty member"),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/admin/faculty/${id}/status`, { status: "INACTIVE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-faculty"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setDeactivating(null);
      toast.success("Faculty member deactivated");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not deactivate faculty member"),
  });

  if (facultyQuery.isLoading) return <PageSkeleton rows={6} />;
  if (facultyQuery.isError) {
    return <PageError message="Could not load faculty data." onRetry={() => void facultyQuery.refetch()} />;
  }

  const faculty = facultyQuery.data!.data;
  const pagination = facultyQuery.data!.pagination;

  const openCreate = () => {
    setForm(EMPTY);
    setDialogOpen(true);
  };

  const openEdit = (f: FacultyListItem) => {
    setForm({
      id: f.id,
      name: f.name,
      email: f.email,
      phone: f.phone ?? "",
      password: "",
      facultyId: f.facultyId,
      department: f.department ?? "",
      designation: f.designation ?? "",
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
            Faculty ({pagination.total})
          </CardTitle>
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
                    <TableHead>Faculty ID</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faculty.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-bold">{f.name}</TableCell>
                      <TableCell className="text-xs">{f.email}</TableCell>
                      <TableCell>{f.facultyId}</TableCell>
                      <TableCell>{f.phone ?? "—"}</TableCell>
                      <TableCell>{f.department ?? "—"}</TableCell>
                      <TableCell>{f.designation ?? "—"}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                            f.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {f.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(f)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {f.status === "ACTIVE" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeactivating(f)}
                              title="Deactivate"
                            >
                              Deactivate
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
          {pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
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
          if (!form.id && !form.facultyId.trim()) {
            toast.error("Faculty ID is required.");
            return;
          }
          if (!form.id && form.password.length < 4) {
            toast.error("Password must be at least 4 characters.");
            return;
          }
          if (form.id) {
            updateMutation.mutate(form);
          } else {
            createMutation.mutate(form);
          }
        }}
        saving={createMutation.isPending || updateMutation.isPending}
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
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Faculty ID *</Label>
            <Input
              value={form.facultyId}
              onChange={(e) => setForm({ ...form, facultyId: e.target.value })}
              disabled={!!form.id}
              placeholder="e.g. FAC001"
            />
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
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Department</Label>
            <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Designation</Label>
            <Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="e.g. Professor" />
          </div>
        </div>
      </FormDialog>

      <FormDialog
        open={deactivating !== null}
        onOpenChange={(o) => { if (!o) setDeactivating(null); }}
        title="Deactivate this faculty member?"
        description={`${deactivating?.name} (${deactivating?.email}) will be marked as inactive and will no longer have access.`}
        onSave={() => { if (deactivating) deactivateMutation.mutate(deactivating.id); }}
        saving={deactivateMutation.isPending}
        saveLabel="Deactivate"
      />
    </>
  );
}