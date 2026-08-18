import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/errors/api_exception.dart';
import '../../models/user.dart';
import '../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';

final usersProvider = FutureProvider.autoDispose<List<User>>((ref) {
  final role = ref.watch(usersFilterProvider);
  final search = ref.watch(usersSearchProvider);
  return ref.watch(userRepositoryProvider).list(role: role?.apiValue, search: search, limit: 100);
});

final usersFilterProvider = StateProvider<UserRole?>((ref) => null);
final usersSearchProvider = StateProvider<String>((ref) => '');

class UsersManagementPage extends ConsumerWidget {
  const UsersManagementPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final roleFilter = ref.watch(usersFilterProvider);
    final async = ref.watch(usersProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(roleFilter == null ? 'All Users' : '${roleFilter.label}s'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add_alt_1),
            tooltip: 'Add user',
            onPressed: () async {
              await showDialog<void>(
                context: context,
                builder: (_) => const _UserFormDialog(),
              );
              ref.invalidate(usersProvider);
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    decoration: const InputDecoration(
                      hintText: 'Search name, email, roll no…',
                      prefixIcon: Icon(Icons.search),
                      isDense: true,
                    ),
                    onChanged: (v) => ref.read(usersSearchProvider.notifier).state = v,
                  ),
                ),
                const SizedBox(width: 10),
                PopupMenuButton<UserRole?>(
                  tooltip: 'Filter by role',
                  initialValue: roleFilter,
                  onSelected: (v) => ref.read(usersFilterProvider.notifier).state = v,
                  itemBuilder: (_) => [
                    const PopupMenuItem(value: null, child: Text('All roles')),
                    ...UserRole.values
                        .where((r) => r != UserRole.admin)
                        .map((r) => PopupMenuItem(value: r, child: Text(r.label))),
                  ],
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.yellow.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.filter_list, color: AppColors.yellowDark),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: async.when(
              loading: () => const Padding(padding: EdgeInsets.all(16), child: ListShimmer()),
              error: (e, _) => EmptyState(
                message: 'Could not load users.\n$e',
                actionLabel: 'Retry',
                onAction: () => ref.invalidate(usersProvider),
              ),
              data: (users) {
                if (users.isEmpty) {
                  return const EmptyState(message: 'No users found', icon: Icons.people_outline);
                }
                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: users.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemBuilder: (context, i) {
                    final u = users[i];
                    return AppCard(
                      onTap: () async {
                        await showDialog<void>(
                          context: context,
                          builder: (_) => _UserFormDialog(user: u),
                        );
                        ref.invalidate(usersProvider);
                      },
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 22,
                            backgroundColor: AppColors.yellow.withValues(alpha: 0.2),
                            child: Text(
                              u.name.isNotEmpty ? u.name[0].toUpperCase() : '?',
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                color: AppColors.yellowDark,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  u.name,
                                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                                ),
                                Text(
                                  '${u.role.label}'
                                  '${u.routeNumber != null ? ' · Route ${u.routeNumber}' : ''}',
                                  style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                                ),
                              ],
                            ),
                          ),
                          if (u.isBusAdmin) const Tag('Bus Admin', foreground: AppColors.black),
                        ],
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _UserFormDialog extends ConsumerStatefulWidget {
  final User? user;

  const _UserFormDialog({this.user});

  @override
  ConsumerState<_UserFormDialog> createState() => _UserFormDialogState();
}

class _UserFormDialogState extends ConsumerState<_UserFormDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _email;
  late final TextEditingController _phone;
  late final TextEditingController _password;
  late final TextEditingController _department;
  late final TextEditingController _rollNo;
  late final TextEditingController _route;
  late final TextEditingController _stop;
  late UserRole _role;
  String? _year;
  String? _section;
  late bool _busAdmin;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final u = widget.user;
    _name = TextEditingController(text: u?.name ?? '');
    _email = TextEditingController(text: u?.email ?? '');
    _phone = TextEditingController(text: u?.phone ?? '');
    _password = TextEditingController();
    _department = TextEditingController(text: u?.department ?? '');
    _rollNo = TextEditingController(text: u?.rollNo ?? '');
    _route = TextEditingController(text: u?.routeNumber?.toString() ?? '');
    _stop = TextEditingController(text: u?.boardingStop ?? '');
    _role = u?.role ?? UserRole.student;
    _year = u?.year;
    _section = u?.section;
    _busAdmin = u?.isBusAdmin ?? false;
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _password.dispose();
    _department.dispose();
    _rollNo.dispose();
    _route.dispose();
    _stop.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final body = {
      'role': _role.apiValue,
      'name': _name.text.trim(),
      'email': _email.text.trim(),
      'phone': _phone.text.trim(),
      'department': _department.text.trim(),
      'year': _year,
      'section': _section,
      'rollNo': _rollNo.text.trim(),
      'routeNumber': int.tryParse(_route.text),
      'boardingStop': _stop.text.trim(),
      'isBusAdmin': _busAdmin,
      if (widget.user == null) 'password': _password.text,
    };
    try {
      if (widget.user == null) {
        await ref.read(userRepositoryProvider).create(body);
      } else {
        await ref.read(userRepositoryProvider).update(widget.user!.id, body);
      }
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
    final isNew = widget.user == null;

    return AlertDialog(
      backgroundColor: isDark ? AppColors.darkSurface : Colors.white,
      title: Text(isNew ? 'Add User' : 'Edit ${widget.user!.name}'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<UserRole>(
                initialValue: _role,
                decoration: const InputDecoration(labelText: 'Role'),
                items: UserRole.values
                    .where((r) => r != UserRole.admin)
                    .map((r) => DropdownMenuItem(value: r, child: Text(r.label)))
                    .toList(),
                onChanged: (v) => setState(() => _role = v ?? UserRole.student),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _name,
                decoration: const InputDecoration(labelText: 'Full name *'),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _email,
                decoration: const InputDecoration(labelText: 'Email *'),
                keyboardType: TextInputType.emailAddress,
                validator: (v) =>
                    (v == null || !v.contains('@')) ? 'Enter a valid email' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _phone,
                decoration: const InputDecoration(labelText: 'Phone'),
                keyboardType: TextInputType.phone,
              ),
              if (isNew) ...[
                const SizedBox(height: 12),
                TextFormField(
                  controller: _password,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'Password *'),
                  validator: (v) => (v == null || v.length < 6) ? 'Min 6 characters' : null,
                ),
              ],
              if (_role == UserRole.student) ...[
                const SizedBox(height: 12),
                TextFormField(
                  controller: _department,
                  decoration: const InputDecoration(labelText: 'Department'),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        initialValue: _year,
                        decoration: const InputDecoration(labelText: 'Year'),
                        items: ['1', '2', '3', '4']
                            .map((y) => DropdownMenuItem(value: y, child: Text('Year $y')))
                            .toList(),
                        onChanged: (v) => setState(() => _year = v),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        initialValue: _section,
                        decoration: const InputDecoration(labelText: 'Section'),
                        items: ['A', 'B', 'C']
                            .map((s) => DropdownMenuItem(value: s, child: Text('Section $s')))
                            .toList(),
                        onChanged: (v) => setState(() => _section = v),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _rollNo,
                  decoration: const InputDecoration(labelText: 'Roll No'),
                ),
                const SizedBox(height: 12),
                SwitchListTile(
                  title: const Text('Student Bus Admin'),
                  subtitle: const Text('Can raise complaints & feedback'),
                  value: _busAdmin,
                  activeTrackColor: AppColors.yellow,
                  activeThumbColor: AppColors.black,
                  contentPadding: EdgeInsets.zero,
                  onChanged: (v) => setState(() => _busAdmin = v),
                ),
              ],
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _route,
                      decoration: const InputDecoration(labelText: 'Route No'),
                      keyboardType: TextInputType.number,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextFormField(
                      controller: _stop,
                      decoration: const InputDecoration(labelText: 'Boarding stop'),
                    ),
                  ),
                ],
              ),
            ],
          ),
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
              : Text(isNew ? 'Create' : 'Save'),
        ),
      ],
    );
  }
}
