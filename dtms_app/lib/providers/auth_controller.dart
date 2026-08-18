import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/storage/token_storage.dart';
import '../models/user.dart';
import '../repositories/auth_repository.dart';
import 'providers.dart';

class AuthState {
  final User? user;
  final bool loading;
  final bool initializing;

  const AuthState({this.user, this.loading = false, this.initializing = true});

  bool get isLoggedIn => user != null;

  AuthState copyWith({User? user, bool? loading, bool? initializing}) => AuthState(
        user: user ?? this.user,
        loading: loading ?? this.loading,
        initializing: initializing ?? this.initializing,
      );
}

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._repo) : super(const AuthState());

  final AuthRepository _repo;

  Future<void> init() async {
    try {
      final user = await _repo.currentUser();
      state = AuthState(user: user, initializing: false);
    } catch (_) {
      // Token missing or expired — go to login.
      await TokenStorage.clearAll();
      state = const AuthState(initializing: false);
    }
  }

  Future<bool> login({
    required UserRole role,
    required String identifier,
    required String password,
  }) async {
    state = state.copyWith(loading: true);
    try {
      final user = await _repo.login(role: role, identifier: identifier, password: password);
      state = AuthState(user: user, loading: false, initializing: false);
      return true;
    } catch (e) {
      state = state.copyWith(loading: false);
      rethrow;
    }
  }

  Future<void> setUser(User user) {
    state = AuthState(user: user, initializing: false);
    return Future.value();
  }

  Future<void> logout() async {
    await _repo.logout();
    state = const AuthState(initializing: false);
  }
}

final authControllerProvider =
    StateNotifierProvider<AuthController, AuthState>((ref) {
  final controller = AuthController(ref.watch(authRepositoryProvider));
  controller.init();
  return controller;
});

final currentUserProvider = Provider<User?>((ref) => ref.watch(authControllerProvider).user);
