import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Users, Building2, TrendingUp, MessageSquare, Settings, 
  UserPlus, Search, BarChart3, DollarSign, Sparkles, Upload,
  MessageCircle, CheckCircle, Clock, X, BrainCircuit, Gauge, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../lib/auth-context';
import { useLocation, useNavigate } from 'react-router-dom';

export function AdminDashboardModule() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const initialParams = new URLSearchParams(location.search);
  const initialTabParam = initialParams.get('tab');
  const initialTab =
    initialTabParam === 'overview' ||
    initialTabParam === 'users' ||
    initialTabParam === 'ventures' ||
    initialTabParam === 'model-metrics' ||
    initialTabParam === 'support'
      ? initialTabParam
      : 'overview';
  const initialSearch = initialParams.get('search') ?? '';
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFounders: 0,
    totalInvestors: 0,
    totalVentures: 0,
    totalMessages: 0,
    totalAIPrompts: 0,
    totalUploads: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [ventures, setVentures] = useState<any[]>([]);
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [modelPerformance, setModelPerformance] = useState<any | null>(null);
  const [aiModels, setAiModels] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    params.set('tab', activeTab);
    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim());
    } else {
      params.delete('search');
    }

    const nextSearch = params.toString();
    const currentSearch = location.search.startsWith('?') ? location.search.slice(1) : location.search;
    if (nextSearch !== currentSearch) {
      navigate(
        {
          pathname: location.pathname,
          search: nextSearch ? `?${nextSearch}` : '',
        },
        { replace: true }
      );
    }
  }, [activeTab, searchTerm, location.pathname, location.search, navigate]);

  const buildUserManagementPath = (extra?: Record<string, string>) => {
    const params = new URLSearchParams();
    params.set('from', 'admin-dashboard');
    params.set('tab', activeTab);
    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim());
    }
    if (extra) {
      Object.entries(extra).forEach(([key, value]) => {
        params.set(key, value);
      });
    }
    return `/dashboard/user-management?${params.toString()}`;
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [usersResult, venturesResult, supportResult] = await Promise.allSettled([
        apiClient.getUsers(0, 1000),
        apiClient.getVentures(0, 1000),
        apiClient.getSupportMessages(0, 100),
      ]);

      const usersData = usersResult.status === 'fulfilled' ? usersResult.value : [];
      const venturesData = venturesResult.status === 'fulfilled' ? venturesResult.value : [];

      if (usersResult.status === 'rejected') {
        console.error('Failed to load users:', usersResult.reason);
      }
      if (venturesResult.status === 'rejected') {
        console.error('Failed to load ventures:', venturesResult.reason);
      }

      setUsers(usersData);
      setVentures(venturesData);

      if (supportResult.status === 'fulfilled') {
        setSupportMessages(supportResult.value);
      } else {
        console.log('Support messages not yet available');
        setSupportMessages([]);
      }

      const founders = usersData.filter((u: any) => u.role === 'founder').length;
      const investors = usersData.filter((u: any) => u.role === 'investor').length;

      setStats({
        totalUsers: usersData.length,
        totalFounders: founders,
        totalInvestors: investors,
        totalVentures: venturesData.length,
        totalMessages: 0,
        totalAIPrompts: 0,
        totalUploads: 0,
      });

      if (usersResult.status === 'rejected' && venturesResult.status === 'rejected') {
        toast.error('Failed to load dashboard core data');
      }

      // Load model-specific data in the background so dashboard core data never blocks on AI services.
      void (async () => {
        const [modelPerfResult, modelsResult] = await Promise.allSettled([
          apiClient.getAdminModelPerformance(),
          apiClient.getAiModels(),
        ]);

        if (modelPerfResult.status === 'fulfilled') {
          setModelPerformance(modelPerfResult.value);
        } else {
          console.log('Model performance metrics not available');
          setModelPerformance(null);
        }

        if (modelsResult.status === 'fulfilled') {
          setAiModels(Array.isArray(modelsResult.value) ? modelsResult.value : []);
        } else {
          console.log('AI model list not available');
          setAiModels([]);
        }
      })();
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToSupport = async (messageId: number, response: string) => {
    try {
      await apiClient.respondToSupportMessage(messageId, response);
      toast.success('Response sent successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to send response');
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVentures = ventures.filter(v =>
    v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#76B947] mx-auto mb-4"></div>
          <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
          Manage users, ventures, and platform operations
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="backdrop-blur-sm bg-[#76B947]/5 dark:bg-black/20 border-[#76B947]/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  {stats.totalUsers}
                </div>
                <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-body)' }}>
                  {stats.totalFounders} founders, {stats.totalInvestors} investors
                </p>
              </div>
              <Users className="h-8 w-8 text-[#76B947]" />
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-[#76B947]/5 dark:bg-black/20 border-[#76B947]/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              Total Ventures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  {stats.totalVentures}
                </div>
                <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-body)' }}>
                  Registered startups
                </p>
              </div>
              <Building2 className="h-8 w-8 text-[#76B947]" />
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-[#76B947]/5 dark:bg-black/20 border-[#76B947]/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              AI Interactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  {stats.totalAIPrompts}
                </div>
                <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-body)' }}>
                  Total prompts
                </p>
              </div>
              <Sparkles className="h-8 w-8 text-[#76B947]" />
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-[#76B947]/5 dark:bg-black/20 border-[#76B947]/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              Support Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  {supportMessages.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-body)' }}>
                  {supportMessages.filter((m: any) => m.status === 'open').length} open
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-[#76B947]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-[#76B947]/10 backdrop-blur-sm">
          <TabsTrigger value="overview" style={{ fontFamily: 'var(--font-heading)' }}>
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" style={{ fontFamily: 'var(--font-heading)' }}>
            Users
          </TabsTrigger>
          <TabsTrigger value="ventures" style={{ fontFamily: 'var(--font-heading)' }}>
            Ventures
          </TabsTrigger>
          <TabsTrigger value="model-metrics" style={{ fontFamily: 'var(--font-heading)' }}>
            Model Metrics
          </TabsTrigger>
          <TabsTrigger value="support" style={{ fontFamily: 'var(--font-heading)' }}>
            Support ({supportMessages.filter((m: any) => m.status === 'open').length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4 bg-gray-50 dark:bg-transparent p-4 rounded-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Users */}
            <Card className="backdrop-blur-sm bg-[#76B947]/5 dark:bg-black/20 border-[#76B947]/30">
              <CardHeader>
                <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Recent Users</CardTitle>
                <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                  Latest registrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {users.slice(0, 10).map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-[#76B947]/10 backdrop-blur-sm">
                        <div>
                          <p className="font-medium dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                            {user.full_name}
                          </p>
                          <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            {user.email}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-[#76B947]/20 text-[#76B947]">
                          {user.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Top Ventures by Uruti Score */}
            <Card className="backdrop-blur-sm bg-[#76B947]/5 dark:bg-black/20 border-[#76B947]/30">
              <CardHeader>
                <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Top Ventures</CardTitle>
                <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                  Highest Uruti Scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {ventures
                      .sort((a, b) => (b.uruti_score || 0) - (a.uruti_score || 0))
                      .slice(0, 10)
                      .map((venture) => (
                        <div key={venture.id} className="flex items-center justify-between p-3 rounded-lg bg-[#76B947]/10 backdrop-blur-sm">
                          <div className="flex-1">
                            <p className="font-medium dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                              {venture.name}
                            </p>
                            <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                              {venture.industry}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                              {venture.uruti_score || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">Score</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4 mt-4">
          <Card className="backdrop-blur-sm bg-[#76B947]/5 dark:bg-black/20 border-[#76B947]/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>User Management</CardTitle>
                  <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                    Manage all platform users
                  </CardDescription>
                </div>
                <Button onClick={() => navigate(`${buildUserManagementPath()}#add-user`)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Users Table */}
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-[#76B947]/10 backdrop-blur-sm hover:bg-[#76B947]/20 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-[#76B947]/20 flex items-center justify-center">
                              <span className="text-[#76B947] font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                                {user.full_name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                                {user.full_name}
                              </p>
                              <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="bg-[#76B947]/20 text-[#76B947]">
                            {user.role}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(buildUserManagementPath({ editUserId: String(user.id) }))}
                          >
                            Manage
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ventures Tab */}
        <TabsContent value="ventures" className="space-y-4 mt-4">
          <Card className="backdrop-blur-sm bg-[#76B947]/5 dark:bg-black/20 border-[#76B947]/30">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Venture Management</CardTitle>
              <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                Monitor and manage all startups on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search ventures by name or industry..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Ventures List */}
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {filteredVentures.map((venture) => (
                      <div key={venture.id} className="p-4 rounded-lg bg-[#76B947]/10 backdrop-blur-sm hover:bg-[#76B947]/20 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg dark:text-white mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                              {venture.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2" style={{ fontFamily: 'var(--font-body)' }}>
                              {venture.tagline}
                            </p>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs">
                                {venture.industry}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {venture.stage}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                              {venture.uruti_score || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">Uruti Score</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{venture.team_size} team members</span>
                          {venture.funding_goal && (
                            <>
                              <span className="mx-2">•</span>
                              <DollarSign className="h-4 w-4" />
                              <span>${(venture.funding_goal / 1000).toFixed(0)}K goal</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-4 mt-4">
          <Card className="backdrop-blur-sm bg-[#76B947]/5 dark:bg-black/20 border-[#76B947]/30">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Support Messages</CardTitle>
              <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                Respond to user support requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {supportMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-semibold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                      No support messages
                    </p>
                    <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                      Support tickets will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {supportMessages.map((message: any) => (
                      <div key={message.id} className="p-4 rounded-lg bg-[#76B947]/10 backdrop-blur-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                              {message.visitor_name}
                            </p>
                            <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                              {message.visitor_email}
                            </p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={message.status === 'open' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'}
                          >
                            {message.status === 'open' ? (
                              <><Clock className="h-3 w-3 mr-1" /> Open</>
                            ) : (
                              <><CheckCircle className="h-3 w-3 mr-1" /> Resolved</>
                            )}
                          </Badge>
                        </div>
                        <p className="text-sm dark:text-white mb-3" style={{ fontFamily: 'var(--font-body)' }}>
                          {message.message}
                        </p>
                        {message.status === 'open' && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => {
                              const response = prompt('Enter your response:');
                              if (response) {
                                handleRespondToSupport(message.id, response);
                              }
                            }}>
                              Respond
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              apiClient.closeSupportMessage(message.id);
                              toast.success('Ticket closed');
                              fetchDashboardData();
                            }}>
                              Close
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Model Metrics Tab */}
        <TabsContent value="model-metrics" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="backdrop-blur-sm bg-[#76B947]/5 dark:bg-black/20 border-[#76B947]/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  Model Registry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                      {aiModels.length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-body)' }}>
                      Registered backend models
                    </p>
                  </div>
                  <BrainCircuit className="h-8 w-8 text-[#76B947]" />
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-[#76B947]/5 dark:bg-black/20 border-[#76B947]/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  Average Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                      {modelPerformance?.performance?.average_score ?? 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-body)' }}>
                      Across scored ventures
                    </p>
                  </div>
                  <Gauge className="h-8 w-8 text-[#76B947]" />
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-[#76B947]/5 dark:bg-black/20 border-[#76B947]/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  Scored Ventures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                      {modelPerformance?.performance?.scored_ventures ?? 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-body)' }}>
                      Total: {modelPerformance?.performance?.total_ventures ?? 0}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-[#76B947]" />
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-[#76B947]/5 dark:bg-black/20 border-[#76B947]/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  Feature Count
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                      {modelPerformance?.model_info?.expected_feature_count ?? 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-body)' }}>
                      Input features
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-[#76B947]" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="backdrop-blur-sm bg-[#76B947]/5 dark:bg-black/20 border-[#76B947]/30">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Model Details</CardTitle>
              <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                Runtime metadata, available models, and score class distribution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-[#76B947]/10 backdrop-blur-sm">
                  <p className="text-xs text-muted-foreground mb-2" style={{ fontFamily: 'var(--font-body)' }}>
                    Inference backend
                  </p>
                  <p className="font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    {modelPerformance?.model_info?.inference_backend || 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-3 mb-2" style={{ fontFamily: 'var(--font-body)' }}>
                    Score definition
                  </p>
                  <p className="text-sm dark:text-white" style={{ fontFamily: 'var(--font-body)' }}>
                    {modelPerformance?.model_info?.score_definition || 'N/A'}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#76B947]/10 backdrop-blur-sm">
                  <p className="text-xs text-muted-foreground mb-3" style={{ fontFamily: 'var(--font-body)' }}>
                    Class distribution
                  </p>
                  <div className="space-y-2">
                    {Object.entries(modelPerformance?.performance?.class_distribution || {}).map(([label, count]) => (
                      <div key={label} className="flex items-center justify-between">
                        <Badge variant="outline" className="bg-[#76B947]/20 text-[#76B947]">{label}</Badge>
                        <span className="text-sm dark:text-white" style={{ fontFamily: 'var(--font-body)' }}>
                          {String(count)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#76B947]/10 backdrop-blur-sm">
                <p className="text-xs text-muted-foreground mb-3" style={{ fontFamily: 'var(--font-body)' }}>
                  Available models
                </p>
                <div className="flex flex-wrap gap-2">
                  {aiModels.length === 0 && (
                    <span className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                      No models discovered
                    </span>
                  )}
                  {aiModels.map((model: any) => (
                    <Badge key={model.id} variant="outline" className="bg-[#76B947]/20 text-[#76B947]">
                      {model.name || model.id}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
