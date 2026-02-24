import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Target, Users, Calendar, Filter, AlertCircle, CheckCircle, Eye, MessageCircle, Bookmark } from 'lucide-react';
import { useDashboard } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

const COLORS = ['#76B947', '#9BCF6E', '#5A9435'];

export function InvestorDashboardAPI() {
  const { user } = useAuth();
  const { dashboard, loading, error } = useDashboard('investor');
  const [portfolioTrend, setPortfolioTrend] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Generate portfolio growth trend
  useEffect(() => {
    if (dashboard?.recent_deals && dashboard.recent_deals.length > 0) {
      const trend = [
        { month: 'Month 1', value: 50000 },
        { month: 'Month 2', value: 75000 },
        { month: 'Month 3', value: 100000 },
        { month: 'Month 4', value: dashboard?.stats?.portfolio_value || 125000 },
      ];
      setPortfolioTrend(trend);
    }
  }, [dashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-[#76B947] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your investor dashboard...</p>
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="glass-card rounded-2xl p-8 border border-black/5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              Welcome back, {dashboard?.name || 'Investor'}! 👋
            </h1>
            <p className="text-lg text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Monitor your portfolio and discover new investment opportunities
            </p>
          </div>
          <div className="glass-button p-6 rounded-2xl">
            <TrendingUp className="h-12 w-12 text-[#76B947]" />
          </div>
        </div>
      </div>

      {/* Key Stats - Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-black/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Portfolio Value</CardTitle>
              <DollarSign className="h-5 w-5 text-[#76B947]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              {formatCurrency(dashboard?.stats?.portfolio_value || 0)}
            </div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Total invested
            </p>
            <Progress value={Math.min(100, (dashboard?.stats?.portfolio_value || 0) / 10000)} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Active Deals</CardTitle>
              <CheckCircle className="h-5 w-5 text-[#76B947]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              {dashboard?.stats?.active_deals || 0}
            </div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Current investments
            </p>
            <Progress value={Math.min(100, (dashboard?.stats?.active_deals || 0) * 20)} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Pipeline</CardTitle>
              <Target className="h-5 w-5 text-[#76B947]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              {dashboard?.stats?.deals_in_pipeline || 0}
            </div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Pending deals
            </p>
            <Progress value={Math.min(100, (dashboard?.stats?.deals_in_pipeline || 0) * 15)} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Opportunities</CardTitle>
              <Users className="h-5 w-5 text-[#76B947]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              {dashboard?.stats?.available_opportunities || 0}
            </div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Available startups
            </p>
            <Progress value={Math.min(100, (dashboard?.stats?.available_opportunities || 0) * 5)} className="mt-3 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass-card border-black/5">
        <CardHeader>
          <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Quick Actions</CardTitle>
          <CardDescription style={{ fontFamily: 'var(--font-body)' }}>Find and manage your next investment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="glass-button h-auto py-6 flex flex-col items-center justify-center space-y-2 hover:scale-105 transition-transform" variant="outline">
              <Target className="h-8 w-8 text-[#76B947]" />
              <span className="text-sm text-center" style={{ fontFamily: 'var(--font-heading)' }}>Find Startups</span>
            </Button>
            <Button className="glass-button h-auto py-6 flex flex-col items-center justify-center space-y-2 hover:scale-105 transition-transform" variant="outline">
              <MessageCircle className="h-8 w-8 text-[#76B947]" />
              <span className="text-sm text-center" style={{ fontFamily: 'var(--font-heading)' }}>Send Offer</span>
            </Button>
            <Button className="glass-button h-auto py-6 flex flex-col items-center justify-center space-y-2 hover:scale-105 transition-transform" variant="outline">
              <Bookmark className="h-8 w-8 text-[#76B947]" />
              <span className="text-sm text-center" style={{ fontFamily: 'var(--font-heading)' }}>View Bookmarks</span>
            </Button>
            <Button className="glass-button h-auto py-6 flex flex-col items-center justify-center space-y-2 hover:scale-105 transition-transform" variant="outline">
              <Eye className="h-8 w-8 text-[#76B947]" />
              <span className="text-sm text-center" style={{ fontFamily: 'var(--font-heading)' }}>Portfolio Overview</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Growth */}
        <Card className="glass-card border-black/5">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Portfolio Growth</CardTitle>
            <CardDescription style={{ fontFamily: 'var(--font-body)' }}>Your investment value over time</CardDescription>
          </CardHeader>
          <CardContent>
            {portfolioTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={portfolioTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="month" style={{ fontFamily: 'var(--font-body)', fontSize: '12px' }} />
                  <YAxis style={{ fontFamily: 'var(--font-body)', fontSize: '12px' }} />
                  <Tooltip contentStyle={{ fontFamily: 'var(--font-body)' }} formatter={(value) => formatCurrency(value as number)} />
                  <Line type="monotone" dataKey="value" stroke="#76B947" strokeWidth={3} dot={{ fill: '#76B947', r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p>No portfolio data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Portfolio Split */}
        <Card className="glass-card border-black/5">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Deal Status Distribution</CardTitle>
            <CardDescription style={{ fontFamily: 'var(--font-body)' }}>Current deal breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard?.portfolio_summary && Object.values(dashboard.portfolio_summary).some((v: any) => v > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Active', value: dashboard.portfolio_summary.active },
                      { name: 'Pending', value: dashboard.portfolio_summary.pending },
                      { name: 'Completed', value: dashboard.portfolio_summary.completed },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[0, 1, 2].map((index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: 'var(--font-body)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p>No deals yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Deals */}
      {dashboard?.recent_deals && dashboard.recent_deals.length > 0 && (
        <Card className="glass-card border-black/5">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Recent Deal Activity</CardTitle>
            <CardDescription style={{ fontFamily: 'var(--font-body)' }}>Your latest investments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-black/5">
                    <TableHead style={{ fontFamily: 'var(--font-body)' }}>Venture Name</TableHead>
                    <TableHead style={{ fontFamily: 'var(--font-body)' }}>Investment</TableHead>
                    <TableHead style={{ fontFamily: 'var(--font-body)' }}>Status</TableHead>
                    <TableHead style={{ fontFamily: 'var(--font-body)' }}>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.recent_deals.map((deal: any) => (
                    <TableRow key={deal.id} className="hover:bg-[#76B947]/5 border-black/5">
                      <TableCell className="font-medium">{deal.venture_name}</TableCell>
                      <TableCell>{deal.amount}</TableCell>
                      <TableCell>
                        <Badge variant={deal.status === 'active' ? 'default' : 'secondary'}>
                          {deal.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {deal.created_at ? new Date(deal.created_at).toLocaleDateString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
