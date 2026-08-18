import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../models/dashboard.dart';
import '../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';

final adminDashboardProvider = FutureProvider.autoDispose<AdminDashboardData>((ref) {
  return ref.watch(dashboardRepositoryProvider).adminDashboard();
});

class AdminDashboard extends ConsumerWidget {
  const AdminDashboard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(adminDashboardProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Transport Control'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => context.push('/notifications'),
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(adminDashboardProvider),
          ),
        ],
      ),
      body: async.when(
        loading: () => const Padding(
          padding: EdgeInsets.all(16),
          child: ListShimmer(),
        ),
        error: (e, _) => EmptyState(
          message: 'Could not load dashboard.\n${e.toString()}',
          icon: Icons.cloud_off,
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(adminDashboardProvider),
        ),
        data: (data) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(adminDashboardProvider),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              HeroBanner(
                title: 'Good day, ${data.adminName.split(' ').first}',
                subtitle: 'Live overview of the DACE transport network',
                trailing: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.yellow.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.directions_bus_filled, color: AppColors.yellow),
                ),
              ),
              const SizedBox(height: 20),
              _StatGrid(stats: data.stats),
              const SizedBox(height: 24),
              SectionHeader(
                title: 'Live Buses',
                actionLabel: 'View map',
                onAction: () => context.push('/tracking'),
              ),
              const SizedBox(height: 12),
              _LiveBusStrip(buses: data.buses),
              const SizedBox(height: 24),
              SectionHeader(
                title: 'Management',
                onAction: () => context.push('/admin'),
              ),
              const SizedBox(height: 12),
              _ManagementGrid(),
              const SizedBox(height: 24),
              SectionHeader(
                title: 'Recent Complaints',
                actionLabel: 'View all',
                onAction: () => context.push('/admin/complaints'),
              ),
              const SizedBox(height: 12),
              if (data.recentComplaints.isEmpty)
                const EmptyState(message: 'No complaints yet')
              else
                ...data.recentComplaints.map(
                  (c) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: AppCard(
                      child: Row(
                        children: [
                                Container(
                                  width: 44,
                                  height: 44,
                                  decoration: BoxDecoration(
                                    color: AppColors.yellow.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Icon(Icons.report_problem_outlined,
                                      color: AppColors.yellowDark),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        c.category,
                                        style: TextStyle(
                                          fontWeight: FontWeight.w700,
                                          color: isDark ? Colors.white : AppColors.black,
                                        ),
                                      ),
                                      Text(
                                        '${c.name} · Route ${c.routeNumber ?? '-'}',
                                        style: TextStyle(
                                          fontSize: 12.5,
                                          color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                    StatusBadge(c.status),
                    ],
                  ),
                ),
              ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatGrid extends StatelessWidget {
  final AdminStats stats;

  const _StatGrid({required this.stats});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.45,
      children: [
        StatCard(label: 'Students', value: '${stats.totalStudents}', icon: Icons.school, color: AppColors.yellowDark),
        StatCard(label: 'Teachers', value: '${stats.totalTeachers}', icon: Icons.co_present, color: AppColors.info),
        StatCard(label: 'Parents', value: '${stats.totalParents}', icon: Icons.family_restroom, color: AppColors.success),
        StatCard(label: 'Buses', value: '${stats.totalBuses}', icon: Icons.directions_bus_filled, color: AppColors.warning),
        StatCard(label: 'Active Trips', value: '${stats.activeTrips}', icon: Icons.route, color: AppColors.danger),
        StatCard(label: 'Pending Complaints', value: '${stats.pendingComplaints}', icon: Icons.pending_actions, color: Colors.purple),
        StatCard(label: 'Resolved', value: '${stats.resolvedComplaints}', icon: Icons.verified, color: AppColors.success),
        StatCard(label: 'Feedback', value: '${stats.feedback}', icon: Icons.rate_review_outlined, color: AppColors.info),
      ],
    );
  }
}

class _LiveBusStrip extends StatelessWidget {
  final List<MiniBus> buses;

  const _LiveBusStrip({required this.buses});

  @override
  Widget build(BuildContext context) {
    final live = buses.where((b) => b.status == 'active').length;
    return AppCard(
      child: Row(
        children: [
          const Icon(Icons.wifi_tethering, color: AppColors.success, size: 30),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$live / ${buses.length} buses on the road',
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                ),
                const SizedBox(height: 4),
                Text(
                  'Live position updates every 5 seconds',
                  style: TextStyle(fontSize: 12.5, color: Colors.grey.shade500),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ManagementGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final items = [
      ('Students', Icons.school, '/admin/users?role=student'),
      ('Teachers', Icons.co_present, '/admin/users?role=teacher'),
      ('Parents', Icons.family_restroom, '/admin/users?role=parent'),
      ('Buses', Icons.directions_bus_filled, '/admin/buses'),
      ('Routes', Icons.route, '/admin/routes'),
      ('Complaints', Icons.report_problem_outlined, '/admin/complaints'),
      ('Feedback', Icons.rate_review_outlined, '/admin/feedback'),
      ('Reports', Icons.insert_chart_outlined, '/admin/reports'),
    ];
    return GridView.count(
      crossAxisCount: 4,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      children: items
          .map((it) => InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: () => context.push(it.$3),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.yellow.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Icon(it.$2, color: AppColors.yellowDark, size: 22),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      it.$1,
                      style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ))
          .toList(),
    );
  }
}
