import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Truck } from "lucide-react";
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
import { DriverStatusBadge } from "@/components/admin/AdminBadges";
import type { Driver, DriverStatus, Paginated } from "@/types/faculty";

interface DriverForm {
  id: string | null;
  driverCode: string;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  experienceYears: string;
  address: string;
}

const EMPTY: DriverForm = {
  id: null,
  driverCode: "",
  name: "",
  phone: "",
  licenseNumber: "",
  licenseExpiry: "",
  experienceYears: "",
  address: "",
};

export default function AdminDriversPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<DriverForm>(EMPTY);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusDialogDriver, setStatusDialogDriver] = useState<Driver | null>(null);
  const [newStatus, setNewStatus] = useState<DriverStatus>("ACTIVE");

  const driversQuery = useQuery({
    queryKey: ["admin-drivers"],
    queryFn: () => api.get<Paginated<Driver>>("/admin/drivers?page=1&limit=100"),
  });

  const busesQuery = useQuery({
    queryKey: ["admin-buses"],
    queryFn: () => api.get<Paginated<import("@/types/faculty").BusInfo>>("/admin/buses?page=1&limit=100"),
  });

  const createMutation = useMutation({
    mutationFn: (f: DriverForm) =>
      api.post<Driver>("/admin/drivers", {
        driverCode: f.driverCode,
        name: f.name,
        phone: f.phone || null,
        licenseNumber: f.licenseNumber,
        licenseExpiry: f.licenseExpiry || null,
        experienceYears: f.experienceYears === "" ? null : Number(f.experienceYears),
        address: f.address || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-drivers"] });
      setDialogOpen(false);
      setForm(EMPTY);
      toast.success("Driver created");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not create driver"),
  });

  const updateMutation = useMutation({
    mutationFn: (f: DriverForm) =>
      api.patch<Driver>(`/admin/drivers/${f.id}`, {
        driverCode: f.driverCode,
        name: f.name,
        phone: f.phone || null,
        licenseNumber: f.licenseNumber,
        licenseExpiry: f.licenseExpiry || null,
        experienceYears: f.experienceYears === "" ? null : Number(f.experienceYears),
        address: f.address || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-drivers"] });
      setDialogOpen(false);
      setForm(EMPTY);
      toast.success("Driver updated");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update driver"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: DriverStatus }) =>
      api.patch(`/admin/drivers/${id}/status`, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-drivers"] });
      setStatusDialogDriver(null);
      toast.success("Driver status updated");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update status"),
  });

  if (driversQuery.isLoading || busesQuery.isLoading) return <PageSkeleton rows={6} />;
  if (driversQuery.isError || busesQuery.isError) {
    return <PageError message="Could not load driver data." onRetry={() => { void driversQuery.refetch(); void busesQuery.refetch(); }} />;
  }

  const drivers = driversQuery.data!.data;
  const buses = busesQuery.data!.data;

  const openCreate = () => {
    setForm(EMPTY);
    setDialogOpen(true);
  };
  const openEdit = (d: Driver) => {
    setForm({
      id: d.id,
      driverCode: d.driverCode,
      name: d.name,
      phone: d.phone ?? "",
      licenseNumber: d.licenseNumber ?? "",
      licenseExpiry: d.licenseExpiry ?? "",
      experienceYears: d.experienceYears == null ? "" : String(d.experienceYears),
      address: d.address ?? "",
    });
    setDialogOpen(true);
  };
  const openStatusDialog = (d: Driver) => {
    setStatusDialogDriver(d);
    setNewStatus(d.status);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Driver name is required.");
      return;
    }
    if (!form.id) {
      createMutation.mutate(form);
    } else {
      updateMutation.mutate(form);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

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
                    <TableHead>Code</TableHead>
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
                      <TableCell className="text-xs text-muted-foreground">{d.driverCode}</TableCell>
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
                        {d.assignedBus ? (
                          <span className="text-xs font-semibold">
                            {d.assignedBus.busNumber} · {d.assignedBus.registrationNumber}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <button
                          className="cursor-pointer bg-transparent border-none p-0"
                          onClick={() => openStatusDialog(d)}
                          title="Change status"
                        >
                          <DriverStatusBadge status={d.status} />
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(d)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
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
        description={form.id ? "Update driver details." : "Register a new driver in the roster."}
        onSave={handleSave}
        saving={isSaving}
        saveLabel="Save Driver"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Driver code *</Label>
            <Input value={form.driverCode} onChange={(e) => setForm({ ...form, driverCode: e.target.value })} placeholder="e.g. DRV001" />
          </div>
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
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Address</Label>
          <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address" />
        </div>
      </FormDialog>

      <FormDialog
        open={statusDialogDriver !== null}
        onOpenChange={(o) => { if (!o) setStatusDialogDriver(null); }}
        title="Change Driver Status"
        description={`Update status for ${statusDialogDriver?.name ?? ""}`}
        onSave={() => {
          if (statusDialogDriver) {
            statusMutation.mutate({ id: statusDialogDriver.id, status: newStatus });
          }
        }}
        saving={statusMutation.isPending}
        saveLabel="Update Status"
      >
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</Label>
          <Select value={newStatus} onValueChange={(v) => setNewStatus(v as DriverStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="ON_LEAVE">On Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FormDialog>
    </>
  );
}
