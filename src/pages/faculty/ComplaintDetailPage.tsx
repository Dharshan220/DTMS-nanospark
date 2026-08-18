import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronUp,
  GraduationCap,
  ImageIcon,
  MessageSquareWarning,
  Send,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { api, ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/faculty";
import { ComplaintStatusBadge } from "@/components/faculty/Badges";
import PageHeader from "@/components/faculty/PageHeader";
import { PageError, PageSkeleton } from "@/components/faculty/DataState";
import {
  COMPLAINT_STATUSES,
  COMPLAINT_STATUS_LABELS,
  type Complaint,
  type ComplaintStatus,
} from "@/types/faculty";

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState<ComplaintStatus>("pending");
  const [respondOpen, setRespondOpen] = useState(false);

  const detailQuery = useQuery({
    queryKey: ["faculty-complaint", id],
    queryFn: () => api.get<{ complaint: Complaint }>(`/complaints/${id}`),
    enabled: Boolean(id),
  });

  const statusMutation = useMutation({
    mutationFn: (payload: { status: ComplaintStatus; response?: string }) =>
      api.put<{ complaint: Complaint }>(`/complaints/${id}/status`, payload),
    onSuccess: (data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["faculty-complaint", id] });
      void queryClient.invalidateQueries({ queryKey: ["faculty-complaints"] });
      void queryClient.invalidateQueries({ queryKey: ["faculty-notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["faculty-dashboard"] });
      toast.success(
        vars.status === "escalated"
          ? "Complaint escalated to the transport department"
          : `Status updated to ${COMPLAINT_STATUS_LABELS[vars.status]}`
      );
      setResponse("");
      setRespondOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Could not update the complaint");
    },
  });

  if (detailQuery.isLoading) return <PageSkeleton rows={5} />;
  if (detailQuery.isError || !detailQuery.data?.complaint) {
    return (
      <PageError
        message="This complaint could not be found or you do not have permission to view it."
        onRetry={() => void detailQuery.refetch()}
      />
    );
  }

  const c = detailQuery.data.complaint;
  const canAct = true; // route-scoped teachers can always act on visible complaints

  const applyStatus = (next: ComplaintStatus) => {
    if (next === c.status) {
      toast.info(`Already ${COMPLAINT_STATUS_LABELS[next].toLowerCase()}`);
      return;
    }
    statusMutation.mutate({ status: next });
  };

  const submitResponse = () => {
    if (response.trim().length < 3) {
      toast.error("Please write a short response first.");
      return;
    }
    statusMutation.mutate({ status: c.status === "pending" ? "under_review" : c.status, response: response.trim() });
  };

  return (
    <>
      <PageHeader
        title="Complaint Details"
        description={`${c.category} · raised ${formatDateTime(c.createdAt)}`}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate("/faculty/complaints")}>
            <ArrowLeft className="h-4 w-4" />
            Back to complaints
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="shadow-card">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
                <MessageSquareWarning className="h-4 w-4 text-[#1a237e]" />
                Complaint
              </CardTitle>
              <ComplaintStatusBadge status={c.status} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-[#f0c200] bg-[#FFD700]/10 text-[#8a6d00]">
                  {c.category}
                </Badge>
                <Badge variant="outline" className="border-border bg-secondary/50 text-muted-foreground">
                  {c.busVehicleNumber ?? `Route ${c.routeNumber ?? "—"}`}
                </Badge>
                <Badge variant="outline" className="border-border bg-secondary/50 text-muted-foreground">
                  Route {c.routeNumber ?? "—"}
                </Badge>
              </div>
              <p className="whitespace-pre-wrap rounded-xl border border-border bg-secondary/30 p-4 text-sm leading-relaxed text-foreground">
                {c.description}
              </p>
              {c.imageUrl ? (
                <div>
                  <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                    <ImageIcon className="h-3.5 w-3.5" /> Attachment
                  </p>
                  <img
                    src={c.imageUrl}
                    alt="Complaint attachment"
                    className="max-h-64 rounded-xl border border-border object-cover shadow-sm"
                  />
                </div>
              ) : null}

              {c.adminResponse ? (
                <div className="rounded-xl border border-green-200 bg-green-50/70 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-green-700">
                    Response from the panel
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground">{c.adminResponse}</p>
                </div>
              ) : null}

              {canAct && (
                <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-foreground">
                    Take action
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <AlertDialog open={respondOpen} onOpenChange={setRespondOpen}>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" className="bg-[#1a237e] text-white hover:bg-[#283593]">
                          <Send className="h-4 w-4" />
                          Respond
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Respond to {c.name}</AlertDialogTitle>
                          <AlertDialogDescription>
                            Your response is visible to the student and to the transport department.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <Textarea
                          value={response}
                          onChange={(e) => setResponse(e.target.value)}
                          placeholder="Write your response to the student…"
                          rows={4}
                          className="mt-2"
                        />
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => {
                              e.preventDefault();
                              submitResponse();
                            }}
                            disabled={statusMutation.isPending}
                          >
                            Send response
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <Select value={c.status} onValueChange={(v) => applyStatus(v as ComplaintStatus)}>
                      <SelectTrigger className="h-9 w-44 text-xs">
                        <SelectValue placeholder="Change status" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPLAINT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {COMPLAINT_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {c.status !== "escalated" && (
                      <Button size="sm" variant="outline" onClick={() => applyStatus("escalated")} disabled={statusMutation.isPending}>
                        <ShieldAlert className="h-4 w-4 text-red-600" />
                        Escalate
                      </Button>
                    )}
                    {c.status !== "resolved" && (
                      <Button size="sm" variant="outline" onClick={() => applyStatus("resolved")} disabled={statusMutation.isPending}>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Mark Resolved
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Escalated complaints are sent to the transport department for action. Complaints cannot be
                    deleted by faculty — only the transport department may remove them.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
                <ChevronUp className="h-4 w-4 text-[#1a237e]" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-0">
                {(c.historyByName ?? c.history).map((h, i) => (
                  <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
                    {i < (c.historyByName ?? c.history).length - 1 && (
                      <span className="absolute left-[9px] top-5 bottom-0 w-px bg-[#1a237e]/20" />
                    )}
                    <span
                      className={`relative z-10 mt-0.5 h-[18px] w-[18px] shrink-0 rounded-full border-2 border-white ${
                        h.status === "resolved" ? "bg-green-500" : h.status === "escalated" ? "bg-red-500" : "bg-[#1a237e]"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-foreground">
                        {COMPLAINT_STATUS_LABELS[h.status]}
                        <span className="ml-2 font-semibold text-muted-foreground">
                          by {h.byName ?? "Transport Office"}
                        </span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">{formatDateTime(h.at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
                <UserRound className="h-4 w-4 text-[#1a237e]" />
                Student
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <Info label="Name" value={c.name} />
              <Info label="Register number" value={c.studentRollNo ?? "—"} />
              <Info label="Department" value={c.studentDepartment ?? "—"} />
              <Info label="Year" value={c.studentYear ? `Year ${c.studentYear}` : "—"} />
              <Info label="Boarding stop" value={c.studentBoardingStop ?? "—"} />
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
                <GraduationCap className="h-4 w-4 text-[#1a237e]" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <Info label="Category" value={c.category} />
              <Info label="Bus" value={c.busVehicleNumber ?? "—"} />
              <Info label="Route" value={c.routeNumber != null ? `Route ${c.routeNumber}` : "—"} />
              <Info label="Submitted" value={formatDateTime(c.createdAt)} />
              <Info label="Last updated" value={formatDateTime(c.updatedAt)} />
              <Info label="Status" value={COMPLAINT_STATUS_LABELS[c.status]} />
            </CardContent>
          </Card>

          <p className="text-[11px] text-muted-foreground">
            <Link to="/faculty/complaints" className="font-bold text-[#1a237e] hover:underline">
              ← All complaints
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-0">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-right text-xs font-bold text-foreground">{value}</span>
    </div>
  );
}