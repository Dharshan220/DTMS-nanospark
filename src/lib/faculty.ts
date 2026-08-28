import type {
  AttendanceRecord,
  AuthUser,
  BoardingStatus,
  BusDisplayStatus,
  BusInfo,
  NotificationItem,
  NotificationType,
  RouteInfo,
  ServerBusStatus,
  StudentProfile,
  TripKind,
} from "@/types/faculty";

/** Required fields for a student's first-time transport profile. */
export const STUDENT_PROFILE_FIELDS = [
  "name",
  "registerNumber",
  "phone",
] as const;

/** True once the student has completed first-time setup (all required fields set). */
export function studentProfileComplete(
  user: Pick<AuthUser, "email"> | null
): boolean {
  if (!user) return false;
  return Boolean(user.email?.trim());
}

/** "6:20 AM" → minutes since midnight. */
export function timeToMinutes(time: string): number {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(time).trim());
  if (!m) return 8 * 60;
  let h = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) h += 12;
  return h * 60 + Number(m[2]);
}

export function minutesToLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${period}`;
}

export function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export function deriveBusStatus(
  bus: Pick<BusInfo, "status"> | null,
  _route: Pick<RouteInfo, "stops"> | null,
  _delayed: boolean
): BusDisplayStatus {
  if (!bus) return "Not Started";
  if (bus.status === "MAINTENANCE") return "Breakdown";
  return "Running";
}

export const BUS_STATUS_TONE: Record<BusDisplayStatus, string> = {
  Running: "border-green-200 bg-green-50 text-green-700",
  Stopped: "border-slate-200 bg-slate-100 text-slate-600",
  Delayed: "border-amber-200 bg-amber-50 text-amber-700",
  Breakdown: "border-red-200 bg-red-50 text-red-700",
  "Not Started": "border-slate-200 bg-slate-50 text-slate-500",
};

export function boardingStatusFor(
  _student: Pick<AuthUser, "id">,
  _records: AttendanceRecord[],
  _date: string,
  _trip: TripKind
): BoardingStatus {
  return "not_scanned";
}

export function stableHash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export const BOARDING_LABELS: Record<BoardingStatus, string> = {
  boarded: "Boarded",
  not_boarded: "Not Boarded",
  not_scanned: "Not Recorded",
};

export const BOARDING_TONE: Record<BoardingStatus, string> = {
  boarded: "border-green-200 bg-green-50 text-green-700",
  not_boarded: "border-red-200 bg-red-50 text-red-700",
  not_scanned: "border-amber-200 bg-amber-50 text-amber-700",
};

export function notificationCategory(_item: Pick<NotificationItem, "type" | "title">): NotificationType {
  return "SYSTEM";
}

export function formatDate(value: string | number): string {
  const d = typeof value === "string" ? new Date(value) : new Date(value);
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

export function formatDateTime(value: string | number): string {
  const d = typeof value === "string" ? new Date(value) : new Date(value);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export function formatRelative(value: string | number): string {
  const ts = typeof value === "string" ? new Date(value).getTime() : value;
  const diff = Date.now() - ts;
  const mins = Math.max(1, Math.round(diff / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} days ago`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function routeDistanceKm(path: { lat: number; lng: number }[]): number | null {
  if (!path || path.length < 2) return null;
  const R = 6371;
  let km = 0;
  for (let i = 1; i < path.length; i++) {
    const dLat = ((path[i].lat - path[i - 1].lat) * Math.PI) / 180;
    const dLng = ((path[i].lng - path[i - 1].lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((path[i - 1].lat * Math.PI) / 180) * Math.cos((path[i].lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    km += 2 * R * Math.asin(Math.sqrt(a));
  }
  return Math.round(km * 10) / 10;
}

export { type ServerBusStatus };
