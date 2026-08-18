import type { ComponentType, SVGProps } from "react";
import { AlertTriangle, ArrowLeftRight, Clock, Settings, TrafficCone, Wrench } from "lucide-react";

export type UpdateKind = "instant" | "swap";
export type ReporterRole = "student" | "faculty" | "driver" | "staff" | "manager";
export type IssueType = "late" | "accident" | "tyre" | "breakdown" | "traffic" | "swap";

export type UpdateEntry = {
  id: string;
  kind: UpdateKind;
  route: string;
  issue: IssueType;
  details: string;
  timestamp: number;
  reporterRole: ReporterRole;
  reporterName?: string;
  delayMinutes?: number;
  effectiveAt?: number;
  swapFrom?: string;
  swapTo?: string;
  image?: string;
  imageName?: string;
};

export type IssueMeta = {
  label: string;
  badge: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export const issueMeta: Record<IssueType, IssueMeta> = {
  late: {
    label: "Bus Late",
    badge: "border-yellow-200 bg-yellow-50 text-yellow-800",
    Icon: Clock,
  },
  accident: {
    label: "Met Accident",
    badge: "border-red-200 bg-red-50 text-red-800",
    Icon: AlertTriangle,
  },
  tyre: {
    label: "Tyre Punctured",
    badge: "border-slate-200 bg-slate-50 text-slate-900",
    Icon: Wrench,
  },
  breakdown: {
    label: "Breakdown",
    badge: "border-orange-200 bg-orange-50 text-orange-800",
    Icon: Settings,
  },
  traffic: {
    label: "Traffic Alert",
    badge: "border-indigo-200 bg-indigo-50 text-indigo-800",
    Icon: TrafficCone,
  },
  swap: {
    label: "Bus Swap",
    badge: "border-purple-200 bg-purple-50 text-purple-800",
    Icon: ArrowLeftRight,
  },
};

export const reporterRoleLabels: Record<ReporterRole, string> = {
  student: "Student",
  faculty: "Faculty",
  driver: "Driver",
  staff: "Staff",
  manager: "Transport Authority Manager",
};

export const formatDate = (value: number) =>
  new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" }).format(value);

export const formatTime = (value: number) =>
  new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, hourCycle: "h12" }).format(value);

export const formatDelay = (totalMinutes: number) => {
  const minutes = Math.max(0, Math.round(totalMinutes));
  return `${minutes} min${minutes === 1 ? "" : "s"}`;
};
