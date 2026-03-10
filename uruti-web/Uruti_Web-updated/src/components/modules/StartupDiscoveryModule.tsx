import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfirmDialog } from '../ui/confirm-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Users, 
  DollarSign,
  MapPin,
  Rocket,
  Award,
  Eye,
  Play,
  ArrowLeft,
  Sparkles,
  Bookmark,
  Loader2,
  LayoutGrid,
  List
} from 'lucide-react';
import { VentureDetailView } from '../VentureDetailView';
import { apiClient } from '../../lib/api-client';
import { toast } from 'sonner';

export function StartupDiscoveryModule() {
  const { confirm } = useConfirmDialog();
  const navigate = useNavigate();
  const [ventures, setVentures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [selectedVenture, setSelectedVenture] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'leaderboard'>('grid');
  const [bookmarkedVentures, setBookmarkedVentures] = useState<Set<number>>(new Set());

  // Load ventures from backend
  useEffect(() => {
    loadVentures();
    loadBookmarks();
  }, []);

  useEffect(() => {
    const handleVentureVideoUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ ventureId?: number; videoUrl?: string }>).detail;
      const ventureId = Number(detail?.ventureId);
      const videoUrl = detail?.videoUrl;
      if (!ventureId || !videoUrl) return;

      setSelectedVenture((prev: any) => {
        if (!prev || Number(prev.id) !== ventureId) return prev;
        return { ...prev, pitchVideoUrl: videoUrl };
      });
    };

    window.addEventListener('venture-video-updated', handleVentureVideoUpdated as EventListener);
    return () => {
      window.removeEventListener('venture-video-updated', handleVentureVideoUpdated as EventListener);
    };
  }, []);

  const loadVentures = async () => {
    setLoading(true);
    try {
      const venturesData = await apiClient.getVentures();
      console.log('Startup Discovery - Ventures fetched:', venturesData);
      setVentures(venturesData);
    } catch (error) {
      console.error('Error loading ventures:', error);
      toast.error('Failed to load startups');
      setVentures([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBookmarks = async () => {
    try {
      const bookmarks = await apiClient.getBookmarkedVentures();
      const bookmarkedIds = new Set(bookmarks.map((b: any) => b.id));
      setBookmarkedVentures(bookmarkedIds);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  const filteredVentures = ventures.filter(venture => {
    const matchesSearch = 
      venture.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venture.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venture.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = filterSector === 'all' || venture.industry === filterSector;
    const matchesStage = filterStage === 'all' || venture.stage === filterStage;
    return matchesSearch && matchesSector && matchesStage;
  });

  const handleViewVenture = async (venture: any) => {
    try {
      // Fetch full venture details from backend
      const fullVenture = await apiClient.getVentureById(venture.id);

      // Map snake_case API response to camelCase for VentureDetailView
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
    }
  };

  const handleBackToList = () => {
    setSelectedVenture(null);
  };

  const toggleBookmark = async (ventureId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    try {
      if (bookmarkedVentures.has(ventureId)) {
        const confirmed = await confirm({
          title: 'Remove Bookmark',
          description: 'Remove this startup from your bookmarks? You can always bookmark it again later.',
          confirmLabel: 'Remove',
          variant: 'danger',
        });
        if (!confirmed) return;

        await apiClient.removeBookmark(ventureId);
        setBookmarkedVentures(prev => {
          const newSet = new Set(prev);
          newSet.delete(ventureId);
          return newSet;
        });
        toast.success('Removed from bookmarks');
      } else {
        await apiClient.bookmarkVenture(ventureId);
        setBookmarkedVentures(prev => new Set(prev).add(ventureId));
        toast.success('Added to bookmarks');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to update bookmark');
    }
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'MVP': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'Pre-Seed': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      'Seed': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'Growth': 'bg-[#76B947]/20 text-[#76B947]',
      'Early Stage': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'Series A': 'bg-[#76B947]/20 text-[#76B947]',
      'Series B': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  };

  // Get unique sectors for filter
  const uniqueSectors = Array.from(new Set(ventures.map(v => v.industry).filter(Boolean)));
  const uniqueStages = Array.from(new Set(ventures.map(v => v.stage).filter(Boolean)));

  if (selectedVenture) {
    return (
      <div>
        <Button 
          variant="ghost" 
          onClick={handleBackToList}
          className="mb-4 hover:bg-[#76B947]/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Discovery
        </Button>
        <VentureDetailView 
          venture={selectedVenture}
          isOwner={false}
          onViewFounder={(founderId) => navigate(`/dashboard/profile/${founderId}`)}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#76B947]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Startup Discovery
          </h1>
          <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
            Explore investment-ready startups in Rwanda's ecosystem
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-[#76B947] text-white hover:bg-[#5a8f35]' : ''}
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            Grid
          </Button>
          <Button
            variant={viewMode === 'leaderboard' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('leaderboard')}
            className={viewMode === 'leaderboard' ? 'bg-[#76B947] text-white hover:bg-[#5a8f35]' : ''}
          >
            <List className="h-4 w-4 mr-1" />
            Leaderboard
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="glass-card border-black/5 dark:border-white/10">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search startups by name, sector, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>

            {/* Sector Filter */}
            <Select value={filterSector} onValueChange={setFilterSector}>
              <SelectTrigger className="w-full lg:w-48 dark:bg-gray-800 dark:border-gray-700">
                <SelectValue placeholder="All Sectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                {uniqueSectors.map((sector) => (
                  <SelectItem key={sector} value={sector}>
                    {sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Stage Filter */}
            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger className="w-full lg:w-48 dark:bg-gray-800 dark:border-gray-700">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {uniqueStages.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Total Startups
                </p>
                <p className="text-3xl mt-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  {ventures.length}
                </p>
              </div>
              <Rocket className="h-8 w-8 text-[#76B947]" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Sectors
                </p>
                <p className="text-3xl mt-1 text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                  {uniqueSectors.length}
                </p>
              </div>
              <Filter className="h-8 w-8 text-[#76B947]" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Bookmarked
                </p>
                <p className="text-3xl mt-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  {bookmarkedVentures.size}
                </p>
              </div>
              <Bookmark className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Filtered
                </p>
                <p className="text-3xl mt-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  {filteredVentures.length}
                </p>
              </div>
              <Search className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {ventures.length === 0 ? (
        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="py-16">
            <div className="text-center">
              <Rocket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                No startups available yet
              </h3>
              <p className="text-muted-foreground mb-6" style={{ fontFamily: 'var(--font-body)' }}>
                Check back soon as founders add their ventures to the platform
              </p>
            </div>
          </CardContent>
        </Card>
      ) : filteredVentures.length === 0 ? (
        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="py-16">
            <div className="text-center">
              <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                No startups match your filters
              </h3>
              <p className="text-muted-foreground mb-6" style={{ fontFamily: 'var(--font-body)' }}>
                Try adjusting your search criteria or filters
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterSector('all');
                  setFilterStage('all');
                }}
              >
                Clear All Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Content based on view mode */
        viewMode === 'leaderboard' ? (
          /* Leaderboard Table View */
          <Card className="glass-card border-black/5 dark:border-white/10">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Startup Leaderboard</CardTitle>
              <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                AI-ranked startups by Uruti Score • {filteredVentures.length} startups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ fontFamily: 'var(--font-heading)' }}>Rank</TableHead>
                    <TableHead style={{ fontFamily: 'var(--font-heading)' }}>Startup</TableHead>
                    <TableHead style={{ fontFamily: 'var(--font-heading)' }}>Uruti Score</TableHead>
                    <TableHead style={{ fontFamily: 'var(--font-heading)' }}>Stage</TableHead>
                    <TableHead style={{ fontFamily: 'var(--font-heading)' }}>Sector</TableHead>
                    <TableHead style={{ fontFamily: 'var(--font-heading)' }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...filteredVentures].sort((a, b) => (b.uruti_score || 0) - (a.uruti_score || 0)).map((venture, index) => {
                    const isBookmarked = bookmarkedVentures.has(venture.id);
                    return (
                      <TableRow key={venture.id} className="hover:bg-[#76B947]/5 cursor-pointer" onClick={() => handleViewVenture(venture)}>
                        <TableCell>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-[#76B947]/20 text-[#76B947]' : index === 1 ? 'bg-blue-100 text-blue-600' : index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-black/5 dark:bg-white/10'
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
                              <p className="font-medium dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>{venture.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1" style={{ fontFamily: 'var(--font-body)' }}>
                                {venture.description || venture.tagline || 'No description'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className={`text-xl font-bold ${
                              (venture.uruti_score || 0) >= 85 ? 'text-[#76B947]' : (venture.uruti_score || 0) >= 70 ? 'text-blue-600' : 'text-orange-600'
                            }`} style={{ fontFamily: 'var(--font-heading)' }}>
                              {venture.uruti_score || 'N/A'}
                            </div>
                            <Progress value={venture.uruti_score || 0} className="h-1.5 w-16" />
                          </div>
                        </TableCell>
                        <TableCell>
                          {venture.stage ? (
                            <Badge className={`text-xs ${getStageColor(venture.stage)}`}>
                              {venture.stage}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {venture.industry ? (
                            <Badge variant="outline" className="text-xs bg-black/5 dark:bg-white/5">
                              {venture.industry}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-[#76B947]/10"
                              onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleViewVenture(venture); }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`hover:bg-[#76B947]/10 ${isBookmarked ? 'text-[#76B947]' : ''}`}
                              onClick={(e: React.MouseEvent) => toggleBookmark(venture.id, e)}
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
        /* Startup Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVentures.map((venture) => (
            <Card 
              key={venture.id}
              className="glass-card border-black/5 dark:border-white/10 hover:border-[#76B947]/30 transition-all cursor-pointer group"
              onClick={() => handleViewVenture(venture)}
            >
              <CardContent className="p-0">
                {/* Venture Image/Thumbnail */}
                <div className="relative h-48 bg-gradient-to-br from-[#76B947]/20 to-black/5 dark:from-[#76B947]/10 dark:to-white/5 overflow-hidden">
                  {venture.logo_url ? (
                    <div className="w-full h-full p-4 flex items-center justify-center bg-white/70 dark:bg-slate-900/70">
                      <img 
                        src={venture.logo_url} 
                        alt={venture.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Rocket className="h-16 w-16 text-[#76B947] opacity-50" />
                    </div>
                  )}
                  
                  {/* Bookmark Button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`absolute top-2 right-2 ${
                      bookmarkedVentures.has(venture.id)
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        : 'bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm'
                    }`}
                    onClick={(e) => toggleBookmark(venture.id, e)}
                  >
                    <Bookmark className={`h-4 w-4 ${bookmarkedVentures.has(venture.id) ? 'fill-current' : ''}`} />
                  </Button>

                  {/* Uruti Score Badge */}
                  {venture.uruti_score && (
                    <Badge className="absolute bottom-2 left-2 bg-[#76B947] text-white">
                      <Award className="h-3 w-3 mr-1" />
                      Uruti Score: {venture.uruti_score}%
                    </Badge>
                  )}
                </div>

                {/* Venture Info */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold dark:text-white mb-1 line-clamp-1" style={{ fontFamily: 'var(--font-heading)' }}>
                        {venture.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3" style={{ fontFamily: 'var(--font-body)' }}>
                        {venture.description || venture.tagline || 'No description available'}
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {venture.industry && (
                      <Badge variant="outline" className="text-xs">
                        {venture.industry}
                      </Badge>
                    )}
                    {venture.stage && (
                      <Badge className={`text-xs ${getStageColor(venture.stage)}`}>
                        {venture.stage}
                      </Badge>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    {venture.location && (
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {venture.location}
                      </div>
                    )}
                    {venture.team_size && (
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {venture.team_size} members
                      </div>
                    )}
                  </div>

                  {/* Funding Info */}
                  {venture.funding_raised && (
                    <div className="flex items-center text-sm mb-4">
                      <DollarSign className="h-4 w-4 mr-1 text-[#76B947]" />
                      <span className="font-semibold text-[#76B947]">{venture.funding_raised}</span>
                      <span className="text-muted-foreground ml-1">raised</span>
                    </div>
                  )}

                  {/* View Button */}
                  <Button 
                    className="w-full bg-black text-white hover:bg-black/90 group-hover:bg-[#76B947] group-hover:text-white transition-all"
                    size="sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )
      )}
    </div>
  );
}
