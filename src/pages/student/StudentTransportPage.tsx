import { useQuery } from "@tanstack/react-query";
import { Bus, CalendarClock, Clock, MapPin, Phone, Route as RouteIcon, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatRelative } from "@/lib/faculty";
import PageHeader from "@/components/faculty/PageHeader";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import type { StudentProfile } from "@/types/faculty";

export default function StudentTransportPage() {
  const profileQuery = useQuery({
    queryKey: ["student-profile"],
    queryFn: () => api.get<StudentProfile>("/student/profile"),
  });

  if (profileQuery.isLoading) return <PageSkeleton />;
  if (profileQuery.isError) {
    return (
      <PageError
        message="Could not load your transport details."
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  const profile = profileQuery.data!;
  const transport = profile.transport;
  const bus = transport?.bus ?? null;
  const busStop = transport?.busStop ?? null;
  const route = bus?.route ?? null;
  const stops = route?.stops ?? [];
  const firstStop = stops[0];
  const collegeStop = stops.find(
    (s) => s.busStop.name.toUpperCase() === "COLLEGE"
  );

  if (!bus || !route) {
    return (
      <PageError
        message="No bus or route is assigned to your profile yet."
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="My Transport"
        description="Your assigned bus, route and daily stops."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <Bus className="h-4 w-4 text-[#1a237e]" />
              My Bus — Route {bus.busNumber}
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
              <InfoRow label="Driver" value={bus.driver?.name || "—"} icon={<UserRound className="h-3.5 w-3.5 text-[#1a237e]" />} />
              <InfoRow label="Driver contact" value={bus.driver?.phone || "—"} icon={<Phone className="h-3.5 w-3.5 text-[#1a237e]" />} />
              <InfoRow label="My boarding stop" value={busStop?.name || "—"} icon={<MapPin className="h-3.5 w-3.5 text-[#1a237e]" />} />
              <InfoRow label="Register number" value={profile.registerNumber || "—"} icon={<UserRound className="h-3.5 w-3.5 text-[#1a237e]" />} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <CalendarClock className="h-4 w-4 text-[#1a237e]" />
              Today&apos;s Trip
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 shrink-0 text-[#1a237e]" />
              <span className="font-semibold text-foreground">
                {firstStop?.busStop.name ?? "—"}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="font-semibold text-foreground">
                {collegeStop?.busStop.name ?? "College"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow
                label="Departure"
                value={firstStop?.estimatedArrivalTime ?? "—"}
              />
              <InfoRow
                label="College arrival"
                value={collegeStop?.estimatedArrivalTime ?? "—"}
              />
              <InfoRow
                label="Current status"
                value="Trip scheduled"
              />
              <InfoRow label="Stops on route" value={String(stops.length)} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
            <RouteIcon className="h-4 w-4 text-[#1a237e]" />
            Route {route.routeCode} — Stops &amp; Timings
          </CardTitle>
          <Badge variant="outline" className="border-[#f0c200] bg-[#FFD700]/10 text-[#8a6d00]">
            {formatRelative(Date.now())} · today
          </Badge>
        </CardHeader>
        <CardContent>
          {stops.length === 0 ? (
            <EmptyState message="No stops defined for this route yet." />
          ) : (
            <ol className="relative space-y-4 border-l-2 border-[#1a237e]/15 pl-6">
              {stops.map((s, i) => {
                const isCollege = s.busStop.name.toUpperCase() === "COLLEGE";
                const isMine = s.busStop.id === busStop?.id;
                return (
                  <li key={`${s.busStop.id}-${i}`} className="relative">
                    <span
                      className={`absolute -left-[31px] top-1 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-extrabold text-white ring-4 ring-background ${
                        isCollege ? "bg-[#FFD700] text-[#1a237e]" : isMine ? "bg-green-600" : "bg-[#1a237e]"
                      }`}
                    >
                      {s.stopOrder}
                    </span>
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#1a237e]" />
                          <span className="truncate">{s.busStop.name}</span>
                          {isMine ? (
                            <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                              My stop
                            </Badge>
                          ) : null}
                          {isCollege ? (
                            <Badge variant="outline" className="border-[#f0c200] bg-[#FFD700]/10 text-[#8a6d00]">
                              College
                            </Badge>
                          ) : null}
                        </p>
                      </div>
                      <p className="flex items-center gap-1.5 text-xs font-bold text-[#1a237e]">
                        <Clock className="h-3.5 w-3.5" />
                        {s.estimatedArrivalTime || "—"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm font-bold text-foreground">
        {icon}
        <span className="truncate">{value}</span>
      </p>
    </div>
  );
}
