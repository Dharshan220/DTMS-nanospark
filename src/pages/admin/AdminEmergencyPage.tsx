import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, MapPin, Phone, Siren, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import PageHeader from "@/components/faculty/PageHeader";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DeleteConfirm from "@/components/admin/DeleteConfirm";
import {
  EmergencyStatusBadge,
  EmergencyTypeBadge,
} from "@/components/admin/AdminBadges";
import { formatDateTime, formatRelative } from "@/lib/faculty";
import type { EmergencyReport, EmergencyStatus } from "@/types/faculty";

const TRANSPORT_OFFICE_PHONE = "9962022222";

export default function AdminEmergencyPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<EmergencyStatus | "active" | "all">("active");
  const [response, setResponse] = useState("");
  const [target, setTarget] = useState<EmergencyReport | null>(null);
  const [deleting, setDeleting] = useState<EmergencyReport | null>(null);

  const query = useQuery({
    queryKey: ["admin-emergencies"],
    queryFn: () => api.get<{ items: EmergencyReport[]; total: number; activeCount: number; active: EmergencyReport[] }>("/emergencies"),
    refetchInterval: 20000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: EmergencyStatus }) =>
      api.put<{ emergency: EmergencyReport }>(`/emergencies/${id}`, {
        status,
        ...(response.trim() ? { response: response.trim() } : {}),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-emergencies"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setTarget(null);
      setResponse("");
      toast.success("Emergency updated");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update emergency"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`/emergencies/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-emergencies"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setDeleting(null);
      toast.success("Emergency report deleted");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not delete report"),
  });

  if (query.isLoading) return <PageSkeleton rows={6} />;
  if (query.isError) {
    return <PageError message="Could not load emergency reports." onRetry={() => void query.refetch()} />;
  }

  const items = query.data!.items;
  const visible = items.filter((e) => {
    if (filter === "all") return true;
    if (filter === "active") return e.status === "active" || e.status === "acknowledged";
    return e.status === filter;
  });

  const respond = (e: EmergencyReport, status: EmergencyStatus) => {
    setTarget(e);
    setResponse(status === "resolved" ? (e.adminResponse ?? "") : "");
    updateMutation.mutate({ id: e.id, status });
  };

  return (
    <>
      <PageHeader
        title="Emergency / SOS"
        description={`${query.data!.activeCount} open emergencies — acknowledge, respond and resolve them.`}
        actions={
          <a
            href={`tel:${TRANSPORT_OFFICE_PHONE}`}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
          >
            <Phone className="h-4 w-4" />
            Transport Office · {TRANSPORT_OFFICE_PHONE}
          </a>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-red-700">Active</p>
          <p className="text-2xl font-extrabold text-red-700">{items.filter((e) => e.status === "active").length}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Acknowledged</p>
          <p className="text-2xl font-extrabold text-amber-700">{items.filter((e) => e.status === "acknowledged").length}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-green-700">Resolved</p>
          <p className="text-2xl font-extrabold text-green-700">{items.filter((e) => e.status === "resolved").length}</p>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
            <Siren className="h-4 w-4 text-[#1a237e]" />
            Emergency Reports ({items.length})
          </CardTitle>
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Open (active + ack)</SelectItem>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {visible.length === 0 ? (
            <EmptyState message="No emergency reports in this view. All clear." />
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((e) => (
                <li key={e.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-extrabold text-foreground">
                        {e.busNumber ? `Bus ${e.busNumber}` : "Bus —"}
                      </span>
                      <EmergencyTypeBadge type={e.type} />
                      <EmergencyStatusBadge status={e.status} />
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {formatRelative(e.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{e.description}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground/80">
                      <span className="flex items-center gap-1">
                        <UserRound className="h-3 w-3" /> {e.reportedByName}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {e.location ?? "Location not shared"}
                      </span>
                      <span>{formatDateTime(e.createdAt)}</span>
                    </div>
                    {e.adminResponse ? (
                      <p className="mt-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-900">
                        <span className="font-bold">Response:</span> {e.adminResponse}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {e.status === "active" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
                        onClick={() => respond(e, "acknowledged")}
                        disabled={updateMutation.isPending}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Acknowledge
                      </Button>
                    ) : null}
                    {e.status !== "resolved" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-green-300 text-green-700 hover:bg-green-50"
                        onClick={() => setTarget(e)}
                        disabled={updateMutation.isPending}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleting(e)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-amber-200 shadow-card">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="text-sm font-extrabold text-foreground">Resolve with a response</p>
            <p className="text-xs text-muted-foreground">
              Optionally attach a written response before marking the emergency resolved.
            </p>
          </div>
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={2}
            placeholder="Response for the faculty (optional)…"
            className="flex-1"
          />
          <Button
            className="gap-2 bg-[#1a237e] text-white hover:bg-[#283593]"
            disabled={updateMutation.isPending || !target}
            onClick={() => { if (target) updateMutation.mutate({ id: target.id, status: "resolved" }); }}
          >
            Mark Resolved
          </Button>
        </CardContent>
      </Card>

      <DeleteConfirm
        open={deleting !== null}
        onOpenChange={(o) => { if (!o) setDeleting(null); }}
        title="Delete emergency report?"
        description={`The ${deleting?.type} report for ${deleting?.busNumber ?? "unknown bus"} will be removed.`}
        onConfirm={() => { if (deleting) deleteMutation.mutate(deleting.id); }}
        deleting={deleteMutation.isPending}
      />

      {target && target.status !== "resolved" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setTarget(null)}>
          <Card className="w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
                <Siren className="h-4 w-4 text-[#1a237e]" />
                Resolve Emergency
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                {target.busNumber ?? "Bus —"} · {target.description}
              </p>
              <Textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={3}
                placeholder="Write the response the faculty will see (optional)…"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setTarget(null)}>Cancel</Button>
                <Button
                  className="gap-2 bg-green-600 text-white hover:bg-green-700"
                  disabled={updateMutation.isPending}
                  onClick={() => updateMutation.mutate({ id: target.id, status: "resolved" })}
                >
                  {updateMutation.isPending ? "Saving…" : "Mark Resolved"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}