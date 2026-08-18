import '../../core/config/api_endpoints.dart';
import '../../core/network/api_client.dart';
import '../../models/domain.dart';

class FeedbackRepository {
  final ApiClient _client;

  FeedbackRepository(this._client);

  Future<List<FeedbackEntry>> list() async {
    final data = await _client.get(ApiEndpoints.feedback);
    final items = data is List ? data : (data['items'] as List? ?? []);
    return items.map((e) => FeedbackEntry.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> submit({
    String? name,
    required String department,
    required String year,
    required String section,
    String routeNumber = '',
    required String category,
    required String description,
    String? userId,
    String? imageUrl,
  }) async {
    await _client.post(
      ApiEndpoints.feedback,
      data: {
        'name': name ?? 'Anonymous',
        'department': department,
        'year': year,
        'section': section,
        'routeNumber': routeNumber,
        'category': category,
        'description': description,
        if (userId != null) 'userId': userId,
        if (imageUrl != null) 'imageUrl': imageUrl,
      },
    );
  }
}
