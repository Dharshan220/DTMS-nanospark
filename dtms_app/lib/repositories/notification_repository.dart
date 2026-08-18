import '../../core/config/api_endpoints.dart';
import '../../core/network/api_client.dart';
import '../../models/domain.dart';

class NotificationRepository {
  final ApiClient _client;

  NotificationRepository(this._client);

  Future<List<NotificationItem>> list() async {
    final data = await _client.get(ApiEndpoints.notifications);
    return (data['items'] as List? ?? [])
        .map((e) => NotificationItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> markRead(String id) => _client.put('${ApiEndpoints.notifications}/$id/read');

  Future<void> markAllRead() => _client.put('${ApiEndpoints.notifications}/read-all');

  Future<void> broadcast({required String title, required String body, List<String>? roles}) =>
      _client.post(ApiEndpoints.notifications, data: {
        'title': title,
        'body': body,
        'roles': roles ?? [],
      });

  Future<void> registerFcmToken(String token) =>
      _client.post(ApiEndpoints.registerDevice, data: {'token': token});
}
