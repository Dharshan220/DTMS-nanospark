/// Central place for every API endpoint path used by Dio.
class ApiEndpoints {
  ApiEndpoints._();

  // Auth
  static const login = '/api/auth/login';
  static const me = '/api/auth/me';
  static const updateProfile = '/api/auth/profile';
  static const changePassword = '/api/auth/change-password';

  // Dashboard
  static const dashboard = '/api/dashboard';

  // Users (admin)
  static const users = '/api/users';

  // Buses
  static const buses = '/api/buses';

  // Routes & transport
  static const routes = '/api/routes';

  // Complaints
  static const complaints = '/api/complaints';
  static const complaintCategories = '/api/complaints/categories';

  // Feedback
  static const feedbackCategories = '/api/feedback-data/categories';
  static const feedback = '/api/feedback';

  // Notifications
  static const notifications = '/api/notifications';
  static const registerDevice = '/api/notifications/devices/fcm';

  // Attendance
  static const attendance = '/api/attendance';
  static const attendanceCheckIn = '/api/attendance/check-in';

  // Tracking
  static const trackingBuses = '/api/tracking/buses';
  static const trackingMy = '/api/tracking/my';

  // QR pass
  static const qrPass = '/api/qr/pass';

  // Reports (admin)
  static const reportsSummary = '/api/reports/summary';
  static const reportsComplaints = '/api/reports/complaints';
  static const reportsAttendance = '/api/reports/attendance';
  static const reportsFeedback = '/api/reports/feedback';
}
