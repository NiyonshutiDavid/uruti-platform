import { Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth-context';
import { getDefaultRouteForRole } from './lib/router-config';
import { LandingHome } from './components/landing/LandingHome';
import { LandingAbout } from './components/landing/LandingAbout';
import { LandingContact } from './components/landing/LandingContact';
import { LandingHowItWorks } from './components/landing/LandingHowItWorks';
import { HelpCenter } from './components/landing/HelpCenter';
import { PrivacyPolicy } from './components/landing/PrivacyPolicy';
import { TermsOfService } from './components/landing/TermsOfService';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { AdminLoginPage } from './components/auth/AdminLoginPage';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Protected route wrapper
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Public page wrapper
export function PublicPage({ children, onNavigate }: { children: React.ReactNode; onNavigate: (page: string) => void }) {
  return <>{children}</>;
}

// Route definitions
export const routes = [
  {
    path: '/',
    element: <LandingHome onNavigate={(page) => {}} />,
  },
  {
    path: '/about',
    element: <LandingAbout onNavigate={(page) => {}} />,
  },
  {
    path: '/contact',
    element: <LandingContact onNavigate={(page) => {}} />,
  },
  {
    path: '/how-it-works',
    element: <LandingHowItWorks onNavigate={(page) => {}} />,
  },
  {
    path: '/help-center',
    element: <HelpCenter onNavigate={(page) => {}} onBack={() => {}} />,
  },
  {
    path: '/privacy-policy',
    element: <PrivacyPolicy onBack={() => {}} />,
  },
  {
    path: '/terms-of-service',
    element: <TermsOfService onBack={() => {}} />,
  },
  {
    path: '/login',
    element: <LoginPage onNavigate={(page) => {}} onLogin={() => {}} />,
  },
  {
    path: '/signup',
    element: <SignupPage onNavigate={(page) => {}} onSignupComplete={() => {}} />,
  },
  {
    path: '/admin',
    element: <AdminLoginPage onLogin={() => {}} onNavigateHome={() => {}} />,
  },
  {
    path: '/dashboard/*',
    element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
];
