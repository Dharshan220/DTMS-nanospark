import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/errors/api_exception.dart';
import '../../models/user.dart';
import '../../providers/auth_controller.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _identifier = TextEditingController();
  final _password = TextEditingController();
  UserRole _role = UserRole.student;
  bool _obscure = true;
  String? _error;

  static const _roleIcons = {
    UserRole.admin: Icons.admin_panel_settings,
    UserRole.student: Icons.school,
    UserRole.teacher: Icons.co_present,
    UserRole.parent: Icons.family_restroom,
  };

  @override
  void dispose() {
    _identifier.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _error = null);
    try {
      await ref.read(authControllerProvider.notifier).login(
            role: _role,
            identifier: _identifier.text.trim(),
            password: _password.text,
          );
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = 'Login failed. Please try again.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final loading = ref.watch(authControllerProvider).loading;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Brand
                  Container(
                    width: 84,
                    height: 84,
                    margin: const EdgeInsets.only(bottom: 18),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: AppColors.yellow,
                      borderRadius: BorderRadius.circular(22),
                    ),
                    child: const Icon(Icons.directions_bus_filled, size: 48, color: AppColors.black),
                  ),
                  Text(
                    'DACE Transport',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white : AppColors.black,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Sign in to your DTMS account',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                  ),
                  const SizedBox(height: 28),

                  // Role selector
                  Text('Login as', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: UserRole.values.map((role) {
                      final selected = role == _role;
                      return ChoiceChip(
                        selected: selected,
                        avatar: Icon(
                          _roleIcons[role],
                          size: 18,
                          color: selected ? AppColors.black : Colors.grey.shade500,
                        ),
                        label: Text(role.label),
                        selectedColor: AppColors.yellow,
                        backgroundColor: isDark ? AppColors.darkGrey : Colors.white,
                        labelStyle: TextStyle(
                          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                          color: selected ? AppColors.black : (isDark ? Colors.white70 : Colors.black87),
                        ),
                        onSelected: (_) => setState(() => _role = role),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 20),

                  Form(
                    key: _formKey,
                    child: Column(
                      children: [
                        TextFormField(
                          controller: _identifier,
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(
                            labelText: 'Email or Mobile',
                            prefixIcon: Icon(Icons.person_outline),
                          ),
                          validator: (v) => (v == null || v.trim().isEmpty)
                              ? 'Enter your email or phone'
                              : null,
                        ),
                        const SizedBox(height: 14),
                        TextFormField(
                          controller: _password,
                          obscureText: _obscure,
                          decoration: InputDecoration(
                            labelText: 'Password',
                            prefixIcon: const Icon(Icons.lock_outline),
                            suffixIcon: IconButton(
                              icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility),
                              onPressed: () => setState(() => _obscure = !_obscure),
                            ),
                          ),
                          validator: (v) =>
                              (v == null || v.isEmpty) ? 'Enter your password' : null,
                          onFieldSubmitted: (_) => _submit(),
                        ),
                      ],
                    ),
                  ),

                  if (_error != null) ...[
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.danger.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline, color: AppColors.danger, size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(_error!, style: const TextStyle(color: AppColors.danger)),
                          ),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 22),
                  FilledButton(
                    onPressed: loading ? null : _submit,
                    child: loading
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(strokeWidth: 2.5),
                          )
                        : Text('Sign In as ${_role.label}'),
                  ),
                  const SizedBox(height: 22),

                  // Demo credentials
                  AppCard(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.info_outline, size: 18, color: AppColors.yellowDark),
                            const SizedBox(width: 8),
                            Text(
                              'Demo accounts',
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Super Admin → admin@dtms.in / admin123\n'
                          'Student → student@dtms.in / student123\n'
                          'Teacher → teacher@dtms.in / teacher123\n'
                          'Parent → parent@dtms.in / parent123',
                          style: TextStyle(
                            fontSize: 12,
                            height: 1.7,
                            color: isDark ? Colors.grey.shade400 : Colors.grey.shade700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
