import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../models/domain.dart';
import '../../models/user.dart';
import '../../providers/auth_controller.dart';
import '../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';
import 'complaints_page.dart' show complaintsProvider;

class ComplaintDetailPage extends ConsumerStatefulWidget {
  final String id;

  const ComplaintDetailPage({super.key, required this.id});

  @override
  ConsumerState<ComplaintDetailPage> createState() => _ComplaintDetailPageState();
}

class _ComplaintDetailPageState extends ConsumerState<ComplaintDetailPage> {
  String? _selectedStatus;
  final _response = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _response.dispose();
    super.dispose();
  }

  Future<void> _updateStatus(Complaint c) async {
    if (_selectedStatus == null || _selectedStatus == c.status) return;
    setState(() => _saving = true);
    try {
      await ref.read(complaintRepositoryProvider).updateStatus(
            c.id,
            _selectedStatus!,
            response: _response.text.trim().isEmpty ? null : _response.text.trim(),
          );
      ref.invalidate(complaintsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Status updated & user notified')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Update failed')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final async = ref.watch(complaintsProvider);
    final complaint = async.valueOrNull?.where((c) => c.id == widget.id).firstOrNull;

    if (complaint == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Complaint')),
        body: async.hasError
            ? EmptyState(message: 'Could not load complaint', icon: Icons.error_outline)
            : const Center(child: CircularProgressIndicator()),
      );
    }

    final isAdmin = ref.watch(currentUserProvider)?.role == UserRole.admin;

    return Scaffold(
      appBar: AppBar(title: Text(complaint.category)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.person_outline, size: 20, color: AppColors.yellowDark),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        complaint.name,
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                      ),
                    ),
                    StatusBadge(complaint.status),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'Route ${complaint.routeNumber ?? '-'} · ${DateFormat('d MMM yyyy, h:mm a').format(DateTime.fromMillisecondsSinceEpoch(complaint.createdAt))}',
                  style: TextStyle(fontSize: 12.5, color: Colors.grey.shade500),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Description',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.grey.shade300 : Colors.grey.shade700,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  complaint.description,
                  style: TextStyle(fontSize: 15, height: 1.5),
                ),
                if (complaint.imageUrl != null) ...[
                  const SizedBox(height: 12),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.network(
                      complaint.imageUrl!,
                      height: 160,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => const SizedBox.shrink(),
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (complaint.adminResponse.isNotEmpty) ...[
            const SizedBox(height: 12),
            AppCard(
              color: AppColors.success.withValues(alpha: 0.08),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Transport office response',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                  ),
                  const SizedBox(height: 6),
                  Text(complaint.adminResponse, style: const TextStyle(fontSize: 14, height: 1.4)),
                ],
              ),
            ),
          ],
          const SizedBox(height: 20),
          Text(
            'Status history',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: isDark ? Colors.white : AppColors.black,
            ),
          ),
          const SizedBox(height: 10),
          ...complaint.history.map(
            (h) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  Icon(Icons.radio_button_checked,
                      size: 16, color: _colorFor(h.status)),
                  const SizedBox(width: 10),
                  Text(
                    h.status.replaceAll('_', ' ').toUpperCase(),
                    style: TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                      color: _colorFor(h.status),
                    ),
                  ),
                  const Spacer(),
                  Text(
                    DateFormat('d MMM, h:mm a')
                        .format(DateTime.fromMillisecondsSinceEpoch(h.at)),
                    style: TextStyle(fontSize: 11.5, color: Colors.grey.shade500),
                  ),
                ],
              ),
            ),
          ),
          if (isAdmin) ...[
            const SizedBox(height: 24),
            Text(
              'Update status',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : AppColors.black,
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _selectedStatus ?? complaint.status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const [
                DropdownMenuItem(value: 'pending', child: Text('Pending')),
                DropdownMenuItem(value: 'in_progress', child: Text('In Progress')),
                DropdownMenuItem(value: 'resolved', child: Text('Resolved')),
              ],
              onChanged: (v) => setState(() => _selectedStatus = v),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _response,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Response to user (optional)',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _saving ? null : () => _updateStatus(complaint),
              child: _saving
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Update Status'),
            ),
          ],
        ],
      ),
    );
  }

  Color _colorFor(String status) => switch (status) {
        'pending' => AppColors.warning,
        'in_progress' => AppColors.info,
        'resolved' => AppColors.success,
        _ => AppColors.grey,
      };
}
