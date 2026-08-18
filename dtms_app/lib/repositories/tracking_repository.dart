import '../../core/config/api_endpoints.dart';
import '../../core/network/api_client.dart';
import '../../models/bus.dart';
import '../../models/dashboard.dart';
import '../../models/domain.dart';

class TrackingRepository {
  final ApiClient _client;

  TrackingRepository(this._client);

  Future<QrPass> qrPass() async {
    final data = await _client.get(ApiEndpoints.qrPass);
    return QrPass.fromJson(data as Map<String, dynamic>);
  }

  Future<QrPass> qrPassForUser(String userId) async {
    final data = await _client.get('${ApiEndpoints.qrPass}?userId=$userId');
    return QrPass.fromJson(data as Map<String, dynamic>);
  }

  Future<List<LiveBus>> allBuses() async {
    final data = await _client.get(ApiEndpoints.trackingBuses);
    return (data['items'] as List? ?? [])
        .map((e) => LiveBus.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<TrackingSnapshot> myBus() async {
    final data = await _client.get(ApiEndpoints.trackingMy);
    return TrackingSnapshot.fromJson(data as Map<String, dynamic>);
  }

  Future<List<AttendanceRecord>> attendance() async {
    final data = await _client.get(ApiEndpoints.attendance);
    return (data['items'] as List? ?? [])
        .map((e) => AttendanceRecord.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> checkIn({String? busId, int? routeNumber, String? stopName}) async {
    await _client.post(ApiEndpoints.attendanceCheckIn, data: {
      if (busId != null) 'busId': busId,
      if (routeNumber != null) 'routeNumber': routeNumber,
      if (stopName != null) 'stopName': stopName,
    });
  }
}
