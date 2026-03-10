// Configuration file for environment variables
// Centralized URL management for the application

export const config = {
  // Deployed defaults. Use VITE_API_URL / VITE_CHATBOT_API_URL to override.
  productionBackendUrl: 'http://173.249.25.80:1199',

  // Core API host.
  apiUrl: import.meta.env.VITE_API_URL || 'http://173.249.25.80:1199',

  // AI routes are currently served on the same deployed host unless overridden.
  chatbotApiUrl:
    import.meta.env.VITE_CHATBOT_API_URL ||
    import.meta.env.VITE_API_URL ||
    'http://173.249.25.80:1199',
  
  // Other configuration options
  appName: 'Uruti Digital Ecosystem',
  version: '1.0.0',
  
  // Feature flags
  features: {
    enableChatbot: true,
    enableNotifications: true,
    enableAnalytics: false,
  },
  
  // Admin credentials (for reference only - actual auth handled by backend)
  admin: {
    defaultEmail: 'dniyonshuti@nexventures.net',
    // Password is: Uruti@January2026.
  }
} as const;

export default config;
