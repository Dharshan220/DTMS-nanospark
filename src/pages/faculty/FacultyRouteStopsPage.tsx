import { useQuery } from "@tanstack/react-query";
import { Bus, CalendarClock, Flag, MapPin, Route as RouteIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import PageHeader from "@/components/faculty/PageHeader";
import { PageError, PageSkeleton } from "@/components/faculty/DataState";
import type { FacultyProfile } from "@/types/faculty";

export default function FacultyRouteStopsPage() {
  const profileQuery = useQuery({
    queryKey: ["faculty-profile"],
    queryFn: () => api.get<FacultyProfile>("/faculty/profile"),
  });

  if (profileQuery.isLoading) return <PageSkeleton rows={5} />;
  if (profileQuery.isError) {
    return <PageError message="Could not load your route information." onRetry={() => void profileQuery.refetch()} />;
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
      lat: s.busStop.latitude ?? undefined,
      lng: s.busStop.longitude ?? undefined,
    })) ?? [];

  const first = routeStops[0];
  const college = routeStops.find((s) => s.name.toUpperCase() === "COLLEGE");
  const totalMinutes = routeStops.length > 1 ? 60 : 0;

  if (!route) {
    return (
      <>
        <PageHeader
          title="Route & Stops"
          description="Your assigned route and its stop schedule (managed by the transport department)."
        />
        <PageError message="No route is assigned to your bus yet." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Route & Stops"
        description="Your assigned route and its stop schedule (managed by the transport department)."
        actions={
          <Badge variant="outline" className="border-[#f0c200] bg-[#FFD700]/10 text-[#8a6d00]">
            Route {route.routeCode}
          </Badge>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <RouteIcon className="h-4 w-4 text-[#1a237e]" />
              Route Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#1a237e] to-[#283593] p-4 text-white shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-[#FFD700] ring-1 ring-white/20">
                <Bus className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-extrabold">Route {route.routeCode}</p>
                <p className="text-[11px] font-semibold text-white/70">{bus?.registrationNumber || "Bus assigned by transport dept."}</p>
              </div>
            </div>
            <Detail label="Route number" value={`Route ${route.routeCode}`} />
            <Detail label="Route name" value={route.routeName || "—"} />
            <Detail label="Starting point" value={first ? first.name : "—"} />
            <Detail label="Destination" value={college?.name ?? "College"} />
            <Detail label="Total stops" value={String(routeStops.length)} />
          </CardContent>
        </Card>

        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <MapPin className="h-4 w-4 text-[#1a237e]" />
              Stops & Timings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-0">
              {routeStops.map((s, i) => {
                const isCollege = s.name.toUpperCase() === "COLLEGE";
                const isLast = i === routeStops.length - 1;
                const etaMin = Math.round((i / Math.max(1, routeStops.length - 1)) * totalMinutes);
                return (
                  <li key={`${s.name}-${i}`} className="relative flex gap-3 pb-4">
                    {!isLast && (
                      <span className="absolute left-[11px] top-6 bottom-0 w-px bg-[#1a237e]/20" />
                    )}
                    <span
                      className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-2 ring-white ${
                        isCollege ? "bg-[#FFD700] text-[#1a237e]" : i === 0 ? "bg-[#1a237e] text-white" : "bg-white text-[#1a237e]"
                      }`}
                    >
                      {isCollege ? <Flag className="h-3 w-3" /> : i === 0 ? <Bus className="h-3 w-3" /> : <span className="text-[9px] font-bold">{i}</span>}
                    </span>
                    <div className={`flex flex-1 items-center justify-between rounded-xl border px-3 py-2 ${isCollege ? "border-[#f0c200] bg-[#FFD700]/10" : "border-border bg-card"}`}>
                      <div>
                        <p className={`text-xs font-bold ${isCollege ? "text-[#1a237e]" : "text-foreground"}`}>
                          {s.name}
                        </p>
                        {isCollege && (
                          <p className="text-[10px] font-semibold text-[#8a6d00]">Destination — college campus</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-extrabold text-foreground">{s.time}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Est. {Math.max(1, etaMin)} min after departure
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" />
              Stop timings are managed by the transport department. ETA estimates are derived from the route schedule.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-xs font-bold text-foreground">{value}</span>
    </div>
  );
}
