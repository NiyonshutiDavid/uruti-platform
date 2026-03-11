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
    // Default AI routing now lives on the same backend host/port.
    // Use configure(..., aiBackendUrl: ...) only when a separate AI service is intended.
    return backendUrl;
  }

  static bool _isLocalDevHost(String host) {
    return host == 'localhost' || host == '127.0.0.1' || host == '10.0.2.2';
  }

  /// Normalizes media URLs so stale localhost ports don't break image loading.
  static String? normalizeMediaUrl(String? rawUrl) {
    if (rawUrl == null) return null;
    final trimmed = rawUrl.trim();
    if (trimmed.isEmpty) return null;

    final parsed = Uri.tryParse(trimmed);
    if (parsed == null) return null;

    if (!parsed.hasScheme) {
      final path = trimmed.startsWith('/') ? trimmed : '/$trimmed';
      return '$apiBaseUrl$path';
    }

    if (parsed.path.isEmpty || parsed.path == '/') {
      return null;
    }

    final backendUri = Uri.tryParse(apiBaseUrl);
    if (backendUri == null || !_isLocalDevHost(parsed.host)) {
      return trimmed;
    }

    // Rewrite local development URLs to the backend currently selected at app start.
    return parsed
        .replace(
          scheme: backendUri.scheme,
          host: backendUri.host,
          port: backendUri.hasPort ? backendUri.port : null,
        )
        .toString();
  }

  // Storage keys
  static const String tokenKey = 'uruti_token';
  static const String userKey = 'uruti_user';
  static const String backendUrlKey = 'uruti_backend_url';

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
