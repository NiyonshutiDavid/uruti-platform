// Configuration file for environment variables
// Centralized URL management for the application

// In production the frontend is served over HTTPS on Netlify.
// Direct calls to http://173.249.25.80 are blocked as Mixed Content.
// Using an empty-string base makes every request a relative URL (e.g. /api/v1/…)
// which Netlify proxies to the backend server-side via netlify.toml.
const IS_PROD = import.meta.env.PROD;

export const config = {
  // Actual backend host — used only for reference / server-side ops.
  productionBackendUrl: 'http://173.249.25.80:1199',

  // Core API host.
  // Production: '' → relative URL → Netlify proxy handles HTTPS→HTTP forwarding.
  // Development: explicit localhost so the Vite dev-server proxy (or direct) works.
  apiUrl: import.meta.env.VITE_API_URL || (IS_PROD ? '' : 'http://localhost:8010'),

  // Same logic for the chatbot/AI routes (co-located on the same backend).
  chatbotApiUrl:
    import.meta.env.VITE_CHATBOT_API_URL ||
    import.meta.env.VITE_API_URL ||
    (IS_PROD ? '' : 'http://localhost:8010'),
  
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
