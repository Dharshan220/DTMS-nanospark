import { useQuery } from "@tanstack/react-query";
import { Bus, CalendarClock, Phone, Route as RouteIcon, UserRound, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { deriveBusStatus } from "@/lib/faculty";
import PageHeader from "@/components/faculty/PageHeader";
import { BusStatusBadge } from "@/components/faculty/Badges";
import { PageError, PageSkeleton } from "@/components/faculty/DataState";
import type { FacultyProfile } from "@/types/faculty";

export default function MyBusPage() {
  const profileQuery = useQuery({
    queryKey: ["faculty-profile"],
    queryFn: () => api.get<FacultyProfile>("/faculty/profile"),
  });

  if (profileQuery.isLoading) return <PageSkeleton />;
  if (profileQuery.isError) {
    return (
      <PageError
        message="Could not load your bus details."
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  const profile = profileQuery.data!;
  const transport = profile.transport;
  const bus = transport?.bus;

  if (!bus) {
    return (
      <PageError
        message="No bus is assigned to your profile yet."
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  const route = bus.route;
  const routeStops = route?.stops
    ?.sort((a, b) => a.stopOrder - b.stopOrder)
    .map((s) => ({
      name: s.busStop.name,
      time: s.estimatedArrivalTime ?? "—",
    })) ?? [];

  const firstStop = routeStops[0];
  const collegeStop = routeStops.find((s) => s.name.toUpperCase() === "COLLEGE");
  const capacity = 60;
  const status = deriveBusStatus(bus, null, false);

  return (
    <>
      <PageHeader
        title="My Bus"
        description="Details of the bus assigned to you by the transport department."
        actions={<BusStatusBadge status={status} />}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <Bus className="h-4 w-4 text-[#1a237e]" />
              Bus {bus.busNumber}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-5 rounded-2xl bg-gradient-to-r from-[#1a237e] to-[#283593] p-5 text-white shadow-md">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-[#FFD700] ring-1 ring-white/20">
                <Bus className="h-8 w-8" />
              </div>
              <div>
                <p className="text-2xl font-extrabold tracking-wide">{bus.registrationNumber}</p>
                <p className="text-xs font-semibold text-white/70">
                  Route {bus.busNumber} · {bus.status === "MAINTENANCE" ? "In maintenance" : "In service"}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-secondary/40 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Bus type / model</p>
                <p className="text-sm font-bold text-foreground">{capacity}-seater campus coach</p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/40 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Registration number</p>
                <p className="text-sm font-bold text-foreground">{bus.registrationNumber}</p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/40 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Capacity</p>
                <p className="text-sm font-bold text-foreground">{capacity} seats</p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/40 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
                <p className="text-sm font-bold text-foreground">
                  {bus.status === "MAINTENANCE" ? "In maintenance" : "In service"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
                <UserRound className="h-4 w-4 text-[#1a237e]" />
                Driver
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFD700]/20 text-[#8a6d00]">
                  <UserRound className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-foreground">{bus.driver?.name || "Not assigned"}</p>
                  <p className="text-[11px] text-muted-foreground">Bus driver</p>
                </div>
              </div>
              {bus.driver?.phone && (
                <a
                  href={`tel:${bus.driver.phone}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-xs font-bold text-[#1a237e] shadow-sm transition hover:-translate-y-[1px]"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {bus.driver.phone}
                </a>
              )}
              <p className="text-[11px] text-muted-foreground">
                Driver changes are managed by the transport department.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
                <RouteIcon className="h-4 w-4 text-[#1a237e]" />
                Assigned Route
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {route ? (
                <>
                  <p className="flex items-center gap-2 font-bold text-foreground">
                    <Badge variant="outline" className="border-[#f0c200] bg-[#FFD700]/10 text-[#8a6d00]">
                      Route {route.routeCode}
                    </Badge>
                    {routeStops.length} stops
                  </p>
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <CalendarClock className="h-4 w-4" />
                    Departs {firstStop?.name} at {firstStop?.time}
                  </p>
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <CalendarClock className="h-4 w-4" />
                    Arrives {collegeStop?.name ?? "College"} by {routeStops[routeStops.length - 1]?.time ?? "—"}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">No route assigned</p>
              )}
            </CardContent>
          </Card>

          {bus.status === "MAINTENANCE" && (
            <Card className="border-red-200 bg-red-50/60 shadow-card">
              <CardContent className="flex items-start gap-3 p-4">
                <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <p className="text-xs font-semibold text-red-700">
                  This bus is under maintenance. Contact the transport department for the replacement bus.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
