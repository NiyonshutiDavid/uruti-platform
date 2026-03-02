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
  MessageCircle, CheckCircle, Clock, X
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../lib/auth-context';

export function AdminDashboardModule() {
  const { user } = useAuth();
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
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch users
      const usersData = await apiClient.getUsers(0, 1000);
      setUsers(usersData);

      // Fetch ventures
      const venturesData = await apiClient.getVentures(0, 1000);
      setVentures(venturesData);

      // Fetch support messages
      try {
        const supportData = await apiClient.getSupportMessages(0, 100);
        setSupportMessages(supportData);
      } catch (error) {
        console.log('Support messages not yet available');
        setSupportMessages([]);
      }

      // Calculate stats
      const founders = usersData.filter((u: any) => u.role === 'founder').length;
      const investors = usersData.filter((u: any) => u.role === 'investor').length;

      setStats({
        totalUsers: usersData.length,
        totalFounders: founders,
        totalInvestors: investors,
        totalVentures: venturesData.length,
        totalMessages: 0, // To be implemented with messages endpoint
        totalAIPrompts: 0, // To be tracked
        totalUploads: 0, // To be tracked
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
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
        <TabsList className="grid w-full grid-cols-4 bg-[#76B947]/10 backdrop-blur-sm">
          <TabsTrigger value="overview" style={{ fontFamily: 'var(--font-heading)' }}>
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" style={{ fontFamily: 'var(--font-heading)' }}>
            Users
          </TabsTrigger>
          <TabsTrigger value="ventures" style={{ fontFamily: 'var(--font-heading)' }}>
            Ventures
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
                <Button onClick={() => toast.info('Add user feature coming soon')}>
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
                          <Button variant="ghost" size="sm">
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
      </Tabs>
    </div>
  );
}
