import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../models/dashboard.dart';
import '../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';

final qrPassProvider = FutureProvider.autoDispose<QrPass>((ref) {
  return ref.watch(trackingRepositoryProvider).qrPass();
});

class QrPassPage extends ConsumerWidget {
  const QrPassPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(qrPassProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('My QR Bus Pass')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => EmptyState(
          message: 'Could not load your pass.\n$e',
          icon: Icons.qr_code_2,
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(qrPassProvider),
        ),
        data: (pass) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Pass card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1A1A00), Color(0xFF403D00)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.directions_bus_filled, color: AppColors.yellow, size: 28),
                          SizedBox(width: 10),
                          Text(
                            'DACE TRANSPORT',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.5,
                            ),
                          ),
                        ],
                      ),
                      const Tag('BUS PASS', foreground: AppColors.black),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: QrImageView(
                      data: pass.qrPayload,
                      version: QrVersions.auto,
                      size: 170,
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
                  const SizedBox(height: 16),
                  Text(
                    pass.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${pass.department} · ${pass.year} Year ${pass.section}',
                    style: const TextStyle(color: Colors.white70, fontSize: 13.5),
                  ),
                  const SizedBox(height: 14),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        Text(
                          pass.routeNumber != null ? 'ROUTE ${pass.routeNumber}' : 'NO ROUTE',
                          style: const TextStyle(
                            color: AppColors.yellow,
                            fontWeight: FontWeight.w900,
                            fontSize: 16,
                          ),
                        ),
                        if (pass.vehicleNumber != null)
                          Text(
                            pass.vehicleNumber!,
                            style: const TextStyle(color: Colors.white70, fontSize: 12.5),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Boarding: ${pass.boardingStop.isEmpty ? '—' : pass.boardingStop}',
                    style: const TextStyle(color: Colors.white70, fontSize: 12.5),
                  ),
                  Text(
                    'Valid till ${pass.validTill}',
                    style: const TextStyle(color: Colors.white54, fontSize: 12),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Show this QR code to the driver or conductor when boarding.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }
}
