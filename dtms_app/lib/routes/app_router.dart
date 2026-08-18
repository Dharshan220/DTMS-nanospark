import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/admin/admin_management_shell.dart';
import '../features/admin/buses_management_page.dart';
import '../features/admin/qr_admin_page.dart';
import '../features/admin/reports_page.dart';
import '../features/admin/routes_management_page.dart';
import '../features/admin/users_management_page.dart';
import '../features/auth/login_page.dart';
import '../features/auth/splash_page.dart';
import '../features/complaints/complaint_detail_page.dart';
import '../features/complaints/complaints_page.dart';
import '../features/complaints/new_complaint_page.dart';
import '../features/dashboard/home_shell.dart';
import '../features/feedback/feedback_page.dart';
import '../features/notifications/notifications_page.dart';
import '../features/profile/profile_page.dart';
import '../features/qr/qr_pass_page.dart';
import '../features/settings/settings_page.dart';
import '../features/tracking/tracking_page.dart';
import '../providers/auth_controller.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authControllerProvider);

  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final loggedIn = authState.user != null;
      final atLogin = state.matchedLocation == '/login';
      final atSplash = state.matchedLocation == '/splash';

      if (authState.initializing) {
        return atSplash ? null : '/splash';
      }
      if (!loggedIn) {
        return atLogin ? null : '/login';
      }
      if (atLogin || atSplash) {
        return '/home';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashPage(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const HomeShell(),
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) => const SettingsPage(),
      ),
      GoRoute(
        path: '/notifications',
        builder: (context, state) => const NotificationsPage(),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfilePage(),
      ),
      GoRoute(
        path: '/tracking',
        builder: (context, state) => const TrackingPage(),
      ),
      GoRoute(
        path: '/qr',
        builder: (context, state) => const QrPassPage(),
      ),
      GoRoute(
        path: '/feedback',
        builder: (context, state) => const FeedbackPage(),
      ),
      GoRoute(
        path: '/complaints',
        builder: (context, state) => const ComplaintsPage(),
      ),
      GoRoute(
        path: '/complaints/new',
        builder: (context, state) => const NewComplaintPage(),
      ),
      GoRoute(
        path: '/complaints/:id',
        builder: (context, state) =>
            ComplaintDetailPage(id: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/admin',
        builder: (context, state) => const AdminManagementShell(),
      ),
      GoRoute(
        path: '/admin/users',
        builder: (context, state) => const UsersManagementPage(),
      ),
      GoRoute(
        path: '/admin/buses',
        builder: (context, state) => const BusesManagementPage(),
      ),
      GoRoute(
        path: '/admin/routes',
        builder: (context, state) => const RoutesManagementPage(),
      ),
      GoRoute(
        path: '/admin/complaints',
        builder: (context, state) => const ComplaintsPage(),
      ),
      GoRoute(
        path: '/admin/feedback',
        builder: (context, state) => const FeedbackAdminPage(),
      ),
      GoRoute(
        path: '/admin/reports',
        builder: (context, state) => const ReportsPage(),
      ),
      GoRoute(
        path: '/admin/broadcast',
        builder: (context, state) => const BroadcastPage(),
      ),
      GoRoute(
        path: '/admin/qr',
        builder: (context, state) => const QrAdminPage(),
      ),
    ],
  );
});
