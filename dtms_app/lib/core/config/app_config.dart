/// App-wide configuration. Adjust values here, or override via --dart-define.
class AppConfig {
  AppConfig._();

  /// Base URL of the DTMS backend API.
  /// Override at build time:
  ///   flutter run --dart-define=API_BASE_URL=https://your-api.example.com
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:4000', // Android emulator → host machine
  );

  /// Google Maps API key. Required for the live map screen.
  /// flutter run --dart-define=GOOGLE_MAPS_API_KEY=AIza...
  static const String googleMapsApiKey = String.fromEnvironment(
    'GOOGLE_MAPS_API_KEY',
    defaultValue: '',
  );

  static const String appName = 'DTMS';
  static const String collegeName = 'Dhaanish Ahmed College of Engineering';
  static const String collegeAddress =
      'Dhaanish Nagar, Vanchuvancherry, Padappai, Sriperumbudur Taluk, Chennai 601 301';
  static const String transportPhone = '+919962022222';
  static const String collegeEmail = 'info@dhaanishcollege.co.in';

  static String get mapsEnabled => googleMapsApiKey.isNotEmpty ? googleMapsApiKey : '';
  static bool get hasMapsKey => googleMapsApiKey.isNotEmpty;
}
