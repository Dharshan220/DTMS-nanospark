import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../models/user.dart';
import '../../providers/auth_controller.dart';
import '../complaints/complaints_page.dart';
import '../notifications/notifications_page.dart';
import '../profile/profile_page.dart';
import '../settings/settings_page.dart';
import '../tracking/tracking_page.dart';
import '../qr/qr_pass_page.dart';
import 'admin_dashboard.dart';
import 'parent_dashboard.dart';
import 'student_dashboard.dart';
import 'teacher_dashboard.dart';

class HomeShell extends ConsumerStatefulWidget {
  const HomeShell({super.key});

  @override
  ConsumerState<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends ConsumerState<HomeShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final role = user?.role ?? UserRole.student;

    final screens = _screensFor(role);
    final tabs = _tabsFor(role);

    if (_index >= tabs.length) _index = 0;

    return Scaffold(
      body: IndexedStack(index: _index, children: screens),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: tabs
            .map((t) => NavigationDestination(
                  icon: Icon(t.icon),
                  selectedIcon: Icon(t.selectedIcon),
                  label: t.label,
                ))
            .toList(),
      ),
    );
  }

  List<Widget> _screensFor(UserRole role) {
    switch (role) {
      case UserRole.admin:
        return const [
          AdminDashboard(),
          TrackingPage(),
          ComplaintsPage(),
          _MorePage(),
        ];
      case UserRole.teacher:
        return const [
          TeacherDashboard(),
          TrackingPage(),
          _MorePage(),
        ];
      case UserRole.parent:
        return const [
          ParentDashboard(),
          TrackingPage(),
          _MorePage(),
        ];
      case UserRole.student:
        return const [
          StudentDashboard(),
          TrackingPage(),
          QrPassPage(),
          ComplaintsPage(),
          _MorePage(),
        ];
    }
  }

  List<_Tab> _tabsFor(UserRole role) {
    switch (role) {
      case UserRole.admin:
        return const [
          _Tab('Home', Icons.space_dashboard_outlined, Icons.space_dashboard),
          _Tab('Live Map', Icons.map_outlined, Icons.map),
          _Tab('Complaints', Icons.report_problem_outlined, Icons.report_problem),
          _Tab('More', Icons.more_horiz, Icons.more_horiz),
        ];
      case UserRole.teacher:
        return const [
          _Tab('Home', Icons.space_dashboard_outlined, Icons.space_dashboard),
          _Tab('Live Map', Icons.map_outlined, Icons.map),
          _Tab('More', Icons.more_horiz, Icons.more_horiz),
        ];
      case UserRole.parent:
        return const [
          _Tab('Home', Icons.space_dashboard_outlined, Icons.space_dashboard),
          _Tab('Track Bus', Icons.directions_bus_outlined, Icons.directions_bus),
          _Tab('More', Icons.more_horiz, Icons.more_horiz),
        ];
      case UserRole.student:
        return const [
          _Tab('Home', Icons.space_dashboard_outlined, Icons.space_dashboard),
          _Tab('Track', Icons.map_outlined, Icons.map),
          _Tab('QR Pass', Icons.qr_code_2, Icons.qr_code_2),
          _Tab('Complaints', Icons.report_problem_outlined, Icons.report_problem),
          _Tab('More', Icons.more_horiz, Icons.more_horiz),
        ];
    }
  }
}

class _Tab {
  final String label;
  final IconData icon;
  final IconData selectedIcon;

  const _Tab(this.label, this.icon, this.selectedIcon);
}

class _MorePage extends ConsumerWidget {
  const _MorePage();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final logout = ref.read(authControllerProvider.notifier).logout;
    final navigator = Navigator.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('More')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (user != null)
            Card(
              child: ListTile(
                leading: CircleAvatar(
                  radius: 26,
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  child: Text(
                    user.name.isNotEmpty ? user.name[0].toUpperCase() : '?',
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
                  ),
                ),
                title: Text(user.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                subtitle: Text('${user.role.label} · ${user.department ?? ''}'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => navigator.push(
                  MaterialPageRoute(builder: (_) => const ProfilePage()),
                ),
              ),
            ),
          const SizedBox(height: 8),
          ListTile(
            leading: const Icon(Icons.notifications_outlined),
            title: const Text('Notifications'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => navigator.push(
              MaterialPageRoute(builder: (_) => const NotificationsPage()),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.settings_outlined),
            title: const Text('Settings'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => navigator.push(
              MaterialPageRoute(builder: (_) => const SettingsPage()),
            ),
          ),
          const Divider(height: 24),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.redAccent),
            title: const Text('Logout', style: TextStyle(color: Colors.redAccent)),
            onTap: () async {
              await logout();
              if (context.mounted) {
                context.go('/login');
              }
            },
          ),
        ],
      ),
    );
  }
}
