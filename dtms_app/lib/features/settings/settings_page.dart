import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../providers/settings_controller.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';

class SettingsPage extends ConsumerWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsControllerProvider);
    final controller = ref.read(settingsControllerProvider.notifier);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          AppCard(
            child: SwitchListTile(
              title: const Text('Dark mode'),
              subtitle: const Text('Black & yellow theme'),
              value: settings.darkMode,
              activeTrackColor: AppColors.yellow,
              activeThumbColor: AppColors.black,
              onChanged: (v) => controller.setDarkMode(v),
            ),
          ),
          const SizedBox(height: 12),
          AppCard(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.help_outline),
                  title: const Text('Help & Support'),
                  subtitle: const Text('Contact the transport office'),
                  onTap: () => showDialog<void>(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: const Text('Transport Office'),
                      content: Text(
                        'Phone: ${' +919962022222'}\n'
                        'Email: ${'info@dhaanishcollege.co.in'}\n\n'
                        'Hours: Mon–Sat, 8:00 AM – 5:00 PM',
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => context.pop(),
                          child: const Text('OK'),
                        ),
                      ],
                    ),
                  ),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.info_outline),
                  title: const Text('About DTMS'),
                  subtitle: const Text('Version 1.0.0 · Nano Spark Team'),
                  onTap: () => showAboutDialog(
                    context: context,
                    applicationName: 'DTMS',
                    applicationVersion: '1.0.0',
                    applicationLegalese: 'DACE Transport · Dhaanish Ahmed College of Engineering',
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
