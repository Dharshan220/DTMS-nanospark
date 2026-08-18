import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/errors/api_exception.dart';
import '../../models/dashboard.dart';
import '../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';

final reportSummaryProvider = FutureProvider.autoDispose<ReportSummary>((ref) {
  return ref.watch(dashboardRepositoryProvider).reportSummary();
});

class ReportsPage extends ConsumerWidget {
  const ReportsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(reportSummaryProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(title: const Text('Reports')),
      body: async.when(
        loading: () => const Padding(padding: EdgeInsets.all(16), child: ListShimmer()),
        error: (e, _) => EmptyState(
          message: 'Could not load reports.\n$e',
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(reportSummaryProvider),
        ),
        data: (r) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              'Complaints by status',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : AppColors.black,
              ),
            ),
            const SizedBox(height: 12),
            AppCard(
              child: Row(
                children: [
                  _Bar('Pending', r.complaintsByStatus['pending'] ?? 0, AppColors.warning),
                  _Bar('In Progress', r.complaintsByStatus['in_progress'] ?? 0, AppColors.info),
                  _Bar('Resolved', r.complaintsByStatus['resolved'] ?? 0, AppColors.success),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Complaints by category',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : AppColors.black,
              ),
            ),
            const SizedBox(height: 12),
            AppCard(
              child: Column(
                children: r.complaintsByCategory.entries
                    .map((e) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 5),
                          child: Row(
                            children: [
                              SizedBox(
                                width: 110,
                                child: Text(
                                  e.key,
                                  style: const TextStyle(fontSize: 12.5),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              Expanded(
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(6),
                                  child: LinearProgressIndicator(
                                    value: r.maxCategory == 0
                                        ? 0
                                        : e.value / r.maxCategory,
                                    minHeight: 8,
                                    backgroundColor: isDark
                                        ? Colors.grey.shade800
                                        : Colors.grey.shade200,
                                    color: AppColors.yellow,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                '${e.value}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 12.5,
                                ),
                              ),
                            ],
                          ),
                        ))
                    .toList(),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: StatCard(
                    label: 'Attendance rate',
                    value: '${r.attendanceRate}%',
                    icon: Icons.how_to_reg,
                    color: AppColors.success,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: StatCard(
                    label: 'Total feedback',
                    value: '${r.totals['feedback'] ?? 0}',
                    icon: Icons.rate_review_outlined,
                    color: AppColors.info,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Bar extends StatelessWidget {
  final String label;
  final int value;
  final Color color;

  const _Bar(this.label, this.value, this.color);

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Container(
            height: 90,
            width: 44,
            alignment: Alignment.bottomCenter,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Container(
              height: 90 * (value / 8).clamp(0.06, 1.0),
              width: 44,
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text('$value', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
          Text(
            label,
            style: const TextStyle(fontSize: 10.5),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class BroadcastPage extends ConsumerStatefulWidget {
  const BroadcastPage({super.key});

  @override
  ConsumerState<BroadcastPage> createState() => _BroadcastPageState();
}

class _BroadcastPageState extends ConsumerState<BroadcastPage> {
  final _title = TextEditingController();
  final _body = TextEditingController();
  final Set<String> _roles = {};
  bool _sending = false;

  @override
  void dispose() {
    _title.dispose();
    _body.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    if (_title.text.trim().isEmpty || _body.text.trim().isEmpty) return;
    setState(() => _sending = true);
    try {
      await ref.read(notificationRepositoryProvider).broadcast(
            title: _title.text.trim(),
            body: _body.text.trim(),
            roles: _roles.toList(),
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Notification sent')),
        );
        context.pop();
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(title: const Text('Broadcast Notification')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextFormField(
            controller: _title,
            decoration: const InputDecoration(labelText: 'Title'),
          ),
          const SizedBox(height: 14),
          TextFormField(
            controller: _body,
            maxLines: 4,
            decoration: const InputDecoration(
              labelText: 'Message',
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            'Send to (empty = everyone)',
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: ['student', 'teacher', 'parent', 'admin']
                .map((r) => FilterChip(
                      label: Text(r.toUpperCase()),
                      selected: _roles.contains(r),
                      selectedColor: AppColors.yellow,
                      checkmarkColor: AppColors.black,
                      backgroundColor: isDark ? AppColors.darkGrey : Colors.white,
                      onSelected: (v) => setState(() {
                        if (v) {
                          _roles.add(r);
                        } else {
                          _roles.remove(r);
                        }
                      }),
                    ))
                .toList(),
          ),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: _sending ? null : _send,
            icon: _sending
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.campaign),
            label: const Text('Send Notification'),
          ),
        ],
      ),
    );
  }
}
