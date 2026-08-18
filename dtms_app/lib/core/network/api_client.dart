import 'package:dio/dio.dart';

import '../errors/api_exception.dart';

/// Singleton Dio client with auth interceptor and friendly errors.
class ApiClient {
  ApiClient._(this._dio);

  final Dio _dio;

  static Future<String?> Function()? tokenProvider;

  static ApiClient? _instance;

  static ApiClient get instance => _instance ?? (_instance = ApiClient._(_createDio()));

  static Dio _createDio() {
    final dio = Dio(
      BaseOptions(
        baseUrl: _baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 30),
        contentType: Headers.jsonContentType,
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await tokenProvider?.call();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (e, handler) {
          handler.next(e);
        },
      ),
    );

    return dio;
  }

  static String get _baseUrl {
    const fromEnv = String.fromEnvironment('API_BASE_URL');
    if (fromEnv.isNotEmpty) return fromEnv;
    return 'http://10.0.2.2:4000';
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) =>
      _guard(() => _dio.get(path, queryParameters: query));

  Future<dynamic> post(String path, {Object? data, bool formData = false}) =>
      _guard(() => _dio.post(path, data: formData ? data : data, options: formData ? Options(contentType: Headers.multipartFormDataContentType) : null));

  Future<dynamic> put(String path, {Object? data}) => _guard(() => _dio.put(path, data: data));

  Future<dynamic> delete(String path) => _guard(() => _dio.delete(path));

  Future<dynamic> uploadFile(String path, String filePath, {String fieldName = 'image'}) async {
    final form = FormData.fromMap({
      fieldName: await MultipartFile.fromFile(filePath),
    });
    return _guard(() => _dio.post(path, data: form));
  }

  Future<dynamic> _guard(Future<dynamic> Function() fn) async {
    try {
      final response = await fn();
      return response.data;
    } on DioException catch (e) {
      final message = e.response?.data is Map && e.response!.data['message'] != null
          ? e.response!.data['message'].toString()
          : _messageFor(e);
      throw ApiException(message, statusCode: e.response?.statusCode, data: e.response?.data);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException('Unexpected error: $e');
    }
  }

  String _messageFor(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
        return 'Connection timed out. Check your internet.';
      case DioExceptionType.connectionError:
        return 'Cannot reach server. Is the DTMS API running?';
      case DioExceptionType.badResponse:
        return 'Server error (${e.response?.statusCode})';
      default:
        return 'Something went wrong. Please try again.';
    }
  }
}
