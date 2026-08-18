import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../theme/app_theme.dart';
import '../../widgets/common.dart';
import 'student_dashboard.dart' show userDashboardProvider;

class ParentDashboard extends ConsumerWidget {
  const ParentDashboard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(userDashboardProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Track My Child'),
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
                title: 'Hi, ${data.user?.name.split(' ').first ?? 'Parent'}!',
                subtitle: 'Monitor your child\'s college bus in real time',
                trailing: const Icon(Icons.family_restroom, color: AppColors.yellow, size: 34),
              ),
              const SizedBox(height: 20),
              SectionHeader(title: 'My Children'),
              const SizedBox(height: 12),
              if (data.children.isEmpty)
                const EmptyState(message: 'No children linked to your account')
              else
                ...data.children.map(
                  (c) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: AppCard(
                      onTap: () => context.push('/tracking'),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 24,
                            backgroundColor: AppColors.yellow.withValues(alpha: 0.2),
                            child: Text(
                              c.name.isNotEmpty ? c.name[0].toUpperCase() : '?',
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                color: AppColors.yellowDark,
                              ),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  c.name,
                                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '${c.department ?? '-'} ${c.year ?? ''} ${c.section ?? ''}'
                                  '${c.routeNumber != null ? ' · Route ${c.routeNumber}' : ''}',
                                  style: TextStyle(
                                    fontSize: 12.5,
                                    color: Colors.grey.shade500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.chevron_right, color: AppColors.yellowDark),
                        ],
                      ),
                    ),
                  ),
                ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _ActionTile(
                      icon: Icons.map_outlined,
                      label: 'Track Bus Live',
                      onTap: () => context.push('/tracking'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _ActionTile(
                      icon: Icons.notifications_outlined,
                      label: 'Alerts',
                      onTap: () => context.push('/notifications'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _ActionTile(
                      icon: Icons.report_problem_outlined,
                      label: 'Report Issue',
                      onTap: () => context.push('/complaints/new'),
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
