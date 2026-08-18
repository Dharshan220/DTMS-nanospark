import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../models/domain.dart';
import '../../models/user.dart';
import '../../providers/auth_controller.dart';
import '../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';

final complaintsProvider = FutureProvider.autoDispose<List<Complaint>>((ref) {
  return ref.watch(complaintRepositoryProvider).list(limit: 50);
});

class ComplaintsPage extends ConsumerWidget {
  const ComplaintsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(complaintsProvider);
    final isAdmin = ref.watch(currentUserProvider)?.role == UserRole.admin;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Complaints'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(complaintsProvider),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/complaints/new'),
        icon: const Icon(Icons.add),
        label: const Text('Raise'),
      ),
      body: async.when(
        loading: () => const Padding(padding: EdgeInsets.all(16), child: ListShimmer()),
        error: (e, _) => EmptyState(
          message: 'Could not load complaints.\n$e',
          icon: Icons.cloud_off,
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(complaintsProvider),
        ),
        data: (items) {
          if (items.isEmpty) {
            return const EmptyState(
              message: 'No complaints yet. Tap Raise to report an issue.',
              icon: Icons.verified_outlined,
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            separatorBuilder: (_, _) => const SizedBox(height: 10),
            itemBuilder: (context, i) => _ComplaintTile(
              complaint: items[i],
              isAdmin: isAdmin,
              onTap: () => context.push('/complaints/${items[i].id}'),
            ),
          );
        },
      ),
    );
  }
}

class _ComplaintTile extends StatelessWidget {
  final Complaint complaint;
  final bool isAdmin;
  final VoidCallback onTap;

  const _ComplaintTile({required this.complaint, required this.isAdmin, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.yellow.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.report_problem_outlined,
                    color: AppColors.yellowDark, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      complaint.category,
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                    ),
                    Text(
                      isAdmin
                          ? '${complaint.name} · R${complaint.routeNumber ?? '-'}'
                          : 'Route ${complaint.routeNumber ?? '-'} · ${_ago(complaint.createdAt)}',
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                    ),
                  ],
                ),
              ),
              StatusBadge(complaint.status),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            complaint.description,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 13.5,
              height: 1.4,
              color: Theme.of(context).brightness == Brightness.dark
                  ? Colors.grey.shade300
                  : Colors.grey.shade800,
            ),
          ),
        ],
      ),
    );
  }

  String _ago(int ms) {
    final diff = DateTime.now().difference(DateTime.fromMillisecondsSinceEpoch(ms));
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return DateFormat('d MMM').format(DateTime.fromMillisecondsSinceEpoch(ms));
  }
}
