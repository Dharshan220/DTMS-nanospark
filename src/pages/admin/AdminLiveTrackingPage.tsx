import { useQuery } from "@tanstack/react-query";
import { Gauge, MapPin, Navigation, Phone, Truck } from "lucide-react";
import { api } from "@/lib/api";
import PageHeader from "@/components/faculty/PageHeader";
import { EmptyState, PageError, PageSkeleton } from "@/components/faculty/DataState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/faculty";
import type { TrackingBusItem } from "@/types/faculty";

export default function AdminLiveTrackingPage() {
  const query = useQuery({
    queryKey: ["admin-tracking"],
    queryFn: () => api.get<{ items: TrackingBusItem[]; updatedAt: number }>("/tracking/buses"),
    refetchInterval: 10000,
  });

  if (query.isLoading) return <PageSkeleton rows={6} />;
  if (query.isError) {
    return <PageError message="Could not load live tracking data." onRetry={() => void query.refetch()} />;
  }

  const items = query.data!.items;

  return (
    <>
      <PageHeader
        title="Live Tracking"
        description="Simulated live positions of every active bus — where each bus is and when it reaches the next stop."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 ? (
          <Card className="shadow-card sm:col-span-2 lg:col-span-3">
            <CardContent><EmptyState message="No buses are currently on the road." /></CardContent>
          </Card>
        ) : (
          items.map((b) => (
            <Card key={b.busId} className="shadow-card transition hover:-translate-y-[2px] hover:shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm font-extrabold">
                  <span className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                    </span>
                    Route {b.routeNumber}
                  </span>
                  <Badge variant="outline" className="border-[#1a237e]/20 bg-[#1a237e]/5 text-[#1a237e]">
                    {b.vehicleNumber}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-3 py-2">
                  <span className="font-semibold text-muted-foreground">Speed</span>
                  <span className="flex items-center gap-1 font-extrabold text-[#1a237e]">
                    <Gauge className="h-3.5 w-3.5" />
                    {b.speedKmh} km/h
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-3 py-2">
                  <span className="font-semibold text-muted-foreground">Next stop</span>
                  <span className="flex items-center gap-1 font-extrabold text-foreground">
                    <MapPin className="h-3.5 w-3.5 text-[#FFD700]" />
                    {b.nextStop} · ~{b.etaMinutes} min
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-3 py-2">
                  <span className="font-semibold text-muted-foreground">Position</span>
                  <span className="font-bold text-foreground">
                    {b.lat.toFixed(4)}, {b.lng.toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center gap-2 border-t border-border pt-2">
                  <Navigation className="h-3.5 w-3.5 text-[#1a237e]" />
                  <span className="font-semibold text-foreground">{b.driverName || "No driver"}</span>
                  {b.driverPhone ? (
                    <a href={`tel:${b.driverPhone}`} className="ml-auto inline-flex items-center gap-1 font-bold text-[#1a237e] hover:underline">
                      <Phone className="h-3 w-3" /> Call
                    </a>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
            <Truck className="h-4 w-4 text-[#1a237e]" />
            Fleet on the road ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Positions are simulated on the server (this demo has no real GPS hardware). Each active bus moves along
            its route toward the college and loops, reporting speed, heading, next stop and ETA. Last update:{" "}
            {formatDateTime(query.data?.updatedAt ?? Date.now())}.
          </p>
        </CardContent>
      </Card>
    </>
  );
}