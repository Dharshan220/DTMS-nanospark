import '../../core/config/api_endpoints.dart';
import '../../core/network/api_client.dart';
import '../../models/dashboard.dart';

class DashboardRepository {
  final ApiClient _client;

  DashboardRepository(this._client);

  Future<DashboardData> myDashboard() async {
    final data = await _client.get(ApiEndpoints.dashboard);
    return DashboardData.fromJson(data as Map<String, dynamic>);
  }

  Future<AdminDashboardData> adminDashboard() async {
    final data = await _client.get(ApiEndpoints.dashboard);
    return AdminDashboardData.fromJson(data as Map<String, dynamic>);
  }

  Future<ReportSummary> reportSummary() async {
    final data = await _client.get(ApiEndpoints.reportsSummary);
    return ReportSummary.fromJson(data as Map<String, dynamic>);
  }
}
