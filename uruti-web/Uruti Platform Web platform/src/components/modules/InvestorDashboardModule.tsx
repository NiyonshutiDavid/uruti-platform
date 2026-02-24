import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, Search, Filter, Star, Bookmark, MessageCircle, Eye, Download, DollarSign, Target, Users, Sparkles, Play, FileText, Calendar, ArrowRight, Award, Bell, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { apiClient } from '../../services/api';

interface Startup {
  id: string;
  name: string;
  tagline: string;
  sector: string;
  stage: string;
  urutiScore: number;
  readinessBand: 'growth-ready' | 'high-potential' | 'niche-specialist';
  fundingAsk: string;
  traction: string;
  teamSize: number;
  monthlyGrowth: number;
  founder: {
    name: string;
    avatar?: string;
  };
  metrics: {
    marketSize: string;
    revenue: string;
    customers: string;
  };
  pitchVideoUrl?: string;
  documentCount: number;
  lastUpdated: string;
  bookmarked: boolean;
}

const mockStartups: Startup[] = [
  {
    id: '1',
    name: 'AgriConnect',
    tagline: 'AI-powered equipment rental platform for smallholder farmers',
    sector: 'AgTech',
    stage: 'Seed',
    urutiScore: 92,
    readinessBand: 'growth-ready',
    fundingAsk: '$250K',
    traction: '5,000+ farmers, $120K MRR',
    teamSize: 8,
    monthlyGrowth: 15,
    founder: {
      name: 'Jean-Baptiste Mugisha'
    },
    metrics: {
      marketSize: '$850M TAM',
      revenue: '$1.44M ARR',
      customers: '5,234'
    },
    pitchVideoUrl: '#',
    documentCount: 12,
    lastUpdated: '2026-02-04',
    bookmarked: true
  },
  {
    id: '2',
    name: 'FinTrack',
    tagline: 'Smart bookkeeping and credit scoring for African SMEs',
    sector: 'FinTech',
    stage: 'Seed',
    urutiScore: 90,
    readinessBand: 'growth-ready',
    fundingAsk: '$500K',
    traction: '2,800 SMEs, $85K MRR',
    teamSize: 12,
    monthlyGrowth: 22,
    founder: {
      name: 'Patricia Mukamana'
    },
    metrics: {
      marketSize: '$1.2B TAM',
      revenue: '$1.02M ARR',
      customers: '2,847'
    },
    pitchVideoUrl: '#',
    documentCount: 15,
    lastUpdated: '2026-02-05',
    bookmarked: false
  },
  {
    id: '3',
    name: 'EduLearn Rwanda',
    tagline: 'Offline-first STEM education for rural secondary schools',
    sector: 'EdTech',
    stage: 'Pre-Seed',
    urutiScore: 78,
    readinessBand: 'high-potential',
    fundingAsk: '$150K',
    traction: '42 schools, 3,200 students',
    teamSize: 5,
    monthlyGrowth: 18,
    founder: {
      name: 'Emmanuel Habimana'
    },
    metrics: {
      marketSize: '$320M TAM',
      revenue: 'Pre-revenue',
      customers: '42 schools'
    },
    pitchVideoUrl: '#',
    documentCount: 8,
    lastUpdated: '2026-02-03',
    bookmarked: true
  },
  {
    id: '4',
    name: 'HealthBridge',
    tagline: 'Blockchain-based health records sharing for hospital networks',
    sector: 'HealthTech',
    stage: 'Pre-Seed',
    urutiScore: 75,
    readinessBand: 'high-potential',
    fundingAsk: '$300K',
    traction: '8 hospitals, pilot phase',
    teamSize: 6,
    monthlyGrowth: 12,
    founder: {
      name: 'Dr. Samuel Nkusi'
    },
    metrics: {
      marketSize: '$680M TAM',
      revenue: 'Pilot phase',
      customers: '8 hospitals'
    },
    pitchVideoUrl: '#',
    documentCount: 10,
    lastUpdated: '2026-01-30',
    bookmarked: false
  },
  {
    id: '5',
    name: 'MotoDeliver',
    tagline: 'Last-mile delivery network optimized for African cities',
    sector: 'Logistics',
    stage: 'Seed',
    urutiScore: 82,
    readinessBand: 'high-potential',
    fundingAsk: '$400K',
    traction: '450 riders, 12K deliveries/month',
    teamSize: 15,
    monthlyGrowth: 25,
    founder: {
      name: 'Alice Uwera'
    },
    metrics: {
      marketSize: '$2.1B TAM',
      revenue: '$540K ARR',
      customers: '1,200+'
    },
    documentCount: 11,
    lastUpdated: '2026-02-02',
    bookmarked: false
  },
  {
    id: '6',
    name: 'SolarGrid',
    tagline: 'Pay-as-you-go solar energy for rural businesses',
    sector: 'CleanTech',
    stage: 'Seed',
    urutiScore: 68,
    readinessBand: 'niche-specialist',
    fundingAsk: '$350K',
    traction: '280 installations, $45K MRR',
    teamSize: 7,
    monthlyGrowth: 10,
    founder: {
      name: 'David Nzabonimpa'
    },
    metrics: {
      marketSize: '$450M TAM',
      revenue: '$540K ARR',
      customers: '280'
    },
    documentCount: 9,
    lastUpdated: '2026-01-28',
    bookmarked: false
  }
];

const portfolioDistribution = [
  { name: 'AgTech', value: 2, color: '#76B947' },
  { name: 'FinTech', value: 2, color: '#5A9435' },
  { name: 'HealthTech', value: 1, color: '#9BCF6E' },
  { name: 'EdTech', value: 1, color: '#B8E086' },
  { name: 'Logistics', value: 1, color: '#3D7A22' },
  { name: 'CleanTech', value: 1, color: '#A8D46F' }
];

const dealFlowData = [
  { month: 'Sep', opportunities: 12, evaluated: 8, interested: 3 },
  { month: 'Oct', opportunities: 18, evaluated: 12, interested: 5 },
  { month: 'Nov', opportunities: 15, evaluated: 10, interested: 4 },
  { month: 'Dec', opportunities: 22, evaluated: 15, interested: 7 },
  { month: 'Jan', opportunities: 20, evaluated: 14, interested: 6 },
  { month: 'Feb', opportunities: 8, evaluated: 5, interested: 2 }
];

export function InvestorDashboardModule() {
  const [startups, setStartups] = useState<Startup[]>(mockStartups);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('all');
  const [filterBand, setFilterBand] = useState('all');
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);
  const [viewType, setViewType] = useState<'leaderboard' | 'grid'>('leaderboard');

  const getReadinessBadge = (band: string) => {
    const bandConfig = {
      'growth-ready': { label: 'Growth Ready', className: 'bg-[#76B947]/20 text-[#76B947]' },
      'high-potential': { label: 'High Potential', className: 'bg-blue-100 text-blue-700' },
      'niche-specialist': { label: 'Niche Specialist', className: 'bg-purple-100 text-purple-700' }
    };
    const config = bandConfig[band as keyof typeof bandConfig];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-[#76B947]';
    if (score >= 70) return 'text-blue-600';
    return 'text-purple-600';
  };

  const toggleBookmark = (startupId: string) => {
    setStartups(startups.map(s => 
      s.id === startupId ? { ...s, bookmarked: !s.bookmarked } : s
    ));
  };

  const filteredStartups = startups.filter(startup => {
    const matchesSearch = startup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         startup.tagline.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = filterSector === 'all' || startup.sector === filterSector;
    const matchesBand = filterBand === 'all' || startup.readinessBand === filterBand;
    return matchesSearch && matchesSector && matchesBand;
  }).sort((a, b) => b.urutiScore - a.urutiScore);

  const bookmarkedCount = startups.filter(s => s.bookmarked).length;
  const avgScore = Math.round(startups.reduce((acc, s) => acc + s.urutiScore, 0) / startups.length);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="glass-card rounded-2xl p-8 border border-black/5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              Welcome, Investor! 💼
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
            <div className="text-3xl mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{startups.length}</div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              <span className="text-[#76B947]">+{startups.filter(s => s.urutiScore >= 85).length}</span> investment ready
            </p>
            <Progress value={35} className="mt-3 h-2" />
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
              {avgScore}
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
            <div className="text-3xl mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{bookmarkedCount}</div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Opportunities saved
            </p>
            <Progress value={(bookmarkedCount / startups.length) * 100} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Total Capital Ask</CardTitle>
              <DollarSign className="h-5 w-5 text-[#76B947]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-1" style={{ fontFamily: 'var(--font-heading)' }}>$2.2M</div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Across {startups.length} opportunities
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
            {startups.filter(s => s.bookmarked).length > 0 ? (
              <div className="space-y-4">
                {startups.filter(s => s.bookmarked).map((startup) => (
                  <div 
                    key={startup.id}
                    className="flex items-start gap-4 p-4 rounded-xl glass-button hover:bg-[#76B947]/10 transition-all cursor-pointer border border-black/5"
                  >
                    <div className="w-16 h-16 rounded-lg bg-[#76B947]/10 flex items-center justify-center flex-shrink-0">
                      <Award className="h-8 w-8 text-[#76B947]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-bold text-base mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                            {startup.name}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-1" style={{ fontFamily: 'var(--font-body)' }}>
                            {startup.tagline}
                          </p>
                        </div>
                        <Badge className={getReadinessBadge(startup.readinessBand).props.className}>
                          {getReadinessBadge(startup.readinessBand).props.children}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Award className="h-4 w-4 text-[#76B947]" />
                          <span className={getScoreColor(startup.urutiScore)}>{startup.urutiScore}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">{startup.sector}</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">{startup.stage}</Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-[#76B947] text-[#76B947] hover:bg-[#76B947]/10"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-purple-300 text-purple-600 hover:bg-purple-50"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Analyze
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                          onClick={() => toggleBookmark(startup.id)}
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
                <Button className="bg-[#76B947] hover:bg-[#5a8f35] text-white">
                  Explore Startups
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card className="glass-card border-black/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Notifications</CardTitle>
                <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                  Latest updates
                </CardDescription>
              </div>
              <Bell className="h-5 w-5 text-[#76B947]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 rounded-lg glass-button hover:bg-[#76B947]/10 transition-all cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-[#76B947]/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-[#76B947]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-heading)' }}>
                    AgriConnect updated pitch deck
                  </p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    New financial projections • 2h ago
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg glass-button hover:bg-[#76B947]/10 transition-all cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-heading)' }}>
                    FinTrack reached 3K customers
                  </p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Milestone achieved • 5h ago
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg glass-button hover:bg-[#76B947]/10 transition-all cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Star className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-heading)' }}>
                    New startup match
                  </p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    MotoDeliver • 1d ago
                  </p>
                </div>
              </div>

              <Button variant="ghost" className="w-full text-[#76B947] hover:bg-[#76B947]/10 text-sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sector Distribution */}
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
                  data={portfolioDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {portfolioDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontFamily: 'var(--font-body)' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Investment Readiness */}
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
                    {startups.filter(s => s.readinessBand === 'growth-ready').length}
                  </span>
                </div>
                <Progress value={33} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>High Potential</span>
                  <span className="text-sm text-blue-600" style={{ fontFamily: 'var(--font-heading)' }}>
                    {startups.filter(s => s.readinessBand === 'high-potential').length}
                  </span>
                </div>
                <Progress value={50} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Niche Specialist</span>
                  <span className="text-sm text-purple-600" style={{ fontFamily: 'var(--font-heading)' }}>
                    {startups.filter(s => s.readinessBand === 'niche-specialist').length}
                  </span>
                </div>
                <Progress value={17} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
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
                <TabsTrigger value="AgTech">AgTech</TabsTrigger>
                <TabsTrigger value="FinTech">FinTech</TabsTrigger>
                <TabsTrigger value="HealthTech">Health</TabsTrigger>
                <TabsTrigger value="EdTech">EdTech</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs value={filterBand} onValueChange={setFilterBand}>
              <TabsList>
                <TabsTrigger value="all">All Bands</TabsTrigger>
                <TabsTrigger value="growth-ready">Growth Ready</TabsTrigger>
                <TabsTrigger value="high-potential">High Potential</TabsTrigger>
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
      {viewType === 'leaderboard' ? (
        <Card className="glass-card border-black/5">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Startup Leaderboard</CardTitle>
            <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
              AI-ranked investment opportunities • {filteredStartups.length} startups
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
                  <TableHead style={{ fontFamily: 'var(--font-heading)' }}>Traction</TableHead>
                  <TableHead style={{ fontFamily: 'var(--font-heading)' }}>Ask</TableHead>
                  <TableHead style={{ fontFamily: 'var(--font-heading)' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStartups.map((startup, index) => (
                  <TableRow key={startup.id} className="hover:bg-[#76B947]/5">
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
                          <AvatarImage src={startup.founder.avatar} />
                          <AvatarFallback className="bg-[#76B947]/20 text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                            {startup.name.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium" style={{ fontFamily: 'var(--font-heading)' }}>{startup.name}</p>
                          <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            {startup.tagline}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="bg-black/5 text-xs">{startup.sector}</Badge>
                            <Badge variant="outline" className="bg-black/5 text-xs">{startup.stage}</Badge>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className={`text-2xl ${getScoreColor(startup.urutiScore)}`} style={{ fontFamily: 'var(--font-heading)' }}>
                          {startup.urutiScore}
                        </div>
                        <Progress value={startup.urutiScore} className="h-1.5 w-16" />
                      </div>
                    </TableCell>
                    <TableCell>{getReadinessBadge(startup.readinessBand)}</TableCell>
                    <TableCell>
                      <p className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>{startup.traction}</p>
                      <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        +{startup.monthlyGrowth}% monthly
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>{startup.fundingAsk}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-[#76B947]/10"
                          onClick={() => setSelectedStartup(startup)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`hover:bg-[#76B947]/10 ${startup.bookmarked ? 'text-[#76B947]' : ''}`}
                          onClick={() => toggleBookmark(startup.id)}
                        >
                          <Bookmark className={`h-4 w-4 ${startup.bookmarked ? 'fill-[#76B947]' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:bg-[#76B947]/10">
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStartups.map((startup, index) => (
            <Card key={startup.id} className="glass-card border-black/5 hover:shadow-lg transition-all">
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
                    className={startup.bookmarked ? 'text-[#76B947]' : ''}
                    onClick={() => toggleBookmark(startup.id)}
                  >
                    <Bookmark className={`h-5 w-5 ${startup.bookmarked ? 'fill-[#76B947]' : ''}`} />
                  </Button>
                </div>
                <CardTitle className="mb-2" style={{ fontFamily: 'var(--font-heading)' }}>{startup.name}</CardTitle>
                <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                  {startup.tagline}
                </CardDescription>
                <div className="flex items-center space-x-2 mt-3">
                  <Badge variant="outline" className="bg-black/5">{startup.sector}</Badge>
                  {getReadinessBadge(startup.readinessBand)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Uruti Score</span>
                    <span className={`text-2xl ${getScoreColor(startup.urutiScore)}`} style={{ fontFamily: 'var(--font-heading)' }}>
                      {startup.urutiScore}
                    </span>
                  </div>
                  <Progress value={startup.urutiScore} className="h-2" />
                  
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-black/10">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: 'var(--font-body)' }}>Market Size</p>
                      <p className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>{startup.metrics.marketSize}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: 'var(--font-body)' }}>Revenue</p>
                      <p className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>{startup.metrics.revenue}</p>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-black/10">
                    <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: 'var(--font-body)' }}>Traction</p>
                    <p className="text-sm mb-2" style={{ fontFamily: 'var(--font-body)' }}>{startup.traction}</p>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-[#76B947]" />
                      <span className="text-sm text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                        +{startup.monthlyGrowth}% monthly growth
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-black/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Funding Ask</span>
                      <span className="text-lg" style={{ fontFamily: 'var(--font-heading)' }}>{startup.fundingAsk}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-3">
                    <Button size="sm" className="flex-1 bg-black text-white hover:bg-black/90" onClick={() => setSelectedStartup(startup)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                    <Button size="sm" variant="outline" className="hover:bg-[#76B947]/10">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Startup Detail Dialog */}
      <Dialog open={selectedStartup !== null} onOpenChange={(open) => !open && setSelectedStartup(null)}>
        <DialogContent className="max-w-4xl glass-card max-h-[90vh] overflow-y-auto">
          {selectedStartup && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedStartup.founder.avatar} />
                      <AvatarFallback className="bg-[#76B947]/20 text-[#76B947] text-xl" style={{ fontFamily: 'var(--font-heading)' }}>
                        {selectedStartup.name.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle style={{ fontFamily: 'var(--font-heading)' }}>{selectedStartup.name}</DialogTitle>
                      <DialogDescription style={{ fontFamily: 'var(--font-body)' }}>
                        {selectedStartup.tagline}
                      </DialogDescription>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline" className="bg-black/5">{selectedStartup.sector}</Badge>
                        <Badge variant="outline" className="bg-black/5">{selectedStartup.stage}</Badge>
                        {getReadinessBadge(selectedStartup.readinessBand)}
                      </div>
                    </div>
                  </div>
                  <div className={`text-4xl ${getScoreColor(selectedStartup.urutiScore)}`} style={{ fontFamily: 'var(--font-heading)' }}>
                    {selectedStartup.urutiScore}
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card className="glass-panel border-black/5">
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: 'var(--font-body)' }}>Market Size</p>
                    <p className="text-xl" style={{ fontFamily: 'var(--font-heading)' }}>{selectedStartup.metrics.marketSize}</p>
                  </CardContent>
                </Card>
                <Card className="glass-panel border-black/5">
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: 'var(--font-body)' }}>Revenue</p>
                    <p className="text-xl" style={{ fontFamily: 'var(--font-heading)' }}>{selectedStartup.metrics.revenue}</p>
                  </CardContent>
                </Card>
                <Card className="glass-panel border-black/5">
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: 'var(--font-body)' }}>Customers</p>
                    <p className="text-xl" style={{ fontFamily: 'var(--font-heading)' }}>{selectedStartup.metrics.customers}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-4">
                  <Card className="glass-panel border-black/5">
                    <CardHeader>
                      <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Traction Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>Current Traction</span>
                        <span className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>{selectedStartup.traction}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>Monthly Growth</span>
                        <span className="text-sm text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>+{selectedStartup.monthlyGrowth}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>Team Size</span>
                        <span className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>{selectedStartup.teamSize} members</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>Funding Ask</span>
                        <span className="text-lg text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>{selectedStartup.fundingAsk}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-panel border-black/5">
                    <CardHeader>
                      <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Founder</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={selectedStartup.founder.avatar} />
                          <AvatarFallback className="bg-[#76B947]/20 text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                            {selectedStartup.founder.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium" style={{ fontFamily: 'var(--font-heading)' }}>{selectedStartup.founder.name}</p>
                          <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Founder & CEO</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <Card className="glass-panel border-black/5">
                    <CardHeader>
                      <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Documents</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button variant="outline" className="w-full justify-between hover:bg-[#76B947]/10">
                        <span className="flex items-center" style={{ fontFamily: 'var(--font-body)' }}>
                          <FileText className="mr-2 h-4 w-4" />
                          Pitch Deck
                        </span>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" className="w-full justify-between hover:bg-[#76B947]/10">
                        <span className="flex items-center" style={{ fontFamily: 'var(--font-body)' }}>
                          <FileText className="mr-2 h-4 w-4" />
                          Financial Model
                        </span>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" className="w-full justify-between hover:bg-[#76B947]/10">
                        <span className="flex items-center" style={{ fontFamily: 'var(--font-body)' }}>
                          <Play className="mr-2 h-4 w-4" />
                          Pitch Video
                        </span>
                        <Play className="h-4 w-4" />
                      </Button>
                      <p className="text-xs text-center text-muted-foreground mt-2" style={{ fontFamily: 'var(--font-body)' }}>
                        +{selectedStartup.documentCount - 3} more documents
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex items-center space-x-2 mt-6 pt-6 border-t border-black/10">
                <Button className="flex-1 bg-black text-white hover:bg-black/90">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Contact Founder
                </Button>
                <Button className="flex-1 glass-button">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Meeting
                </Button>
                <Button
                  variant="outline"
                  className={selectedStartup.bookmarked ? 'text-[#76B947] hover:bg-[#76B947]/10' : 'hover:bg-[#76B947]/10'}
                  onClick={() => toggleBookmark(selectedStartup.id)}
                >
                  <Bookmark className={`h-4 w-4 ${selectedStartup.bookmarked ? 'fill-[#76B947]' : ''}`} />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}