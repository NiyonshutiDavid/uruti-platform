import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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