import '../../core/config/api_endpoints.dart';
import '../../core/network/api_client.dart';
import '../../models/bus.dart';
import '../../models/bus_route.dart';

class BusRepository {
  final ApiClient _client;

  BusRepository(this._client);

  Future<List<Bus>> listBuses() async {
    final data = await _client.get(ApiEndpoints.buses);
    return (data['items'] as List? ?? [])
        .map((e) => Bus.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Bus> getBus(String id) async {
    final data = await _client.get('${ApiEndpoints.buses}/$id');
    return Bus.fromJson(data as Map<String, dynamic>);
  }

  Future<List<BusRoute>> listRoutes() async {
    final data = await _client.get(ApiEndpoints.routes);
    return (data['items'] as List? ?? [])
        .map((e) => BusRoute.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<BusRoute> getRoute(int routeNumber) async {
    final data = await _client.get('${ApiEndpoints.routes}/$routeNumber');
    return BusRoute.fromJson(data['route'] as Map<String, dynamic>);
  }

  Future<void> createBus(Map<String, dynamic> body) => _client.post(ApiEndpoints.buses, data: body);

  Future<void> updateBus(String id, Map<String, dynamic> body) =>
      _client.put('${ApiEndpoints.buses}/$id', data: body);

  Future<void> deleteBus(String id) => _client.delete('${ApiEndpoints.buses}/$id');

  Future<void> assignBusAdmins(String busId, List<String> adminIds) =>
      _client.put('${ApiEndpoints.buses}/$busId/bus-admins', data: {'adminIds': adminIds});
}
