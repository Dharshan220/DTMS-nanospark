import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, History, MapPin, Phone, Siren } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Badge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatDateTime } from "@/lib/faculty";
import PageHeader from "@/components/faculty/PageHeader";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import {
  EMERGENCY_TYPES,
  EMERGENCY_TYPE_LABELS,
  EMERGENCY_STATUS_LABELS,
  type EmergencyReport,
  type EmergencyType,
  type FacultyProfile,
  type Paginated,
} from "@/types/faculty";

const TRANSPORT_OFFICE_PHONE = "9962022222";

export default function FacultyEmergencyPage() {
  const { user } = useAuth();
  const [type, setType] = useState<EmergencyType>("BREAKDOWN");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["faculty-profile"],
    queryFn: () => api.get<FacultyProfile>("/faculty/profile"),
  });

  const activeQuery = useQuery({
    queryKey: ["faculty-emergency-active"],
    queryFn: () => api.get<{ active: boolean; alert: EmergencyReport | null }>("/emergency/active"),
  });

  const historyQuery = useQuery({
    queryKey: ["faculty-emergency-history"],
    queryFn: () => api.get<Paginated<EmergencyReport>>("/emergency?page=1&limit=20"),
  });

  const reportMutation = useMutation({
    mutationFn: (payload: { type?: EmergencyType; message?: string; latitude?: number; longitude?: number }) =>
      api.post<EmergencyReport>("/emergency", payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["faculty-emergency-active"] });
      void queryClient.invalidateQueries({ queryKey: ["faculty-emergency-history"] });
      setDescription("");
      toast.success("SOS report sent to the transport department", {
        description: "The department has been alerted and will respond to this report.",
        action: { label: "Call office", onClick: () => { window.location.href = `tel:${TRANSPORT_OFFICE_PHONE}`; } },
      });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not send the SOS report"),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.patch<EmergencyReport>(`/emergency/${id}/cancel`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["faculty-emergency-active"] });
      void queryClient.invalidateQueries({ queryKey: ["faculty-emergency-history"] });
      toast.success("Emergency report cancelled");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not cancel the report"),
  });

  if (profileQuery.isLoading || activeQuery.isLoading || historyQuery.isLoading) return <PageSkeleton rows={4} />;
  if (profileQuery.isError || activeQuery.isError || historyQuery.isError) {
    return (
      <PageError
        message="Could not prepare the emergency panel."
        onRetry={() => { void profileQuery.refetch(); void activeQuery.refetch(); void historyQuery.refetch(); }}
      />
    );
  }

  const profile = profileQuery.data!;
  const transport = profile.transport;
  const bus = transport?.bus;
  const activeEmergency = activeQuery.data;
  const history = historyQuery.data?.data ?? [];

  const handleSos = () => {
    reportMutation.mutate({
      type,
      message: description.trim() || undefined,
    });
  };

  return (
    <>
      <PageHeader
        title="Emergency / SOS"
        description="Report an emergency on your assigned bus. The transport department is alerted for immediate action."
      />

      <Alert className="border-red-200 bg-red-50 text-red-800">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Before you report</AlertTitle>
        <AlertDescription>
          SOS reports are sent to the transport department server and appear on the admin panel for immediate
          action. For life-threatening situations, call the transport office right away.
        </AlertDescription>
      </Alert>

      {activeEmergency?.active && activeEmergency.alert && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Active Emergency</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              You have an active {EMERGENCY_TYPE_LABELS[activeEmergency.alert.type]} report.
              Status: {EMERGENCY_STATUS_LABELS[activeEmergency.alert.status]}.
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => cancelMutation.mutate(activeEmergency.alert!.id)}
              disabled={cancelMutation.isPending}
            >
              Cancel Report
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white shadow-card lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
            <div className="relative">
              <span className="absolute inset-0 animate-pulse rounded-full bg-red-500/20" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-500/30">
                <Siren className="h-12 w-12" />
              </div>
            </div>
            <div>
              <p className="text-lg font-extrabold text-red-700">SOS — Alert Transport</p>
              <p className="text-xs text-muted-foreground">
                {bus ? `Route ${bus.busNumber} · ${bus.registrationNumber}` : "No bus assigned"}
              </p>
            </div>
            <a
              href={`tel:${TRANSPORT_OFFICE_PHONE}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-700 shadow-md transition hover:-translate-y-[1px] hover:shadow-lg"
            >
              <Phone className="h-4 w-4" />
              Call Transport Office · {TRANSPORT_OFFICE_PHONE}
            </a>
          </CardContent>
        </Card>

        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <AlertTriangle className="h-4 w-4 text-[#1a237e]" />
              Emergency Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Emergency type
                </Label>
                <Select value={type} onValueChange={(v) => setType(v as EmergencyType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMERGENCY_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Reporting faculty
                </Label>
                <div className="rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm font-bold text-foreground">
                  {profile.name ?? "—"}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Bus
              </Label>
              <div className="rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm font-bold text-foreground">
                {bus ? `Route ${bus.busNumber} · ${bus.registrationNumber}` : "—"}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Description
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe what happened and the help needed…"
              />
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full gap-2 bg-gradient-to-r from-red-500 to-red-700 py-6 text-base font-extrabold text-white shadow-lg shadow-red-500/30 hover:from-red-600 hover:to-red-800 sm:w-auto">
                  <Siren className="h-5 w-5" />
                  Send SOS Report
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm SOS report</AlertDialogTitle>
                  <AlertDialogDescription>
                    This sends a {EMERGENCY_TYPE_LABELS[type]} report for Route {bus?.busNumber ?? "—"} to the
                    transport department. For real emergencies, also call the transport office immediately.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={(e) => { e.preventDefault(); handleSos(); }}>
                    Confirm report
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <p className="text-[11px] text-muted-foreground">
              Report date/time is recorded automatically when submitted.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
            <History className="h-4 w-4 text-[#1a237e]" />
            Past Emergency Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <EmptyState message="No emergency reports yet." />
          ) : (
            <ul className="divide-y divide-border">
              {history.map((r) => (
                <li key={r.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-xs font-bold text-foreground">
                      {r.bus?.registrationNumber ?? "Bus —"}
                      <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
                        {EMERGENCY_TYPE_LABELS[r.type]}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          r.status === "RESOLVED"
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        }
                      >
                        {EMERGENCY_STATUS_LABELS[r.status]}
                      </Badge>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{r.message}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                      {r.faculty?.name ?? "Faculty"} · {r.latitude && r.longitude ? `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}` : "Location unknown"}
                      {r.resolutionNote ? ` · Response: ${r.resolutionNote}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
                    {formatDateTime(r.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
