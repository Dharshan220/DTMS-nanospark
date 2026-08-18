import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../core/storage/token_storage.dart';
import '../../repositories/auth_repository.dart';
import '../../repositories/bus_repository.dart';
import '../../repositories/complaint_repository.dart';
import '../../repositories/dashboard_repository.dart';
import '../../repositories/feedback_repository.dart';
import '../../repositories/notification_repository.dart';
import '../../repositories/tracking_repository.dart';
import '../../repositories/user_repository.dart';

/// Wire the token provider into the Dio client so every request is authenticated.
class Bootstrap {
  static Future<void> init() async {
    ApiClient.tokenProvider = TokenStorage.readToken;
    ApiClient.instance;
  }
}

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient.instance);

final authRepositoryProvider = Provider<AuthRepository>((ref) => AuthRepository(ref.watch(apiClientProvider)));
final dashboardRepositoryProvider = Provider<DashboardRepository>((ref) => DashboardRepository(ref.watch(apiClientProvider)));
final userRepositoryProvider = Provider<UserRepository>((ref) => UserRepository(ref.watch(apiClientProvider)));
final busRepositoryProvider = Provider<BusRepository>((ref) => BusRepository(ref.watch(apiClientProvider)));
final complaintRepositoryProvider = Provider<ComplaintRepository>((ref) => ComplaintRepository(ref.watch(apiClientProvider)));
final feedbackRepositoryProvider = Provider<FeedbackRepository>((ref) => FeedbackRepository(ref.watch(apiClientProvider)));
final notificationRepositoryProvider = Provider<NotificationRepository>((ref) => NotificationRepository(ref.watch(apiClientProvider)));
final trackingRepositoryProvider = Provider<TrackingRepository>((ref) => TrackingRepository(ref.watch(apiClientProvider)));
