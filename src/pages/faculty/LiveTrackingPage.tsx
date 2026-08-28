import { useQuery } from "@tanstack/react-query";
import { Bus, Clock, Info, MapPin, Navigation, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from "@/lib/api";
import PageHeader from "@/components/faculty/PageHeader";
import { BusStatusBadge } from "@/components/faculty/Badges";
import { PageError, PageSkeleton } from "@/components/faculty/DataState";
import type { FacultyProfile } from "@/types/faculty";

export default function LiveTrackingPage() {
  const profileQuery = useQuery({
    queryKey: ["faculty-profile"],
    queryFn: () => api.get<FacultyProfile>("/faculty/profile"),
  });

  if (profileQuery.isLoading) return <PageSkeleton rows={3} />;
  if (profileQuery.isError) {
    return (
      <PageError
        message="Could not load bus information."
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  const profile = profileQuery.data!;
  const transport = profile.transport;
  const bus = transport?.bus;
  const route = bus?.route;

  const routeStops = route?.stops
    ?.sort((a, b) => a.stopOrder - b.stopOrder)
    .map((s) => ({
      name: s.busStop.name,
      time: s.estimatedArrivalTime ?? "—",
    })) ?? [];

  return (
    <>
      <PageHeader
        title="Live Bus Tracking"
        description="Track your assigned bus in real time."
        actions={<BusStatusBadge status={bus?.status === "MAINTENANCE" ? "Breakdown" : bus ? "Running" : "Not Started"} />}
      />

      <Alert className="border-sky-200 bg-sky-50 text-sky-800">
        <Info className="h-4 w-4" />
        <AlertTitle>GPS tracking is not yet available</AlertTitle>
        <AlertDescription>
          Live GPS tracking will be available when real GPS devices are attached to buses.
          Currently showing route and stop information from your transport assignment.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <MapPin className="h-4 w-4 text-[#1a237e]" />
              Route {route?.routeCode ?? "—"} Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {routeStops.length > 0 ? (
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <p className="mb-2 text-sm font-bold text-foreground">
                  {route?.routeName ?? `Route ${route?.routeCode}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {routeStops.length} stops · {routeStops[0]?.name} → {routeStops[routeStops.length - 1]?.name}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No route information available.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <Navigation className="h-4 w-4 text-[#1a237e]" />
              Trip Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-2.5 last:border-0 last:pb-0">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Bus number
              </span>
              <span className="text-right text-xs font-bold text-foreground">
                {bus ? `Route ${bus.busNumber} · ${bus.registrationNumber}` : "—"}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-2.5 last:border-0 last:pb-0">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </span>
              <span className="text-right text-xs font-bold text-foreground">
                {bus?.status === "MAINTENANCE" ? "In maintenance" : bus ? "In service" : "—"}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-2.5 last:border-0 last:pb-0">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Driver
              </span>
              <span className="text-right text-xs font-bold text-foreground">
                {bus?.driver?.name ?? "—"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
            <Clock className="h-4 w-4 text-[#1a237e]" />
            Stop Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {routeStops.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stops available for this route.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {routeStops.map((s, i) => {
                const isCollege = s.name.toUpperCase() === "COLLEGE";
                return (
                  <div
                    key={`${s.name}-${i}`}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs ${
                      isCollege
                        ? "border-[#caa200] bg-[#FFD700]/15 font-bold text-[#8a6d00]"
                        : i === 0
                          ? "border-[#1a237e] bg-[#1a237e]/5 font-bold text-[#1a237e]"
                          : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <span className="truncate">
                      {isCollege && (
                        <Bus className="mr-1 inline h-3 w-3 text-[#FFD700]" />
                      )}
                      {s.name}
                    </span>
                    <span className="shrink-0 font-semibold">{s.time}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
