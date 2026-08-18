import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, UsersRound } from "lucide-react";
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
import type { PublicUser, ServerRole } from "@/types/faculty";

const ROLE_LABELS: Record<ServerRole, string> = {
  student: "Student",
  teacher: "Faculty",
  parent: "Parent",
  admin: "Super Admin",
};

const ROLES_ORDER: ServerRole[] = ["student", "teacher", "parent"];

interface UserForm {
  id: string | null;
  role: ServerRole;
  name: string;
  email: string;
  phone: string;
  password: string;
  active: boolean;
}

const EMPTY: UserForm = { id: null, role: "student", name: "", email: "", phone: "", password: "", active: true };

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<UserForm>(EMPTY);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<PublicUser | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<ServerRole | "all">("all");

  const usersQuery = useQuery({
    queryKey: ["admin-users", search, roleFilter],
    queryFn: () =>
      api.get<{ items: PublicUser[]; total: number }>(
        `/users?role=${roleFilter === "all" ? "" : roleFilter}&search=${encodeURIComponent(search)}`
      ),
  });

  const saveMutation = useMutation({
    mutationFn: (f: UserForm) => {
      const payload = {
        name: f.name,
        email: f.email,
        phone: f.phone || null,
        active: f.active,
      };
      if (f.id) {
        const rolePayload = f.role === "admin" ? {} : { role: f.role };
        return api.put<{ user: PublicUser }>(`/users/${f.id}`, { ...payload, ...rolePayload });
      }
      return api.post<{ user: PublicUser }>("/users", { ...payload, role: f.role, password: f.password });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setDialogOpen(false);
      setForm(EMPTY);
      toast.success("User saved");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not save user"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`/users/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setDeleting(null);
      toast.success("User deleted");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not delete user"),
  });

  if (usersQuery.isLoading) return <PageSkeleton rows={6} />;
  if (usersQuery.isError) {
    return <PageError message="Could not load users." onRetry={() => void usersQuery.refetch()} />;
  }

  const users = usersQuery.data!.items;
  const grouped = ROLES_ORDER.map((role) => ({
    role,
    items: users.filter((u) => u.role === role),
  }));

  const openCreate = () => {
    setForm(EMPTY);
    setDialogOpen(true);
  };
  const openEdit = (u: PublicUser) => {
    setForm({
      id: u.id,
      role: u.role,
      name: u.name,
      email: u.email,
      phone: u.phone ?? "",
      password: "",
      active: u.active !== false,
    });
    setDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Users & Roles"
        description="Every account in the system — manage roles, access and activity. Super Admin accounts are protected."
        actions={
          <Button className="gap-2 bg-[#1a237e] text-white hover:bg-[#283593]" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add User
          </Button>
        }
      />

      <Card className="shadow-card">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
            <UsersRound className="h-4 w-4 text-[#1a237e]" />
            Accounts ({usersQuery.data!.total})
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {ROLES_ORDER.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              className="w-48"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {users.length === 0 ? (
            <EmptyState message={search ? "No users match your search." : "No accounts yet."} />
          ) : (
            grouped.map((group) =>
              group.items.length === 0 ? null : (
                <div key={group.role}>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    {ROLE_LABELS[group.role]}s · {group.items.length}
                  </p>
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.items.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell>
                              <p className="font-bold">{u.name}</p>
                              <p className="text-[11px] text-muted-foreground">{u.email}</p>
                            </TableCell>
                            <TableCell>{u.phone ?? "—"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-[#1a237e]/20 bg-[#1a237e]/5 text-[#1a237e]">
                                {ROLE_LABELS[u.role]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  u.active === false
                                    ? "border-red-200 bg-red-50 text-red-700"
                                    : "border-green-200 bg-green-50 text-green-700"
                                }
                              >
                                {u.active === false ? "Inactive" : "Active"}
                              </Badge>
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
                </div>
              )
            )
          )}
        </CardContent>
      </Card>

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={form.id ? "Edit User" : "Add User"}
        description={form.id ? "Update the account details, role and access status." : "Create any account — student, faculty or parent."}
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
        saveLabel={form.id ? "Save User" : "Create User"}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Role</Label>
            <Select
              value={form.role}
              onValueChange={(v) => setForm({ ...form, role: v as ServerRole })}
              disabled={form.id === "admin"}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES_ORDER.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Full name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Email *</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" />
          </div>
          {!form.id ? (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Password *</Label>
              <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" />
            </div>
          ) : null}
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3">
          <div>
            <p className="text-sm font-bold text-foreground">Account active</p>
            <p className="text-[11px] text-muted-foreground">Inactive accounts cannot log in.</p>
          </div>
          <Switch
            checked={form.active}
            onCheckedChange={(v) => setForm({ ...form, active: v })}
            className="data-[state=checked]:bg-[#1a237e]"
          />
        </div>
      </FormDialog>

      <DeleteConfirm
        open={deleting !== null}
        onOpenChange={(o) => { if (!o) setDeleting(null); }}
        title="Delete this account?"
        description={`${deleting?.name} (${deleting?.email}) will be permanently removed. This cannot be undone.`}
        onConfirm={() => { if (deleting) deleteMutation.mutate(deleting.id); }}
        deleting={deleteMutation.isPending}
      />
    </>
  );
}