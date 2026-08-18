import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, MapPin, Pencil, Plus, Route, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import PageHeader from "@/components/faculty/PageHeader";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import type { RouteInfo } from "@/types/faculty";

interface StopRow {
  name: string;
  time: string;
}

interface RouteForm {
  id: string | null;
  routeNumber: string;
  vehicleNumber: string;
  arrivalTime: string;
  boardingPoints: StopRow[];
}

const EMPTY: RouteForm = { id: null, routeNumber: "", vehicleNumber: "", arrivalTime: "8:05 AM", boardingPoints: [] };

export default function AdminRoutesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<RouteForm>(EMPTY);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<RouteInfo | null>(null);

  const routesQuery = useQuery({
    queryKey: ["admin-routes"],
    queryFn: () => api.get<{ items: RouteInfo[]; total: number }>("/transport"),
  });

  const saveMutation = useMutation({
    mutationFn: (f: RouteForm) => {
      const payload = {
        routeNumber: f.routeNumber,
        vehicleNumber: f.vehicleNumber,
        arrivalTime: f.arrivalTime,
        boardingPoints: f.boardingPoints,
      };
      if (f.id) return api.put(`/transport/${f.id}`, payload);
      return api.post("/transport", payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-routes"] });
      setDialogOpen(false);
      setForm(EMPTY);
      toast.success("Route saved");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not save route"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`/transport/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-routes"] });
      setDeleting(null);
      toast.success("Route deleted");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not delete route"),
  });

  if (routesQuery.isLoading) return <PageSkeleton rows={6} />;
  if (routesQuery.isError) {
    return <PageError message="Could not load routes." onRetry={() => void routesQuery.refetch()} />;
  }

  const routes = routesQuery.data!.items;

  const openCreate = () => {
    setForm({ ...EMPTY, boardingPoints: [{ name: "", time: "" }] });
    setDialogOpen(true);
  };
  const openEdit = (r: RouteInfo) => {
    setForm({
      id: r.id,
      routeNumber: String(r.routeNumber),
      vehicleNumber: r.vehicleNumber ?? "",
      arrivalTime: r.arrivalTime ?? "8:05 AM",
      boardingPoints: (r.boardingPoints ?? []).map((p) => ({ name: p.name, time: p.time })),
    });
    setDialogOpen(true);
  };

  const setStop = (i: number, patch: Partial<StopRow>) => {
    setForm((f) => ({
      ...f,
      boardingPoints: f.boardingPoints.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }));
  };

  return (
    <>
      <PageHeader
        title="Routes"
        description="Manage bus routes, arrival times and boarding point schedules."
        actions={
          <Button className="gap-2 bg-[#1a237e] text-white hover:bg-[#283593]" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Route
          </Button>
        }
      />

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
            <Route className="h-4 w-4 text-[#1a237e]" />
            Routes ({routes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {routes.length === 0 ? (
            <EmptyState message="No routes yet. Add your first route." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Arrival</TableHead>
                    <TableHead>Boarding Points</TableHead>
                    <TableHead>Stops</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routes.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-bold">Route {r.routeNumber}</TableCell>
                      <TableCell>{r.vehicleNumber || "—"}</TableCell>
                      <TableCell>{r.arrivalTime ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex max-w-[280px] flex-wrap gap-1">
                          {(r.boardingPoints ?? []).slice(0, 4).map((p) => (
                            <Badge key={p.name} variant="outline" className="border-[#1a237e]/20 bg-[#1a237e]/5 text-[#1a237e]">
                              <MapPin className="mr-1 h-3 w-3" />
                              {p.name}
                            </Badge>
                          ))}
                          {(r.boardingPoints ?? []).length > 4 ? (
                            <Badge variant="outline">+{(r.boardingPoints ?? []).length - 4} more</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{r.stops?.length ?? (r.boardingPoints ?? []).length}</TableCell>
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
        title={form.id ? `Edit Route — ${form.routeNumber}` : "Add Route"}
        description="Boarding points are listed in the order the bus visits them."
        onSave={() => {
          if (!form.routeNumber.trim()) {
            toast.error("Route number is required.");
            return;
          }
          const stops = form.boardingPoints.filter((s) => s.name.trim());
          if (stops.length === 0) {
            toast.error("Add at least one boarding point.");
            return;
          }
          saveMutation.mutate({ ...form, boardingPoints: stops });
        }}
        saving={saveMutation.isPending}
        saveLabel="Save Route"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Route number *</Label>
            <Input value={form.routeNumber} onChange={(e) => setForm({ ...form, routeNumber: e.target.value })} inputMode="numeric" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Vehicle number</Label>
            <Input value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">College arrival</Label>
            <Input value={form.arrivalTime} onChange={(e) => setForm({ ...form, arrivalTime: e.target.value })} placeholder="8:05 AM" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Boarding points (in order)
            </Label>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setForm((f) => ({ ...f, boardingPoints: [...f.boardingPoints, { name: "", time: "" }] }))}
            >
              <Plus className="h-3 w-3" /> Add stop
            </Button>
          </div>
          {form.boardingPoints.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-5 text-center text-[11px] font-bold text-muted-foreground">{i + 1}.</span>
              <Input
                value={s.name}
                onChange={(e) => setStop(i, { name: e.target.value })}
                placeholder="Stop name"
                className="flex-1"
              />
              <Input
                value={s.time}
                onChange={(e) => setStop(i, { time: e.target.value })}
                placeholder="8:15 AM"
                className="w-28"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                onClick={() => setForm((f) => ({ ...f, boardingPoints: f.boardingPoints.filter((_, idx) => idx !== i) }))}
                title="Remove stop"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            Stops are saved in the order listed here.
          </p>
        </div>
      </FormDialog>

      <DeleteConfirm
        open={deleting !== null}
        onOpenChange={(o) => { if (!o) setDeleting(null); }}
        title="Delete this route?"
        description={`Route ${deleting?.routeNumber} with ${(deleting?.boardingPoints ?? []).length} boarding points will be removed.`}
        onConfirm={() => { if (deleting) deleteMutation.mutate(deleting.id); }}
        deleting={deleteMutation.isPending}
      />
    </>
  );
}