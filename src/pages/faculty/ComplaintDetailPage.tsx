import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageSquareWarning } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/faculty";
import PageHeader from "@/components/faculty/PageHeader";
import { PageError, PageSkeleton } from "@/components/faculty/DataState";
import type { NotificationItem } from "@/types/faculty";

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const notificationQuery = useQuery({
    queryKey: ["faculty-notification", id],
    queryFn: () => api.get<NotificationItem>(`/notifications/${id}`),
    enabled: Boolean(id),
  });

  if (notificationQuery.isLoading) return <PageSkeleton rows={5} />;
  if (notificationQuery.isError || !notificationQuery.data) {
    return (
      <PageError
        message="This notification could not be found or you do not have permission to view it."
        onRetry={() => void notificationQuery.refetch()}
      />
    );
  }

  const n = notificationQuery.data;

  return (
    <>
      <PageHeader
        title="Notification Details"
        description={`${n.type} · ${formatDateTime(n.createdAt)}`}
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
                Notification
              </CardTitle>
              <Badge
                variant="outline"
                className={`whitespace-nowrap ${
                  n.readAt
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {n.readAt ? "Read" : "Unread"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-[#f0c200] bg-[#FFD700]/10 text-[#8a6d00]">
                  {n.type}
                </Badge>
                <Badge variant="outline" className="border-border bg-secondary/50 text-muted-foreground">
                  {n.channel}
                </Badge>
              </div>
              <p className="text-lg font-extrabold text-foreground">{n.title}</p>
              <p className="whitespace-pre-wrap rounded-xl border border-border bg-secondary/30 p-4 text-sm leading-relaxed text-foreground">
                {n.message}
              </p>
              {n.sentAt && (
                <p className="text-[11px] text-muted-foreground">
                  Sent: {formatDateTime(n.sentAt)}
                </p>
              )}
              {n.deliveredAt && (
                <p className="text-[11px] text-muted-foreground">
                  Delivered: {formatDateTime(n.deliveredAt)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
                <MessageSquareWarning className="h-4 w-4 text-[#1a237e]" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <Info label="Type" value={n.type} />
              <Info label="Channel" value={n.channel} />
              <Info label="Status" value={n.status} />
              <Info label="Created" value={formatDateTime(n.createdAt)} />
              {n.readAt && <Info label="Read at" value={formatDateTime(n.readAt)} />}
            </CardContent>
          </Card>

          <p className="text-[11px] text-muted-foreground">
            <button onClick={() => navigate("/faculty/complaints")} className="font-bold text-[#1a237e] hover:underline">
              ← All complaints
            </button>
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
