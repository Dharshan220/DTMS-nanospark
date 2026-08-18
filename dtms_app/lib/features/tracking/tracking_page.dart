import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../core/config/app_config.dart';
import '../../models/bus.dart';
import '../../models/user.dart';
import '../../providers/auth_controller.dart';
import '../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';

final liveBusesProvider = StreamProvider.autoDispose<List<LiveBus>>((ref) {
  final repo = ref.watch(trackingRepositoryProvider);
  return Stream.periodic(const Duration(seconds: 5), (_) => null)
      .asyncMap((_) => repo.allBuses())
      .handleError((e) {});
});

final myTrackingProvider = StreamProvider.autoDispose<TrackingSnapshot>((ref) {
  final repo = ref.watch(trackingRepositoryProvider);
  return Stream.periodic(const Duration(seconds: 5), (_) => null)
      .asyncMap((_) => repo.myBus())
      .handleError((e) {});
});

class TrackingPage extends ConsumerWidget {
  const TrackingPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isAdmin = ref.watch(currentUserProvider)?.role == UserRole.admin;

    return Scaffold(
      appBar: AppBar(
        title: Text(isAdmin ? 'Live Bus Map' : 'Track My Bus'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.invalidate(liveBusesProvider);
              ref.invalidate(myTrackingProvider);
            },
          ),
        ],
      ),
      body: isAdmin ? const _AdminLiveMap() : const _MyBusLiveMap(),
    );
  }
}

class _AdminLiveMap extends ConsumerWidget {
  const _AdminLiveMap();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(liveBusesProvider);

    if (!AppConfig.hasMapsKey) {
      return const EmptyState(
        message: 'Google Maps API key not configured.\n'
            'Run with --dart-define=GOOGLE_MAPS_API_KEY=YOUR_KEY',
        icon: Icons.map_outlined,
      );
    }

    return async.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => EmptyState(
        message: 'Could not load live buses.\n$e',
        icon: Icons.cloud_off,
        actionLabel: 'Retry',
        onAction: () => ref.invalidate(liveBusesProvider),
      ),
      data: (buses) {
        final markers = buses
            .map((b) => Marker(
                  markerId: MarkerId(b.busId),
                  position: LatLng(b.lat, b.lng),
                  infoWindow: InfoWindow(
                    title: 'Route ${b.routeNumber} · ${b.vehicleNumber}',
                    snippet: '${b.speedKmh} km/h · ETA ${b.etaMinutes} min · next: ${b.nextStop}',
                  ),
                  icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueYellow),
                ))
            .toSet();

        final center = buses.isNotEmpty
            ? LatLng(buses.first.lat, buses.first.lng)
            : const LatLng(12.8846, 80.0742);

        return Stack(
          children: [
            GoogleMap(
              initialCameraPosition: CameraPosition(target: center, zoom: 11),
              markers: markers,
              myLocationEnabled: true,
              myLocationButtonEnabled: true,
            ),
            Positioned(
              left: 12,
              right: 12,
              bottom: 16,
              child: _BusStatusCard(buses: buses),
            ),
          ],
        );
      },
    );
  }
}

class _BusStatusCard extends StatelessWidget {
  final List<LiveBus> buses;

  const _BusStatusCard({required this.buses});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final moving = buses.where((b) => b.speedKmh > 5).length;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkGrey : Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              const Icon(Icons.wifi_tethering, color: AppColors.success, size: 22),
              const SizedBox(width: 8),
              Text(
                '$moving buses moving · ${buses.length} live',
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
              ),
              const Spacer(),
              Text(
                'updates every 5s',
                style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
              ),
            ],
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 64,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: buses.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final b = buses[i];
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.yellow.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Route ${b.routeNumber}',
                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${b.speedKmh} km/h · ETA ${b.etaMinutes}m',
                        style: TextStyle(fontSize: 10.5, color: Colors.grey.shade600),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _MyBusLiveMap extends ConsumerStatefulWidget {
  const _MyBusLiveMap();

  @override
  ConsumerState<_MyBusLiveMap> createState() => _MyBusLiveMapState();
}

class _MyBusLiveMapState extends ConsumerState<_MyBusLiveMap> {
  GoogleMapController? _mapController;
  final _mapKey = GlobalKey();
  LatLng? _lastBusPos;

  @override
  void dispose() {
    _mapController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(myTrackingProvider);

    if (!AppConfig.hasMapsKey) {
      return const EmptyState(
        message: 'Google Maps API key not configured.\n'
            'Run with --dart-define=GOOGLE_MAPS_API_KEY=YOUR_KEY',
        icon: Icons.map_outlined,
      );
    }

    return async.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => EmptyState(
        message: 'No live data for your bus yet.\n$e',
        icon: Icons.directions_bus_outlined,
        actionLabel: 'Retry',
        onAction: () => ref.invalidate(myTrackingProvider),
      ),
      data: (snap) {
        final route = snap.route;
        final bus = snap.current;

        final polyline = route.path.length >= 2
            ? {
                Polyline(
                  polylineId: const PolylineId('route'),
                  points: route.path.map((p) => LatLng(p.lat, p.lng)).toList(),
                  color: AppColors.yellow,
                  width: 5,
                ),
              }
            : <Polyline>{};

        final stops = route.timelinePoints
            .map((s) => s.lat != null && s.lng != null
                ? Marker(
                    markerId: MarkerId(s.name),
                    position: LatLng(s.lat!, s.lng!),
                    icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
                    infoWindow: InfoWindow(title: s.name, snippet: s.time),
                  )
                : null)
            .whereType<Marker>()
            .toSet();

        final busPos = LatLng(bus.lat, bus.lng);
        final busMarker = {
          Marker(
            markerId: const MarkerId('mybus'),
            position: busPos,
            infoWindow: InfoWindow(
              title: 'Route ${bus.routeNumber}',
              snippet: '${bus.speedKmh} km/h',
            ),
            icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueYellow),
          ),
        };

        final center = _lastBusPos ?? busPos;
        _lastBusPos = busPos;

        return Stack(
          children: [
            GoogleMap(
              key: _mapKey,
              initialCameraPosition: CameraPosition(target: center, zoom: 13),
              polylines: polyline,
              markers: stops.union(busMarker),
              myLocationEnabled: true,
              myLocationButtonEnabled: true,
              onMapCreated: (controller) => _mapController = controller,
            ),
            Positioned(
              left: 12,
              right: 12,
              bottom: 16,
              child: _MyBusInfoCard(snap: snap),
            ),
          ],
        );
      },
    );
  }
}

class _MyBusInfoCard extends StatelessWidget {
  final TrackingSnapshot snap;

  const _MyBusInfoCard({required this.snap});

  @override
  Widget build(BuildContext context) {
    final bus = snap.current;
    final route = snap.route;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkGrey : Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.yellow,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Route ${bus.routeNumber}',
                  style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.black),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  route.vehicleNumber,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Text('${bus.speedKmh} km/h',
                  style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.success)),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(Icons.flag_outlined, size: 18, color: AppColors.warning),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Next stop: ${bus.nextStop} (${bus.stopTime})',
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(Icons.schedule, size: 18, color: AppColors.info),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Arriving college in ~${bus.etaMinutes} minutes',
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
