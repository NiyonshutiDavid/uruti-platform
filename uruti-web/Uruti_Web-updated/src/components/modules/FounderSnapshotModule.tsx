import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Lightbulb, TrendingUp, FileText, Users, Calendar, ArrowRight, Sparkles, Target, DollarSign } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { EnhancedCaptureIdeaDialog } from '../EnhancedCaptureIdeaDialog';
import { apiClient } from '../../lib/api-client';
import { formatLocalDate, formatRelativeTime, parseServerDate, toEpochMs } from '../../lib/datetime';
import { toast } from 'sonner';

const COLORS = ['#76B947', '#9BCF6E', '#5A9435'];

export function FounderSnapshotModule() {
  const { user } = useAuth();
  const displayName = user?.full_name || 'Founder';
  const [captureDialogOpen, setCaptureDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // State for real backend data
  const [venturesCount, setVenturesCount] = useState(0);
  const [pitchSessionsCount, setPitchSessionsCount] = useState(0);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [upcomingMilestones, setUpcomingMilestones] = useState<any[]>([]);
  const [pitchPerformanceData, setPitchPerformanceData] = useState<any[]>([]);
  const [startupReadinessData, setStartupReadinessData] = useState<any[]>([]);
  const [investmentReadiness, setInvestmentReadiness] = useState<any[]>([]);

  // Load all dashboard data from backend
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch ventures
      const ventures = await apiClient.getMyVentures();
      setVenturesCount(ventures.length);

      // Calculate startup readiness data from ventures
      const readinessData = ventures.slice(0, 5).map((venture: any) => ({
        name: venture.startup_name || venture.name || 'Unnamed',
        readiness: venture.investment_readiness_score || 0
      }));
      setStartupReadinessData(readinessData);

      // Calculate investment readiness distribution
      const readyCount = ventures.filter((v: any) => (v.investment_readiness_score || 0) >= 70).length;
      const developingCount = ventures.filter((v: any) => {
        const score = v.investment_readiness_score || 0;
        return score >= 40 && score < 70;
      }).length;
      const earlyCount = ventures.length - readyCount - developingCount;

      setInvestmentReadiness([
        { name: 'Investment Ready', value: readyCount },
        { name: 'Developing', value: developingCount },
        { name: 'Early Stage', value: earlyCount }
      ].filter(item => item.value > 0));

      // Fetch connections
      const connections = await apiClient.getConnections();
      setConnectionsCount(connections.length);

      // Fetch notifications (limited to recent 5)
      const allNotifications = await apiClient.getNotifications();
      const recentNotifications = allNotifications.slice(0, 5).map((notif: any) => ({
        id: notif.id,
        message: notif.message,
        time: formatRelativeTime(notif.created_at),
        type: notif.type || 'info'
      }));
      setNotifications(recentNotifications);

      // Fetch calendar events for upcoming milestones
      const events = await apiClient.getMeetings();
      const upcomingEvents = events
        .filter((event: any) => parseServerDate(event.date).getTime() > Date.now())
        .sort((a: any, b: any) => toEpochMs(a.date) - toEpochMs(b.date))
        .slice(0, 5)
        .map((event: any) => ({
          id: event.id,
          event: event.title,
          date: formatDate(event.date)
        }));
      setUpcomingMilestones(upcomingEvents);

      // Fetch pitch sessions from backend analyses endpoint
      const pitchSessions = await apiClient.getPitchAnalyses().catch(() => []);
      setPitchSessionsCount((pitchSessions || []).length);
      setPitchPerformanceData(
        (pitchSessions || [])
          .slice()
          .reverse()
          .map((s: any, idx: number) => ({ week: `S${idx + 1}`, score: Number(s.overallScore || 0) })),
      );

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Keep default empty values on error
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string): string => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return formatLocalDate(date, options, '');
  };

  const quickActions = [
    { label: 'Capture New Idea', icon: Lightbulb, action: 'capture' },
    { label: 'Start Pitch Coach', icon: TrendingUp, action: 'pitch' },
    { label: 'Build a New Connection', icon: Users, action: 'connections' },
  ];

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'capture':
        setCaptureDialogOpen(true);
        break;
      case 'pitch':
        // Navigate to Pitch Coach
        window.dispatchEvent(new CustomEvent('navigate', { detail: { module: 'pitch-coach' } }));
        break;
      case 'connections':
        // Navigate to Build Connections
        window.dispatchEvent(new CustomEvent('navigate', { detail: { module: 'connections' } }));
        break;
    }
  };

  // Remove the old dummy data declarations (they're now in state and loaded from backend)

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="glass-card rounded-2xl p-8 border border-black/5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              Welcome, {displayName}! 👋
            </h1>
            <p className="text-lg text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Ready to start your entrepreneurial journey?
            </p>
          </div>
          <div className="glass-button p-6 rounded-2xl">
            <Sparkles className="h-12 w-12 text-[#76B947]" />
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-black/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Total Startup Ideas</CardTitle>
              <Lightbulb className="h-5 w-5 text-[#76B947]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{loading ? '...' : venturesCount}</div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              {venturesCount === 0 ? 'Start capturing your ideas' : `${venturesCount} idea${venturesCount > 1 ? 's' : ''} captured`}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Recorded Pitch Sessions</CardTitle>
              <TrendingUp className="h-5 w-5 text-[#76B947]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{loading ? '...' : pitchSessionsCount}</div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              {pitchSessionsCount === 0 ? 'No sessions recorded yet' : `${pitchSessionsCount} session${pitchSessionsCount > 1 ? 's' : ''} recorded`}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Connections Built</CardTitle>
              <Users className="h-5 w-5 text-[#76B947]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{loading ? '...' : connectionsCount}</div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              {connectionsCount === 0 ? 'No connections yet' : `${connectionsCount} connection${connectionsCount > 1 ? 's' : ''} built`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass-card border-black/5">
        <CardHeader>
          <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Quick Actions</CardTitle>
          <CardDescription style={{ fontFamily: 'var(--font-body)' }}>Fast track your startup development</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  className="glass-button h-auto py-6 flex flex-col items-center justify-center space-y-2 hover:scale-105 transition-transform"
                  variant="outline"
                  onClick={() => handleQuickAction(action.action)}
                >
                  <Icon className="h-8 w-8 text-[#76B947]" />
                  <span className="text-sm text-center" style={{ fontFamily: 'var(--font-heading)' }}>{action.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pitch Performance Chart */}
        <Card className="glass-card border-black/5">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Pitch Performance Trend</CardTitle>
            <CardDescription style={{ fontFamily: 'var(--font-body)' }}>Your improvement over the last month</CardDescription>
          </CardHeader>
          <CardContent>
            {pitchPerformanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={pitchPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="week" style={{ fontFamily: 'var(--font-body)', fontSize: '12px' }} />
                  <YAxis style={{ fontFamily: 'var(--font-body)', fontSize: '12px' }} />
                  <Tooltip contentStyle={{ fontFamily: 'var(--font-body)' }} />
                  <Line type="monotone" dataKey="score" stroke="#76B947" strokeWidth={3} dot={{ fill: '#76B947', r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[250px] text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  No pitch performance data yet. Start your first pitch session!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Investment Readiness */}
        <Card className="glass-card border-black/5">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Investment Readiness Distribution</CardTitle>
            <CardDescription style={{ fontFamily: 'var(--font-body)' }}>Current status of your startup portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            {investmentReadiness.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={investmentReadiness}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {investmentReadiness.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: 'var(--font-body)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[250px] text-center">
                <Target className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  No startup data yet. Capture your first idea to get started!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Startup Readiness Bar Chart */}
        <Card className="glass-card border-black/5">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Startup Readiness Score</CardTitle>
            <CardDescription style={{ fontFamily: 'var(--font-body)' }}>Readiness scores for your top startups</CardDescription>
          </CardHeader>
          <CardContent>
            {startupReadinessData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={startupReadinessData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="name" style={{ fontFamily: 'var(--font-body)', fontSize: '12px' }} />
                  <YAxis style={{ fontFamily: 'var(--font-body)', fontSize: '12px' }} />
                  <Tooltip contentStyle={{ fontFamily: 'var(--font-body)' }} />
                  <Legend wrapperStyle={{ fontFamily: 'var(--font-body)' }} />
                  <Bar dataKey="readiness" fill="#76B947" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-center">
                <Lightbulb className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  No startup readiness scores yet. Start by capturing your ideas!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notifications and Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Notifications */}
        <Card className="glass-card border-black/5">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Recent Notifications</CardTitle>
            <CardDescription style={{ fontFamily: 'var(--font-body)' }}>Stay updated with your latest activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div key={notification.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-[#76B947]/5 dark:hover:bg-gray-800 transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      notification.type === 'success' ? 'bg-[#76B947]' : 
                      notification.type === 'warning' ? 'bg-yellow-500' : 
                      'bg-blue-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground" style={{ fontFamily: 'var(--font-body)' }}>{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-body)' }}>{notification.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    No recent notifications. Start using the platform to see updates here!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Milestones */}
        <Card className="glass-card border-black/5">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Upcoming Milestones</CardTitle>
            <CardDescription style={{ fontFamily: 'var(--font-body)' }}>Track your important dates and deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingMilestones.length > 0 ? (
                upcomingMilestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#76B947]/5 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="glass-button p-2 rounded-lg">
                        <Calendar className="h-5 w-5 text-[#76B947]" />
                      </div>
                      <div>
                        <p className="text-sm text-black" style={{ fontFamily: 'var(--font-heading)' }}>{milestone.event}</p>
                        <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>{milestone.date}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    No upcoming milestones yet. Check your calendar to schedule events!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Capture Idea Dialog */}
      <EnhancedCaptureIdeaDialog open={captureDialogOpen} onOpenChange={setCaptureDialogOpen} />
    </div>
  );
}