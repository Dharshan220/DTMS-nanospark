import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../models/dashboard.dart';
import '../../models/user.dart';
import '../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';

class QrAdminPage extends ConsumerWidget {
  const QrAdminPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final students = ref.watch(
      userRepositoryProvider.select((r) => r.list(role: 'student', limit: 100)),
    );

    return Scaffold(
      appBar: AppBar(title: const Text('Student QR Passes')),
      body: FutureBuilder(
        future: students,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Padding(padding: EdgeInsets.all(16), child: ListShimmer());
          }
          final list = snap.data ?? const <User>[];
          if (list.isEmpty) return const EmptyState(message: 'No students found');

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, _) => const SizedBox(height: 10),
            itemBuilder: (context, i) {
              final s = list[i];
              return AppCard(
                onTap: () => showModalBottomSheet<void>(
                  context: context,
                  isScrollControlled: true,
                  backgroundColor: Theme.of(context).brightness == Brightness.dark
                      ? AppColors.darkSurface
                      : Colors.white,
                  builder: (_) => _StudentPassSheet(student: s),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: AppColors.yellow.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.person, color: AppColors.yellowDark),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            s.name,
                            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                          ),
                          Text(
                            '${s.department ?? ''} ${s.year ?? ''} ${s.section ?? ''} · Route ${s.routeNumber ?? '-'}',
                            style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.qr_code_2, color: AppColors.yellowDark),
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

class _StudentPassSheet extends ConsumerWidget {
  final User student;

  const _StudentPassSheet({required this.student});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pass = ref.watch(adminStudentPassProvider(student.id));

    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '${student.name} — Bus Pass',
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17),
          ),
          const SizedBox(height: 16),
          pass.when(
            loading: () => const Padding(
              padding: EdgeInsets.all(30),
              child: CircularProgressIndicator(),
            ),
            error: (e, _) => Text('Could not load pass: $e'),
            data: (p) => Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: QrImageView(
                    data: p.qrPayload,
                    version: QrVersions.auto,
                    size: 180,
                    backgroundColor: Colors.white,
                    eyeStyle: const QrEyeStyle(
                      eyeShape: QrEyeShape.square,
                      color: AppColors.black,
                    ),
                    dataModuleStyle: const QrDataModuleStyle(
                      dataModuleShape: QrDataModuleShape.square,
                      color: AppColors.black,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  p.routeNumber != null ? 'ROUTE ${p.routeNumber}' : 'NO ROUTE',
                  style: const TextStyle(
                    color: AppColors.yellowDark,
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                  ),
                ),
                Text(
                  'Boarding: ${p.boardingStop.isEmpty ? '—' : p.boardingStop} · Valid till ${p.validTill}',
                  style: TextStyle(fontSize: 12.5, color: Colors.grey.shade600),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

final adminStudentPassProvider = FutureProvider.autoDispose.family<QrPass, String>((ref, id) {
  return ref.watch(trackingRepositoryProvider).qrPassForUser(id);
});
