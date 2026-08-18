import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../theme/app_theme.dart';
import '../../widgets/common.dart';
import 'student_dashboard.dart' show userDashboardProvider;

class TeacherDashboard extends ConsumerWidget {
  const TeacherDashboard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(userDashboardProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Transport'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(userDashboardProvider),
          ),
        ],
      ),
      body: async.when(
        loading: () => const Padding(padding: EdgeInsets.all(16), child: ListShimmer()),
        error: (e, _) => EmptyState(
          message: 'Could not load dashboard.\n$e',
          icon: Icons.cloud_off,
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(userDashboardProvider),
        ),
        data: (data) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(userDashboardProvider),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              HeroBanner(
                title: 'Hi, ${data.user?.name.split(' ').first ?? 'Teacher'}!',
                subtitle: data.myBus != null
                    ? 'Your bus: Route ${data.myBus!.routeNumber} · ${data.myBus!.vehicleNumber}'
                    : 'No bus assigned. Contact the transport office.',
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: StatCard(
                      label: 'My Bus',
                      value: data.myBus != null ? 'R${data.myBus!.routeNumber}' : '—',
                      icon: Icons.directions_bus_filled,
                      color: AppColors.yellowDark,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: StatCard(
                      label: 'Complaints',
                      value: '${data.complaints?.total ?? 0}',
                      icon: Icons.report_problem_outlined,
                      color: AppColors.warning,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              SectionHeader(title: 'Quick actions'),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _ActionTile(
                      icon: Icons.map_outlined,
                      label: 'Live Tracking',
                      onTap: () => context.push('/tracking'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _ActionTile(
                      icon: Icons.report_problem_outlined,
                      label: 'Raise Complaint',
                      onTap: () => context.push('/complaints/new'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _ActionTile(
                      icon: Icons.notifications_outlined,
                      label: 'Notifications',
                      onTap: () => context.push('/notifications'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _ActionTile(
                      icon: Icons.person_outline,
                      label: 'Profile',
                      onTap: () => context.push('/profile'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              if (data.route != null) ...[
                SectionHeader(title: 'My Route (${data.route!.routeNumber})'),
                const SizedBox(height: 12),
                AppCard(
                  child: Column(
                    children: data.route!.stops
                        .map((s) => Padding(
                              padding: const EdgeInsets.symmetric(vertical: 5),
                              child: Row(
                                children: [
                                  Icon(Icons.circle,
                                      size: 9, color: AppColors.yellowDark),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(s.name,
                                        style: const TextStyle(fontWeight: FontWeight.w600)),
                                  ),
                                  Text(s.time,
                                      style: TextStyle(
                                          fontSize: 12.5, color: Colors.grey.shade500)),
                                ],
                              ),
                            ))
                        .toList(),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _ActionTile({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: onTap,
      child: AppCard(
        padding: const EdgeInsets.symmetric(vertical: 18),
        child: Column(
          children: [
            Icon(icon, size: 28, color: AppColors.yellowDark),
            const SizedBox(height: 8),
            Text(label, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}
