/**
 * DTMS domain types.
 * Shapes match the NestJS backend API responses.
 */

export type ServerRole = "ADMIN" | "FACULTY" | "STUDENT";

export interface AuthUser {
  id: string;
  email: string;
  role: ServerRole;
  status: string;
}

/** Full student profile from /student/profile */
export interface StudentProfile {
  id: string;
  userId: string;
  email: string;
  registerNumber: string;
  name: string;
  phone: string | null;
  department: string | null;
  year: string | null;
  section: string | null;
  gender: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  transport?: {
    bus: {
      id: string;
      busNumber: number;
      registrationNumber: string;
      driver: { id: string; name: string; phone: string | null } | null;
      route: {
        id: string;
        routeCode: string;
        routeName: string;
        stops: {
          stopOrder: number;
          estimatedArrivalTime: string | null;
          busStop: { id: string; name: string; latitude: number | null; longitude: number | null };
        }[];
      } | null;
    } | null;
    busStop: { id: string; stopCode: string; name: string; latitude: number | null; longitude: number | null } | null;
    startDate: string;
    status: string;
  } | null;
}

/** Full faculty profile from /faculty/profile */
export interface FacultyProfile {
  id: string;
  userId: string;
  email: string;
  facultyId: string;
  name: string;
  phone: string | null;
  department: string | null;
  designation: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  transport?: {
    bus: {
      id: string;
      busNumber: number;
      registrationNumber: string;
      driver: { id: string; name: string; phone: string | null } | null;
      route: {
        id: string;
        routeCode: string;
        routeName: string;
        stops: {
          stopOrder: number;
          estimatedArrivalTime: string | null;
          busStop: { id: string; name: string; latitude: number | null; longitude: number | null };
        }[];
      } | null;
    } | null;
    startDate: string;
    status: string;
  } | null;
}

export interface Paginated<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Bus ────────────────────────────────────────────
export type ServerBusStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

export interface BusInfo {
  id: string;
  busNumber: number;
  registrationNumber: string;
  capacity: number;
  boysCapacity: number | null;
  girlsCapacity: number | null;
  driverId: string | null;
  driver: { id: string; driverCode: string; name: string; phone: string | null } | null;
  status: ServerBusStatus;
  createdAt: string;
  updatedAt: string;
}

export type BusDisplayStatus = "Running" | "Stopped" | "Delayed" | "Breakdown" | "Not Started";

// ─── Driver ─────────────────────────────────────────
export type DriverStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE";

export interface Driver {
  id: string;
  driverCode: string;
  name: string;
  phone: string | null;
  alternatePhone: string | null;
  licenseNumber: string;
  licenseExpiry: string | null;
  experienceYears: number | null;
  address: string | null;
  status: DriverStatus;
  assignedBus: { id: string; busNumber: number; registrationNumber: string } | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Student (admin list view) ──────────────────────
export interface StudentListItem {
  id: string;
  userId: string;
  email: string;
  registerNumber: string;
  name: string;
  phone: string | null;
  department: string | null;
  year: string | null;
  section: string | null;
  gender: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Faculty (admin list view) ──────────────────────
export interface FacultyListItem {
  id: string;
  userId: string;
  email: string;
  facultyId: string;
  name: string;
  phone: string | null;
  department: string | null;
  designation: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Route ──────────────────────────────────────────
export interface RouteStop {
  name: string;
  time: string;
  lat?: number;
  lng?: number;
}

export interface RouteInfo {
  id: string;
  routeCode: string;
  routeName: string;
  description: string | null;
  status: string;
  stops: RouteStop[];
  createdAt: string;
  updatedAt: string;
}

// ─── Bus Stop ───────────────────────────────────────
export interface BusStop {
  id: string;
  stopCode: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Transport Assignment ───────────────────────────
export interface TransportAssignment {
  id: string;
  studentId?: string;
  facultyId?: string;
  bus: {
    id: string;
    busNumber: number;
    registrationNumber: string;
    driver: { id: string; name: string; phone: string | null } | null;
    route: {
      id: string;
      routeCode: string;
      routeName: string;
      stops: {
        stopOrder: number;
        estimatedArrivalTime: string | null;
        busStop: { id: string; name: string; latitude: number | null; longitude: number | null };
      }[];
    } | null;
  } | null;
  busStop: { id: string; stopCode: string; name: string; latitude: number | null; longitude: number | null } | null;
  startDate: string;
  endDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Complaint ──────────────────────────────────────
export type ComplaintStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "REJECTED";
export type ComplaintPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type ComplaintCategory = "BUS" | "DRIVER" | "ROUTE" | "BUS_STOP" | "ATTENDANCE" | "SAFETY" | "OTHER";

export interface Complaint {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: ComplaintStatus;
  bus: { id: string; busNumber: number } | null;
  driver: { id: string; name: string } | null;
  route: { id: string; routeCode: string; routeName: string } | null;
  busStop: { id: string; name: string } | null;
  student?: { id: string; name: string; registerNumber: string };
  resolutionNote: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Feedback ───────────────────────────────────────
export type FeedbackStatus = "SUBMITTED" | "REVIEWED" | "RESOLVED";
export type FeedbackCategory = "BUS" | "ROUTE" | "DRIVER" | "FACULTY" | "SERVICE" | "OTHER";

export interface Feedback {
  id: string;
  subject: string;
  message: string;
  rating: number;
  category: string;
  status: FeedbackStatus;
  student?: { id: string; name: string; registerNumber: string };
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Attendance ─────────────────────────────────────
export interface AttendanceRecord {
  id: string;
  bus: { id: string; busNumber: number; capacity: number };
  faculty: { id: string; name: string } | null;
  facultyId?: string;
  date: string;
  tripType: "MORNING" | "EVENING";
  boysCount: number;
  girlsCount: number;
  totalCount: number;
  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus = "present" | "absent";
export type BoardingStatus = "boarded" | "not_boarded" | "not_scanned";
export type TripKind = "morning" | "evening";

export interface AttendanceSummary {
  items: AttendanceRecord[];
  present: number;
  absent: number;
  total: number;
}

// ─── Emergency ──────────────────────────────────────
export type EmergencyType = "MEDICAL" | "ACCIDENT" | "SAFETY" | "BREAKDOWN" | "HARASSMENT" | "SECURITY" | "OTHER";
export type EmergencyStatus = "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED" | "CANCELLED";

export const EMERGENCY_TYPES: { value: EmergencyType; label: string }[] = [
  { value: "MEDICAL", label: "Medical Emergency" },
  { value: "ACCIDENT", label: "Accident" },
  { value: "SAFETY", label: "Safety Issue" },
  { value: "BREAKDOWN", label: "Bus Breakdown" },
  { value: "HARASSMENT", label: "Harassment" },
  { value: "SECURITY", label: "Security Threat" },
  { value: "OTHER", label: "Other" },
];

export const EMERGENCY_TYPE_LABELS: Record<EmergencyType, string> = {
  MEDICAL: "Medical Emergency",
  ACCIDENT: "Accident",
  SAFETY: "Safety Issue",
  BREAKDOWN: "Bus Breakdown",
  HARASSMENT: "Harassment",
  SECURITY: "Security Threat",
  OTHER: "Other",
};

export const EMERGENCY_STATUS_LABELS: Record<EmergencyStatus, string> = {
  ACTIVE: "Active",
  ACKNOWLEDGED: "Acknowledged",
  RESOLVED: "Resolved",
  CANCELLED: "Cancelled",
};

export interface EmergencyReport {
  id: string;
  role?: string;
  type: EmergencyType;
  priority: string;
  status: EmergencyStatus;
  message: string | null;
  latitude: number | null;
  longitude: number | null;
  locationAccuracy?: number | null;
  student?: { id: string; name: string; registerNumber: string };
  faculty?: { id: string; name: string; facultyId: string };
  bus?: { id: string; busNumber: number; registrationNumber: string; driver?: { id: string; name: string; phone: string | null } };
  route?: { id: string; routeCode: string; routeName: string };
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Notification ───────────────────────────────────
export type NotificationType = "EMERGENCY" | "COMPLAINT" | "FEEDBACK" | "TRANSPORT" | "SYSTEM";

export interface NotificationItem {
  id: string;
  type: string;
  channel: string;
  title: string;
  message: string;
  status: string;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    student?: { id: string; name: string; registerNumber: string };
    faculty?: { id: string; name: string; facultyId: string };
  };
}

// ─── Schedule ───────────────────────────────────────
export interface Schedule {
  id: string;
  bus: { id: string; busNumber: number; registrationNumber: string; status: string };
  route: { id: string; routeCode: string; routeName: string };
  tripType: "MORNING" | "EVENING";
  departureTime: string;
  expectedArrivalTime: string;
  effectiveFrom: string;
  effectiveUntil: string | null;
  status: "ACTIVE" | "INACTIVE" | "CANCELLED";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  overrides?: ScheduleOverride[];
}

export interface ScheduleOverride {
  id: string;
  scheduleId: string;
  date: string;
  status: "SCHEDULED" | "CANCELLED" | "REPLACED";
  reason: string | null;
  replacementBus: { id: string; busNumber: number } | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentSchedule {
  assignment: { busId: string; busNumber: number };
  schedules: {
    id: string;
    tripType: "MORNING" | "EVENING";
    departureTime: string;
    expectedArrivalTime: string;
    effectiveBus: { id: string; busNumber: number };
    originalBus?: { id: string; busNumber: number };
    route: { id: string; routeCode: string; routeName: string };
    effectiveFrom: string;
    effectiveUntil: string | null;
    tripStatus: "SCHEDULED" | "REPLACED" | "CANCELLED";
    override?: { id: string; status: string; reason: string };
  }[];
}

// ─── Analytics ──────────────────────────────────────
export interface AnalyticsDashboard {
  users: { students: number; faculty: number };
  transport: { buses: number; activeBuses: number; routes: number; activeStudentAssignments: number; activeFacultyAssignments: number };
  attendance: { today: { records: number; present: number; boys: number; girls: number } };
  operations: { activeEmergencies: number; openComplaints: number; pendingFeedback: number };
  schedules: { active: number; cancelled: number };
  notifications: { total: number; failed: number };
}

export interface AnalyticsOverview extends AnalyticsDashboard {
  dateRange: { from: string; to: string };
  attendance: AnalyticsDashboard["attendance"] & {
    totalRecords: number;
    totalPassengers: number;
    totalBoys: number;
    totalGirls: number;
    averagePassengers: number | null;
  };
}

export interface AnalyticsAttendanceSummary {
  dateRange: { from: string; to: string };
  totalRecords: number;
  totalPassengers: number;
  totalBoys: number;
  totalGirls: number;
  averagePassengers: number | null;
}

export interface DailyAttendance {
  date: string;
  boys: number;
  girls: number;
  total: number;
  records: number;
}

export interface BusAnalytics {
  busId: string;
  busNumber: number;
  registrationNumber: string;
  capacity: number;
  status: string;
  route: { id: string; routeCode: string; routeName: string } | null;
  assignedStudents: number;
  assignedFaculty: number;
  attendanceCount: number;
  utilizationPercentage: number | null;
}

export interface RouteAnalytics {
  routeId: string;
  routeCode: string;
  routeName: string;
  status: string;
  totalBuses: number;
  assignedStudents: number;
  assignedFaculty: number;
  totalPassengers: number;
  attendanceCount: number;
  complaints: number;
  emergencies: number;
}

export interface AssignmentAnalytics {
  students: { total: number; assigned: number; unassigned: number };
  faculty: { total: number; assigned: number; unassigned: number };
}

export interface ComplaintAnalytics {
  dateRange: { from: string; to: string };
  total: number;
  open: number;
  inReview: number;
  resolved: number;
  rejected: number;
  byCategory: { category: string; count: number }[];
}

export interface FeedbackAnalytics {
  dateRange: { from: string; to: string };
  total: number;
  submitted: number;
  reviewed: number;
  resolved: number;
  averageRating: number | null;
  byCategory: { category: string; count: number }[];
}

export interface EmergencyAnalytics {
  dateRange: { from: string; to: string };
  total: number;
  active: number;
  acknowledged: number;
  resolved: number;
  cancelled: number;
  byType: { type: string; count: number }[];
  byRole: { role: string; count: number }[];
}

export interface ScheduleAnalytics {
  active: number;
  inactive: number;
  cancelled: number;
  overrides: { scheduled: number; cancelled: number; replaced: number };
}

export interface NotificationAnalytics {
  dateRange: { from: string; to: string };
  total: number;
  byChannel: { whatsapp: number; inApp: number };
  byStatus: { pending: number; sent: number; delivered: number; read: number; failed: number };
  deliverySuccessRate: number | null;
}

// ─── Maintenance ────────────────────────────────────
export type MaintenanceStatus = "scheduled" | "in_progress" | "completed";

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
  createdAt?: string;
  updatedAt?: string;
}

// ─── Legacy / Dashboard ─────────────────────────────
export type BusPassengerCount = AttendanceRecord;

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
  complaints: { total: number; pending: number; inProgress: number; resolved: number };
  unread: number;
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

export const COMPLAINT_CATEGORIES = [
  "BUS", "DRIVER", "ROUTE", "BUS_STOP", "ATTENDANCE", "SAFETY", "OTHER",
] as const;

export const COMPLAINT_STATUSES: ComplaintStatus[] = [
  "OPEN", "IN_REVIEW", "RESOLVED", "REJECTED",
];

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  OPEN: "Open",
  IN_REVIEW: "In Review",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
};
