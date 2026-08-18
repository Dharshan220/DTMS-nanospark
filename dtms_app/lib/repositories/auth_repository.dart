import '../../core/config/api_endpoints.dart';
import '../../core/network/api_client.dart';
import '../../core/storage/token_storage.dart';
import '../../models/user.dart';

class AuthRepository {
  final ApiClient _client;

  AuthRepository(this._client);

  Future<User> login({
    required UserRole role,
    required String identifier,
    required String password,
  }) async {
    final data = await _client.post(
      ApiEndpoints.login,
      data: {'role': role.apiValue, 'identifier': identifier, 'password': password},
    );
    final token = data['token']?.toString();
    if (token == null || token.isEmpty) {
      throw Exception('No token returned');
    }
    await TokenStorage.saveToken(token);
    await TokenStorage.cacheRole(role.apiValue);
    final user = User.fromJson(data['user'] as Map<String, dynamic>);
    await TokenStorage.cacheUserId(user.id);
    return user;
  }

  Future<User?> currentUser() async {
    final token = await TokenStorage.readToken();
    if (token == null || token.isEmpty) return null;
    final data = await _client.get(ApiEndpoints.me);
    return User.fromJson(data['user'] as Map<String, dynamic>);
  }

  Future<User> updateProfile({
    String? name,
    String? phone,
    String? photoUrl,
    String? boardingStop,
  }) async {
    final data = await _client.put(
      ApiEndpoints.updateProfile,
      data: {
        if (name != null) 'name': name,
        if (phone != null) 'phone': phone,
        if (photoUrl != null) 'photoUrl': photoUrl,
        if (boardingStop != null) 'boardingStop': boardingStop,
      },
    );
    return User.fromJson(data['user'] as Map<String, dynamic>);
  }

  Future<void> changePassword(String current, String next) async {
    await _client.post(
      ApiEndpoints.changePassword,
      data: {'currentPassword': current, 'newPassword': next},
    );
  }

  Future<void> logout() => TokenStorage.clearAll();
}
