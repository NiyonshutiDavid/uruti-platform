import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../lib/auth-context';
import { getDefaultRouteForRole, hasAccessToRoute } from '../../lib/router-config';
import { Header } from '../Header';
import { Sidebar } from '../Sidebar';
import { FloatingCallWidget } from '../FloatingCallWidget';
import { OnboardingTour } from '../OnboardingTour';
import { FounderSnapshotModule } from '../modules/FounderSnapshotModule';
import { StartupHubModule } from '../modules/StartupHubModule';
import { StartupDiscoveryModule } from '../modules/StartupDiscoveryModule';
import { PitchPerformanceModule } from '../modules/PitchPerformanceModule';
import { AIChatModule } from '../modules/AIChatModule';
import { AdvisoryTracksModule } from '../modules/AdvisoryTracksModule';
import { BuildConnectionsModule } from '../modules/BuildConnectionsModule';
import { ReadinessCalendarModule } from '../modules/ReadinessCalendarModule';
import { PitchCoachModule } from '../modules/PitchCoachModule';
import { InvestorDashboardModule } from '../modules/InvestorDashboardModule';
import { NotificationsModule } from '../modules/NotificationsModule';
import { DealFlowModule } from '../modules/DealFlowModule';
import { SettingsModule } from '../modules/SettingsModule';
import { MessagesModule } from '../modules/MessagesModule';
import { ProfileModule } from '../modules/ProfileModule';
import { ProfileViewModule } from '../modules/ProfileViewModule';
import { AvailabilityModule } from '../modules/AvailabilityModule';
import { CustomerSupportModule } from '../modules/CustomerSupportModule';
import { AdminAdvisoryTracksModule } from '../modules/AdminAdvisoryTracksModule';
import { AdminDashboardModule } from '../modules/AdminDashboardModule';
import { AdminUserManagementModule } from '../modules/AdminUserManagementModule';
import { AdminCredentialsModule } from '../modules/AdminCredentialsModule';
import { useCall } from '../../lib/call-context';
import { Button } from '../ui/button';

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout: authLogout } = useAuth();
  const [activeModule, setActiveModule] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [aiChatContext, setAiChatContext] = useState<{ name: string; description: string } | undefined>();
  const [aiAnalysisContext, setAiAnalysisContext] = useState<any>(undefined);
  const { callState, endCall, acceptIncomingCall, declineIncomingCall } = useCall();

  // Keep module state synced with URL and enforce role-based access
  useEffect(() => {
    if (!user) return;

    const defaultRoute = getDefaultRouteForRole(user.role);
    const currentPath = location.pathname;
    const pathSegments = currentPath.replace('/dashboard/', '').split('/');
    const moduleFromPath = pathSegments[0];
    const hasSubroute = pathSegments.length > 1;

    // If viewing another user's profile, don't update activeModule to 'profile'
    if (moduleFromPath === 'profile' && hasSubroute) {
      // Keep the current activeModule - don't change sidebar highlight
      return;
    }

    if (!moduleFromPath || (moduleFromPath === 'dashboard' && user.role !== 'founder')) {
      setActiveModule(defaultRoute);
      navigate(`/dashboard/${defaultRoute}`, { replace: true });
      return;
    }

    if (hasAccessToRoute(user.role, moduleFromPath)) {
      setActiveModule(moduleFromPath);
      return;
    }

    setActiveModule(defaultRoute);
    navigate(`/dashboard/${defaultRoute}`, { replace: true });
  }, [user, location.pathname, navigate]);

  const handleModuleChange = useCallback((module: string) => {
    const routeBase = module.split('/')[0];
    const hasSubroute = module.includes('/');

    // Check if user has access to this route
    if (user && !hasAccessToRoute(user.role, routeBase)) {
      console.warn(`User with role ${user.role} does not have access to ${routeBase}`);
      return;
    }
    
    // When viewing other users' profiles, don't update activeModule to 'profile'
    // Keep the previous module selected in sidebar to avoid highlighting "My Profile"
    if (hasSubroute && routeBase === 'profile') {
      // Viewing someone else's profile - don't change sidebar selection
      setIsMobileSidebarOpen(false);
      navigate(`/dashboard/${module}`);
    } else {
      // Regular module navigation
      setActiveModule(routeBase);
      setIsMobileSidebarOpen(false);
      navigate(`/dashboard/${module}`);
    }
  }, [user, navigate]);

  const ProfileViewRoute = () => {
    const params = useParams();
    const parsedUserId = Number(params.userId);

    if (!params.userId || Number.isNaN(parsedUserId)) {
      return <Navigate to="/dashboard/connections" replace />;
    }

    return (
      <ProfileViewModule
        userId={parsedUserId}
        onBack={() => handleModuleChange('connections')}
        onModuleChange={handleModuleChange}
      />
    );
  };

  const handleLogout = () => {
    authLogout();
    navigate('/home');
  };

  const handleOpenAIChat = (context?: { name: string; description: string }) => {
    setAiChatContext(context);
    setActiveModule('ai-chat');
    navigate('/dashboard/ai-chat');
  };

  const handleNavigate = useCallback((module: string) => {
    handleModuleChange(module);
  }, [handleModuleChange]);

  // Listen for navigation events
  useEffect(() => {
    const handleNavigateToPitchCoach = () => {
      handleModuleChange('pitch-coach');
    };

    const handleNavigateToProfile = () => {
      handleModuleChange('profile');
    };

    const handleOpenAIAnalysis = (event: any) => {
      const venture = event.detail.venture;
      setAiAnalysisContext(venture);
      setAiChatContext(undefined);
      handleModuleChange('ai-chat');
    };

    const handleNavigateEvent = (event: any) => {
      const module = event.detail.module;
      handleNavigate(module);
    };

    window.addEventListener('navigate-to-pitch-coach', handleNavigateToPitchCoach);
    window.addEventListener('navigate-to-profile', handleNavigateToProfile);
    window.addEventListener('open-ai-analysis', handleOpenAIAnalysis);
    window.addEventListener('navigate', handleNavigateEvent);

    return () => {
      window.removeEventListener('navigate-to-pitch-coach', handleNavigateToPitchCoach);
      window.removeEventListener('navigate-to-profile', handleNavigateToProfile);
      window.removeEventListener('open-ai-analysis', handleOpenAIAnalysis);
      window.removeEventListener('navigate', handleNavigateEvent);
    };
  }, [handleModuleChange, handleNavigate]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Header 
        userType={user?.role || 'founder'} 
        onNavigate={handleModuleChange}
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onLogout={handleLogout}
      />
      <div className="flex">
        <Sidebar 
          activeModule={activeModule} 
          onModuleChange={handleModuleChange}
          userType={user?.role || 'founder'}
          isMobileSidebarOpen={isMobileSidebarOpen}
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        />
        <main className="flex-1 p-3 sm:p-4 md:p-6 ml-0 lg:ml-64 w-full lg:w-auto">
          <Routes>
            {/* Founder routes */}
            <Route path="dashboard" element={user.role === 'founder' ? <FounderSnapshotModule /> : <Navigate to="/dashboard" replace />} />
            <Route path="startups" element={user.role === 'founder' ? <StartupHubModule onOpenAIChat={handleOpenAIChat} /> : <Navigate to="/dashboard" replace />} />
            <Route path="pitch-performance" element={user.role === 'founder' ? <PitchPerformanceModule /> : <Navigate to="/dashboard" replace />} />
            <Route path="advisory-tracks" element={user.role === 'founder' ? <AdvisoryTracksModule /> : <Navigate to="/dashboard" replace />} />
            <Route path="pitch-coach" element={user.role === 'founder' ? <PitchCoachModule /> : <Navigate to="/dashboard" replace />} />

            {/* Investor routes */}
            <Route path="investor-dashboard" element={user.role === 'investor' ? <InvestorDashboardModule /> : <Navigate to="/dashboard" replace />} />

            <Route path="startup-discovery" element={(user.role === 'investor' || user.role === 'admin') ? <StartupDiscoveryModule /> : <Navigate to="/dashboard" replace />} />
            <Route path="deal-flow" element={user.role === 'investor' ? <DealFlowModule /> : <Navigate to="/dashboard" replace />} />

            {/* Admin routes */}
            <Route path="admin-dashboard" element={user.role === 'admin' ? <AdminDashboardModule /> : <Navigate to="/dashboard" replace />} />
            <Route path="admin-advisory-tracks" element={user.role === 'admin' ? <AdminAdvisoryTracksModule /> : <Navigate to="/dashboard" replace />} />
            <Route path="user-management" element={user.role === 'admin' ? <AdminUserManagementModule /> : <Navigate to="/dashboard" replace />} />

            {/* Shared routes */}
            <Route path="ai-chat" element={<AIChatModule userType={user.role as 'founder' | 'investor'} startupContext={aiChatContext} analysisContext={aiAnalysisContext} />} />
            <Route path="connections" element={user.role === 'admin' ? <Navigate to="/dashboard" replace /> : <BuildConnectionsModule onModuleChange={handleModuleChange} userType={user.role as 'founder' | 'investor'} />} />
            <Route path="calendar" element={<ReadinessCalendarModule />} />
            <Route path="notifications" element={<NotificationsModule />} />
            <Route path="settings" element={user.role === 'admin' ? <AdminCredentialsModule /> : <SettingsModule userType={user.role as 'founder' | 'investor'} />} />
            <Route path="messages" element={user.role === 'admin' ? <Navigate to="/dashboard" replace /> : <MessagesModule userType={user.role as 'founder' | 'investor'} />} />
            <Route path="profile" element={user.role === 'admin' ? <Navigate to="/dashboard" replace /> : <ProfileModule userType={user.role as 'founder' | 'investor'} />} />
            <Route path="profile/:userId" element={user.role === 'admin' ? <Navigate to="/dashboard" replace /> : <ProfileViewRoute />} />
            <Route path="availability" element={<AvailabilityModule />} />
            <Route path="customer-support" element={<CustomerSupportModule />} />

            {/* Default redirect */}
            <Route path="" element={<Navigate to={`/dashboard/${getDefaultRouteForRole(user.role)}`} replace />} />
            <Route path="*" element={<Navigate to={`/dashboard/${getDefaultRouteForRole(user.role)}`} replace />} />
          </Routes>
        </main>
      </div>
      {user.role !== 'admin' && <OnboardingTour />}

      {callState?.isOpen && callState.isRinging && callState.isIncoming && (
        <div className="fixed left-1/2 top-4 z-[220] w-[min(92vw,420px)] -translate-x-1/2 rounded-2xl border border-border/70 bg-card/95 p-4 text-foreground shadow-2xl backdrop-blur sm:top-6 md:top-20">
          <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
            Incoming {callState.type} call
          </p>
          <p className="mt-1 text-base font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
            {callState.contactName}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button
              onClick={() => void declineIncomingCall()}
              variant="destructive"
              className="flex-1"
            >
              Decline
            </Button>
            <Button
              onClick={() => void acceptIncomingCall()}
              className="flex-1 bg-[#76B947] text-white hover:bg-[#76B947]/90"
            >
              Accept
            </Button>
          </div>
        </div>
      )}

      {callState && (
        <FloatingCallWidget
          open={callState.isOpen && (!callState.isIncoming || !callState.isRinging)}
          onClose={endCall}
          type={callState.type}
          isRinging={callState.isRinging}
          isIncoming={callState.isIncoming}
          contactName={callState.contactName}
          contactAvatar={callState.contactAvatar}
          contactOnline={callState.contactOnline}
        />
      )}
    </>
  );
}
