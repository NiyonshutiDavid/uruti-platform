import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfirmDialog } from '../ui/confirm-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, Search, Filter, Star, Bookmark, MessageCircle, Eye, Download, DollarSign, Target, Users, Sparkles, Play, FileText, Calendar, ArrowRight, ArrowLeft, Award, Bell, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { VentureDetailView } from '../VentureDetailView';
import { apiClient } from '../../lib/api-client';
import { toast } from 'sonner';
import { useAuth } from '../../lib/auth-context';

export function InvestorDashboardModule() {
  const { confirm } = useConfirmDialog();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ventures, setVentures] = useState<any[]>([]);
  const [bookmarkedVentures, setBookmarkedVentures] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('all');
  const [filterBand, setFilterBand] = useState('all');
  const [selectedVenture, setSelectedVenture] = useState<any | null>(null);
  const [viewType, setViewType] = useState<'leaderboard' | 'grid'>('leaderboard');
  const [loadingVenture, setLoadingVenture] = useState(false);

  // Load all data from backend
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Fetch all ventures for leaderboard
      const allVentures = await apiClient.getVentures();
      console.log('Investor Dashboard - All ventures fetched:', allVentures);
      setVentures(allVentures);

      // Fetch bookmarked ventures
      const bookmarks = await apiClient.getBookmarkedVentures();
      console.log('Investor Dashboard - Bookmarked ventures fetched:', bookmarks);
      setBookmarkedVentures(bookmarks);

      // TODO: Fetch notifications from backend when endpoint is ready
      // For now, notifications array stays empty
      setNotifications([]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
      setVentures([]);
      setBookmarkedVentures([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async (ventureId: number) => {
    try {
      const isBookmarked = bookmarkedVentures.some(v => v.id === ventureId);
      
      if (isBookmarked) {
        const confirmed = await confirm({
          title: 'Remove Bookmark',
          description: 'Remove this startup from your bookmarks? You can always bookmark it again later.',
          confirmLabel: 'Remove',
          variant: 'danger',
        });
        if (!confirmed) return;

        await apiClient.removeBookmark(ventureId);
        setBookmarkedVentures(prev => prev.filter(v => v.id !== ventureId));
        toast.success('Removed from bookmarks');
      } else {
        await apiClient.bookmarkVenture(ventureId);
        await loadAllData();
        toast.success('Added to bookmarks');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to update bookmark');
    }
  };

  const handleViewVenture = async (venture: any) => {
    setLoadingVenture(true);
    try {
      const fullVenture = await apiClient.getVentureById(venture.id);
      const mapped = {
        id: String(fullVenture.id),
        name: fullVenture.name || '',
        sector: fullVenture.industry || '',
        tagline: fullVenture.tagline || '',
        problem: fullVenture.problem_statement || '',
        solution: fullVenture.solution || '',
        targetMarket: fullVenture.target_market || '',
        urutiScore: fullVenture.uruti_score || 0,
        activeUsers: fullVenture.customers || 0,
        monthlyGrowth: fullVenture.mrr ? Math.round((fullVenture.mrr / Math.max(fullVenture.monthly_burn_rate || 1, 1)) * 100) : 0,
        highlights: fullVenture.highlights || [],
        teamBackground: fullVenture.team_background || '',
        competitiveEdge: fullVenture.competitive_edge || '',
        fundingPlans: fullVenture.funding_plans || '',
        milestones: fullVenture.milestones || [],
        activities: fullVenture.activities || [],
        pitchDeckUrl: fullVenture.pitch_deck_url || '',
        pitchVideoUrl: fullVenture.demo_video_url || '',
        thumbnailUrl: fullVenture.banner_url || '',
        fundingGoal: fullVenture.funding_goal || 0,
        fundingRaised: fullVenture.funding_raised || 0,
        teamSize: fullVenture.team_size || 1,
        stage: fullVenture.stage || '',
        founderId: fullVenture.founder_id || 0,
      };
      setSelectedVenture(mapped);
    } catch (error) {
      console.error('Failed to load venture details:', error);
      toast.error('Failed to load venture details');
    } finally {
      setLoadingVenture(false);
    }
  };

  const getReadinessBand = (score: number) => {
    if (score >= 85) {
      return <Badge className="bg-[#76B947]/20 text-[#76B947]">Growth Ready</Badge>;
    } else if (score >= 70) {
      return <Badge className="bg-blue-100 text-blue-700">High Potential</Badge>;
    } else {
      return <Badge className="bg-orange-100 text-orange-700">Emerging</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-[#76B947]';
    if (score >= 70) return 'text-blue-600';
    return 'text-orange-600';
  };

  // Calculate sector distribution from real data
  const sectorDistribution = ventures.reduce((acc: any[], venture) => {
    const sector = venture.industry || venture.sector || 'Other';
    const existing = acc.find(item => item.name === sector);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ 
        name: sector, 
        value: 1, 
        color: `hsl(${Math.random() * 360}, 65%, 50%)` 
      });
    }
    return acc;
  }, []);

  // Extract unique sectors and stages from real data
  const uniqueSectors = Array.from(new Set(ventures.map(v => v.industry || v.sector).filter(Boolean)));
  const uniqueStages = Array.from(new Set(ventures.map(v => v.stage).filter(Boolean)));

  // Filter ventures
  const filteredVentures = ventures.filter(venture => {
    const matchesSearch = (venture.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (venture.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = filterSector === 'all' || venture.industry === filterSector || venture.sector === filterSector;
    
    // Filter by stage
    const matchesStage = filterBand === 'all' || venture.stage === filterBand;
    
    return matchesSearch && matchesSector && matchesStage;
  }).sort((a, b) => (b.uruti_score || 0) - (a.uruti_score || 0));

  const avgScore = ventures.length > 0 
    ? Math.round(ventures.reduce((acc, v) => acc + (v.uruti_score || 0), 0) / ventures.length)
    : 0;

  const growthReadyCount = ventures.filter(v => (v.uruti_score || 0) >= 85).length;
  const highPotentialCount = ventures.filter(v => (v.uruti_score || 0) >= 70 && (v.uruti_score || 0) < 85).length;
  const emergingCount = ventures.filter(v => (v.uruti_score || 0) < 70).length;

  // Get user's first name for welcome message
  const displayName = user?.full_name?.split(' ')[0] || 'Investor';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#76B947] mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If a venture is selected, show the full detail view
  if (selectedVenture) {
    return (
      <div className="space-y-6">
        <Button
          onClick={() => setSelectedVenture(null)}
          variant="outline"
          className="hover:bg-[#76B947]/10 hover:border-[#76B947]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <VentureDetailView
          venture={selectedVenture}
          isPublic={false}
          onViewFounder={(founderId) => navigate(`/dashboard/profile/${founderId}`)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="glass-card rounded-2xl p-8 border border-black/5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              Hi {displayName}! 👋
            </h1>
            <p className="text-lg text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Discover investment-ready startups powered by AI-driven intelligence
            </p>
          </div>
          <div className="glass-button p-6 rounded-2xl">
            <Target className="h-12 w-12 text-[#76B947]" />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-black/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Deal Flow</CardTitle>
              <TrendingUp className="h-5 w-5 text-[#76B947]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{ventures.length}</div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              <span className="text-[#76B947]">+{growthReadyCount}</span> investment ready
            </p>
            <Progress value={ventures.length > 0 ? (growthReadyCount / ventures.length) * 100 : 0} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Avg Uruti Score</CardTitle>
              <Award className="h-5 w-5 text-[#76B947]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl mb-1 ${getScoreColor(avgScore)}`} style={{ fontFamily: 'var(--font-heading)' }}>
              {avgScore || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              AI-powered quality rating
            </p>
            <Progress value={avgScore} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Bookmarked</CardTitle>
              <Bookmark className="h-5 w-5 text-[#76B947]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{bookmarkedVentures.length}</div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Opportunities saved
            </p>
            <Progress value={ventures.length > 0 ? (bookmarkedVentures.length / ventures.length) * 100 : 0} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Total Ventures</CardTitle>
              <DollarSign className="h-5 w-5 text-[#76B947]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{ventures.length}</div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Available opportunities
            </p>
            <Progress value={60} className="mt-3 h-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Deal Flow - Bookmarked Startups */}
        <Card className="glass-card border-black/5 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>My Deal Flow</CardTitle>
                <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                  Startups you're interested in
                </CardDescription>
              </div>
              <Bookmark className="h-5 w-5 text-[#76B947]" />
            </div>
          </CardHeader>
          <CardContent>
            {bookmarkedVentures.length > 0 ? (
              <div className="space-y-4">
                {bookmarkedVentures.slice(0, 3).map((venture) => (
                  <div 
                    key={venture.id}
                    className="flex items-start gap-4 p-4 rounded-xl glass-button hover:bg-[#76B947]/10 transition-all cursor-pointer border border-black/5"
                  >
                    <div className="w-16 h-16 rounded-lg bg-[#76B947]/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {venture.logo_url ? (
                        <img src={venture.logo_url} alt={venture.name} className="w-full h-full object-cover" />
                      ) : (
                        <Award className="h-8 w-8 text-[#76B947]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-bold text-base mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                            {venture.name}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-1" style={{ fontFamily: 'var(--font-body)' }}>
                            {venture.description || venture.tagline || 'No description available'}
                          </p>
                        </div>
                        {venture.uruti_score && (
                          <Badge className={`${venture.uruti_score >= 85 ? 'bg-[#76B947]/20 text-[#76B947]' : 'bg-blue-100 text-blue-700'}`}>
                            {venture.uruti_score}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        {venture.uruti_score && (
                          <div className="flex items-center gap-1">
                            <Award className="h-4 w-4 text-[#76B947]" />
                            <span className={getScoreColor(venture.uruti_score)}>{venture.uruti_score}</span>
                          </div>
                        )}
                        {venture.industry && (
                          <Badge variant="outline" className="text-xs">{venture.industry}</Badge>
                        )}
                        {venture.stage && (
                          <Badge variant="outline" className="text-xs">{venture.stage}</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-[#76B947] text-[#76B947] hover:bg-[#76B947]/10"
                          onClick={() => handleViewVenture(venture)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(venture.id);
                          }}
                        >
                          <Bookmark className="h-3 w-3 fill-[#76B947] text-[#76B947]" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bookmark className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h4 className="font-bold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  No startups in your deal flow yet
                </h4>
                <p className="text-sm text-muted-foreground mb-4" style={{ fontFamily: 'var(--font-body)' }}>
                  Visit Startup Discovery to bookmark interesting opportunities
                </p>
                <Button 
                  className="bg-[#76B947] hover:bg-[#5a8f35] text-white"
                  onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'startup-discovery' } }))}
                >
                  Explore Startups
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications Card (always visible now) */}
        <Card className="glass-card border-black/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Notifications</CardTitle>
                <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                  Latest updates & alerts
                </CardDescription>
              </div>
              <Bell className="h-5 w-5 text-[#76B947]" />
            </div>
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notification, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg glass-button hover:bg-[#76B947]/10 transition-all cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-[#76B947]/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-[#76B947]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-heading)' }}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        {notification.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  No notifications yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sector Distribution & Investment Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sector Distribution */}
        {sectorDistribution.length > 0 && (
          <Card className="glass-card border-black/5">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Sector Distribution</CardTitle>
              <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                Portfolio breakdown by industry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={sectorDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sectorDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: 'var(--font-body)' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Investment Readiness */}
        {ventures.length > 0 && (
          <Card className="glass-card border-black/5">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Investment Readiness</CardTitle>
              <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                Startups by readiness band
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Growth Ready</span>
                    <span className="text-sm text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                      {growthReadyCount}
                    </span>
                  </div>
                  <Progress value={ventures.length > 0 ? (growthReadyCount / ventures.length) * 100 : 0} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>High Potential</span>
                    <span className="text-sm text-blue-600" style={{ fontFamily: 'var(--font-heading)' }}>
                      {highPotentialCount}
                    </span>
                  </div>
                  <Progress value={ventures.length > 0 ? (highPotentialCount / ventures.length) * 100 : 0} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Emerging</span>
                    <span className="text-sm text-orange-600" style={{ fontFamily: 'var(--font-heading)' }}>
                      {emergingCount}
                    </span>
                  </div>
                  <Progress value={ventures.length > 0 ? (emergingCount / ventures.length) * 100 : 0} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filters */}
      <Card className="glass-card border-black/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search startups by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Tabs value={filterSector} onValueChange={setFilterSector}>
              <TabsList>
                <TabsTrigger value="all">All Sectors</TabsTrigger>
                {uniqueSectors.slice(0, 4).map(sector => (
                  <TabsTrigger key={sector} value={sector}>{sector}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Tabs value={filterBand} onValueChange={setFilterBand}>
              <TabsList>
                <TabsTrigger value="all">All Stages</TabsTrigger>
                {uniqueStages.slice(0, 4).map(stage => (
                  <TabsTrigger key={stage} value={stage}>{stage}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Tabs value={viewType} onValueChange={(v) => setViewType(v as 'leaderboard' | 'grid')}>
              <TabsList>
                <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                <TabsTrigger value="grid">Grid</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Startup Leaderboard */}
      {ventures.length === 0 ? (
        <Card className="glass-card border-black/5">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="h-20 w-20 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              No ventures available yet
            </h3>
            <p className="text-muted-foreground text-center" style={{ fontFamily: 'var(--font-body)' }}>
              Check back soon for new investment opportunities
            </p>
          </CardContent>
        </Card>
      ) : viewType === 'leaderboard' ? (
        <Card className="glass-card border-black/5">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Startup Leaderboard</CardTitle>
            <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
              AI-ranked investment opportunities • {filteredVentures.length} startups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ fontFamily: 'var(--font-heading)' }}>Rank</TableHead>
                  <TableHead style={{ fontFamily: 'var(--font-heading)' }}>Startup</TableHead>
                  <TableHead style={{ fontFamily: 'var(--font-heading)' }}>Uruti Score</TableHead>
                  <TableHead style={{ fontFamily: 'var(--font-heading)' }}>Band</TableHead>
                  <TableHead style={{ fontFamily: 'var(--font-heading)' }}>Stage</TableHead>
                  <TableHead style={{ fontFamily: 'var(--font-heading)' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVentures.map((venture, index) => {
                  const isBookmarked = bookmarkedVentures.some(b => b.id === venture.id);
                  return (
                    <TableRow key={venture.id} className="hover:bg-[#76B947]/5">
                      <TableCell>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-[#76B947]/20 text-[#76B947]' : 'bg-black/5'
                        }`}>
                          <span style={{ fontFamily: 'var(--font-heading)' }}>{index + 1}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={venture.logo_url} alt={venture.name} />
                            <AvatarFallback className="bg-[#76B947]/20 text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                              {(venture.name || '??').substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium" style={{ fontFamily: 'var(--font-heading)' }}>{venture.name}</p>
                            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                              {venture.description || venture.tagline || 'No description'}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              {venture.industry && (
                                <Badge variant="outline" className="bg-black/5 text-xs">{venture.industry}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className={`text-2xl ${getScoreColor(venture.uruti_score || 0)}`} style={{ fontFamily: 'var(--font-heading)' }}>
                            {venture.uruti_score || 'N/A'}
                          </div>
                          <Progress value={venture.uruti_score || 0} className="h-1.5 w-16" />
                        </div>
                      </TableCell>
                      <TableCell>{getReadinessBand(venture.uruti_score || 0)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-black/5">
                          {venture.stage || 'Not specified'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-[#76B947]/10"
                            onClick={() => handleViewVenture(venture)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`hover:bg-[#76B947]/10 ${isBookmarked ? 'text-[#76B947]' : ''}`}
                            onClick={() => toggleBookmark(venture.id)}
                          >
                            <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-[#76B947]' : ''}`} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVentures.map((venture, index) => {
            const isBookmarked = bookmarkedVentures.some(b => b.id === venture.id);
            return (
              <Card key={venture.id} className="glass-card border-black/5 hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-[#76B947]/20 text-[#76B947]' : 'bg-black/5'
                    }`}>
                      <span className="text-lg" style={{ fontFamily: 'var(--font-heading)' }}>#{index + 1}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={isBookmarked ? 'text-[#76B947]' : ''}
                      onClick={() => toggleBookmark(venture.id)}
                    >
                      <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-[#76B947]' : ''}`} />
                    </Button>
                  </div>
                  <CardTitle className="mb-2" style={{ fontFamily: 'var(--font-heading)' }}>{venture.name}</CardTitle>
                  <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                    {venture.description || venture.tagline || 'No description available'}
                  </CardDescription>
                  <div className="flex items-center space-x-2 mt-3">
                    {venture.industry && (
                      <Badge variant="outline" className="bg-black/5">{venture.industry}</Badge>
                    )}
                    {getReadinessBand(venture.uruti_score || 0)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Uruti Score</span>
                      <span className={`text-2xl ${getScoreColor(venture.uruti_score || 0)}`} style={{ fontFamily: 'var(--font-heading)' }}>
                        {venture.uruti_score || 'N/A'}
                      </span>
                    </div>
                    <Progress value={venture.uruti_score || 0} className="h-2" />

                    <div className="flex items-center space-x-2 pt-3">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-[#76B947] text-white hover:bg-[#5a8f35]" 
                        onClick={() => handleViewVenture(venture)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        {loadingVenture ? 'Loading...' : 'View Details'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
}