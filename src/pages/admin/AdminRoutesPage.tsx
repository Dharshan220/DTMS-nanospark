import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Pencil, Plus, Route, Trash2 } from "lucide-react";
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
import type { RouteInfo, BusStop, Paginated } from "@/types/faculty";

interface BackendRouteStop {
  id: string;
  routeId: string;
  busStopId: string;
  stopOrder: number;
  estimatedArrivalTime: string | null;
  busStop: BusStop;
  createdAt: string;
  updatedAt: string;
}

interface RouteForm {
  id: string | null;
  routeCode: string;
  routeName: string;
  description: string;
}

const EMPTY: RouteForm = { id: null, routeCode: "", routeName: "", description: "" };

export default function AdminRoutesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<RouteForm>(EMPTY);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deactivating, setDeactivating] = useState<RouteInfo | null>(null);

  const routesQuery = useQuery({
    queryKey: ["admin-routes"],
    queryFn: () => api.get<Paginated<RouteInfo>>("/admin/routes?page=1&limit=100"),
  });

  const routeStopsQuery = useQuery({
    queryKey: ["admin-route-stops"],
    queryFn: () =>
      Promise.all(
        (routesQuery.data?.data ?? []).map((r) =>
          api.get<BackendRouteStop[]>(`/admin/routes/${r.id}/stops`).catch(() => [] as BackendRouteStop[])
        )
      ),
    enabled: routesQuery.isSuccess && (routesQuery.data?.data.length ?? 0) > 0,
  });

  const saveMutation = useMutation({
    mutationFn: async (f: RouteForm) => {
      if (f.id) {
        return api.patch(`/admin/routes/${f.id}`, {
          routeName: f.routeName,
          description: f.description || undefined,
        });
      }
      return api.post("/admin/routes", {
        routeCode: f.routeCode,
        routeName: f.routeName,
        description: f.description || undefined,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-routes"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-route-stops"] });
      setDialogOpen(false);
      setForm(EMPTY);
      toast.success("Route saved");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not save route"),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/routes/${id}/status`, { status: "INACTIVE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-routes"] });
      setDeactivating(null);
      toast.success("Route deactivated");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not deactivate route"),
  });

  if (routesQuery.isLoading) return <PageSkeleton rows={6} />;
  if (routesQuery.isError) {
    return <PageError message="Could not load routes." onRetry={() => void routesQuery.refetch()} />;
  }

  const routes = routesQuery.data!.data;
  const stopsByRoute = new Map<string, BackendRouteStop[]>();
  if (routeStopsQuery.data) {
    routes.forEach((r, i) => {
      stopsByRoute.set(r.id, routeStopsQuery.data[i] ?? []);
    });
  }

  const openCreate = () => {
    setForm({ ...EMPTY });
    setDialogOpen(true);
  };
  const openEdit = (r: RouteInfo) => {
    setForm({
      id: r.id,
      routeCode: r.routeCode,
      routeName: r.routeName,
      description: r.description ?? "",
    });
    setDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Routes"
        description="Manage bus routes, their codes and boarding stops."
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
                    <TableHead>Route Code</TableHead>
                    <TableHead>Route Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Stops</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routes.map((r) => {
                    const routeStops = stopsByRoute.get(r.id) ?? [];
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-bold">{r.routeCode}</TableCell>
                        <TableCell>{r.routeName}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {r.description || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex max-w-[280px] flex-wrap gap-1">
                            {routeStops.slice(0, 4).map((rs) => (
                              <Badge key={rs.id} variant="outline" className="border-[#1a237e]/20 bg-[#1a237e]/5 text-[#1a237e]">
                                <MapPin className="mr-1 h-3 w-3" />
                                {rs.busStop?.name ?? "Stop"}
                              </Badge>
                            ))}
                            {routeStops.length > 4 ? (
                              <Badge variant="outline">+{routeStops.length - 4} more</Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={r.status === "ACTIVE" ? "default" : "secondary"}
                            className={r.status === "ACTIVE"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                            }
                          >
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(r)} title="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {r.status === "ACTIVE" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeactivating(r)}
                                title="Deactivate"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={form.id ? `Edit Route — ${form.routeCode}` : "Add Route"}
        description="Define route code, name and optional description."
        onSave={() => {
          if (!form.routeName.trim()) {
            toast.error("Route name is required.");
            return;
          }
          if (!form.id && !form.routeCode.trim()) {
            toast.error("Route code is required.");
            return;
          }
          saveMutation.mutate(form);
        }}
        saving={saveMutation.isPending}
        saveLabel="Save Route"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {!form.id && (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Route code *</Label>
              <Input value={form.routeCode} onChange={(e) => setForm({ ...form, routeCode: e.target.value })} placeholder="e.g. R001" />
            </div>
          )}
          <div className={`space-y-1.5 ${form.id ? "sm:col-span-2" : ""}`}>
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Route name *</Label>
            <Input value={form.routeName} onChange={(e) => setForm({ ...form, routeName: e.target.value })} placeholder="e.g. City Center Loop" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Description</Label>
          <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
        </div>
      </FormDialog>

      <FormDialog
        open={deactivating !== null}
        onOpenChange={(o) => { if (!o) setDeactivating(null); }}
        title="Deactivate Route"
        description={`Set "${deactivating?.routeCode} — ${deactivating?.routeName}" to inactive?`}
        onSave={() => { if (deactivating) deactivateMutation.mutate(deactivating.id); }}
        saving={deactivateMutation.isPending}
        saveLabel="Deactivate"
      >
        <p className="text-sm text-muted-foreground">
          This route will be marked as inactive and will no longer appear in active listings.
        </p>
      </FormDialog>
    </>
  );
}
