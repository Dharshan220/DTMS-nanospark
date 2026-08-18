import { useQuery } from "@tanstack/react-query";
import { Bus, Clock, Info, MapPin, Navigation, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from "@/lib/api";
import { deriveBusStatus, formatDateTime } from "@/lib/faculty";
import { demoTripState } from "@/data/facultyDemo";
import PageHeader from "@/components/faculty/PageHeader";
import RouteMap from "@/components/faculty/RouteMap";
import { BusStatusBadge } from "@/components/faculty/Badges";
import { PageError, PageSkeleton } from "@/components/faculty/DataState";
import type { DashboardResponse, TrackingResponse } from "@/types/faculty";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function LiveTrackingPage() {
  const trackingQuery = useQuery({
    queryKey: ["faculty-tracking"],
    queryFn: () => api.get<TrackingResponse>("/tracking/my"),
    refetchInterval: 5000,
  });
  const dashQuery = useQuery({
    queryKey: ["faculty-dashboard"],
    queryFn: () => api.get<DashboardResponse>("/dashboard"),
  });

  if (trackingQuery.isLoading || dashQuery.isLoading) return <PageSkeleton rows={3} />;
  if (trackingQuery.isError || dashQuery.isError) {
    return (
      <PageError
        message={
          trackingQuery.isError
            ? "Live tracking is unavailable right now. Try again shortly."
            : "Could not load bus information."
        }
        onRetry={() => { void trackingQuery.refetch(); void dashQuery.refetch(); }}
      />
    );
  }

  const tracking = trackingQuery.data!;
  const dash = dashQuery.data!;
  const bus = dash.myBus;
  const current = tracking.current;
  const route = tracking.route;

  const stops = route.boardingPoints.length ? route.boardingPoints : route.stops;
  const nextIdx = stops.findIndex((s) => s.name === current.nextStop);
  const currentStop = nextIdx > 0 ? stops[nextIdx - 1] : stops[Math.max(0, stops.length - 2)];

  const trip = demoTripState(route.routeNumber, today());
  const status = deriveBusStatus(bus, route, trip.delayed);

  const info: { label: string; value: string }[] = [
    { label: "Bus number", value: bus ? `Route ${bus.routeNumber} · ${bus.vehicleNumber}` : `Route ${route.routeNumber}` },
    { label: "Current location", value: `${current.lat.toFixed(5)}, ${current.lng.toFixed(5)}` },
    { label: "Current stop", value: currentStop ? `${currentStop.name} (${currentStop.time})` : "—" },
    { label: "Next stop", value: `${current.nextStop} (${current.stopTime})` },
    { label: "ETA to next stop", value: `~${current.etaMinutes} min` },
    { label: "Speed", value: `${current.speedKmh} km/h` },
    { label: "Last updated", value: formatDateTime(Date.now()) },
  ];

  return (
    <>
      <PageHeader
        title="Live Bus Tracking"
        description="Track your assigned bus in real time."
        actions={<BusStatusBadge status={status} />}
      />

      <Alert className="border-sky-200 bg-sky-50 text-sky-800">
        <Info className="h-4 w-4" />
        <AlertTitle>Simulated positions</AlertTitle>
        <AlertDescription>
          The transport server currently simulates bus positions along the route. When real GPS
          devices are attached, the same tracking API feeds live coordinates here without UI changes.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <MapPin className="h-4 w-4 text-[#1a237e]" />
              Route {route.routeNumber} Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RouteMap route={route} current={current} />
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
            {info.map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-3 border-b border-border/60 pb-2.5 last:border-0 last:pb-0">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {row.label}
                </span>
                <span className="text-right text-xs font-bold text-foreground">{row.value}</span>
              </div>
            ))}
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
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {stops.map((s, i) => {
              const isNext = i === nextIdx;
              const isCurrent = nextIdx > 0 && i === nextIdx - 1;
              return (
                <div
                  key={`${s.name}-${i}`}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs ${
                    isNext
                      ? "border-[#1a237e] bg-[#1a237e]/5 font-bold text-[#1a237e]"
                      : isCurrent
                        ? "border-[#caa200] bg-[#FFD700]/15 font-bold text-[#8a6d00]"
                        : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <span className="truncate">
                    {s.name.toUpperCase() === "COLLEGE" && (
                      <Bus className="mr-1 inline h-3 w-3 text-[#FFD700]" />
                    )}
                    {s.name}
                  </span>
                  <span className="shrink-0 font-semibold">{s.time}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {status === "Delayed" && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-800">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Bus delayed</AlertTitle>
          <AlertDescription>
            Route {route.routeNumber} is running late today. Inform students and the transport department if needed.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}