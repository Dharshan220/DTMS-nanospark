import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsState {
  final bool darkMode;

  const SettingsState({this.darkMode = true});

  SettingsState copyWith({bool? darkMode}) => SettingsState(darkMode: darkMode ?? this.darkMode);
}

class SettingsController extends StateNotifier<SettingsState> {
  SettingsController() : super(const SettingsState(darkMode: true)) {
    _load();
  }

  static const _darkKey = 'dtms_dark_mode';

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final dark = prefs.getBool(_darkKey) ?? true;
    state = state.copyWith(darkMode: dark);
  }

  Future<void> setDarkMode(bool value) async {
    state = state.copyWith(darkMode: value);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_darkKey, value);
  }
}

final settingsControllerProvider =
    StateNotifierProvider<SettingsController, SettingsState>((ref) => SettingsController());
