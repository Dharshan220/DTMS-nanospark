import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bus, Pencil, Plus, Trash2, UserRound } from "lucide-react";
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
import { AdminBusStatusBadge } from "@/components/admin/AdminBadges";
import type { BusInfo, Driver, ServerBusStatus } from "@/types/faculty";

interface BusForm {
  id: string | null;
  routeNumber: string;
  vehicleNumber: string;
  capacity: string;
  status: ServerBusStatus;
  driverId: string | null;
}

/** Radix Select forbids empty-string item values; use a sentinel for "no driver". */
const NO_DRIVER = "__none__";

const EMPTY: BusForm = { id: null, routeNumber: "", vehicleNumber: "", capacity: "60", status: "active", driverId: null };

export default function AdminBusesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<BusForm>(EMPTY);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<BusInfo | null>(null);

  const busesQuery = useQuery({
    queryKey: ["admin-buses"],
    queryFn: () => api.get<{ items: BusInfo[]; total: number }>("/buses"),
  });
  const driversQuery = useQuery({
    queryKey: ["admin-drivers"],
    queryFn: () => api.get<{ items: Driver[]; total: number }>("/drivers"),
  });

  const saveMutation = useMutation({
    mutationFn: (f: BusForm) => {
      const payload: Record<string, unknown> = {
        routeNumber: f.routeNumber,
        vehicleNumber: f.vehicleNumber,
        capacity: Number(f.capacity) || 60,
        status: f.status,
      };
      if (f.id) {
        if (f.driverId) {
          return api.put(`/drivers/${f.driverId}/assign-bus`, { busId: f.id }).then(() => api.put(`/buses/${f.id}`, payload));
        }
        return api.put(`/buses/${f.id}`, payload);
      }
      return api.post("/buses", payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-buses"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-drivers"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setDialogOpen(false);
      setForm(EMPTY);
      toast.success("Bus saved");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not save bus"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`/buses/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-buses"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-drivers"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setDeleting(null);
      toast.success("Bus deleted");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not delete bus"),
  });

  if (busesQuery.isLoading || driversQuery.isLoading) return <PageSkeleton rows={6} />;
  if (busesQuery.isError || driversQuery.isError) {
    return <PageError message="Could not load bus data." onRetry={() => { void busesQuery.refetch(); void driversQuery.refetch(); }} />;
  }

  const buses = busesQuery.data!.items;
  const drivers = driversQuery.data!.items;

  const openCreate = () => {
    setForm(EMPTY);
    setDialogOpen(true);
  };
  const openEdit = (bus: BusInfo) => {
    setForm({
      id: bus.id,
      routeNumber: String(bus.routeNumber),
      vehicleNumber: bus.vehicleNumber,
      capacity: String(bus.capacity ?? 60),
      status: bus.status,
      driverId: drivers.find((d) => d.assignedBusId === bus.id)?.id ?? null,
    });
    setDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Buses"
        description="Manage the transport fleet — assign drivers, set status and capacity."
        actions={
          <Button className="gap-2 bg-[#1a237e] text-white hover:bg-[#283593]" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Bus
          </Button>
        }
      />

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
            <Bus className="h-4 w-4 text-[#1a237e]" />
            Fleet ({buses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {buses.length === 0 ? (
            <EmptyState message="No buses yet. Add your first bus." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buses.map((bus) => (
                    <TableRow key={bus.id}>
                      <TableCell className="font-bold">Route {bus.routeNumber}</TableCell>
                      <TableCell>{bus.vehicleNumber}</TableCell>
                      <TableCell>
                        {bus.driverName ? (
                          <span className="flex items-center gap-1.5">
                            <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
                            {bus.driverName}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>{bus.capacity ?? 60}</TableCell>
                      <TableCell><AdminBusStatusBadge status={bus.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(bus)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleting(bus)}
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
        title={form.id ? `Edit Bus — Route ${form.routeNumber}` : "Add Bus"}
        description={form.id ? "Update fleet details and driver assignment." : "Register a new bus in the fleet."}
        onSave={() => {
          if (!form.routeNumber.trim() || !form.vehicleNumber.trim()) {
            toast.error("Route number and vehicle number are required.");
            return;
          }
          saveMutation.mutate(form);
        }}
        saving={saveMutation.isPending}
        saveLabel="Save Bus"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Route number *</Label>
            <Input
              value={form.routeNumber}
              onChange={(e) => setForm({ ...form, routeNumber: e.target.value })}
              placeholder="e.g. 25"
              inputMode="numeric"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Vehicle number *</Label>
            <Input
              value={form.vehicleNumber}
              onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
              placeholder="e.g. TN 21 AB 1234"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Capacity</Label>
            <Input
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              inputMode="numeric"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ServerBusStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Assign driver
          </Label>
          <Select
            value={form.driverId ?? NO_DRIVER}
            onValueChange={(v) => setForm({ ...form, driverId: v === NO_DRIVER ? null : v })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_DRIVER}>— No driver —</SelectItem>
              {drivers.map((d) => (
                <SelectItem key={d.id} value={d.id} disabled={d.assignedBusId !== null && d.assignedBusId !== form.id}>
                  {d.name}
                  {d.assignedBusId && d.assignedBusId !== form.id ? " (already assigned)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Assigning a driver frees the driver from any previous bus.
          </p>
        </div>
      </FormDialog>

      <DeleteConfirm
        open={deleting !== null}
        onOpenChange={(o) => { if (!o) setDeleting(null); }}
        title="Delete this bus?"
        description={`Route ${deleting?.routeNumber} · ${deleting?.vehicleNumber} will be removed from the fleet.`}
        onConfirm={() => { if (deleting) deleteMutation.mutate(deleting.id); }}
        deleting={deleteMutation.isPending}
      />
    </>
  );
}