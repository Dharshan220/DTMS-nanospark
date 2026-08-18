import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Loader2,
  MessageSquareWarning,
  Send,
  ShieldCheck,
  Truck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiError } from "@/lib/api";
import { formatDateTime, initials } from "@/lib/faculty";
import PageHeader from "@/components/faculty/PageHeader";
import StatCard from "@/components/faculty/StatCard";
import { ComplaintStatusBadge } from "@/components/faculty/Badges";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import { COMPLAINT_CATEGORIES, type Complaint } from "@/types/faculty";

const REPORT_OPTIONS = [
  { label: "Bus Issue", description: "Problems with the bus itself", categories: ["Bus Breakdown", "Vehicle Problem", "Seat Damage", "Cleanliness"] },
  { label: "Route Issue", description: "Problems with the route or stops", categories: ["Late Bus", "Bus Delay", "Route Issue", "Bus Stop Issue"] },
  { label: "Safety Issue", description: "Anything that put your safety at risk", categories: ["Safety", "Student Safety", "Driver Issue"] },
  { label: "General / Feedback", description: "Suggestions and other feedback", categories: ["General Complaint", "Suggestion", "Other"] },
];

export default function StudentComplaintsPage() {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [showAllCategories, setShowAllCategories] = useState(false);

  const complaintsQuery = useQuery({
    queryKey: ["student-complaints"],
    queryFn: () => api.get<{ items: Complaint[]; total: number }>("/complaints?limit=100"),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { category: string; description: string }) =>
      api.post<{ complaint: Complaint }>("/complaints", payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["student-complaints"] });
      void queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["student-notifications"] });
      setCategory("");
      setDescription("");
      toast.success("Your report has been submitted to the transport office.");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not submit your report"),
  });

  const complaints = useMemo(() => complaintsQuery.data?.items ?? [], [complaintsQuery.data]);

  const counts = useMemo(() => {
    const c = { total: complaints.length, pending: 0, resolved: 0, inProgress: 0 };
    for (const x of complaints) {
      if (x.status === "pending") c.pending += 1;
      else if (x.status === "resolved") c.resolved += 1;
      else if (x.status === "in_progress" || x.status === "under_review") c.inProgress += 1;
    }
    return c;
  }, [complaints]);

  const submit = () => {
    if (!category) {
      toast.error("Choose a category for your report.");
      return;
    }
    if (description.trim().length < 5) {
      toast.error("Please describe the issue in at least 5 characters.");
      return;
    }
    createMutation.mutate({ category, description: description.trim() });
  };

  if (complaintsQuery.isLoading) return <PageSkeleton rows={6} />;
  if (complaintsQuery.isError) {
    return (
      <PageError
        message="Could not load your reports."
        onRetry={() => void complaintsQuery.refetch()}
      />
    );
  }

  const quickCategories = REPORT_OPTIONS.flatMap((o) => o.categories);

  return (
    <>
      <PageHeader
        title="Complaints & Feedback"
        description="Report a bus, route or safety issue — the transport office will respond to you here."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My Reports" value={counts.total} icon={MessageSquareWarning} />
        <StatCard label="Pending" value={counts.pending} icon={MessageSquareWarning} tone="warning" />
        <StatCard label="In Progress" value={counts.inProgress} icon={MessageSquareWarning} tone="navy" />
        <StatCard label="Resolved" value={counts.resolved} icon={MessageSquareWarning} tone="success" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <Send className="h-4 w-4 text-[#1a237e]" />
              Report an Issue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                What do you want to report?
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_OPTIONS.map((group) => (
                    <div key={group.label}>
                      <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        {group.label}
                      </p>
                      {group.categories
                        .filter((c) => COMPLAINT_CATEGORIES.includes(c as (typeof COMPLAINT_CATEGORIES)[number]))
                        .map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                    </div>
                  ))}
                  {showAllCategories ? (
                    <>
                      <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        More categories
                      </p>
                      {COMPLAINT_CATEGORIES.filter((c) => !quickCategories.includes(c)).map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setShowAllCategories((v) => !v)}
                    className="w-full px-2 py-1.5 text-left text-[11px] font-bold text-[#1a237e] hover:bg-secondary/60"
                  >
                    {showAllCategories ? "Show fewer categories" : "Show all categories…"}
                  </button>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Describe the issue *
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us what happened — the bus number, stop, time, and what went wrong."
                rows={5}
              />
            </div>

            <Button
              className="w-full gap-2 bg-[#1a237e] text-white hover:bg-[#283593]"
              onClick={submit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {createMutation.isPending ? "Submitting…" : "Submit Report"}
            </Button>

            <div className="grid gap-2 sm:grid-cols-2">
              {REPORT_OPTIONS.map((o) => (
                <div key={o.label} className="rounded-xl border border-border bg-secondary/30 px-3 py-2">
                  <p className="flex items-center gap-1.5 text-[11px] font-extrabold text-foreground">
                    {o.label === "Bus Issue" ? (
                      <Truck className="h-3.5 w-3.5 text-[#1a237e]" />
                    ) : o.label === "Safety Issue" ? (
                      <ShieldCheck className="h-3.5 w-3.5 text-[#1a237e]" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-[#1a237e]" />
                    )}
                    {o.label}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{o.description}</p>
                </div>
              ))}
            </div>

            <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
              <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Your report is tracked by the transport office. You can follow its status below —
              submissions cannot be edited or deleted after they are sent.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <MessageSquareWarning className="h-4 w-4 text-[#1a237e]" />
              My Reports ({complaints.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {complaints.length === 0 ? (
              <EmptyState
                message="You haven't submitted any reports yet."
                hint="Use the form to report a bus, route or safety issue."
              />
            ) : (
              <ul className="space-y-3">
                {complaints.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-2xl border border-border bg-secondary/20 p-4 transition hover:bg-secondary/40"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a237e]/10 text-[10px] font-bold text-[#1a237e]">
                        {initials(c.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground">{c.category}</p>
                        <p className="text-[10px] font-semibold text-muted-foreground">
                          Submitted {formatDateTime(c.createdAt)}
                        </p>
                      </div>
                      <ComplaintStatusBadge status={c.status} />
                    </div>
                    <p className="mt-2.5 whitespace-pre-line rounded-xl bg-card px-3 py-2 text-xs leading-relaxed text-foreground">
                      {c.description}
                    </p>
                    {c.adminResponse ? (
                      <div className="mt-2 rounded-xl border border-[#f0c200]/40 bg-[#FFD700]/5 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a6d00]">
                          Transport office response
                        </p>
                        <p className="mt-0.5 whitespace-pre-line text-xs leading-relaxed text-foreground">
                          {c.adminResponse}
                        </p>
                      </div>
                    ) : null}
                    {c.history && c.history.length > 1 ? (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {c.history.map((h, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] text-muted-foreground">
                            {h.status.replace("_", " ")}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              You can view the status and responses of your reports. Submissions are final and cannot be
              edited or deleted by students.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}