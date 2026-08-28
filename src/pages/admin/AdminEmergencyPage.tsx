import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, MapPin, Phone, Siren, UserRound } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import PageHeader from "@/components/faculty/PageHeader";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EmergencyStatusBadge,
  EmergencyTypeBadge,
} from "@/components/admin/AdminBadges";
import { formatDateTime, formatRelative } from "@/lib/faculty";
import type { EmergencyReport, EmergencyStatus, Paginated } from "@/types/faculty";

const TRANSPORT_OFFICE_PHONE = "9962022222";

export default function AdminEmergencyPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<EmergencyStatus | "active" | "all">("active");
  const [response, setResponse] = useState("");
  const [target, setTarget] = useState<EmergencyReport | null>(null);

  const query = useQuery({
    queryKey: ["admin-emergencies"],
    queryFn: () => api.get<Paginated<EmergencyReport>>("/admin/emergency?page=1&limit=100"),
    refetchInterval: 20000,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => api.patch<EmergencyReport>(`/admin/emergency/${id}/acknowledge`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-emergencies"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setTarget(null);
      setResponse("");
      toast.success("Emergency acknowledged");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not acknowledge emergency"),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, resolutionNote }: { id: string; resolutionNote?: string }) =>
      api.patch<EmergencyReport>(`/admin/emergency/${id}/resolve`, { resolutionNote }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-emergencies"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setTarget(null);
      setResponse("");
      toast.success("Emergency resolved");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not resolve emergency"),
  });

  if (query.isLoading) return <PageSkeleton rows={6} />;
  if (query.isError) {
    return <PageError message="Could not load emergency reports." onRetry={() => void query.refetch()} />;
  }

  const items = query.data!.data;
  const visible = items.filter((e) => {
    if (filter === "all") return true;
    if (filter === "active") return e.status === "ACTIVE" || e.status === "ACKNOWLEDGED";
    return e.status === filter;
  });

  const activeCount = items.filter((e) => e.status === "ACTIVE" || e.status === "ACKNOWLEDGED").length;

  const getReporterName = (e: EmergencyReport) => e.student?.name ?? e.faculty?.name ?? "Unknown";
  const getBusLabel = (e: EmergencyReport) => e.bus ? `Bus ${e.bus.busNumber}` : "Bus —";

  return (
    <>
      <PageHeader
        title="Emergency / SOS"
        description={`${activeCount} open emergencies — acknowledge, respond and resolve them.`}
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
          <p className="text-2xl font-extrabold text-red-700">{items.filter((e) => e.status === "ACTIVE").length}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Acknowledged</p>
          <p className="text-2xl font-extrabold text-amber-700">{items.filter((e) => e.status === "ACKNOWLEDGED").length}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-green-700">Resolved</p>
          <p className="text-2xl font-extrabold text-green-700">{items.filter((e) => e.status === "RESOLVED").length}</p>
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
                        {getBusLabel(e)}
                      </span>
                      <EmergencyTypeBadge type={e.type} />
                      <EmergencyStatusBadge status={e.status} />
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {formatRelative(e.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{e.message}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground/80">
                      <span className="flex items-center gap-1">
                        <UserRound className="h-3 w-3" /> {getReporterName(e)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {e.latitude != null && e.longitude != null ? `${e.latitude}, ${e.longitude}` : "Location not shared"}
                      </span>
                      <span>{formatDateTime(e.createdAt)}</span>
                    </div>
                    {e.resolutionNote ? (
                      <p className="mt-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-900">
                        <span className="font-bold">Response:</span> {e.resolutionNote}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {e.status === "ACTIVE" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
                        onClick={() => acknowledgeMutation.mutate(e.id)}
                        disabled={acknowledgeMutation.isPending}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Acknowledge
                      </Button>
                    ) : null}
                    {e.status !== "RESOLVED" && e.status !== "CANCELLED" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-green-300 text-green-700 hover:bg-green-50"
                        onClick={() => { setTarget(e); setResponse(""); }}
                        disabled={resolveMutation.isPending}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                      </Button>
                    ) : null}
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
            disabled={resolveMutation.isPending || !target}
            onClick={() => { if (target) resolveMutation.mutate({ id: target.id, resolutionNote: response.trim() || undefined }); }}
          >
            Mark Resolved
          </Button>
        </CardContent>
      </Card>

      {target && target.status !== "RESOLVED" && target.status !== "CANCELLED" ? (
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
                {getBusLabel(target)} · {target.message}
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
                  disabled={resolveMutation.isPending}
                  onClick={() => resolveMutation.mutate({ id: target.id, resolutionNote: response.trim() || undefined })}
                >
                  {resolveMutation.isPending ? "Saving…" : "Mark Resolved"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}
