import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Lightbulb, TrendingUp, FileText, Users, Calendar, ArrowRight, Sparkles, Target, DollarSign } from 'lucide-react';
import { apiClient } from '../../services/api';

const COLORS = ['#76B947', '#9BCF6E', '#5A9435'];

interface DashboardData {
  role: string;
  name: string;
  stats: {
    total_ventures: number;
    pitch_sessions: number;
    active_mentor_connections: number;
    unread_messages: number;
  };
  recent_ventures: Array<{
    id: number;
    title: string;
    industry: string;
    stage: string;
    pitch_score: number;
    created_at: string;
  }>;
  recent_pitch_sessions: Array<{
    id: number;
    score: number;
    feedback: string;
    created_at: string;
  }>;
}

export function FounderSnapshotModule() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await apiClient.getDashboard('founder');
        setDashboard(data);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const quickActions = [
    { label: 'Capture New Idea', icon: Lightbulb, action: 'capture' },
    { label: 'Start Pitch Coach', icon: TrendingUp, action: 'pitch' },
    { label: 'Generate Financial Model', icon: FileText, action: 'financial' },
    { label: 'Connect with Mentor', icon: Users, action: 'mentor' },
  ];

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  if (!dashboard) {
    return <div className="text-center py-8 text-red-600">Failed to load dashboard</div>;
  }

  const stats = dashboard.stats;
  const userName = dashboard.name || 'Founder';

  // Build pitch performance chart data from recent sessions
  const pitchPerformanceData = dashboard.recent_pitch_sessions.slice(0, 4).map((session, i) => ({
    week: `Session ${i + 1}`,
    score: Math.min(100, Math.max(0, session.score)),
  }));

  // Build startup readiness data from recent ventures
  const startupReadinessData = dashboard.recent_ventures.map(v => ({
    name: v.title || `Venture ${v.id}`,
    readiness: Math.min(100, Math.max(0, v.pitch_score)),
  }));

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="glass-card rounded-2xl p-8 border border-black/5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              Welcome back, {userName}! 👋
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

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-black/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Total Ventures</CardTitle>
              <Lightbulb className="h-5 w-5 text-[#76B947]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{stats.total_ventures}</div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Active ventures
            </p>
            <Progress value={Math.min(100, stats.total_ventures * 10)} className="mt-3 h-2" />
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
            <div className="text-3xl mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{stats.pitch_sessions}</div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Completed sessions
            </p>
            <Progress value={Math.min(100, stats.pitch_sessions * 5)} className="mt-3 h-2" />
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
            <div className="text-3xl mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{stats.active_mentor_connections}</div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Active connections
            </p>
            <Progress value={Math.min(100, stats.active_mentor_connections * 20)} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Messages</CardTitle>
              <FileText className="h-5 w-5 text-[#76B947]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{stats.unread_messages}</div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Unread
            </p>
            <Progress value={Math.min(100, stats.unread_messages * 10)} className="mt-3 h-2" />
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
        {/* Pitch Performance Chart */}
        {pitchPerformanceData.length > 0 && (
          <Card className="glass-card border-black/5">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Pitch Performance Trend</CardTitle>
              <CardDescription style={{ fontFamily: 'var(--font-body)' }}>Your recent session scores</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={pitchPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="week" style={{ fontFamily: 'var(--font-body)', fontSize: '12px' }} />
                  <YAxis style={{ fontFamily: 'var(--font-body)', fontSize: '12px' }} />
                  <Tooltip contentStyle={{ fontFamily: 'var(--font-body)' }} />
                  <Line type="monotone" dataKey="score" stroke="#76B947" strokeWidth={3} dot={{ fill: '#76B947', r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Recent Ventures */}
        {dashboard.recent_ventures.length > 0 && (
          <Card className="glass-card border-black/5">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Recent Ventures</CardTitle>
              <CardDescription style={{ fontFamily: 'var(--font-body)' }}>Your active ideas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboard.recent_ventures.slice(0, 3).map(venture => (
                  <div key={venture.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#76B947]/5 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                        {venture.title}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">{venture.industry}</Badge>
                        <Badge variant="outline" className="text-xs">{venture.stage}</Badge>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-sm font-semibold text-[#76B947]">{venture.pitch_score}</p>
                      <p className="text-xs text-muted-foreground">Score</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Venture Pitch Readiness Chart */}
      {startupReadinessData.length > 0 && (
        <Card className="glass-card border-black/5">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Venture Pitch Readiness</CardTitle>
            <CardDescription style={{ fontFamily: 'var(--font-body)' }}>Current scores of your ventures</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={startupReadinessData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="name" style={{ fontFamily: 'var(--font-body)', fontSize: '12px' }} />
                <YAxis style={{ fontFamily: 'var(--font-body)', fontSize: '12px' }} />
                <Tooltip contentStyle={{ fontFamily: 'var(--font-body)' }} />
                <Bar dataKey="readiness" fill="#76B947" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Pitch Sessions Overview */}
      {dashboard.recent_pitch_sessions.length > 0 && (
        <Card className="glass-card border-black/5">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Recent Pitch Sessions</CardTitle>
            <CardDescription style={{ fontFamily: 'var(--font-body)' }}>Your completed pitch performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard.recent_pitch_sessions.slice(0, 5).map(session => (
                <div key={session.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#76B947]/5 transition-colors">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                      {new Date(session.created_at).toLocaleDateString()}
                    </p>
                    {session.feedback && (
                      <p className="text-sm text-black mt-1 line-clamp-1" style={{ fontFamily: 'var(--font-body)' }}>
                        {session.feedback}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-semibold text-[#76B947]">{session.score}</p>
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

