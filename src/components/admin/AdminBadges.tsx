import { Badge } from "@/components/ui/badge";
import {
  EMERGENCY_TYPE_LABELS,
  type DriverStatus,
  type EmergencyStatus,
  type EmergencyType,
  type MaintenanceStatus,
  type ServerBusStatus,
} from "@/types/faculty";

export function AdminBusStatusBadge({ status }: { status: ServerBusStatus }) {
  const map: Record<ServerBusStatus, { label: string; cls: string }> = {
    ACTIVE: { label: "Active", cls: "border-green-200 bg-green-50 text-green-700" },
    MAINTENANCE: { label: "Maintenance", cls: "border-amber-200 bg-amber-50 text-amber-700" },
    INACTIVE: { label: "Inactive", cls: "border-slate-200 bg-slate-100 text-slate-600" },
  };
  const s = map[status] ?? map.INACTIVE;
  return (
    <Badge variant="outline" className={s.cls}>
      {s.label}
    </Badge>
  );
}

export function DriverStatusBadge({ status }: { status: DriverStatus }) {
  const map: Record<DriverStatus, { label: string; cls: string }> = {
    ACTIVE: { label: "Active", cls: "border-green-200 bg-green-50 text-green-700" },
    INACTIVE: { label: "Inactive", cls: "border-slate-200 bg-slate-100 text-slate-600" },
    ON_LEAVE: { label: "On Leave", cls: "border-amber-200 bg-amber-50 text-amber-700" },
  };
  const s = map[status] ?? map.INACTIVE;
  return (
    <Badge variant="outline" className={s.cls}>
      {s.label}
    </Badge>
  );
}

export function EmergencyStatusBadge({ status }: { status: EmergencyStatus }) {
  const map: Record<EmergencyStatus, { label: string; cls: string }> = {
    ACTIVE: { label: "Active", cls: "border-red-200 bg-red-50 text-red-700" },
    ACKNOWLEDGED: { label: "Acknowledged", cls: "border-amber-200 bg-amber-50 text-amber-700" },
    RESOLVED: { label: "Resolved", cls: "border-green-200 bg-green-50 text-green-700" },
    CANCELLED: { label: "Cancelled", cls: "border-slate-200 bg-slate-100 text-slate-600" },
  };
  const s = map[status] ?? map.ACTIVE;
  return (
    <Badge variant="outline" className={s.cls}>
      {s.label}
    </Badge>
  );
}

export function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
  const map: Record<MaintenanceStatus, { label: string; cls: string }> = {
    scheduled: { label: "Scheduled", cls: "border-blue-200 bg-blue-50 text-blue-700" },
    in_progress: { label: "In Progress", cls: "border-amber-200 bg-amber-50 text-amber-700" },
    completed: { label: "Completed", cls: "border-green-200 bg-green-50 text-green-700" },
  };
  const s = map[status] ?? map.scheduled;
  return (
    <Badge variant="outline" className={s.cls}>
      {s.label}
    </Badge>
  );
}

export function EmergencyTypeBadge({ type }: { type: EmergencyType }) {
  const map: Record<string, string> = {
    ACCIDENT: "border-red-200 bg-red-50 text-red-700",
    BREAKDOWN: "border-amber-200 bg-amber-50 text-amber-700",
    MEDICAL: "border-rose-200 bg-rose-50 text-rose-700",
    SAFETY: "border-orange-200 bg-orange-50 text-orange-700",
    HARASSMENT: "border-purple-200 bg-purple-50 text-purple-700",
    SECURITY: "border-red-200 bg-red-50 text-red-700",
    OTHER: "border-slate-200 bg-slate-100 text-slate-600",
  };
  return (
    <Badge variant="outline" className={map[type] ?? map.OTHER}>
      {EMERGENCY_TYPE_LABELS[type] ?? type}
    </Badge>
  );
}
