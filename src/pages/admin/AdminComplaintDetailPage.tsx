import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ImageIcon, MessageSquareWarning, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import PageHeader from "@/components/faculty/PageHeader";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DeleteConfirm from "@/components/admin/DeleteConfirm";
import { ComplaintStatusBadge } from "@/components/faculty/Badges";
import { formatDateTime } from "@/lib/faculty";
import type { Complaint, ComplaintStatus } from "@/types/faculty";

const STATUS_LABELS: Record<ComplaintStatus, string> = {
  pending: "Pending",
  under_review: "Under Review",
  in_progress: "In Progress",
  resolved: "Resolved",
  escalated: "Escalated",
};

export default function AdminComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ComplaintStatus | "">("");
  const [response, setResponse] = useState("");
  const [deleting, setDeleting] = useState(false);

  const query = useQuery({
    queryKey: ["admin-complaint", id],
    queryFn: () => api.get<{ complaint: Complaint }>(`/complaints/${id}`),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { status: ComplaintStatus; response?: string }) =>
      api.put<{ complaint: Complaint }>(`/complaints/${id}/status`, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-complaint", id] });
      void queryClient.invalidateQueries({ queryKey: ["admin-complaints"] });
      setStatus("");
      setResponse("");
      toast.success("Complaint updated");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update complaint"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.del(`/complaints/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-complaints"] });
      toast.success("Complaint deleted");
      window.history.back();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not delete complaint"),
  });

  if (query.isLoading) return <PageSkeleton rows={6} />;
  if (query.isError) {
    return <PageError message="Could not load this complaint." onRetry={() => void query.refetch()} />;
  }

  const c = query.data!.complaint;

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
            {c.imageUrl ? (
              <div>
                <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <ImageIcon className="h-3 w-3" /> Attached photo
                </p>
                <img
                  src={c.imageUrl}
                  alt="Complaint"
                  className="max-h-64 rounded-xl border border-border object-contain"
                />
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Student</p>
                <p className="mt-0.5 font-bold">{c.name}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Roll no</p>
                <p className="mt-0.5 font-bold">{c.studentRollNo ?? "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Route</p>
                <p className="mt-0.5 font-bold">{c.routeNumber ? `Route ${c.routeNumber}` : "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Submitted</p>
                <p className="mt-0.5 font-bold">{formatDateTime(c.createdAt)}</p>
              </div>
            </div>
            {c.studentDepartment || c.studentYear ? (
              <p className="text-[11px] text-muted-foreground">
                {[c.studentDepartment, c.studentYear, c.studentBoardingStop].filter(Boolean).join(" · ")}
              </p>
            ) : null}
            {c.adminResponse ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-green-700">Admin response</p>
                <p className="mt-1 text-sm text-green-900">{c.adminResponse}</p>
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
                <Select value={status} onValueChange={(v) => setStatus(v as ComplaintStatus)}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABELS) as ComplaintStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Response to student
                </Label>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={3}
                  placeholder="Optional reply that the student will see…"
                />
              </div>
              <Button
                className="w-full gap-2 bg-[#1a237e] text-white hover:bg-[#283593]"
                disabled={updateMutation.isPending || (!status && !response.trim())}
                onClick={() => {
                  if (!status && !response.trim()) return;
                  updateMutation.mutate({
                    status: (status || c.status) as ComplaintStatus,
                    ...(response.trim() ? { response: response.trim() } : {}),
                  });
                }}
              >
                {updateMutation.isPending ? "Saving…" : "Save Update"}
              </Button>
              <p className="text-[11px] text-muted-foreground">
                The student is notified automatically. Escalated complaints also alert the transport department.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-extrabold">History</CardTitle>
            </CardHeader>
            <CardContent>
              {c.history.length === 0 ? (
                <EmptyState message="No history yet." />
              ) : (
                <ol className="space-y-3">
                  {c.history.map((h, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${i === c.history.length - 1 ? "bg-[#1a237e]" : "bg-muted-foreground/40"}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold capitalize">{h.status.replace("_", " ")}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {h.byName ?? h.by} · {formatDateTime(h.at)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card className="border-red-200 shadow-card">
            <CardContent className="pt-6">
              <Button
                variant="outline"
                className="w-full gap-2 text-destructive hover:text-destructive"
                onClick={() => setDeleting(true)}
              >
                <Trash2 className="h-4 w-4" /> Delete Complaint
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteConfirm
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete this complaint?"
        description={`The ${c.category} complaint by ${c.name} will be permanently removed.`}
        onConfirm={() => deleteMutation.mutate()}
        deleting={deleteMutation.isPending}
      />
    </>
  );
}