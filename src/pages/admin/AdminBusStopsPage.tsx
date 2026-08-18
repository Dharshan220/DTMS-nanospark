import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
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
import type { RouteInfo } from "@/types/faculty";

export default function AdminBusStopsPage() {
  const queryClient = useQueryClient();
  const [routeId, setRouteId] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [newTime, setNewTime] = useState("");

  const routesQuery = useQuery({
    queryKey: ["admin-routes"],
    queryFn: () => api.get<{ items: RouteInfo[]; total: number }>("/transport"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, boardingPoints }: { id: string; boardingPoints: { name: string; time: string }[] }) =>
      api.put(`/transport/${id}`, { boardingPoints }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-routes"] });
      toast.success("Bus stops updated");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update stops"),
  });

  if (routesQuery.isLoading) return <PageSkeleton rows={6} />;
  if (routesQuery.isError) {
    return <PageError message="Could not load bus stops." onRetry={() => void routesQuery.refetch()} />;
  }

  const routes = routesQuery.data!.items;
  const selected = routes.find((r) => r.id === routeId) ?? routes[0];

  const allStops = new Map<string, { routes: number[]; times: string[] }>();
  for (const r of routes) {
    for (const p of r.boardingPoints ?? []) {
      const entry = allStops.get(p.name) ?? { routes: [], times: [] };
      entry.routes.push(r.routeNumber);
      entry.times.push(p.time);
      allStops.set(p.name, entry);
    }
  }

  const stops = selected ? (selected.boardingPoints ?? []) : [];

  const saveStops = (next: { name: string; time: string }[]) => {
    if (!selected) return;
    const cleaned = next.filter((s) => s.name.trim());
    if (cleaned.length === 0) {
      toast.error("A route must keep at least one stop.");
      return;
    }
    updateMutation.mutate({ id: selected.id, boardingPoints: cleaned });
  };

  return (
    <>
      <PageHeader
        title="Bus Stops"
        description="View every stop across routes and manage the stops of each route."
      />

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
            <MapPin className="h-4 w-4 text-[#1a237e]" />
            All Bus Stops ({allStops.size})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allStops.size === 0 ? (
            <EmptyState message="No bus stops defined yet." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stop</TableHead>
                    <TableHead>Served Routes</TableHead>
                    <TableHead>Pickup Times</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...allStops.entries()]
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([name, info]) => (
                      <TableRow key={name}>
                        <TableCell className="font-bold">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-[#1a237e]" />
                            {name}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {info.routes.map((rn) => (
                              <Badge key={rn} variant="outline" className="border-[#1a237e]/20 bg-[#1a237e]/5 text-[#1a237e]">
                                Route {rn}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{info.times.join(" · ")}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
            <Clock className="h-4 w-4 text-[#1a237e]" />
            Manage Stops — Route {selected ? selected.routeNumber : "—"}
          </CardTitle>
          <Select value={selected?.id ?? ""} onValueChange={setRouteId}>
            <SelectTrigger className="max-w-xs"><SelectValue placeholder="Select route" /></SelectTrigger>
            <SelectContent>
              {routes.map((r) => (
                <SelectItem key={r.id} value={r.id}>Route {r.routeNumber} · {r.vehicleNumber || "no vehicle"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selected ? (
            <EmptyState message="No routes to manage." />
          ) : (
            <>
              <div className="space-y-2">
                {stops.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 text-center text-[11px] font-bold text-muted-foreground">{i + 1}.</span>
                    <Input
                      defaultValue={s.name}
                      className="flex-1"
                      onBlur={(e) => {
                        const name = e.target.value.trim();
                        if (name && name !== s.name) {
                          saveStops(stops.map((st, idx) => (idx === i ? { ...st, name } : st)));
                        }
                      }}
                    />
                    <Input
                      defaultValue={s.time}
                      className="w-28"
                      onBlur={(e) => {
                        const time = e.target.value.trim();
                        if (time && time !== s.time) {
                          saveStops(stops.map((st, idx) => (idx === i ? { ...st, time } : st)));
                        }
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => saveStops(stops.filter((_, idx) => idx !== i))}
                      title="Remove stop"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex items-end gap-2 border-t border-border pt-4">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">New stop name</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Anna Salai" />
                </div>
                <div className="w-28 space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Time</Label>
                  <Input value={newTime} onChange={(e) => setNewTime(e.target.value)} placeholder="8:20 AM" />
                </div>
                <Button
                  className="gap-2 bg-[#1a237e] text-white hover:bg-[#283593]"
                  onClick={() => {
                    if (!newName.trim()) {
                      toast.error("Enter a stop name.");
                      return;
                    }
                    saveStops([...stops, { name: newName.trim(), time: newTime.trim() || "—" }]);
                    setNewName("");
                    setNewTime("");
                  }}
                >
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Pencil className="h-3 w-3" />
                Edit a stop's name or time inline, then click away to save.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}