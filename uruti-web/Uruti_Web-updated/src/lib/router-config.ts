import { UserRole } from './auth-context';

// Founder routes
export const founderRoutes = [
  { id: 'dashboard', path: '/dashboard/dashboard', label: 'Founder Snapshot' },
  { id: 'profile', path: '/dashboard/profile', label: 'My Profile' },
  { id: 'startups', path: '/dashboard/startups', label: 'Startup Hub' },
  { id: 'pitch-performance', path: '/dashboard/pitch-performance', label: 'Pitch Performance' },
  { id: 'ai-chat', path: '/dashboard/ai-chat', label: 'Uruti AI Chat' },
  { id: 'advisory-tracks', path: '/dashboard/advisory-tracks', label: 'Advisory Tracks' },
  { id: 'connections', path: '/dashboard/connections', label: 'Build Connections' },
  { id: 'calendar', path: '/dashboard/calendar', label: 'Readiness Calendar' },
  { id: 'availability', path: '/dashboard/availability', label: 'My Availability' },
  { id: 'pitch-coach', path: '/dashboard/pitch-coach', label: 'Pitch Coach' },
  { id: 'messages', path: '/dashboard/messages', label: 'Messages' },
  { id: 'settings', path: '/dashboard/settings', label: 'Settings' },
  { id: 'notifications', path: '/dashboard/notifications', label: 'Notifications' },
];

// Investor routes
export const investorRoutes = [
  { id: 'investor-dashboard', path: '/dashboard/investor-dashboard', label: 'Investor Dashboard' },
  { id: 'profile', path: '/dashboard/profile', label: 'My Profile' },
  { id: 'startup-discovery', path: '/dashboard/startup-discovery', label: 'Startup Discovery' },
  { id: 'deal-flow', path: '/dashboard/deal-flow', label: 'Deal Flow' },
  { id: 'connections', path: '/dashboard/connections', label: 'Network Directory' },
  { id: 'ai-chat', path: '/dashboard/ai-chat', label: 'Uruti AI Chat' },
  { id: 'calendar', path: '/dashboard/calendar', label: 'Meeting Calendar' },
  { id: 'availability', path: '/dashboard/availability', label: 'Availability & Booking' },
  { id: 'messages', path: '/dashboard/messages', label: 'Messages' },
  { id: 'settings', path: '/dashboard/settings', label: 'Settings' },
  { id: 'notifications', path: '/dashboard/notifications', label: 'Notifications' },
];

// Admin routes (accessed via /dashboard)
export const adminRoutes = [
  { id: 'admin-dashboard', path: '/dashboard/admin-dashboard', label: 'Admin Dashboard' },
  { id: 'model-performance', path: '/dashboard/model-performance', label: 'Model Performance' },
  { id: 'user-management', path: '/dashboard/user-management', label: 'User Management' },
  { id: 'startup-discovery', path: '/dashboard/startup-discovery', label: 'All Startups' },
  { id: 'admin-advisory-tracks', path: '/dashboard/admin-advisory-tracks', label: 'Advisory Tracks' },
  { id: 'customer-support', path: '/dashboard/customer-support', label: 'Customer Support' },
  { id: 'settings', path: '/dashboard/settings', label: 'Settings' },
];

export function getRoutesForRole(role: UserRole) {
  switch (role) {
    case 'founder':
      return founderRoutes;
    case 'investor':
      return investorRoutes;
    case 'admin':
      return adminRoutes;
    default:
      return founderRoutes;
  }
}

export function getDefaultRouteForRole(role: UserRole): string {
  switch (role) {
    case 'founder':
      return 'dashboard';
    case 'investor':
      return 'investor-dashboard';
    case 'admin':
      return 'admin-dashboard';
    default:
      return 'dashboard';
  }
}

export function hasAccessToRoute(userRole: UserRole, routeId: string): boolean {
  const routes = getRoutesForRole(userRole);
  return routes.some(route => route.id === routeId);
}