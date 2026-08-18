import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../models/dashboard.dart';
import '../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';

final userDashboardProvider = FutureProvider.autoDispose<DashboardData>((ref) {
  return ref.watch(dashboardRepositoryProvider).myDashboard();
});

class StudentDashboard extends ConsumerWidget {
  const StudentDashboard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(userDashboardProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Transport'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(userDashboardProvider),
          ),
        ],
      ),
      body: async.when(
        loading: () => const Padding(
          padding: EdgeInsets.all(16),
          child: ListShimmer(),
        ),
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
                title: 'Hi, ${data.user?.name.split(' ').first ?? 'Student'}!',
                subtitle: data.myBus != null
                    ? 'Your bus: Route ${data.myBus!.routeNumber} · ${data.myBus!.vehicleNumber}'
                    : 'No bus assigned yet. Contact the transport office.',
                trailing: data.isBusAdmin
                    ? const Tag('Bus Admin', foreground: AppColors.black)
                    : null,
              ),
              const SizedBox(height: 20),
              if (data.attendance != null)
                _AttendanceCard(
                  today: data.attendance!.today,
                  presentCount: data.attendance!.presentCount,
                  routeNumber: data.myBus?.routeNumber,
                  onCheckIn: () async {
                    try {
                      await ref.read(trackingRepositoryProvider).checkIn(
                            busId: data.myBus?.id,
                            routeNumber: data.myBus?.routeNumber,
                            stopName: data.user?.boardingStop,
                          );
                      ref.invalidate(userDashboardProvider);
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Checked in successfully!')),
                        );
                      }
                    } catch (_) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Check-in failed')),
                        );
                      }
                    }
                  },
                ),
              const SizedBox(height: 16),
              _QuickActions(data: data),
              const SizedBox(height: 24),
              SectionHeader(title: 'My Route'),
              const SizedBox(height: 12),
              if (data.route == null)
                const EmptyState(message: 'No route assigned')
              else
                AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppColors.yellow,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              'Route ${data.route!.routeNumber}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                color: AppColors.black,
                              ),
                            ),
                          ),
                          const Spacer(),
                          Text(
                            'Arrival ${data.route!.arrivalTime}',
                            style: TextStyle(
                              fontSize: 12.5,
                              color: Colors.grey.shade500,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      ...data.route!.stops.map(
                        (s) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Row(
                            children: [
                              Icon(Icons.circle, size: 10, color: AppColors.yellowDark),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  s.name,
                                  style: const TextStyle(fontWeight: FontWeight.w600),
                                ),
                              ),
                              Text(
                                s.time,
                                style: TextStyle(
                                  fontSize: 12.5,
                                  color: Colors.grey.shade500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AttendanceCard extends StatelessWidget {
  final String today;
  final int presentCount;
  final int? routeNumber;
  final VoidCallback onCheckIn;

  const _AttendanceCard({
    required this.today,
    required this.presentCount,
    this.routeNumber,
    required this.onCheckIn,
  });

  @override
  Widget build(BuildContext context) {
    final checked = today != 'not_checked';
    final present = today == 'present';

    return AppCard(
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: (present
                      ? AppColors.success
                      : checked
                          ? AppColors.danger
                          : AppColors.grey)
                  .withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(
              checked ? (present ? Icons.check : Icons.close) : Icons.how_to_reg,
              color: present
                  ? AppColors.success
                  : checked
                      ? AppColors.danger
                      : AppColors.grey,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  checked ? (present ? 'Checked in today' : 'Marked absent today') : 'Not checked in yet',
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                ),
                Text(
                  '$presentCount total rides logged',
                  style: TextStyle(fontSize: 12.5, color: Colors.grey.shade500),
                ),
              ],
            ),
          ),
          if (!checked)
            TextButton(onPressed: onCheckIn, child: const Text('Check in')),
        ],
      ),
    );
  }
}

class _QuickActions extends StatelessWidget {
  final DashboardData data;

  const _QuickActions({required this.data});

  @override
  Widget build(BuildContext context) {
    final items = [
      ('Track Bus', Icons.map_outlined, () => context.push('/tracking')),
      ('QR Pass', Icons.qr_code_2, () => context.push('/qr')),
      ('Complaints', Icons.report_problem_outlined, () => context.push('/complaints')),
      if (data.isBusAdmin) ('Feedback', Icons.rate_review_outlined, () => context.push('/feedback')),
      ('Notifications', Icons.notifications_outlined, () => context.push('/notifications')),
      ('Profile', Icons.person_outline, () => context.push('/profile')),
    ];
    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 0.95,
      children: items
          .map((it) => InkWell(
                borderRadius: BorderRadius.circular(18),
                onTap: it.$3,
                child: AppCard(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(it.$2, size: 26, color: AppColors.yellowDark),
                      const SizedBox(height: 8),
                      Text(
                        it.$1,
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              ))
          .toList(),
    );
  }
}
