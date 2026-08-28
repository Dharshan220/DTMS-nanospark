import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MessageSquareWarning } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import PageHeader from "@/components/faculty/PageHeader";
import { PageError, PageSkeleton } from "@/components/faculty/DataState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ComplaintStatusBadge } from "@/components/faculty/Badges";
import { formatDateTime } from "@/lib/faculty";
import type { Complaint, ComplaintStatus } from "@/types/faculty";

const STATUS_OPTIONS: Record<ComplaintStatus, { label: string; next: ComplaintStatus[] }> = {
  OPEN: { label: "Open", next: ["IN_REVIEW", "REJECTED"] },
  IN_REVIEW: { label: "In Review", next: ["RESOLVED", "REJECTED"] },
  RESOLVED: { label: "Resolved", next: [] },
  REJECTED: { label: "Rejected", next: [] },
};

export default function AdminComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ComplaintStatus | "">("");
  const [resolutionNote, setResolutionNote] = useState("");

  const query = useQuery({
    queryKey: ["admin-complaint", id],
    queryFn: () => api.get<Complaint>(`/admin/complaints/${id}`),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { status?: ComplaintStatus; resolutionNote?: string }) =>
      api.patch<Complaint>(`/admin/complaints/${id}`, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-complaint", id] });
      void queryClient.invalidateQueries({ queryKey: ["admin-complaints"] });
      setStatus("");
      setResolutionNote("");
      toast.success("Complaint updated");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update complaint"),
  });

  if (query.isLoading) return <PageSkeleton rows={6} />;
  if (query.isError) {
    return <PageError message="Could not load this complaint." onRetry={() => void query.refetch()} />;
  }

  const c = query.data!;
  const allowedStatuses = STATUS_OPTIONS[c.status]?.next ?? [];

  return (
    <>
      <PageHeader
        title="Complaint Details"
        description="Review the complaint, update its status and reply to the student."
        actions={
          <Button asChild variant="outline" className="gap-2">
            <Link to="/admin/complaints">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 text-sm font-extrabold">
              <MessageSquareWarning className="h-4 w-4 text-[#1a237e]" />
              {c.category}
              <ComplaintStatusBadge status={c.status} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm leading-relaxed">
              {c.description}
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Student</p>
                <p className="mt-0.5 font-bold">{c.student?.name ?? "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Register no</p>
                <p className="mt-0.5 font-bold">{c.student?.registerNumber ?? "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Route</p>
                <p className="mt-0.5 font-bold">{c.route?.routeCode ? `Route ${c.route.routeCode}` : "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Submitted</p>
                <p className="mt-0.5 font-bold">{formatDateTime(c.createdAt)}</p>
              </div>
            </div>
            {c.resolutionNote ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-green-700">Admin response</p>
                <p className="mt-1 text-sm text-green-900">{c.resolutionNote}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-extrabold">Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  New status
                </Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as ComplaintStatus)}
                  disabled={allowedStatuses.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={allowedStatuses.length === 0 ? "No status changes available" : "Select status"} />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedStatuses.map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_OPTIONS[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Response to student
                </Label>
                <Textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  rows={3}
                  placeholder="Optional reply that the student will see…"
                />
              </div>
              <Button
                className="w-full gap-2 bg-[#1a237e] text-white hover:bg-[#283593]"
                disabled={updateMutation.isPending || (!status && !resolutionNote.trim())}
                onClick={() => {
                  if (!status && !resolutionNote.trim()) return;
                  const payload: { status?: ComplaintStatus; resolutionNote?: string } = {};
                  if (status) payload.status = status as ComplaintStatus;
                  if (resolutionNote.trim()) payload.resolutionNote = resolutionNote.trim();
                  updateMutation.mutate(payload);
                }}
              >
                {updateMutation.isPending ? "Saving…" : "Save Update"}
              </Button>
              <p className="text-[11px] text-muted-foreground">
                The student is notified automatically.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-extrabold">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priority</span>
                <span className="font-bold uppercase">{c.priority}</span>
              </div>
              {c.bus && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bus</span>
                  <span className="font-bold">Bus {c.bus.busNumber}</span>
                </div>
              )}
              {c.driver && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Driver</span>
                  <span className="font-bold">{c.driver.name}</span>
                </div>
              )}
              {c.busStop && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bus Stop</span>
                  <span className="font-bold">{c.busStop.name}</span>
                </div>
              )}
              {c.resolvedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolved at</span>
                  <span className="font-bold">{formatDateTime(c.resolvedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
