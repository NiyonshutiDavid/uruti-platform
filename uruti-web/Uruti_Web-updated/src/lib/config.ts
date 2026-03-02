// Configuration file for environment variables
// Centralized URL management for the application

export const config = {
  // Backend API URL - defaults to localhost in development
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  
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
