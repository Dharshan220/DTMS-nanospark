import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Route } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import PageHeader from "@/components/faculty/PageHeader";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { RouteInfo } from "@/types/faculty";

export default function AdminSchedulesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<{ route: RouteInfo; field: "arrivalTime" | "stop"; index?: number; value: string } | null>(null);

  const query = useQuery({
    queryKey: ["admin-routes"],
    queryFn: () => api.get<{ items: RouteInfo[]; total: number }>("/transport"),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; arrivalTime?: string; boardingPoints?: { name: string; time: string }[] }) =>
      api.put(`/transport/${payload.id}`, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-routes"] });
      setEditing(null);
      toast.success("Schedule updated");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update schedule"),
  });

  if (query.isLoading) return <PageSkeleton rows={6} />;
  if (query.isError) {
    return <PageError message="Could not load schedules." onRetry={() => void query.refetch()} />;
  }

  const routes = query.data!.items;

  const changeStopTime = (route: RouteInfo, index: number, time: string) => {
    const points = (route.boardingPoints ?? []).map((p, i) => (i === index ? { ...p, time } : p));
    updateMutation.mutate({ id: route.id, boardingPoints: points });
  };

  return (
    <>
      <PageHeader
        title="Schedules"
        description="College arrival times and boarding-point schedules for every route."
      />

      {routes.length === 0 ? (
        <Card className="shadow-card"><CardContent><EmptyState message="No routes defined yet." /></CardContent></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {routes.map((r) => (
            <Card key={r.id} className="shadow-card">
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2 text-sm font-extrabold">
                  <Route className="h-4 w-4 text-[#1a237e]" />
                  Route {r.routeNumber}
                  <Badge variant="outline" className="border-[#1a237e]/20 bg-[#1a237e]/5 text-[#1a237e]">
                    {r.vehicleNumber || "No vehicle"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-[#1a237e]/20 bg-[#1a237e]/5 px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    College arrival
                  </span>
                  <div className="flex items-center gap-2">
                    {editing?.route.id === r.id && editing.field === "arrivalTime" ? (
                      <>
                        <Input
                          value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          className="w-28"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              updateMutation.mutate({ id: r.id, arrivalTime: editing.value.trim() });
                            }
                          }}
                        />
                        <Button size="sm" onClick={() => updateMutation.mutate({ id: r.id, arrivalTime: editing.value.trim() })}>
                          Save
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex items-center gap-1.5 font-extrabold text-[#1a237e]">
                          <Clock className="h-4 w-4" /> {r.arrivalTime ?? "—"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditing({ route: r, field: "arrivalTime", value: r.arrivalTime ?? "" })}
                        >
                          Edit
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <ul className="divide-y divide-border">
                  {(r.boardingPoints ?? []).map((p, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 py-2">
                      <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1a237e] text-[10px] font-bold text-white">
                          {i + 1}
                        </span>
                        {p.name}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                        {editing?.route.id === r.id && editing.field === "stop" && editing.index === i ? (
                          <>
                            <Input
                              value={editing.value}
                              onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                              className="h-7 w-24"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  changeStopTime(r, i, editing.value.trim());
                                }
                              }}
                            />
                            <Button size="sm" variant="outline" className="h-7" onClick={() => changeStopTime(r, i, editing.value.trim())}>
                              Save
                            </Button>
                          </>
                        ) : (
                          <>
                            <Clock className="h-3.5 w-3.5 text-[#FFD700]" /> {p.time}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => setEditing({ route: r, field: "stop", index: i, value: p.time })}
                            >
                              Edit
                            </Button>
                          </>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-center text-[11px] text-muted-foreground">
        Schedules follow the daily route timings and are editable inline.
      </p>
    </>
  );
}