import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, Wrench } from "lucide-react";
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
import { MaintenanceStatusBadge } from "@/components/admin/AdminBadges";
import { formatDate } from "@/lib/faculty";
import type { BusInfo, MaintenanceRecord, MaintenanceStatus } from "@/types/faculty";

const MAINTENANCE_TYPES = ["routine", "repair", "service", "insurance", "fitness", "other"];

interface MaintForm {
  id: string | null;
  busId: string;
  type: string;
  serviceDate: string;
  nextServiceDate: string;
  description: string;
  cost: string;
  status: MaintenanceStatus;
}

const EMPTY: MaintForm = {
  id: null,
  busId: "",
  type: "routine",
  serviceDate: new Date().toISOString().slice(0, 10),
  nextServiceDate: "",
  description: "",
  cost: "",
  status: "scheduled",
};

export default function AdminMaintenancePage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<MaintForm>(EMPTY);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<MaintenanceRecord | null>(null);

  const recordsQuery = useQuery({
    queryKey: ["admin-maintenance"],
    queryFn: () => api.get<{ items: MaintenanceRecord[]; total: number }>("/maintenance"),
  });
  const busesQuery = useQuery({
    queryKey: ["admin-buses"],
    queryFn: () => api.get<{ items: BusInfo[]; total: number }>("/buses"),
  });

  const saveMutation = useMutation({
    mutationFn: (f: MaintForm) => {
      const payload = {
        busId: f.busId,
        type: f.type,
        serviceDate: f.serviceDate,
        nextServiceDate: f.nextServiceDate || null,
        description: f.description || null,
        cost: f.cost === "" ? null : Number(f.cost),
        status: f.status,
      };
      if (f.id) return api.put(`/maintenance/${f.id}`, payload);
      return api.post("/maintenance", payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-maintenance"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setDialogOpen(false);
      setForm(EMPTY);
      toast.success("Maintenance record saved");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not save record"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`/maintenance/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-maintenance"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setDeleting(null);
      toast.success("Maintenance record deleted");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not delete record"),
  });

  if (recordsQuery.isLoading || busesQuery.isLoading) return <PageSkeleton rows={6} />;
  if (recordsQuery.isError || busesQuery.isError) {
    return <PageError message="Could not load maintenance data." onRetry={() => { void recordsQuery.refetch(); void busesQuery.refetch(); }} />;
  }

  const records = recordsQuery.data!.items;
  const buses = busesQuery.data!.items;

  const openCreate = () => {
    setForm({ ...EMPTY, busId: buses[0]?.id ?? "" });
    setDialogOpen(true);
  };
  const openEdit = (r: MaintenanceRecord) => {
    setForm({
      id: r.id,
      busId: r.busId,
      type: r.type,
      serviceDate: r.serviceDate,
      nextServiceDate: r.nextServiceDate ?? "",
      description: r.description ?? "",
      cost: r.cost == null ? "" : String(r.cost),
      status: r.status,
    });
    setDialogOpen(true);
  };

  const totalCost = records.reduce((s, r) => s + (r.cost ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Maintenance"
        description="Track servicing, repairs and compliance for every bus."
        actions={
          <Button className="gap-2 bg-[#1a237e] text-white hover:bg-[#283593]" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Record
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#1a237e]/20 bg-[#1a237e]/5 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#1a237e]">Total records</p>
          <p className="text-2xl font-extrabold text-[#1a237e]">{records.length}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Open (scheduled / in progress)</p>
          <p className="text-2xl font-extrabold text-amber-700">
            {records.filter((r) => r.status !== "completed").length}
          </p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-green-700">Spent (₹)</p>
          <p className="text-2xl font-extrabold text-green-700">{totalCost.toLocaleString("en-IN")}</p>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
            <Wrench className="h-4 w-4 text-[#1a237e]" />
            Maintenance Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <EmptyState message="No maintenance records yet." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bus</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Service Date</TableHead>
                    <TableHead>Next Service</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-bold">
                        {r.routeNumber ? `Route ${r.routeNumber}` : "Bus"}
                        {r.busNumber ? ` · ${r.busNumber}` : ""}
                      </TableCell>
                      <TableCell className="capitalize">{r.type}</TableCell>
                      <TableCell className="text-xs">{formatDate(r.serviceDate)}</TableCell>
                      <TableCell className="text-xs">{r.nextServiceDate ? formatDate(r.nextServiceDate) : "—"}</TableCell>
                      <TableCell>{r.cost != null ? `₹${r.cost.toLocaleString("en-IN")}` : "—"}</TableCell>
                      <TableCell><MaintenanceStatusBadge status={r.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(r)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleting(r)}
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
        title={form.id ? "Edit Maintenance Record" : "Add Maintenance Record"}
        description="Record a service or repair for a bus in the fleet."
        onSave={() => {
          if (!form.busId || !form.serviceDate) {
            toast.error("Bus and service date are required.");
            return;
          }
          saveMutation.mutate(form);
        }}
        saving={saveMutation.isPending}
        saveLabel="Save Record"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Bus *</Label>
            <Select value={form.busId} onValueChange={(v) => setForm({ ...form, busId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {buses.map((b) => (
                  <SelectItem key={b.id} value={b.id}>Route {b.routeNumber} · {b.vehicleNumber}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MAINTENANCE_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Service date *</Label>
            <Input type="date" value={form.serviceDate} onChange={(e) => setForm({ ...form, serviceDate: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Next service date</Label>
            <Input type="date" value={form.nextServiceDate} onChange={(e) => setForm({ ...form, nextServiceDate: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Cost (₹)</Label>
            <Input value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} inputMode="numeric" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as MaintenanceStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Description</Label>
          <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      </FormDialog>

      <DeleteConfirm
        open={deleting !== null}
        onOpenChange={(o) => { if (!o) setDeleting(null); }}
        title="Delete maintenance record?"
        description={`The ${deleting?.type} record for ${deleting?.routeNumber ? `Route ${deleting.routeNumber}` : "this bus"} will be removed.`}
        onConfirm={() => { if (deleting) deleteMutation.mutate(deleting.id); }}
        deleting={deleteMutation.isPending}
      />
    </>
  );
}