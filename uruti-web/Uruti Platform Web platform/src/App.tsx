import { useState, useEffect } from 'react';
import { ThemeProvider } from './lib/theme-context';
import { CallProvider, useCall } from './lib/call-context';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { FloatingCallWidget } from './components/FloatingCallWidget';
import { FounderDashboardAPI } from './components/modules/FounderDashboardAPI';
import { InvestorDashboardAPI } from './components/modules/InvestorDashboardAPI';
import { StartupHubModule } from './components/modules/StartupHubModule';
import { StartupDiscoveryModule } from './components/modules/StartupDiscoveryModule';
import { PitchPerformanceModule } from './components/modules/PitchPerformanceModule';
import { AIChatModule } from './components/modules/AIChatModule';
import { AdvisoryTracksModule } from './components/modules/AdvisoryTracksModule';
import { MentorsModule } from './components/modules/MentorsModule';
import { ReadinessCalendarModule } from './components/modules/ReadinessCalendarModule';
import { PitchCoachModule } from './components/modules/PitchCoachModule';
import { NotificationsModule } from './components/modules/NotificationsModule';
import { DealFlowModule } from './components/modules/DealFlowModule';
import { SettingsModule } from './components/modules/SettingsModule';
import { MessagesModule } from './components/modules/MessagesModule';
import { ProfileModule } from './components/modules/ProfileModuleRefactored';
import { AvailabilityModule } from './components/modules/AvailabilityModule';
import { LandingHome } from './components/landing/LandingHome';
import { LandingAbout } from './components/landing/LandingAbout';
import { LandingContact } from './components/landing/LandingContact';
import { LandingHowItWorks } from './components/landing/LandingHowItWorks';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import ResetPasswordPage from './components/pages/ResetPasswordPage';

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [currentPage, setCurrentPage] = useState<'landing' | 'login' | 'signup' | 'reset-password' | 'dashboard'>('landing');
  const [landingPage, setLandingPage] = useState<'home' | 'about' | 'contact' | 'how-it-works'>('home');
  const [activeModule, setActiveModule] = useState(() => {
    // Set initial dashboard based on user role
    if (isAuthenticated && user?.role === 'investor') {
      return 'investor-dashboard';
    }
    return 'dashboard';
  });
  const [aiChatContext, setAiChatContext] = useState<{ name: string; description: string } | undefined>();
  const [aiAnalysisContext, setAiAnalysisContext] = useState<any>(undefined);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { callState, endCall } = useCall();

  // Auto-navigate to dashboard if user is authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setCurrentPage('dashboard');
      // Set correct dashboard module based on role
      if (user?.role === 'investor') {
        setActiveModule('investor-dashboard');
      } else {
        setActiveModule('dashboard');
      }
    }
  }, [isAuthenticated, isLoading, user]);

  // Check for reset-password route on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('token')) {
      setCurrentPage('reset-password');
    }
  }, []);

  const handleLandingNavigate = (page: string) => {
    if (page === 'login') {
      setCurrentPage('login');
    } else if (page === 'signup') {
      setCurrentPage('signup');
    } else if (page === 'home' || page === 'about' || page === 'contact' || page === 'how-it-works') {
      setLandingPage(page as 'home' | 'about' | 'contact' | 'how-it-works');
      setCurrentPage('landing');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogin = () => {
    setCurrentPage('dashboard');
  };

  const handleSignupComplete = () => {
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setCurrentPage('landing');
    setLandingPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleModuleChange = (module: string) => {
    setActiveModule(module);
    setIsMobileSidebarOpen(false); // Close mobile sidebar on navigation
  };

  // Listen for navigation events
  useEffect(() => {
    const handleNavigateToPitchCoach = () => {
      setActiveModule('pitch-coach');
    };

    const handleNavigateToProfile = () => {
      setActiveModule('profile');
    };

    const handleOpenAIAnalysis = (event: any) => {
      const venture = event.detail.venture;
      setAiAnalysisContext(venture);
      setAiChatContext(undefined); // Clear old context
      setActiveModule('ai-chat');
    };

    window.addEventListener('navigate-to-pitch-coach', handleNavigateToPitchCoach);
    window.addEventListener('navigate-to-profile', handleNavigateToProfile);
    window.addEventListener('open-ai-analysis', handleOpenAIAnalysis);

    return () => {
      window.removeEventListener('navigate-to-pitch-coach', handleNavigateToPitchCoach);
      window.removeEventListener('navigate-to-profile', handleNavigateToProfile);
      window.removeEventListener('open-ai-analysis', handleOpenAIAnalysis);
    };
  }, []);

  const renderActiveModule = () => {
    const userType = user?.role === 'investor' ? 'investor' : 'founder';
    
    switch (activeModule) {
      case 'dashboard':
        return userType === 'investor' ? <InvestorDashboardAPI /> : <FounderDashboardAPI />;
      case 'investor-dashboard':
        return <InvestorDashboardAPI />;
      case 'startups':
        return <StartupHubModule onOpenAIChat={(context) => {
          setAiChatContext(context);
          setActiveModule('ai-chat');
        }} />;
      case 'startup-discovery':
        return <StartupDiscoveryModule />;
      case 'pitch-performance':
        return <PitchPerformanceModule />;
      case 'ai-chat':
        return <AIChatModule userType={userType} startupContext={aiChatContext} analysisContext={aiAnalysisContext} />;
      case 'advisory-tracks':
        return <AdvisoryTracksModule />;
      case 'mentors':
        return <MentorsModule onModuleChange={handleModuleChange} />;
      case 'calendar':
        return <ReadinessCalendarModule />;
      case 'pitch-coach':
        return <PitchCoachModule />;
      case 'notifications':
        return <NotificationsModule />;
      case 'deal-flow':
        return <DealFlowModule />;
      case 'settings':
        return <SettingsModule userType={userType} />;
      case 'messages':
        return <MessagesModule userType={userType} />;
      case 'profile':
        return <ProfileModule userType={userType} />;
      case 'availability':
        return <AvailabilityModule />;
      default:
        return userType === 'investor' ? <InvestorDashboardAPI /> : <FounderDashboardAPI />;
    }
  };

  const renderLandingPage = () => {
    switch (landingPage) {
      case 'home':
        return <LandingHome onNavigate={handleLandingNavigate} />;
      case 'about':
        return <LandingAbout onNavigate={handleLandingNavigate} />;
      case 'contact':
        return <LandingContact onNavigate={handleLandingNavigate} />;
      case 'how-it-works':
        return <LandingHowItWorks onNavigate={handleLandingNavigate} />;
      default:
        return <LandingHome onNavigate={handleLandingNavigate} />;
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background dark:bg-gray-950">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 border-4 border-[#76B947] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        ) : currentPage === 'landing' ? (
          <div className="flex flex-col items-center justify-center h-full">
            {renderLandingPage()}
          </div>
        ) : currentPage === 'login' ? (
          <LoginPage onNavigate={handleLandingNavigate} onLogin={handleLogin} />
        ) : currentPage === 'signup' ? (
          <SignupPage onNavigate={handleLandingNavigate} onSignupComplete={handleSignupComplete} />
        ) : currentPage === 'reset-password' ? (
          <ResetPasswordPage />
        ) : (
          <>
            <Header 
              userType={user?.role === 'investor' ? 'investor' : 'founder'} 
              onNavigate={setActiveModule}
              onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              onLogout={handleLogout}
            />
            <div className="flex">
              <Sidebar 
                activeModule={activeModule} 
                onModuleChange={handleModuleChange}
                userType={user?.role === 'investor' ? 'investor' : 'founder'}
                isMobileSidebarOpen={isMobileSidebarOpen}
                setIsMobileSidebarOpen={setIsMobileSidebarOpen}
              />
              <main className="flex-1 p-3 sm:p-4 md:p-6 ml-0 lg:ml-64 w-full lg:w-auto">
                {renderActiveModule()}
              </main>
            </div>
            {callState && <FloatingCallWidget
              open={callState.isOpen}
              onClose={endCall}
              type={callState.type}
              contactName={callState.contactName}
              contactAvatar={callState.contactAvatar}
              contactOnline={callState.contactOnline}
            />}
          </>
        )}
      </div>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CallProvider>
        <AppContent />
      </CallProvider>
    </AuthProvider>
  );
}