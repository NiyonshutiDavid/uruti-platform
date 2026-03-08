class AppConstants {
  // API — configured from main.dart via AppConstants.configure()
  // Do NOT edit here; change kBackendUrl in main.dart instead.
  static late String apiBaseUrl;
  static late String apiV1;
  static late String aiBaseUrl;
  static late String aiApiV1;

  static void configure(String backendUrl, {String? aiBackendUrl}) {
    apiBaseUrl = backendUrl;
    apiV1 = '$backendUrl/api/v1';

    final resolvedAiBaseUrl =
        (aiBackendUrl != null && aiBackendUrl.trim().isNotEmpty)
        ? aiBackendUrl.trim()
        : _deriveAiBaseUrl(backendUrl);
    aiBaseUrl = resolvedAiBaseUrl;
    aiApiV1 = '$resolvedAiBaseUrl/api/v1';
  }

  static String _deriveAiBaseUrl(String backendUrl) {
    final uri = Uri.tryParse(backendUrl);
    if (uri == null) {
      return backendUrl;
    }

    final hasPort = uri.hasPort;
    final targetPort = hasPort ? 8020 : null;
    return uri.replace(port: targetPort).toString();
  }

  // Storage keys
  static const String tokenKey = 'uruti_token';
  static const String userKey = 'uruti_user';

  // App info
  static const String appName = 'Uruti';
  static const String appVersion = '1.0.0';
  static const String appTagline = "Digital Ecosystem for Founders & Investors";

  // Roles
  static const String roleFounder = 'founder';
  static const String roleInvestor = 'investor';
  static const String roleMentor = 'mentor';
  static const String roleAdmin = 'admin';

  // Pagination
  static const int pageSize = 10;
}
