// Configuration file for environment variables
// Centralized URL management for the application

export const config = {
  // Local testing defaults. Use VITE_API_URL / VITE_CHATBOT_API_URL to override.
  productionBackendUrl: 'http://localhost:8010',

  // Route everything to localhost during end-to-end module testing.
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8010',

  // Dedicated AI service for local split-backend testing.
  chatbotApiUrl:
    import.meta.env.VITE_CHATBOT_API_URL ||
    import.meta.env.VITE_API_URL ||
    'http://localhost:8020',
  
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
