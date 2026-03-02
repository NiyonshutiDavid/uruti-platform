import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
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
  Loader2
} from 'lucide-react';
import { VentureDetailView } from '../VentureDetailView';
import { apiClient } from '../../lib/api-client';
import { toast } from 'sonner';

export function StartupDiscoveryModule() {
  const [ventures, setVentures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [selectedVenture, setSelectedVenture] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [bookmarkedVentures, setBookmarkedVentures] = useState<Set<number>>(new Set());

  // Load ventures from backend
  useEffect(() => {
    loadVentures();
    loadBookmarks();
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

  const handleViewVenture = (venture: any) => {
    setSelectedVenture(venture);
  };

  const handleBackToList = () => {
    setSelectedVenture(null);
  };

  const toggleBookmark = async (ventureId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    try {
      if (bookmarkedVentures.has(ventureId)) {
        const confirmed = window.confirm('Remove this startup from your bookmarks?');
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
          onClose={handleBackToList}
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
          <Badge className="bg-[#76B947]/20 text-[#76B947] border-[#76B947]/30">
            <Sparkles className="mr-1 h-3 w-3" />
            {filteredVentures.length} Startups Available
          </Badge>
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
      )}
    </div>
  );
}
