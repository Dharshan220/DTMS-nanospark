import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/errors/api_exception.dart';
import '../../models/bus.dart';
import '../../models/user.dart';
import '../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';

final adminBusesProvider = FutureProvider.autoDispose<List<Bus>>((ref) {
  return ref.watch(busRepositoryProvider).listBuses();
});

class BusesManagementPage extends ConsumerWidget {
  const BusesManagementPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(adminBusesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Buses')),
      body: async.when(
        loading: () => const Padding(padding: EdgeInsets.all(16), child: ListShimmer()),
        error: (e, _) => EmptyState(
          message: 'Could not load buses.\n$e',
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(adminBusesProvider),
        ),
        data: (buses) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(adminBusesProvider),
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: buses.length,
            separatorBuilder: (_, _) => const SizedBox(height: 10),
            itemBuilder: (context, i) {
              final b = buses[i];
              return AppCard(
                onTap: () async {
                  await showDialog<void>(
                    context: context,
                    builder: (_) => _BusEditDialog(bus: b),
                  );
                  ref.invalidate(adminBusesProvider);
                },
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: (b.isActive ? AppColors.success : AppColors.warning)
                            .withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Icon(
                        Icons.directions_bus_filled,
                        color: b.isActive ? AppColors.success : AppColors.warning,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Route ${b.routeNumber} · ${b.vehicleNumber}',
                            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${b.driverName} · ${b.driverPhone}',
                            style: TextStyle(fontSize: 12.5, color: Colors.grey.shade500),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${b.busAdminCount}/2 bus admins',
                            style: TextStyle(fontSize: 11.5, color: AppColors.yellowDark),
                          ),
                        ],
                      ),
                    ),
                    StatusBadge(b.status),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

class _BusEditDialog extends ConsumerStatefulWidget {
  final Bus bus;

  const _BusEditDialog({required this.bus});

  @override
  ConsumerState<_BusEditDialog> createState() => _BusEditDialogState();
}

class _BusEditDialogState extends ConsumerState<_BusEditDialog> {
  late final _vehicle = TextEditingController(text: widget.bus.vehicleNumber);
  late final _driver = TextEditingController(text: widget.bus.driverName);
  late final _phone = TextEditingController(text: widget.bus.driverPhone);
  late final _capacity = TextEditingController(text: '${widget.bus.capacity}');
  late String _status = widget.bus.status;
  bool _saving = false;
  late final Future<List<User>> _studentsFuture;

  @override
  void initState() {
    super.initState();
    _studentsFuture =
        ref.read(userRepositoryProvider).list(role: 'student', limit: 100);
  }

  @override
  void dispose() {
    _vehicle.dispose();
    _driver.dispose();
    _phone.dispose();
    _capacity.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ref.read(busRepositoryProvider).updateBus(widget.bus.id, {
        'vehicleNumber': _vehicle.text.trim(),
        'driverName': _driver.text.trim(),
        'driverPhone': _phone.text.trim(),
        'capacity': int.tryParse(_capacity.text) ?? 60,
        'status': _status,
      });
      if (mounted) context.pop();
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return AlertDialog(
      backgroundColor: isDark ? AppColors.darkSurface : Colors.white,
      title: Text('Route ${widget.bus.routeNumber}'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextFormField(
              controller: _vehicle,
              decoration: const InputDecoration(labelText: 'Vehicle number'),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _driver,
              decoration: const InputDecoration(labelText: 'Driver name'),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _phone,
              decoration: const InputDecoration(labelText: 'Driver phone'),
              keyboardType: TextInputType.phone,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _capacity,
              decoration: const InputDecoration(labelText: 'Capacity'),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const [
                DropdownMenuItem(value: 'active', child: Text('Active')),
                DropdownMenuItem(value: 'maintenance', child: Text('Maintenance')),
              ],
              onChanged: (v) => setState(() => _status = v ?? 'active'),
            ),
            const SizedBox(height: 16),
            FutureBuilder<List<User>>(
              future: _studentsFuture,
              builder: (context, snap) {
                final students = snap.data ?? const <User>[];
                final selected = Set<String>.from(widget.bus.busAdminIds);
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Student Bus Admins (max 2)',
                      style: TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w700,
                        color: isDark ? Colors.white : AppColors.black,
                      ),
                    ),
                    const SizedBox(height: 8),
                    for (final s in students)
                      CheckboxListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        title: Text(s.name),
                        subtitle: Text('${s.department ?? ''} ${s.year ?? ''} ${s.section ?? ''}'),
                        value: selected.contains(s.id),
                        activeColor: AppColors.yellow,
                        checkColor: AppColors.black,
                        onChanged: (v) {
                          setState(() {
                            if (v == true) {
                              if (selected.length >= 2) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('A bus can have at most 2 bus admins'),
                                  ),
                                );
                                return;
                              }
                              selected.add(s.id);
                            } else {
                              selected.remove(s.id);
                            }
                          });
                        },
                      ),
                  ],
                );
              },
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => context.pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _saving ? null : _save,
          child: _saving
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Save'),
        ),
      ],
    );
  }
}
