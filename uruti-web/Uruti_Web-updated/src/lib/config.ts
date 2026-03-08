// Configuration file for environment variables
// Centralized URL management for the application

export const config = {
  // Backend API URL - defaults to hosted API when env override is not provided
  apiUrl: import.meta.env.VITE_API_URL || 'http://173.249.25.80:1199',
  
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
