import '../../core/config/api_endpoints.dart';
import '../../core/network/api_client.dart';
import '../../models/user.dart';

class UserRepository {
  final ApiClient _client;

  UserRepository(this._client);

  Future<List<User>> list({
    String? role,
    String? search,
    int page = 1,
    int limit = 20,
  }) async {
    final data = await _client.get(ApiEndpoints.users, query: {
      if (role != null) 'role': role,
      if (search != null && search.isNotEmpty) 'search': search,
      'page': page,
      'limit': limit,
    });
    final items = (data['items'] as List?) ?? [];
    return items.map((e) => User.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<User> create(Map<String, dynamic> body) async {
    final data = await _client.post(ApiEndpoints.users, data: body);
    return User.fromJson(data['user'] as Map<String, dynamic>);
  }

  Future<User> update(String id, Map<String, dynamic> body) async {
    final data = await _client.put('${ApiEndpoints.users}/$id', data: body);
    return User.fromJson(data['user'] as Map<String, dynamic>);
  }

  Future<void> delete(String id) => _client.delete('${ApiEndpoints.users}/$id');
}
