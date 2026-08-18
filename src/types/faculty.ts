/**
 * DTMS domain types used by the Faculty panel.
 * Shapes mirror the transport server API (server/api/routes/*).
 */

export type ServerRole = "admin" | "teacher" | "student" | "parent";

export interface AuthUser {
  id: string;
  role: ServerRole;
  name: string;
  email: string;
  phone: string | null;
  department: string | null;
  year: string | null;
  section: string | null;
  rollNo: string | null;
  routeNumber: number | null;
  boardingStop: string | null;
  gender: string | null;
  isBusAdmin: boolean;
  childIds: string[];
  photoUrl: string | null;
  active?: boolean;
  createdAt?: number;
}

/** Public user shape returned by the server (publicUser middleware). */
export type PublicUser = AuthUser;

export interface TrackingBusItem {
  busId: string;
  routeNumber: number;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string | null;
  lat: number;
  lng: number;
  speedKmh: number;
  heading: number;
  nextStop: string;
  etaMinutes: number;
  stopTime: string;
}

/** Server bus.status values. */
export type ServerBusStatus = "active" | "maintenance" | "inactive";

export type DriverStatus = "active" | "inactive" | "on_leave";

export type EmergencyStatus = "active" | "acknowledged" | "resolved";

export type MaintenanceStatus = "scheduled" | "in_progress" | "completed";

export interface Driver {
  id: string;
  name: string;
  phone: string | null;
  licenseNumber: string | null;
  licenseExpiry: string | null;
  experienceYears: number | null;
  status: DriverStatus;
  assignedBusId: string | null;
  assignedBusRoute?: number | null;
  assignedVehicle?: string | null;
  createdAt?: number;
}

export interface MaintenanceRecord {
  id: string;
  busId: string;
  busNumber?: string | null;
  routeNumber?: number | null;
  type: string;
  serviceDate: string;
  nextServiceDate: string | null;
  description: string | null;
  cost: number | null;
  status: MaintenanceStatus;
  createdAt?: number;
  updatedAt?: number;
}

export interface SystemSettings {
  transportName: string;
  academicYear: string;
  complaintCategories: string[];
  emergencyCategories: string[];
  busStatusTypes: string[];
  notificationPreferences: Record<string, boolean>;
}

export interface AdminDashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalBuses: number;
  activeBuses: number;
  maintenanceBuses: number;
  inactiveBuses: number;
  totalDrivers: number;
  activeTrips: number;
  liveBuses: number;
  complaints: number;
  pendingComplaints: number;
  inProgressComplaints: number;
  resolvedComplaints: number;
  escalatedComplaints: number;
  feedback: number;
  todayPresent: number;
  activeEmergencies: number;
  maintenanceRecords: number;
}

export interface AdminDashboardBus {
  id: string;
  routeNumber: number;
  vehicleNumber: string;
  status: ServerBusStatus;
  driverName: string;
  driverId: string | null;
  busAdminCount: number;
}

export interface AdminDashboardResponse {
  role: ServerRole;
  stats: AdminDashboardStats;
  todayPassenger: {
    total: number;
    boys: number;
    girls: number;
    morning: number;
    evening: number;
  };
  recentComplaints: {
    id: string;
    category: string;
    status: ComplaintStatus;
    name: string;
    createdAt: number;
    routeNumber: number | null;
  }[];
  recentFeedback: {
    id: string;
    name: string;
    routeNumber: number | null;
    rating: number;
    message: string;
    createdAt: number;
  }[];
  activeEmergencies: EmergencyReport[];
  buses: AdminDashboardBus[];
  adminName: string;
  unread: number;
}

/** Derived display status for a bus. */
export type BusDisplayStatus = "Running" | "Stopped" | "Delayed" | "Breakdown" | "Not Started";

export interface BusInfo {
  id: string;
  routeNumber: number;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  capacity: number;
  status: ServerBusStatus;
  busAdminIds?: string[];
  createdAt?: number;
}

export interface BusAdminInfo {
  id: string;
  name: string;
  role: ServerRole;
  department: string | null;
  year: string | null;
  section: string | null;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  department: string | null;
  year: string | null;
  section: string | null;
  rollNo: string | null;
  routeNumber: number | null;
  boardingStop: string | null;
  isBusAdmin?: boolean;
}

export interface RouteStop {
  name: string;
  time: string;
  lat?: number;
  lng?: number;
}

export interface RoutePathPoint {
  lat: number;
  lng: number;
}

export interface RouteInfo {
  id: string;
  routeNumber: number;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  arrivalTime: string;
  boardingPoints: RouteStop[];
  stops: RouteStop[];
  path: RoutePathPoint[];
  active?: boolean;
}

export const COMPLAINT_CATEGORIES = [
  "Late Bus",
  "Bus Delay",
  "Cleanliness",
  "Safety",
  "Student Safety",
  "Bus Breakdown",
  "Vehicle Problem",
  "Seat Damage",
  "Route Issue",
  "Driver Issue",
  "Bus Stop Issue",
  "General Complaint",
  "Suggestion",
  "Other",
] as const;

export type ComplaintStatus = "pending" | "under_review" | "in_progress" | "resolved" | "escalated";

export const COMPLAINT_STATUSES: ComplaintStatus[] = [
  "pending",
  "under_review",
  "in_progress",
  "resolved",
  "escalated",
];

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  pending: "Pending",
  under_review: "Under Review",
  in_progress: "In Progress",
  resolved: "Resolved",
  escalated: "Escalated",
};

export interface ComplaintHistoryEntry {
  status: ComplaintStatus;
  at: number;
  by: string;
  byName?: string;
}

export interface Complaint {
  id: string;
  userId: string;
  name: string;
  role: ServerRole;
  category: string;
  busId: string | null;
  routeNumber: number | null;
  description: string;
  imageUrl: string | null;
  status: ComplaintStatus;
  adminResponse: string;
  history: ComplaintHistoryEntry[];
  createdAt: number;
  updatedAt: number;
  /** Enriched by the server for faculty/admin views. */
  studentRollNo?: string | null;
  studentDepartment?: string | null;
  studentYear?: string | null;
  studentBoardingStop?: string | null;
  busVehicleNumber?: string | null;
  historyByName?: ComplaintHistoryEntry[];
}

export interface ComplaintResponse {
  id: string;
  by: string;
  at: number;
  text: string;
}

export type AttendanceStatus = "present" | "absent";

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  busId: string | null;
  routeNumber: number | null;
  status: AttendanceStatus;
  checkInAt: string;
  checkInStop: string | null;
}

export interface AttendanceSummary {
  items: AttendanceRecord[];
  present: number;
  absent: number;
  total: number;
}

export type BoardingStatus = "boarded" | "not_boarded" | "not_scanned";

export type TripKind = "morning" | "evening";

/** Passenger count recorded by a faculty member for their assigned bus. */
export interface BusPassengerCount {
  id: string;
  date: string;
  busId: string;
  routeNumber: number | null;
  facultyId: string | null;
  tripType: TripKind;
  total: number;
  boys: number;
  girls: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface PassengerCountResponse {
  items: BusPassengerCount[];
  total: number;
}

export type NotificationType =
  | "Bus Delay"
  | "Route Change"
  | "Bus Replacement"
  | "Emergency"
  | "Complaint Update"
  | "Transport Announcement"
  | "General";

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: number;
}

export type EmergencyType = "accident" | "breakdown" | "medical" | "safety" | "other";

export const EMERGENCY_TYPES: { value: EmergencyType; label: string }[] = [
  { value: "accident", label: "Accident" },
  { value: "breakdown", label: "Bus Breakdown" },
  { value: "medical", label: "Medical Emergency" },
  { value: "safety", label: "Safety Issue" },
  { value: "other", label: "Other" },
];

export const EMERGENCY_TYPE_LABELS: Record<EmergencyType, string> = {
  accident: "Accident",
  breakdown: "Bus Breakdown",
  medical: "Medical Emergency",
  safety: "Safety Issue",
  other: "Other",
};

export const EMERGENCY_STATUS_LABELS: Record<EmergencyStatus, string> = {
  active: "Active",
  acknowledged: "Acknowledged",
  resolved: "Resolved",
};

export interface EmergencyReport {
  id: string;
  type: EmergencyType;
  description: string;
  location: string | null;
  busId: string | null;
  busNumber: string | null;
  routeNumber: number | null;
  reportedById: string;
  reportedByName: string;
  status: EmergencyStatus;
  adminResponse: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface TrackingPosition {
  lat: number;
  lng: number;
  speedKmh: number;
  heading: number;
  nextStop: string;
  etaMinutes: number;
  stopTime: string;
}

export interface TrackingResponse {
  route: RouteInfo;
  current: TrackingPosition;
}

export interface DashboardBusInfo {
  id: string;
  routeNumber: number;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  status: ServerBusStatus;
}

export interface DashboardRouteInfo {
  routeNumber: number;
  arrivalTime: string;
  stops: RouteStop[];
}

export interface DashboardResponse {
  role: ServerRole;
  user: AuthUser | null;
  myBus: DashboardBusInfo | null;
  route: DashboardRouteInfo | null;
  complaints: {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
  };
  unread: number;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}