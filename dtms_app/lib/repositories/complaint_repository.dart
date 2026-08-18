import '../../core/config/api_endpoints.dart';
import '../../core/network/api_client.dart';
import '../../models/domain.dart';

class ComplaintRepository {
  final ApiClient _client;

  ComplaintRepository(this._client);

  Future<List<String>> categories() async {
    final data = await _client.get(ApiEndpoints.complaintCategories);
    return (data['categories'] as List? ?? []).map((e) => e.toString()).toList();
  }

  Future<List<Complaint>> list({String? status, String? category, int page = 1, int limit = 20}) async {
    final data = await _client.get(ApiEndpoints.complaints, query: {
      if (status != null) 'status': status,
      if (category != null) 'category': category,
      'page': page,
      'limit': limit,
    });
    return (data['items'] as List? ?? [])
        .map((e) => Complaint.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Complaint> create({
    required String category,
    required String description,
    String? busId,
    int? routeNumber,
    String? imageUrl,
  }) async {
    final data = await _client.post(
      ApiEndpoints.complaints,
      data: {
        'category': category,
        'description': description,
        if (busId != null) 'busId': busId,
        if (routeNumber != null) 'routeNumber': routeNumber,
        if (imageUrl != null) 'imageUrl': imageUrl,
      },
    );
    return Complaint.fromJson(data['complaint'] as Map<String, dynamic>);
  }

  Future<Complaint> updateStatus(String id, String status, {String? response}) async {
    final data = await _client.put(
      '${ApiEndpoints.complaints}/$id/status',
      data: {'status': status, if (response != null) 'response': response},
    );
    return Complaint.fromJson(data['complaint'] as Map<String, dynamic>);
  }

  Future<void> delete(String id) => _client.delete('${ApiEndpoints.complaints}/$id');

  Future<String?> uploadImage(String filePath) async {
    final data = await _client.uploadFile('/api/upload/image', filePath);
    return data['imageUrl']?.toString();
  }
}
