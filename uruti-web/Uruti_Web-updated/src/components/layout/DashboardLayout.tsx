import { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../lib/auth-context';
import { getDefaultRouteForRole, hasAccessToRoute } from '../../lib/router-config';
import { Header } from '../Header';
import { Sidebar } from '../Sidebar';
import { FloatingCallWidget } from '../FloatingCallWidget.tsx';
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
import { AdminModelPerformanceModule } from '../modules/AdminModelPerformanceModule';
import { useCall } from '../../lib/call-context';
import { Button } from '../ui/button';
import { apiClient } from '../../lib/api-client';
import { toast } from 'sonner';

/* ── Draggable incoming-call banner ──────────────────────────────────────── */
function DraggableCallBanner({
  type,
  contactName,
  onDecline,
  onAccept,
}: {
  type: string;
  contactName: string;
  onDecline: () => void;
  onAccept: () => void;
}) {
  const bannerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Ignore if clicking a button
    if ((e.target as HTMLElement).closest('button')) return;
    dragging.current = true;
    const rect = bannerRef.current!.getBoundingClientRect();
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const el = bannerRef.current!;
    const maxX = window.innerWidth - el.offsetWidth;
    const maxY = window.innerHeight - el.offsetHeight;
    setPos({
      x: Math.max(0, Math.min(e.clientX - offset.current.x, maxX)),
      y: Math.max(0, Math.min(e.clientY - offset.current.y, maxY)),
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const style: React.CSSProperties = pos
    ? { left: pos.x, top: pos.y, transform: 'none' }
    : { left: '50%', top: 80, transform: 'translateX(-50%)' };

  return (
    <div
      ref={bannerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ ...style, touchAction: 'none' }}
      className="fixed z-[220] w-[min(92vw,420px)] cursor-grab rounded-2xl border border-border/70 bg-card/95 p-4 text-foreground shadow-2xl backdrop-blur active:cursor-grabbing"
    >
      <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
        Incoming {type} call
      </p>
      <p className="mt-1 text-base font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
        {contactName}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <Button onClick={onDecline} variant="destructive" className="flex-1">
          Decline
        </Button>
        <Button onClick={onAccept} className="flex-1 bg-[#76B947] text-white hover:bg-[#76B947]/90">
          Accept
        </Button>
      </div>
    </div>
  );
}

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, logout: authLogout } = useAuth();
  const [activeModule, setActiveModule] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [aiChatContext, setAiChatContext] = useState<{ name: string; description: string } | undefined>();
  const [aiAnalysisContext, setAiAnalysisContext] = useState<any>(undefined);
  const remindedMeetingKeys = useRef<Set<string>>(new Set());
  const notifWsRef = useRef<ReturnType<typeof apiClient.createNotificationsWebSocket> | null>(null);
  // Track current path via ref so WS message handlers always read the latest value
  const currentPathRef = useRef(location.pathname);
  useEffect(() => { currentPathRef.current = location.pathname; }, [location.pathname]);

  const {
    callState,
    localStream,
    remoteStream,
    remoteVideoEnabled,
    endCall,
    acceptIncomingCall,
    declineIncomingCall,
  } = useCall();

  const showBrowserReminder = useCallback(async (title: string, body: string) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch {
        return;
      }
    }

    if (Notification.permission !== 'granted') return;

    const browserNotification = new Notification(title, { body });
    browserNotification.onclick = () => {
      window.focus();
      navigate('/dashboard/calendar');
    };
  }, [navigate]);

  // Global notifications WebSocket – open for every dashboard page so that
  // new messages and other notifications surface as browser/OS alerts even
  // when the user is not on the Messages route.
  useEffect(() => {
    if (!user || !token) return;

    // Clean up any previous socket before opening a new one
    if (notifWsRef.current) {
      notifWsRef.current.close();
      notifWsRef.current = null;
    }

    const ws = apiClient.createNotificationsWebSocket(token);
    notifWsRef.current = ws;

    let pingInterval: ReturnType<typeof setInterval> | null = null;

    ws.onopen = () => {
      pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('ping');
        }
      }, 20000);
    };

    ws.onmessage = async (event: MessageEvent) => {
      let msg: { event?: string; data?: Record<string, unknown> };
      try {
        msg = JSON.parse(event.data as string);
      } catch {
        return;
      }

      const evtName = msg?.event;

      // message_created – skip if user is already viewing the Messages page
      if (evtName === 'message_created' && !currentPathRef.current.startsWith('/dashboard/messages')) {
        const data = msg.data ?? {};
        const senderId = data.sender_id as number | undefined;
        if (senderId && senderId !== user.id) {
          const senderName = (data.sender_full_name ?? data.sender_name ?? 'Someone') as string;
          const preview = (data.body as string | undefined)?.slice(0, 80) ?? 'New message';
          toast.info(`💬 ${senderName}: ${preview}`, {
            action: { label: 'Open', onClick: () => navigate('/dashboard/messages') },
          });
          await showBrowserNotification(`Message from ${senderName}`, preview, '/dashboard/messages');
        }
      }

      // notification_created – general platform notification
      if (evtName === 'notification_created') {
        const data = msg.data ?? {};
        const title = (data.title as string | undefined) ?? 'New notification';
        const body = (data.message as string | undefined) ?? '';
        toast.info(`🔔 ${title}${body ? `: ${body.slice(0, 80)}` : ''}`, {
          action: { label: 'View', onClick: () => navigate('/dashboard/notifications') },
        });
        await showBrowserNotification(title, body, '/dashboard/notifications');
      }
    };

    ws.onerror = () => { /* silent – reconnect handled by close handler */ };

    ws.onclose = () => {
      if (pingInterval) clearInterval(pingInterval);
      // Schedule reconnect after 5 s unless the component has unmounted
      const timer = setTimeout(() => {
        // Re-run the effect by closing the stale ref so the cleanup runs on next render
        notifWsRef.current = null;
      }, 5000);
      return () => clearTimeout(timer);
    };

    return () => {
      if (pingInterval) clearInterval(pingInterval);
      ws.close();
      notifWsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  const showBrowserNotification = useCallback(async (title: string, body: string, targetPath: string) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'default') {
      try { await Notification.requestPermission(); } catch { return; }
    }

    if (Notification.permission !== 'granted') return;

    const n = new Notification(title, { body });
    n.onclick = () => { window.focus(); navigate(targetPath); };
  }, [navigate]);

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

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const checkMeetingReminders = async () => {
      try {
        const meetings = await apiClient.getUpcomingMeetings(1);
        if (cancelled || !Array.isArray(meetings)) return;

        const nowMs = Date.now();

        for (const meeting of meetings) {
          const startTimeValue = meeting?.start_time;
          const meetingId = meeting?.id;
          if (!startTimeValue || !meetingId) continue;

          const startMs = new Date(startTimeValue).getTime();
          const minutesUntil = Math.round((startMs - nowMs) / 60000);
          if (minutesUntil < 0 || minutesUntil > 30) continue;

          const key = `${meetingId}:${startTimeValue}`;
          if (remindedMeetingKeys.current.has(key)) continue;
          remindedMeetingKeys.current.add(key);

          const title = (meeting?.title || 'Upcoming meeting').toString();
          const body = `Starts in ${minutesUntil} minute${minutesUntil === 1 ? '' : 's'}.`;

          toast.info(`${title} · ${body}`);
          await showBrowserReminder(title, body);
        }
      } catch {
        // Silent fail to avoid noisy reminder loop errors
      }
    };

    void checkMeetingReminders();
    const interval = setInterval(() => {
      void checkMeetingReminders();
    }, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user, showBrowserReminder]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAiChatRoute = location.pathname.startsWith('/dashboard/ai-chat');
  const isMessagesRoute = location.pathname.startsWith('/dashboard/messages');

  return (
    <>
      <Header 
        userType={user?.role || 'founder'} 
        onNavigate={handleModuleChange}
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onLogout={handleLogout}
      />
      <div className="flex h-[calc(100dvh-4rem)] overflow-hidden">
        <Sidebar 
          activeModule={activeModule} 
          onModuleChange={handleModuleChange}
          userType={user?.role || 'founder'}
          isMobileSidebarOpen={isMobileSidebarOpen}
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        />
        <main className={`flex-1 min-h-0 ml-0 lg:ml-64 w-full lg:w-auto overflow-hidden ${
          isAiChatRoute ? '' : 'p-3 sm:p-4 md:p-6'
        } ${
          isAiChatRoute || isMessagesRoute ? '' : 'overflow-y-auto'
        }`}>
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
            <Route path="model-performance" element={user.role === 'admin' ? <AdminModelPerformanceModule /> : <Navigate to="/dashboard" replace />} />
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
        <DraggableCallBanner
          type={callState.type}
          contactName={callState.contactName}
          onDecline={() => void declineIncomingCall()}
          onAccept={() => void acceptIncomingCall()}
        />
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
          localStream={localStream}
          remoteStream={remoteStream}
          remoteVideoEnabled={remoteVideoEnabled}
        />
      )}
    </>
  );
}
