import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../models/domain.dart';
import '../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';

final notificationsProvider = FutureProvider.autoDispose<List<NotificationItem>>((ref) {
  return ref.watch(notificationRepositoryProvider).list();
});

class NotificationsPage extends ConsumerWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(notificationsProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all),
            tooltip: 'Mark all read',
            onPressed: () async {
              await ref.read(notificationRepositoryProvider).markAllRead();
              ref.invalidate(notificationsProvider);
            },
          ),
        ],
      ),
      body: async.when(
        loading: () => const Padding(padding: EdgeInsets.all(16), child: ListShimmer()),
        error: (e, _) => EmptyState(
          message: 'Could not load notifications.\n$e',
          icon: Icons.cloud_off,
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(notificationsProvider),
        ),
        data: (items) {
          if (items.isEmpty) {
            return const EmptyState(
              message: 'No notifications yet.\nAlerts about your bus will appear here.',
              icon: Icons.notifications_none,
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final n = items[i];
              return Dismissible(
                key: Key(n.id),
                direction: DismissDirection.endToStart,
                background: Container(
                  alignment: Alignment.centerRight,
                  padding: const EdgeInsets.only(right: 20),
                  decoration: BoxDecoration(
                    color: AppColors.danger,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Icon(Icons.delete_outline, color: Colors.white),
                ),
                onDismissed: (_) async {
                  await ref.read(notificationRepositoryProvider).markRead(n.id);
                  ref.invalidate(notificationsProvider);
                },
                child: AppCard(
                  onTap: () async {
                    if (!n.read) {
                      await ref.read(notificationRepositoryProvider).markRead(n.id);
                      ref.invalidate(notificationsProvider);
                    }
                  },
                  color: n.read
                      ? null
                      : AppColors.yellow.withValues(alpha: 0.08),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(9),
                        decoration: BoxDecoration(
                          color: _colorFor(n.type).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(_iconFor(n.type),
                            color: _colorFor(n.type), size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    n.title,
                                    style: TextStyle(
                                      fontWeight:
                                          n.read ? FontWeight.w600 : FontWeight.w800,
                                      fontSize: 14.5,
                                      color: isDark ? Colors.white : AppColors.black,
                                    ),
                                  ),
                                ),
                                if (!n.read)
                                  Container(
                                    width: 8,
                                    height: 8,
                                    decoration: const BoxDecoration(
                                      color: AppColors.yellow,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              n.body,
                              style: TextStyle(
                                fontSize: 13,
                                height: 1.4,
                                color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              DateFormat('d MMM, h:mm a')
                                  .format(DateTime.fromMillisecondsSinceEpoch(n.createdAt)),
                              style: TextStyle(
                                fontSize: 11,
                                color: isDark ? Colors.grey.shade600 : Colors.grey.shade500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  Color _colorFor(String type) => switch (type) {
        'complaint' => AppColors.warning,
        'broadcast' => AppColors.info,
        'alert' => AppColors.danger,
        _ => AppColors.yellowDark,
      };

  IconData _iconFor(String type) => switch (type) {
        'complaint' => Icons.report_problem_outlined,
        'broadcast' => Icons.campaign_outlined,
        'alert' => Icons.warning_amber_outlined,
        _ => Icons.notifications_outlined,
      };
}
