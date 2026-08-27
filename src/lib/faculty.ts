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

/** Role picked on the web login page. */
export type LoginRole = "student" | "faculty" | "admin";

/** Map the web login pill to the server role. */
export function serverRoleFor(role: LoginRole): AuthUser["role"] {
  if (role === "faculty") return "teacher";
  if (role === "admin") return "admin";
  return "student";
}

/** Required fields for a student's first-time transport profile. */
export const STUDENT_PROFILE_FIELDS = [
  "name",
  "rollNo",
  "phone",
  "routeNumber",
  "boardingStop",
] as const;

/** True once the student has completed first-time setup (all required fields set). */
export function studentProfileComplete(
  user: Pick<AuthUser, "name" | "rollNo" | "phone" | "routeNumber" | "boardingStop"> | null
): boolean {
  if (!user) return false;
  return (
    Boolean(user.name?.trim()) &&
    Boolean(user.rollNo?.trim()) &&
    Boolean(user.phone?.trim()) &&
    user.routeNumber != null &&
    Boolean(user.boardingStop?.trim())
  );
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

/**
 * Derive a display status for the assigned bus from real data
 * (server status + scheduled departure/arrival vs current time).
 * "Delayed" only appears when the (demo) trip service flags it.
 */
export function deriveBusStatus(
  bus: Pick<BusInfo, "status"> | null,
  route: Pick<RouteInfo, "boardingPoints" | "arrivalTime"> | null,
  delayed: boolean
): BusDisplayStatus {
  if (!bus || !route || route.boardingPoints.length === 0) return "Not Started";
  if (bus.status === "maintenance") return "Breakdown";
  const first = timeToMinutes(route.boardingPoints[0].time);
  const arrival = timeToMinutes(route.arrivalTime);
  const now = nowMinutes();
  let base: Exclude<BusDisplayStatus, "Delayed"> = "Running";
  if (now < first) base = "Not Started";
  else if (now > arrival + 45) base = "Stopped";
  if (delayed && base === "Running") return "Delayed";
  return base;
}

export const BUS_STATUS_TONE: Record<BusDisplayStatus, string> = {
  Running: "border-green-200 bg-green-50 text-green-700",
  Stopped: "border-slate-200 bg-slate-100 text-slate-600",
  Delayed: "border-amber-200 bg-amber-50 text-amber-700",
  Breakdown: "border-red-200 bg-red-50 text-red-700",
  "Not Started": "border-slate-200 bg-slate-50 text-slate-500",
};

/**
 * Real boarding evidence (server attendance) wins; otherwise fall back to
 * the demo service so the UI is complete before check-in integrations are wired up.
 */
export function boardingStatusFor(
  student: Pick<StudentProfile, "id">,
  records: AttendanceRecord[],
  date: string,
  trip: TripKind
): BoardingStatus {
  const record = records.find((a) => a.studentId === student.id && a.date === date);
  if (record) {
    if (record.status === "absent") return "not_boarded";
    if (trip === "morning") return "boarded";
    const hour = new Date(record.checkInAt).getHours();
    if (hour >= 12) return "boarded";
    return "not_scanned";
  }
  return demoBoardingStatus(student.id, date, trip);
}

/**
 * Deterministic demo boarding simulation for students who have no attendance
 * record yet. Labelled as demo in the UI — replace with a real check-in
 * integration when one is connected.
 */
export function demoBoardingStatus(studentId: string, date: string, trip: TripKind): BoardingStatus {
  const hash = stableHash(`${studentId}|${date}|${trip}`);
  const roll = hash % 100;
  if (roll < 4) return "not_scanned"; // no record yet
  return roll < 82 ? "boarded" : "not_boarded";
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

/** Map the server notification `type` to the panel's category list. */
export function notificationCategory(item: Pick<NotificationItem, "type" | "title">): NotificationType {
  const t = item.type;
  const title = item.title.toLowerCase();
  if (t === "alert" || t === "delay") {
    if (title.includes("replacement")) return "Bus Replacement";
    if (title.includes("route")) return "Route Change";
    if (title.includes("emergency")) return "Emergency";
    return "Bus Delay";
  }
  if (t === "complaint") return "Complaint Update";
  if (t === "emergency") return "Emergency";
  if (t === "broadcast" || t === "announcement") {
    if (title.includes("replacement")) return "Bus Replacement";
    if (title.includes("route")) return "Route Change";
    if (title.includes("emergency")) return "Emergency";
    return "Transport Announcement";
  }
  return "General";
}

export function formatDate(value: number | string): string {
  const d = typeof value === "string" ? new Date(value) : new Date(value);
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

export function formatDateTime(value: number | string): string {
  const d = typeof value === "string" ? new Date(value) : new Date(value);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export function formatRelative(value: number): string {
  const diff = Date.now() - value;
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

/** Approximate route distance (km) from the coordinate path — real arithmetic. */
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