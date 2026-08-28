import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bus, Pencil, Plus, UserRound } from "lucide-react";
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
import { AdminBusStatusBadge } from "@/components/admin/AdminBadges";
import type { BusInfo, Driver, ServerBusStatus, Paginated } from "@/types/faculty";

interface BusForm {
  id: string | null;
  busNumber: string;
  registrationNumber: string;
  capacity: string;
  driverId: string | null;
}

/** Radix Select forbids empty-string item values; use a sentinel for "no driver". */
const NO_DRIVER = "__none__";

const EMPTY: BusForm = { id: null, busNumber: "", registrationNumber: "", capacity: "60", driverId: null };

export default function AdminBusesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<BusForm>(EMPTY);
  const [dialogOpen, setDialogOpen] = useState(false);

  const busesQuery = useQuery({
    queryKey: ["admin-buses"],
    queryFn: () => api.get<Paginated<BusInfo>>("/admin/buses?page=1&limit=100"),
  });
  const driversQuery = useQuery({
    queryKey: ["admin-drivers"],
    queryFn: () => api.get<Paginated<Driver>>("/admin/drivers?page=1&limit=100"),
  });

  const saveMutation = useMutation({
    mutationFn: async (f: BusForm) => {
      if (f.id) {
        const payload = {
          busNumber: Number(f.busNumber),
          registrationNumber: f.registrationNumber,
          capacity: Number(f.capacity) || 60,
        };
        await api.patch(`/admin/buses/${f.id}`, payload);

        const currentBus = busesQuery.data?.data.find((b) => b.id === f.id);
        const currentDriverId = currentBus?.driverId ?? null;
        if (f.driverId !== currentDriverId) {
          await api.patch(`/admin/buses/${f.id}/driver`, {
            driverId: f.driverId || null,
          });
        }
      } else {
        const payload = {
          busNumber: Number(f.busNumber),
          registrationNumber: f.registrationNumber,
          capacity: Number(f.capacity) || 60,
          driverId: f.driverId || undefined,
        };
        await api.post("/admin/buses", payload);
      }
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

  if (busesQuery.isLoading || driversQuery.isLoading) return <PageSkeleton rows={6} />;
  if (busesQuery.isError || driversQuery.isError) {
    return <PageError message="Could not load bus data." onRetry={() => { void busesQuery.refetch(); void driversQuery.refetch(); }} />;
  }

  const buses = busesQuery.data!.data;
  const drivers = driversQuery.data!.data;

  const openCreate = () => {
    setForm(EMPTY);
    setDialogOpen(true);
  };
  const openEdit = (bus: BusInfo) => {
    setForm({
      id: bus.id,
      busNumber: String(bus.busNumber),
      registrationNumber: bus.registrationNumber,
      capacity: String(bus.capacity ?? 60),
      driverId: bus.driverId ?? null,
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
                    <TableHead>Bus No.</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buses.map((bus) => (
                    <TableRow key={bus.id}>
                      <TableCell className="font-bold">Bus {bus.busNumber}</TableCell>
                      <TableCell>{bus.registrationNumber}</TableCell>
                      <TableCell>
                        {bus.driver ? (
                          <span className="flex items-center gap-1.5">
                            <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
                            {bus.driver.name}
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
        title={form.id ? `Edit Bus — ${form.busNumber}` : "Add Bus"}
        description={form.id ? "Update fleet details and driver assignment." : "Register a new bus in the fleet."}
        onSave={() => {
          if (!form.busNumber.trim() || !form.registrationNumber.trim()) {
            toast.error("Bus number and registration number are required.");
            return;
          }
          saveMutation.mutate(form);
        }}
        saving={saveMutation.isPending}
        saveLabel="Save Bus"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Bus number *</Label>
            <Input
              value={form.busNumber}
              onChange={(e) => setForm({ ...form, busNumber: e.target.value })}
              placeholder="e.g. 25"
              inputMode="numeric"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Registration number *</Label>
            <Input
              value={form.registrationNumber}
              onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
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
              {drivers.map((d) => {
                const isAssignedToOther = d.assignedBus && d.assignedBus.id !== form.id;
                return (
                  <SelectItem key={d.id} value={d.id} disabled={!!isAssignedToOther}>
                    {d.name}
                    {isAssignedToOther ? ` (assigned to Bus ${d.assignedBus!.busNumber})` : ""}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Assigning a driver frees the driver from any previous bus.
          </p>
        </div>
      </FormDialog>
    </>
  );
}
