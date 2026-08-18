import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/bus_route.dart';
import '../../models/domain.dart';
import '../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';

final adminRoutesProvider = FutureProvider.autoDispose<List<BusRoute>>((ref) {
  return ref.watch(busRepositoryProvider).listRoutes();
});

class RoutesManagementPage extends ConsumerWidget {
  const RoutesManagementPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(adminRoutesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Routes & Stops')),
      body: async.when(
        loading: () => const Padding(padding: EdgeInsets.all(16), child: ListShimmer()),
        error: (e, _) => EmptyState(
          message: 'Could not load routes.\n$e',
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(adminRoutesProvider),
        ),
        data: (routes) => ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: routes.length,
          separatorBuilder: (_, _) => const SizedBox(height: 10),
          itemBuilder: (context, i) {
            final r = routes[i];
            return ExpansionTile(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              collapsedShape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              leading: Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: AppColors.yellow.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Center(
                  child: Text(
                    '${r.routeNumber}',
                    style: const TextStyle(
                      color: AppColors.yellowDark,
                      fontWeight: FontWeight.w900,
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
              title: Text(
                'Route ${r.routeNumber}',
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
              subtitle: Text(
                '${r.vehicleNumber} · ${r.timelinePoints.length} stops · arrives ${r.arrivalTime}',
                style: const TextStyle(fontSize: 12),
              ),
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  child: Column(
                    children: r.timelinePoints
                        .map((s) => Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              child: Row(
                                children: [
                                  Icon(Icons.circle, size: 9, color: AppColors.yellowDark),
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
                            ))
                        .toList(),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

final adminFeedbackProvider = FutureProvider.autoDispose<List<FeedbackEntry>>((ref) {
  return ref.watch(feedbackRepositoryProvider).list();
});

class FeedbackAdminPage extends ConsumerWidget {
  const FeedbackAdminPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(adminFeedbackProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Feedback')),
      body: async.when(
        loading: () => const Padding(padding: EdgeInsets.all(16), child: ListShimmer()),
        error: (e, _) => EmptyState(
          message: 'Could not load feedback.\n$e',
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(adminFeedbackProvider),
        ),
        data: (items) {
          if (items.isEmpty) {
            return const EmptyState(message: 'No feedback yet', icon: Icons.rate_review_outlined);
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            separatorBuilder: (_, _) => const SizedBox(height: 10),
            itemBuilder: (context, i) {
              final f = items[i];
              return AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            '${f.name} · ${f.department} ${f.year} ${f.section}',
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                          ),
                        ),
                        Tag(f.category, foreground: AppColors.black),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      f.description,
                      style: TextStyle(
                        fontSize: 13.5,
                        height: 1.4,
                        color: Theme.of(context).brightness == Brightness.dark
                            ? Colors.grey.shade300
                            : Colors.grey.shade800,
                      ),
                    ),
                    if (f.routeNumber.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Text(
                          'Route ${f.routeNumber}',
                          style: TextStyle(fontSize: 11.5, color: AppColors.yellowDark),
                        ),
                      ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
