class BoardingStop {
  final String name;
  final String time;
  final double? lat;
  final double? lng;

  const BoardingStop({required this.name, required this.time, this.lat, this.lng});

  factory BoardingStop.fromJson(Map<String, dynamic> json) => BoardingStop(
        name: json['name']?.toString() ?? '',
        time: json['time']?.toString() ?? '',
        lat: (json['lat'] as num?)?.toDouble(),
        lng: (json['lng'] as num?)?.toDouble(),
      );

  Map<String, dynamic> toJson() => {'name': name, 'time': time};
}

class BusRoute {
  final String id;
  final int routeNumber;
  final String vehicleNumber;
  final String driverName;
  final String driverPhone;
  final String arrivalTime;
  final List<BoardingStop> boardingPoints;
  final List<BoardingStop> stops;
  final List<LatLngPoint> path;
  final bool active;

  const BusRoute({
    required this.id,
    required this.routeNumber,
    required this.vehicleNumber,
    required this.driverName,
    required this.driverPhone,
    required this.arrivalTime,
    this.boardingPoints = const [],
    this.stops = const [],
    this.path = const [],
    this.active = true,
  });

  factory BusRoute.fromJson(Map<String, dynamic> json) {
    List<BoardingStop> parseList(String key) => (json[key] as List?)
            ?.map((e) => BoardingStop.fromJson(e as Map<String, dynamic>))
            .toList() ??
        const [];

    final path = (json['path'] as List?)
            ?.map((e) {
              final m = e as Map<String, dynamic>;
              return LatLngPoint((m['lat'] as num).toDouble(), (m['lng'] as num).toDouble());
            })
            .toList() ??
        const <LatLngPoint>[];

    return BusRoute(
      id: json['id']?.toString() ?? '',
      routeNumber: (json['routeNumber'] as num?)?.toInt() ?? 0,
      vehicleNumber: json['vehicleNumber']?.toString() ?? '',
      driverName: json['driverName']?.toString() ?? '',
      driverPhone: json['driverPhone']?.toString() ?? '',
      arrivalTime: json['arrivalTime']?.toString() ?? '',
      boardingPoints: parseList('boardingPoints'),
      stops: parseList('stops'),
      path: path,
      active: json['active'] != false,
    );
  }

  List<BoardingStop> get timelinePoints =>
      boardingPoints.isNotEmpty ? boardingPoints : stops;
}

class LatLngPoint {
  final double lat;
  final double lng;

  const LatLngPoint(this.lat, this.lng);

  factory LatLngPoint.fromJson(Map<String, dynamic> json) =>
      LatLngPoint((json['lat'] as num).toDouble(), (json['lng'] as num).toDouble());
}
