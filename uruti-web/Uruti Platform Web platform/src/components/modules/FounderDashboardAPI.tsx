import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Lightbulb, TrendingUp, FileText, Users, Calendar, ArrowRight, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { useDashboard } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#76B947', '#9BCF6E', '#5A9435'];

export function FounderDashboardAPI() {
  const { user } = useAuth();
  const { dashboard, loading, error } = useDashboard('founder');
  const [pitchTrend, setPitchTrend] = useState<any[]>([]);

  // Generate pitch performance trend based on pitch sessions
  useEffect(() => {
    if (dashboard?.recent_pitch_sessions && dashboard.recent_pitch_sessions.length > 0) {
      const trend = dashboard.recent_pitch_sessions
        .slice()
        .reverse()
        .map((session: any, idx: number) => ({
          week: `Session ${idx + 1}`,
          score: session.score || 0,
        }));
      setPitchTrend(trend);
    }
  }, [dashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-[#76B947] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="space-y-6">
        <div className="glass-card rounded-2xl p-8 border border-red-500/20 bg-red-50 dark:bg-red-950/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <div>
              <h2 className="font-semibold text-red-900 dark:text-red-300">Error Loading Dashboard</h2>
              <p className="text-sm text-red-800 dark:text-red-400 mt-1">{error?.message || 'Failed to load dashboard data'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const quickActions = [
    { label: 'Capture New Idea', icon: Lightbulb, action: 'capture' },
    { label: 'Start Pitch Coach', icon: TrendingUp, action: 'pitch' },
    { label: 'Generate Financial Model', icon: FileText, action: 'financial' },
    { label: 'Connect with Mentor', icon: Users, action: 'mentor' },
  ];

  const readinessData = [
    { name: 'Investment Ready', value: dashboard?.metrics?.investment_ready || 0 },
    { name: 'In Development', value: dashboard?.metrics?.in_development || 0 },
    { name: 'Ideation', value: Math.max(0, (dashboard?.metrics?.total_ideas || 0) - (dashboard?.metrics?.investment_ready || 0) - (dashboard?.metrics?.in_development || 0)) },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="glass-card rounded-2xl p-8 border border-black/5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              Welcome back, {dashboard?.name || 'Founder'}! 👋
            </h1>
            <p className="text-lg text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Here's a snapshot of your startup readiness journey
            </p>
          </div>
          <div className="glass-button p-6 rounded-2xl">
            <Sparkles className="h-12 w-12 text-[#76B947]" />
          </div>
        </div>
      </div>

      {/* Key Stats - Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-black/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Total Startup Ideas</CardTitle>
              <Lightbulb className="h-5 w-5 text-[#76B947]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              {dashboard?.stats?.total_ventures || 0}
            </div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              {dashboard?.metrics?.total_ideas || 0} total ventures
            </p>
            <Progress value={Math.min(100, (dashboard?.stats?.total_ventures || 0) * 10)} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Pitch Sessions</CardTitle>
              <TrendingUp className="h-5 w-5 text-[#76B947]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              {dashboard?.stats?.pitch_sessions || 0}
            </div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Total pitch sessions
            </p>
            <Progress value={Math.min(100, (dashboard?.stats?.pitch_sessions || 0) * 5)} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Investment Ready</CardTitle>
              <FileText className="h-5 w-5 text-[#76B947]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              {dashboard?.metrics?.investment_ready || 0}
            </div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Ready for fundraising
            </p>
            <Progress value={dashboard?.metrics?.investment_ready ? 100 : 0} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Mentor Connections</CardTitle>
              <Users className="h-5 w-5 text-[#76B947]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              {dashboard?.metrics?.mentors_connected || 0}
            </div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Active mentor connections
            </p>
            <Progress value={Math.min(100, (dashboard?.metrics?.mentors_connected || 0) * 20)} className="mt-3 h-2" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  className="glass-button h-auto py-6 flex flex-col items-center justify-center space-y-2 hover:scale-105 transition-transform"
                  variant="outline"
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
        {/* Pitch Performance Trend */}
        <Card className="glass-card border-black/5">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Pitch Performance Trend</CardTitle>
            <CardDescription style={{ fontFamily: 'var(--font-body)' }}>Your recent pitch sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {pitchTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={pitchTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="week" style={{ fontFamily: 'var(--font-body)', fontSize: '12px' }} />
                  <YAxis style={{ fontFamily: 'var(--font-body)', fontSize: '12px' }} />
                  <Tooltip contentStyle={{ fontFamily: 'var(--font-body)' }} />
                  <Line type="monotone" dataKey="score" stroke="#76B947" strokeWidth={3} dot={{ fill: '#76B947', r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p>No pitch sessions yet. Start by capturing an idea!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Investment Readiness Distribution */}
        <Card className="glass-card border-black/5">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Startup Portfolio Status</CardTitle>
            <CardDescription style={{ fontFamily: 'var(--font-body)' }}>Current stage distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {readinessData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={readinessData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {readinessData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: 'var(--font-body)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p>No ventures yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Ventures */}
      {dashboard?.recent_ventures && dashboard.recent_ventures.length > 0 && (
        <Card className="glass-card border-black/5">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Recent Ventures</CardTitle>
            <CardDescription style={{ fontFamily: 'var(--font-body)' }}>Your active startup ideas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.recent_ventures.map((venture: any) => (
                <div key={venture.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-[#76B947]/5 transition-colors border border-black/5">
                  <div className="flex-1">
                    <h3 className="font-semibold text-black dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                      {venture.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">{venture.industry}</Badge>
                      <Badge variant="secondary" className="text-xs">{venture.stage}</Badge>
                      <span className="text-xs text-muted-foreground">Score: {venture.pitch_score}/100</span>
                    </div>
                  </div>
                  <Progress value={venture.pitch_score || 0} className="w-24 h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Pitch Sessions */}
      {dashboard?.recent_pitch_sessions && dashboard.recent_pitch_sessions.length > 0 && (
        <Card className="glass-card border-black/5">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Recent Pitch Sessions</CardTitle>
            <CardDescription style={{ fontFamily: 'var(--font-body)' }}>Your pitch coach sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.recent_pitch_sessions.map((session: any) => (
                <div key={session.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-[#76B947]/5 transition-colors border border-black/5">
                  <div className="flex-1">
                    <h3 className="font-semibold text-black dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                      {session.title}
                    </h3>
                    {session.feedback && (
                      <p className="text-sm text-muted-foreground mt-1">{session.feedback.substring(0, 100)}...</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#76B947]">{session.score}</div>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
