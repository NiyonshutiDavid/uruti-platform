import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './lib/theme-context';
import { AuthProvider, useAuth } from './lib/auth-context';
import { SupportProvider } from './lib/support-context';
import { AdvisoryProvider } from './lib/advisory-context';
import { CallProvider } from './lib/call-context';
import { DashboardLayout } from './components/layout/DashboardLayout';
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
import { ScrollToTop } from './components/ScrollToTop';
import apiClient from './lib/api-client';

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const upsertMetaByName = (name: string, content: string) => {
    let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('name', name);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  };

  const upsertMetaByProperty = (property: string, content: string) => {
    let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('property', property);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  };

  useEffect(() => {
    const path = location.pathname;
    const params = new URLSearchParams(location.search);

    const publicPages: Record<string, { title: string; description: string }> = {
      '/home': {
        title: 'Uruti | AI-Powered Startup & Investment Readiness Platform',
        description:
          'Uruti helps founders, investors, and mentors discover startups, measure readiness, and grow venture outcomes with AI-powered insights.',
      },
      '/about': {
        title: 'About Uruti | Startup Ecosystem Platform',
        description:
          'Learn about Uruti’s mission to empower entrepreneurship and investment readiness across Africa through data and AI.',
      },
      '/contact': {
        title: 'Contact Uruti | Get Support and Partnerships',
        description:
          'Contact Uruti for platform support, partnerships, mentorship programs, and startup ecosystem collaboration.',
      },
      '/how-it-works': {
        title: 'How Uruti Works | Founder and Investor Journey',
        description:
          'See how founders and investors use Uruti for startup discovery, readiness scoring, advisory guidance, and connections.',
      },
      '/help-center': {
        title: 'Help Center | Uruti Support',
        description: 'Get answers to common questions about Uruti accounts, features, discovery, scoring, and platform usage.',
      },
      '/privacy-policy': {
        title: 'Privacy Policy | Uruti',
        description: 'Review how Uruti collects, processes, and protects personal and platform data.',
      },
      '/terms-of-service': {
        title: 'Terms of Service | Uruti',
        description: 'Read the terms and conditions for using the Uruti platform and services.',
      },
      '/login': {
        title: 'Login | Uruti',
        description: 'Log in to Uruti to access your founder, investor, mentor, or admin workspace.',
      },
      '/signup': {
        title: 'Sign Up | Uruti',
        description: 'Create a Uruti account and join the startup and investor ecosystem.',
      },
      '/admin': {
        title: 'Admin Login | Uruti',
        description: 'Secure admin access to the Uruti platform dashboard and controls.',
      },
    };

    const dashboardModuleTitles: Record<string, string> = {
      dashboard: 'Founder Dashboard',
      startups: 'Startup Hub',
      'pitch-performance': 'Pitch Performance',
      'advisory-tracks': 'Advisory Tracks',
      'pitch-coach': 'Pitch Coach',
      'investor-dashboard': 'Investor Dashboard',
      'startup-discovery': 'Startup Discovery',
      'deal-flow': 'Deal Flow',
      'admin-dashboard': 'Admin Dashboard',
      'admin-advisory-tracks': 'Admin Advisory Tracks',
      'user-management': 'User Management',
      'ai-chat': 'AI Chat',
      connections: 'Build Connections',
      calendar: 'Calendar',
      notifications: 'Notifications',
      settings: 'Settings',
      messages: 'Messages',
      profile: 'Profile',
      availability: 'Availability',
      'customer-support': 'Customer Support',
    };

    let title = 'Uruti Platform';
    let description = 'Uruti platform for startup discovery, investment readiness, and mentorship.';

    if (path.startsWith('/dashboard')) {
      const module = path.replace('/dashboard/', '').split('/')[0] || 'dashboard';

      if (module === 'admin-dashboard') {
        const adminTab = params.get('tab');
        const adminTabTitles: Record<string, string> = {
          overview: 'Admin Dashboard Overview',
          users: 'Admin Dashboard Users',
          ventures: 'Admin Dashboard Ventures',
          'model-metrics': 'Admin Dashboard Model Metrics',
          support: 'Admin Dashboard Support',
        };
        title = `${adminTabTitles[adminTab || 'overview'] || 'Admin Dashboard'} | Uruti`;
      } else {
        title = `${dashboardModuleTitles[module] || 'Dashboard'} | Uruti`;
      }

      description = 'Manage your Uruti workspace, discover startups, track readiness scores, and collaborate effectively.';
    } else if (publicPages[path]) {
      title = publicPages[path].title;
      description = publicPages[path].description;
    }

    document.title = title;
    upsertMetaByName('description', description);
    upsertMetaByProperty('og:title', title);
    upsertMetaByProperty('og:description', description);
    upsertMetaByName('twitter:title', title);
    upsertMetaByName('twitter:description', description);
  }, [location.pathname, location.search]);

  const handlePublicNavigate = (page: string) => {
    if (page.startsWith('/')) {
      navigate(page);
      return;
    }

    const routeMap: Record<string, string> = {
      home: '/home',
      about: '/about',
      'how-it-works': '/how-it-works',
      contact: '/contact',
      login: '/login',
      signup: '/signup',
      admin: '/admin',
      'help-center': '/help-center',
      'privacy-policy': '/privacy-policy',
      'terms-of-service': '/terms-of-service',
    };

    const target = routeMap[page] || '/home';
    navigate(target);
  };

  const handleLoginSuccess = () => {
    navigate('/dashboard');
  };

  const handleSignupSuccess = () => {
    navigate('/dashboard');
  };

  const handleAdminLoginSuccess = () => {
    navigate('/dashboard/admin-dashboard');
  };

  // Handle pending profile update after signup
  useEffect(() => {
    const handlePendingProfileUpdate = async () => {
      if (isAuthenticated && user) {
        const pendingUpdate = localStorage.getItem('pendingProfileUpdate');
        if (pendingUpdate) {
          try {
            const profileData = JSON.parse(pendingUpdate);
            await apiClient.updateProfile(profileData);
            localStorage.removeItem('pendingProfileUpdate');
            console.log('Profile updated successfully');
          } catch (error) {
            console.error('Failed to update profile:', error);
            // Don't remove from storage if it fails, will try again next time
          }
        }
      }
    };

    handlePendingProfileUpdate();
  }, [isAuthenticated, user]);

  return (
    <ThemeProvider>
      <ScrollToTop />
      <Toaster
        position="top-right"
        closeButton
        richColors
        expand
        duration={3200}
        toastOptions={{
          style: {
            borderRadius: '14px',
            border: '1px solid rgba(118, 185, 71, 0.28)',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.18)',
          },
        }}
      />
      <Routes>
        {/* Landing pages */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<LandingHome onNavigate={handlePublicNavigate} />} />
        <Route path="/about" element={<LandingAbout onNavigate={handlePublicNavigate} />} />
        <Route path="/contact" element={<LandingContact onNavigate={handlePublicNavigate} />} />
        <Route path="/how-it-works" element={<LandingHowItWorks onNavigate={handlePublicNavigate} />} />
        <Route path="/help-center" element={<HelpCenter onNavigate={handlePublicNavigate} onBack={() => navigate('/contact')} />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy onBack={() => navigate('/home')} />} />
        <Route path="/terms-of-service" element={<TermsOfService onBack={() => navigate('/home')} />} />

        {/* Auth pages */}
        <Route path="/login" element={<LoginPage onNavigate={handlePublicNavigate} onLogin={handleLoginSuccess} />} />
        <Route path="/signup" element={<SignupPage onNavigate={handlePublicNavigate} onSignupComplete={handleSignupSuccess} />} />
        <Route path="/admin" element={<AdminLoginPage onLogin={handleAdminLoginSuccess} onNavigateHome={() => navigate('/home')} />} />

        {/* Protected dashboard routes */}
        <Route 
          path="/dashboard/*" 
          element={
            isAuthenticated ? (
              <DashboardLayout />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SupportProvider>
        <AdvisoryProvider>
          <CallProvider>
            <AppContent />
          </CallProvider>
        </AdvisoryProvider>
      </SupportProvider>
    </AuthProvider>
  );
}