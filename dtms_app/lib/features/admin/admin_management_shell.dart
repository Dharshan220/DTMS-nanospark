import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../theme/app_theme.dart';
import '../../widgets/common.dart';

class AdminManagementShell extends StatelessWidget {
  const AdminManagementShell({super.key});

  @override
  Widget build(BuildContext context) {
    final items = [
      ('Students', 'Manage student accounts', Icons.school, '/admin/users?role=student'),
      ('Teachers', 'Manage teacher accounts', Icons.co_present, '/admin/users?role=teacher'),
      ('Parents', 'Manage parent accounts', Icons.family_restroom, '/admin/users?role=parent'),
      ('Buses', 'Fleet & bus admins', Icons.directions_bus_filled, '/admin/buses'),
      ('Routes', 'Stops & timings', Icons.route, '/admin/routes'),
      ('Complaints', 'Resolve complaints', Icons.report_problem_outlined, '/admin/complaints'),
      ('Feedback', 'Review feedback', Icons.rate_review_outlined, '/admin/feedback'),
      ('Reports', 'Analytics & exports', Icons.insert_chart_outlined, '/admin/reports'),
      ('Broadcast', 'Send notification', Icons.campaign_outlined, '/admin/broadcast'),
      ('QR Codes', 'Bus pass QR', Icons.qr_code_2, '/admin/qr'),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Management')),
      body: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.6,
        ),
        itemCount: items.length,
        itemBuilder: (context, i) {
          final it = items[i];
          return AppCard(
            onTap: () => context.push(it.$4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.yellow.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(it.$3, color: AppColors.yellowDark),
                ),
                const SizedBox(height: 10),
                Text(it.$1, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                const SizedBox(height: 2),
                Text(
                  it.$2,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 11.5, color: Colors.grey.shade500),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
