import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Lightbulb, TrendingUp, FileText, Users, Calendar, ArrowRight, Sparkles, Target, DollarSign } from 'lucide-react';

const pitchPerformanceData = [
  { week: 'Week 1', score: 65 },
  { week: 'Week 2', score: 72 },
  { week: 'Week 3', score: 78 },
  { week: 'Week 4', score: 85 },
];

const startupReadinessData = [
  { name: 'AgriConnect', readiness: 85, sector: 'AgTech' },
  { name: 'EduLearn Rwanda', readiness: 72, sector: 'EdTech' },
  { name: 'HealthBridge', readiness: 68, sector: 'HealthTech' },
  { name: 'FinTrack', readiness: 90, sector: 'FinTech' },
];

const investmentReadiness = [
  { name: 'Investment Ready', value: 2 },
  { name: 'High Potential', value: 3 },
  { name: 'In Development', value: 3 },
];

const COLORS = ['#76B947', '#9BCF6E', '#5A9435'];

export function FounderSnapshotModule() {
  const [userName] = useState('Founder Kwizera');

  const quickActions = [
    { label: 'Capture New Idea', icon: Lightbulb, action: 'capture' },
    { label: 'Start Pitch Coach', icon: TrendingUp, action: 'pitch' },
    { label: 'Generate Financial Model', icon: FileText, action: 'financial' },
    { label: 'Connect with Mentor', icon: Users, action: 'mentor' },
  ];

  const notifications = [
    { id: 1, type: 'success', message: 'AgriConnect pitch score improved by 12 points!', time: '2 hours ago' },
    { id: 2, type: 'info', message: 'New mentor available: Jean-Paul Uwimana (VC Expert)', time: '5 hours ago' },
    { id: 3, type: 'warning', message: 'FinTrack financial model needs review', time: '1 day ago' },
  ];

  const upcomingMilestones = [
    { id: 1, event: 'Investor Pitch Day - AgriConnect', date: 'Feb 15, 2026', type: 'pitch' },
    { id: 2, event: 'Mentor Session with Marie Umutoni', date: 'Feb 8, 2026', type: 'mentor' },
    { id: 3, event: 'Financial Model Workshop', date: 'Feb 12, 2026', type: 'workshop' },
  ];

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
              <CardTitle className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Total Startup Ideas</CardTitle>
              <Lightbulb className="h-5 w-5 text-[#76B947]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-1" style={{ fontFamily: 'var(--font-heading)' }}>8</div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              <span className="text-[#76B947]">+2</span> this month
            </p>
            <Progress value={75} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Active Pitch Sessions</CardTitle>
              <TrendingUp className="h-5 w-5 text-[#76B947]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-1" style={{ fontFamily: 'var(--font-heading)' }}>24</div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              <span className="text-[#76B947]">+8</span> this week
            </p>
            <Progress value={60} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Generated Documents</CardTitle>
              <FileText className="h-5 w-5 text-[#76B947]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-1" style={{ fontFamily: 'var(--font-heading)' }}>42</div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              <span className="text-[#76B947]">+5</span> this week
            </p>
            <Progress value={85} className="mt-3 h-2" />
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
            <div className="text-3xl mb-1" style={{ fontFamily: 'var(--font-heading)' }}>12</div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              <span className="text-[#76B947]">3</span> active chats
            </p>
            <Progress value={50} className="mt-3 h-2" />
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
        <Card className="glass-card border-black/5">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Pitch Performance Trend</CardTitle>
            <CardDescription style={{ fontFamily: 'var(--font-body)' }}>Your improvement over the last month</CardDescription>
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

        {/* Investment Readiness */}
        <Card className="glass-card border-black/5">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Investment Readiness Distribution</CardTitle>
            <CardDescription style={{ fontFamily: 'var(--font-body)' }}>Current status of your startup portfolio</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>

      {/* Startup Readiness Scores */}
      <Card className="glass-card border-black/5">
        <CardHeader>
          <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Startup Readiness Scores</CardTitle>
          <CardDescription style={{ fontFamily: 'var(--font-body)' }}>Track the investment readiness of each venture</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <Card className="glass-card border-black/5">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Recent Notifications</CardTitle>
            <CardDescription style={{ fontFamily: 'var(--font-body)' }}>Stay updated on your progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-[#76B947]/5 transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    notification.type === 'success' ? 'bg-[#76B947]' : 
                    notification.type === 'warning' ? 'bg-yellow-500' : 
                    'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-black" style={{ fontFamily: 'var(--font-body)' }}>{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-body)' }}>{notification.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Milestones */}
        <Card className="glass-card border-black/5">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Upcoming Milestones</CardTitle>
            <CardDescription style={{ fontFamily: 'var(--font-body)' }}>Don't miss important events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingMilestones.map((milestone) => (
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
