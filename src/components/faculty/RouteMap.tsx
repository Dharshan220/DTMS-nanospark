import { useMemo } from "react";
import type { RouteInfo, TrackingPosition } from "@/types/faculty";

const W = 800;
const H = 460;

interface Point {
  x: number;
  y: number;
  name: string;
  time: string;
  isCollege: boolean;
}

function project(points: { lat: number; lng: number }[], extra: { lat: number; lng: number }[]) {
  const all = [...points, ...extra];
  const lats = all.map((p) => p.lat);
  const lngs = all.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const pad = 0.08;
  const latSpan = Math.max(maxLat - minLat, 0.004);
  const lngSpan = Math.max(maxLng - minLng, 0.004);
  const toX = (lng: number) => ((lng - minLng) / lngSpan) * (1 - 2 * pad) * W + pad * W;
  const toY = (lat: number) => ((maxLat - lat) / latSpan) * (1 - 2 * pad) * H + pad * H;
  return { toX, toY };
}

export default function RouteMap({
  route,
  current,
}: {
  route: RouteInfo;
  current: TrackingPosition;
}) {
  const { stops, bus, pathPoints, currentIdx, nextIdx } = useMemo(() => {
    const path = route.path && route.path.length >= 2 ? route.path : route.boardingPoints.map((s) => ({ lat: s.lat ?? 0, lng: s.lng ?? 0 }));
    const { toX, toY } = project(path, [{ lat: current.lat, lng: current.lng }]);
    const rawStops = route.boardingPoints.length ? route.boardingPoints : route.stops;
    const stops: Point[] = rawStops.map((s) => ({
      x: toX(s.lat ?? 0),
      y: toY(s.lng ?? 0),
      name: s.name,
      time: s.time,
      isCollege: s.name.toUpperCase() === "COLLEGE",
    }));
    const nextIdx = stops.findIndex((s) => s.name === current.nextStop);
    const currentIdx = nextIdx > 0 ? nextIdx - 1 : Math.max(0, stops.length - 2);
    return {
      stops,
      bus: { x: toX(current.lat), y: toY(current.lng) },
      pathPoints: path.map((p) => ({ x: toX(p.lat), y: toY(p.lng) })),
      currentIdx,
      nextIdx,
    };
  }, [route, current]);

  if (stops.length < 2) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-border bg-card text-sm text-muted-foreground">
        Route map unavailable for this bus.
      </div>
    );
  }

  const pathD = pathPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-[#f6f8ff]">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Bus route map">
          <defs>
            <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="rgba(26,35,126,0.06)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#map-grid)" />
          <path d={pathD} fill="none" stroke="#1a237e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
          <path d={pathD} fill="none" stroke="#FFD700" strokeWidth="1.2" strokeDasharray="8 8" opacity="0.9" />

          {stops.map((s, i) => {
            const isCollege = s.isCollege;
            const isNext = i === nextIdx;
            const isCurrent = i === currentIdx;
            const labelAbove = i % 2 === 0;
            return (
              <g key={`${s.name}-${i}`}>
                <circle
                  cx={s.x}
                  cy={s.y}
                  r={isCurrent ? 7 : isNext ? 6 : 4.5}
                  fill={isCollege ? "#FFD700" : isCurrent ? "#FFD700" : isNext ? "#fff" : "#1a237e"}
                  stroke={isNext ? "#1a237e" : "#fff"}
                  strokeWidth={isNext ? 2.5 : 1.5}
                  opacity={isCollege ? 1 : 0.95}
                />
                <text
                  x={s.x}
                  y={labelAbove ? s.y - 12 : s.y + 20}
                  textAnchor="middle"
                  fontSize={isCollege ? 12 : 10.5}
                  fontWeight={isCollege || isNext || isCurrent ? 700 : 500}
                  fill={isCollege ? "#1a237e" : isNext ? "#1a237e" : "#475569"}
                  style={{ pointerEvents: "none" }}
                >
                  {s.name.length > 26 ? `${s.name.slice(0, 25)}…` : s.name}
                </text>
              </g>
            );
          })}

          <g transform={`translate(${bus.x},${bus.y})`}>
            <circle r="18" fill="#FFD700" opacity="0.25" className="animate-pulse-slow" />
            <circle r="9" fill="#FFD700" stroke="#1a237e" strokeWidth="2.5" />
            <circle r="3" fill="#1a237e" />
          </g>
        </svg>
        <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#1a237e] shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[#FFD700] ring-1 ring-[#1a237e]" />
          Bus
        </span>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Schematic route view — not to scale. Positions are simulated by the transport server
        (real GPS feeds can be plugged into the tracking service later).
      </p>
    </div>
  );
}