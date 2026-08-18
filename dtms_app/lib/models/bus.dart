import 'bus_route.dart';

class Bus {
  final String id;
  final int routeNumber;
  final String vehicleNumber;
  final String driverName;
  final String driverPhone;
  final int capacity;
  final String status; // active | maintenance
  final List<String> busAdminIds;
  final int busAdminCount;
  final List<BusAdmin> admins;

  const Bus({
    required this.id,
    required this.routeNumber,
    required this.vehicleNumber,
    this.driverName = '',
    this.driverPhone = '',
    this.capacity = 60,
    this.status = 'active',
    this.busAdminIds = const [],
    this.busAdminCount = 0,
    this.admins = const [],
  });

  bool get isActive => status == 'active';

  factory Bus.fromJson(Map<String, dynamic> json) => Bus(
        id: json['id']?.toString() ?? '',
        routeNumber: (json['routeNumber'] as num?)?.toInt() ?? 0,
        vehicleNumber: json['vehicleNumber']?.toString() ?? '',
        driverName: json['driverName']?.toString() ?? '',
        driverPhone: json['driverPhone']?.toString() ?? '',
        capacity: (json['capacity'] as num?)?.toInt() ?? 60,
        status: json['status']?.toString() ?? 'active',
        busAdminIds: (json['busAdminIds'] as List?)?.map((e) => e.toString()).toList() ?? const [],
        busAdminCount: (json['busAdminCount'] as num?)?.toInt() ?? (json['busAdminIds'] as List?)?.length ?? 0,
        admins: (json['admins'] as List?)?.map((e) => BusAdmin.fromJson(e as Map<String, dynamic>)).toList() ?? const [],
      );
}

class BusAdmin {
  final String id;
  final String name;
  final String? department;
  final String? year;
  final String? section;

  const BusAdmin({required this.id, required this.name, this.department, this.year, this.section});

  factory BusAdmin.fromJson(Map<String, dynamic> json) => BusAdmin(
        id: json['id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        department: json['department']?.toString(),
        year: json['year']?.toString(),
        section: json['section']?.toString(),
      );
}

class LiveBus {
  final String busId;
  final int routeNumber;
  final String vehicleNumber;
  final String driverName;
  final double lat;
  final double lng;
  final int speedKmh;
  final int heading;
  final String nextStop;
  final String stopTime;
  final int etaMinutes;

  const LiveBus({
    required this.busId,
    required this.routeNumber,
    required this.vehicleNumber,
    required this.driverName,
    required this.lat,
    required this.lng,
    required this.speedKmh,
    required this.heading,
    required this.nextStop,
    required this.stopTime,
    required this.etaMinutes,
  });

  factory LiveBus.fromJson(Map<String, dynamic> json) => LiveBus(
        busId: json['busId']?.toString() ?? '',
        routeNumber: (json['routeNumber'] as num?)?.toInt() ?? 0,
        vehicleNumber: json['vehicleNumber']?.toString() ?? '',
        driverName: json['driverName']?.toString() ?? '',
        lat: (json['lat'] as num?)?.toDouble() ?? 0,
        lng: (json['lng'] as num?)?.toDouble() ?? 0,
        speedKmh: (json['speedKmh'] as num?)?.toInt() ?? 0,
        heading: (json['heading'] as num?)?.toInt() ?? 0,
        nextStop: json['nextStop']?.toString() ?? '',
        stopTime: json['stopTime']?.toString() ?? '',
        etaMinutes: (json['etaMinutes'] as num?)?.toInt() ?? 0,
      );
}

class TrackingSnapshot {
  final BusRoute route;
  final LiveBus current;

  const TrackingSnapshot({required this.route, required this.current});

  factory TrackingSnapshot.fromJson(Map<String, dynamic> json) => TrackingSnapshot(
        route: BusRoute.fromJson(json['route'] as Map<String, dynamic>),
        current: LiveBus.fromJson(json['current'] as Map<String, dynamic>),
      );
}
