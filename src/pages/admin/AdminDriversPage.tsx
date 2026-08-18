import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, Truck } from "lucide-react";
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
import { DriverStatusBadge } from "@/components/admin/AdminBadges";
import type { BusInfo, Driver, DriverStatus } from "@/types/faculty";

interface DriverForm {
  id: string | null;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  experienceYears: string;
  status: DriverStatus;
  assignedBusId: string | null;
}

const EMPTY: DriverForm = {
  id: null,
  name: "",
  phone: "",
  licenseNumber: "",
  licenseExpiry: "",
  experienceYears: "",
  status: "active",
  assignedBusId: null,
};

/** Radix Select forbids empty-string item values; use a sentinel for "no bus". */
const NO_BUS = "__none__";

export default function AdminDriversPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<DriverForm>(EMPTY);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<Driver | null>(null);

  const driversQuery = useQuery({
    queryKey: ["admin-drivers"],
    queryFn: () => api.get<{ items: Driver[]; total: number }>("/drivers"),
  });
  const busesQuery = useQuery({
    queryKey: ["admin-buses"],
    queryFn: () => api.get<{ items: BusInfo[]; total: number }>("/buses"),
  });

  const saveMutation = useMutation({
    mutationFn: (f: DriverForm) => {
      const payload = {
        name: f.name,
        phone: f.phone || null,
        licenseNumber: f.licenseNumber || null,
        licenseExpiry: f.licenseExpiry || null,
        experienceYears: f.experienceYears === "" ? null : Number(f.experienceYears),
        status: f.status,
      };
      if (f.id) {
        return api.put<{ driver: Driver }>(`/drivers/${f.id}`, payload).then(async (r) => {
          if (f.assignedBusId !== r.driver.assignedBusId) {
            return api.put(`/drivers/${f.id}/assign-bus`, { busId: f.assignedBusId });
          }
          return r;
        });
      }
      return api.post<{ driver: Driver }>("/drivers", { ...payload, assignedBusId: f.assignedBusId });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-drivers"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-buses"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setDialogOpen(false);
      setForm(EMPTY);
      toast.success("Driver saved");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not save driver"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`/drivers/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-drivers"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-buses"] });
      setDeleting(null);
      toast.success("Driver deleted");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not delete driver"),
  });

  if (driversQuery.isLoading || busesQuery.isLoading) return <PageSkeleton rows={6} />;
  if (driversQuery.isError || busesQuery.isError) {
    return <PageError message="Could not load driver data." onRetry={() => { void driversQuery.refetch(); void busesQuery.refetch(); }} />;
  }

  const drivers = driversQuery.data!.items;
  const buses = busesQuery.data!.items;
  const freeBuses = buses.filter((b) => !drivers.some((d) => d.assignedBusId === b.id));

  const openCreate = () => {
    setForm(EMPTY);
    setDialogOpen(true);
  };
  const openEdit = (d: Driver) => {
    setForm({
      id: d.id,
      name: d.name,
      phone: d.phone ?? "",
      licenseNumber: d.licenseNumber ?? "",
      licenseExpiry: d.licenseExpiry ?? "",
      experienceYears: d.experienceYears == null ? "" : String(d.experienceYears),
      status: d.status,
      assignedBusId: d.assignedBusId,
    });
    setDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Drivers"
        description="Manage driver records, licences and bus assignments."
        actions={
          <Button className="gap-2 bg-[#1a237e] text-white hover:bg-[#283593]" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Driver
          </Button>
        }
      />

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
            <Truck className="h-4 w-4 text-[#1a237e]" />
            Drivers ({drivers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {drivers.length === 0 ? (
            <EmptyState message="No drivers yet. Add your first driver." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Assigned Bus</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-bold">{d.name}</TableCell>
                      <TableCell>{d.phone ?? "—"}</TableCell>
                      <TableCell>
                        <span className="block text-xs">{d.licenseNumber ?? "—"}</span>
                        <span className="block text-[11px] text-muted-foreground">
                          {d.licenseExpiry ? `valid till ${d.licenseExpiry}` : ""}
                        </span>
                      </TableCell>
                      <TableCell>{d.experienceYears != null ? `${d.experienceYears} yrs` : "—"}</TableCell>
                      <TableCell>
                        {d.assignedBusId ? (
                          <span className="text-xs font-semibold">
                            Route {d.assignedBusRoute} · {d.assignedVehicle}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell><DriverStatusBadge status={d.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(d)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleting(d)}
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
        title={form.id ? "Edit Driver" : "Add Driver"}
        description={form.id ? "Update driver details and bus assignment." : "Register a new driver in the roster."}
        onSave={() => {
          if (!form.name.trim()) {
            toast.error("Driver name is required.");
            return;
          }
          saveMutation.mutate(form);
        }}
        saving={saveMutation.isPending}
        saveLabel="Save Driver"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Full name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Palani S" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">License number</Label>
            <Input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">License expiry</Label>
            <Input type="date" value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Experience (years)</Label>
            <Input
              value={form.experienceYears}
              onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
              inputMode="numeric"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as DriverStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Assigned bus
          </Label>
          <Select
            value={form.assignedBusId ?? NO_BUS}
            onValueChange={(v) => setForm({ ...form, assignedBusId: v === NO_BUS ? null : v })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_BUS}>— No bus —</SelectItem>
              {buses
                .filter((b) => {
                  const owner = drivers.find((d) => d.assignedBusId === b.id);
                  return !owner || owner.id === form.id;
                })
                .map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    Route {b.routeNumber} · {b.vehicleNumber}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            {freeBuses.length} buses currently unassigned. Assigning moves the bus to this driver.
          </p>
        </div>
      </FormDialog>

      <DeleteConfirm
        open={deleting !== null}
        onOpenChange={(o) => { if (!o) setDeleting(null); }}
        title="Remove this driver?"
        description={`${deleting?.name} will be removed from the roster and their bus freed.`}
        onConfirm={() => { if (deleting) deleteMutation.mutate(deleting.id); }}
        deleting={deleteMutation.isPending}
      />
    </>
  );
}