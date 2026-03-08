// Configuration file for environment variables
// Centralized URL management for the application

export const config = {
  // Shared production backend used by the live frontend deployment.
  productionBackendUrl: 'http://173.249.25.80:1199',

  // Backend API URL - prefer explicit env, else use same-origin on production
  // domains and localhost during development.
  apiUrl:
    import.meta.env.VITE_API_URL ||
    (typeof window !== 'undefined' &&
            (window.location.hostname.endsWith('uruti.rw') ||
             window.location.hostname.endsWith('netlify.app'))
        ? 'http://173.249.25.80:1199'
        : 'http://localhost:8010'),

  // Optional dedicated chatbot service URL. Falls back to apiUrl when unset.
  chatbotApiUrl:
    import.meta.env.VITE_CHATBOT_API_URL ||
    import.meta.env.VITE_API_URL ||
    (typeof window !== 'undefined' &&
            (window.location.hostname.endsWith('uruti.rw') ||
             window.location.hostname.endsWith('netlify.app'))
    ? 'http://173.249.25.80:1199'
        : 'http://localhost:8020'),
  
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
