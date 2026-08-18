import 'user.dart';
import 'domain.dart';

class AdminStats {
  final int totalStudents;
  final int totalTeachers;
  final int totalParents;
  final int totalBuses;
  final int activeTrips;
  final int liveBuses;
  final int complaints;
  final int pendingComplaints;
  final int inProgressComplaints;
  final int resolvedComplaints;
  final int feedback;
  final int todayPresent;

  const AdminStats({
    this.totalStudents = 0,
    this.totalTeachers = 0,
    this.totalParents = 0,
    this.totalBuses = 0,
    this.activeTrips = 0,
    this.liveBuses = 0,
    this.complaints = 0,
    this.pendingComplaints = 0,
    this.inProgressComplaints = 0,
    this.resolvedComplaints = 0,
    this.feedback = 0,
    this.todayPresent = 0,
  });

  factory AdminStats.fromJson(Map<String, dynamic> json) => AdminStats(
        totalStudents: (json['totalStudents'] as num?)?.toInt() ?? 0,
        totalTeachers: (json['totalTeachers'] as num?)?.toInt() ?? 0,
        totalParents: (json['totalParents'] as num?)?.toInt() ?? 0,
        totalBuses: (json['totalBuses'] as num?)?.toInt() ?? 0,
        activeTrips: (json['activeTrips'] as num?)?.toInt() ?? 0,
        liveBuses: (json['liveBuses'] as num?)?.toInt() ?? 0,
        complaints: (json['complaints'] as num?)?.toInt() ?? 0,
        pendingComplaints: (json['pendingComplaints'] as num?)?.toInt() ?? 0,
        inProgressComplaints: (json['inProgressComplaints'] as num?)?.toInt() ?? 0,
        resolvedComplaints: (json['resolvedComplaints'] as num?)?.toInt() ?? 0,
        feedback: (json['feedback'] as num?)?.toInt() ?? 0,
        todayPresent: (json['todayPresent'] as num?)?.toInt() ?? 0,
      );
}

class MyBusInfo {
  final String id;
  final int routeNumber;
  final String vehicleNumber;
  final String driverName;
  final String driverPhone;
  final String status;

  const MyBusInfo({
    required this.id,
    required this.routeNumber,
    required this.vehicleNumber,
    this.driverName = '',
    this.driverPhone = '',
    this.status = 'active',
  });

  factory MyBusInfo.fromJson(Map<String, dynamic> json) => MyBusInfo(
        id: json['id']?.toString() ?? '',
        routeNumber: (json['routeNumber'] as num?)?.toInt() ?? 0,
        vehicleNumber: json['vehicleNumber']?.toString() ?? '',
        driverName: json['driverName']?.toString() ?? '',
        driverPhone: json['driverPhone']?.toString() ?? '',
        status: json['status']?.toString() ?? 'active',
      );
}

class MyRouteInfo {
  final int routeNumber;
  final String arrivalTime;
  final List<BoardingStopSummary> stops;

  const MyRouteInfo({required this.routeNumber, required this.arrivalTime, this.stops = const []});

  factory MyRouteInfo.fromJson(Map<String, dynamic> json) => MyRouteInfo(
        routeNumber: (json['routeNumber'] as num?)?.toInt() ?? 0,
        arrivalTime: json['arrivalTime']?.toString() ?? '',
        stops: (json['stops'] as List?)
                ?.map((e) => BoardingStopSummary.fromJson(e as Map<String, dynamic>))
                .toList() ??
            const [],
      );
}

class BoardingStopSummary {
  final String name;
  final String time;

  const BoardingStopSummary({required this.name, required this.time});

  factory BoardingStopSummary.fromJson(Map<String, dynamic> json) => BoardingStopSummary(
        name: json['name']?.toString() ?? '',
        time: json['time']?.toString() ?? '',
      );
}

class ChildSummary {
  final String id;
  final String name;
  final String? department;
  final String? year;
  final String? section;
  final int? routeNumber;
  final String? boardingStop;

  const ChildSummary({
    required this.id,
    required this.name,
    this.department,
    this.year,
    this.section,
    this.routeNumber,
    this.boardingStop,
  });

  factory ChildSummary.fromJson(Map<String, dynamic> json) => ChildSummary(
        id: json['id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        department: json['department']?.toString(),
        year: json['year']?.toString(),
        section: json['section']?.toString(),
        routeNumber: (json['routeNumber'] as num?)?.toInt(),
        boardingStop: json['boardingStop']?.toString(),
      );
}

class DashboardData {
  final String role;
  final User? user;
  final MyBusInfo? myBus;
  final MyRouteInfo? route;
  final ComplaintSummary? complaints;
  final int unread;
  final bool isBusAdmin;
  final AttendanceSummary? attendance;
  final List<ChildSummary> children;

  const DashboardData({
    this.role = 'student',
    this.user,
    this.myBus,
    this.route,
    this.complaints,
    this.unread = 0,
    this.isBusAdmin = false,
    this.attendance,
    this.children = const [],
  });

  factory DashboardData.fromJson(Map<String, dynamic> json) => DashboardData(
        role: json['role']?.toString() ?? 'student',
        user: json['user'] is Map ? User.fromJson(json['user'] as Map<String, dynamic>) : null,
        myBus: json['myBus'] is Map ? MyBusInfo.fromJson(json['myBus'] as Map<String, dynamic>) : null,
        route: json['route'] is Map ? MyRouteInfo.fromJson(json['route'] as Map<String, dynamic>) : null,
        complaints: json['complaints'] is Map
            ? ComplaintSummary.fromJson(json['complaints'] as Map<String, dynamic>)
            : null,
        unread: (json['unread'] as num?)?.toInt() ?? 0,
        isBusAdmin: json['isBusAdmin'] == true,
        attendance: json['attendance'] is Map
            ? AttendanceSummary.fromJson(json['attendance'] as Map<String, dynamic>)
            : null,
        children: (json['children'] as List?)
                ?.map((e) => ChildSummary.fromJson(e as Map<String, dynamic>))
                .toList() ??
            const [],
      );
}

class ComplaintSummary {
  final int total;
  final int pending;
  final int inProgress;
  final int resolved;

  const ComplaintSummary({this.total = 0, this.pending = 0, this.inProgress = 0, this.resolved = 0});

  factory ComplaintSummary.fromJson(Map<String, dynamic> json) => ComplaintSummary(
        total: (json['total'] as num?)?.toInt() ?? 0,
        pending: (json['pending'] as num?)?.toInt() ?? 0,
        inProgress: (json['inProgress'] as num?)?.toInt() ?? 0,
        resolved: (json['resolved'] as num?)?.toInt() ?? 0,
      );
}

class AttendanceSummary {
  final String today; // present | absent | not_checked
  final int presentCount;

  const AttendanceSummary({this.today = 'not_checked', this.presentCount = 0});

  factory AttendanceSummary.fromJson(Map<String, dynamic> json) => AttendanceSummary(
        today: json['today']?.toString() ?? 'not_checked',
        presentCount: (json['presentCount'] as num?)?.toInt() ?? 0,
      );
}

class AdminDashboardData {
  final AdminStats stats;
  final List<Complaint> recentComplaints;
  final List<FeedbackEntry> recentFeedback;
  final List<MiniBus> buses;
  final String adminName;
  final int unread;

  const AdminDashboardData({
    required this.stats,
    this.recentComplaints = const [],
    this.recentFeedback = const [],
    this.buses = const [],
    this.adminName = 'Super Admin',
    this.unread = 0,
  });

  factory AdminDashboardData.fromJson(Map<String, dynamic> json) => AdminDashboardData(
        stats: AdminStats.fromJson(json['stats'] as Map<String, dynamic>? ?? {}),
        recentComplaints: (json['recentComplaints'] as List?)
                ?.map((e) => Complaint.fromJson(e as Map<String, dynamic>))
                .toList() ??
            const [],
        recentFeedback: (json['recentFeedback'] as List?)
                ?.map((e) => FeedbackEntry.fromJson(e as Map<String, dynamic>))
                .toList() ??
            const [],
        buses: (json['buses'] as List?)?.map((e) => MiniBus.fromJson(e as Map<String, dynamic>)).toList() ?? const [],
        adminName: json['adminName']?.toString() ?? 'Super Admin',
        unread: (json['unread'] as num?)?.toInt() ?? 0,
      );
}

class MiniBus {
  final String id;
  final int routeNumber;
  final String vehicleNumber;
  final String status;
  final int busAdminCount;

  const MiniBus({
    required this.id,
    required this.routeNumber,
    required this.vehicleNumber,
    required this.status,
    this.busAdminCount = 0,
  });

  factory MiniBus.fromJson(Map<String, dynamic> json) => MiniBus(
        id: json['id']?.toString() ?? '',
        routeNumber: (json['routeNumber'] as num?)?.toInt() ?? 0,
        vehicleNumber: json['vehicleNumber']?.toString() ?? '',
        status: json['status']?.toString() ?? 'active',
        busAdminCount: (json['busAdminCount'] as num?)?.toInt() ?? 0,
      );
}

class ReportSummary {
  final Map<String, int> totals;
  final Map<String, int> complaintsByStatus;
  final Map<String, int> complaintsByCategory;
  final int attendanceRate;

  const ReportSummary({
    this.totals = const {},
    this.complaintsByStatus = const {},
    this.complaintsByCategory = const {},
    this.attendanceRate = 0,
  });

  int get maxCategory =>
      complaintsByCategory.values.fold(0, (a, b) => a > b ? a : b);

  factory ReportSummary.fromJson(Map<String, dynamic> json) => ReportSummary(
        totals: (json['totals'] as Map?)
                ?.map((k, v) => MapEntry(k.toString(), (v as num?)?.toInt() ?? 0)) ??
            const {},
        complaintsByStatus: (json['complaintsByStatus'] as Map?)
                ?.map((k, v) => MapEntry(k.toString(), (v as num?)?.toInt() ?? 0)) ??
            const {},
        complaintsByCategory: (json['complaintsByCategory'] as Map?)
                ?.map((k, v) => MapEntry(k.toString(), (v as num?)?.toInt() ?? 0)) ??
            const {},
        attendanceRate: (json['attendanceRate'] as num?)?.toInt() ?? 0,
      );
}

class QrPass {
  final String studentId;
  final String name;
  final String department;
  final String year;
  final String section;
  final int? routeNumber;
  final String? vehicleNumber;
  final String boardingStop;
  final String validTill;
  final String qrPayload;

  const QrPass({
    required this.studentId,
    required this.name,
    this.department = '',
    this.year = '',
    this.section = '',
    this.routeNumber,
    this.vehicleNumber,
    this.boardingStop = '',
    required this.validTill,
    required this.qrPayload,
  });

  factory QrPass.fromJson(Map<String, dynamic> json) => QrPass(
        studentId: json['pass'] is Map ? json['pass']['studentId']?.toString() ?? '' : '',
        name: json['pass'] is Map ? json['pass']['name']?.toString() ?? '' : '',
        department: json['pass'] is Map ? json['pass']['department']?.toString() ?? '' : '',
        year: json['pass'] is Map ? json['pass']['year']?.toString() ?? '' : '',
        section: json['pass'] is Map ? json['pass']['section']?.toString() ?? '' : '',
        routeNumber: json['pass'] is Map ? (json['pass']['routeNumber'] as num?)?.toInt() : null,
        vehicleNumber: json['pass'] is Map ? json['pass']['vehicleNumber']?.toString() : null,
        boardingStop: json['pass'] is Map ? json['pass']['boardingStop']?.toString() ?? '' : '',
        validTill: json['pass'] is Map ? json['pass']['validTill']?.toString() ?? '' : '',
        qrPayload: json['qrPayload']?.toString() ?? '',
      );
}
