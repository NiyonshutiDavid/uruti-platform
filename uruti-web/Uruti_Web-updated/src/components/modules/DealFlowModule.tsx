import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { VentureDetailView } from '../VentureDetailView';
import { 
  Search, 
  TrendingUp, 
  Users, 
  DollarSign,
  MapPin,
  Award,
  Eye,
  Bookmark,
  Sparkles,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { toast } from 'sonner';

export function DealFlowModule() {
  const [ventures, setVentures] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [selectedVenture, setSelectedVenture] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load bookmarked ventures from backend
  useEffect(() => {
    loadBookmarkedVentures();
  }, []);

  const loadBookmarkedVentures = async () => {
    setIsLoading(true);
    try {
      const bookmarks = await apiClient.getBookmarkedVentures();
      console.log('Deal Flow - Bookmarked ventures fetched:', bookmarks);
      setVentures(bookmarks);
    } catch (error) {
      console.error('Error loading bookmarked ventures:', error);
      toast.error('Failed to load bookmarked startups');
      setVentures([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewVenture = (venture: any) => {
    setSelectedVenture(venture);
  };

  const handleBackToList = () => {
    setSelectedVenture(null);
  };

  const handleAnalyzeWithAI = (venture: any, e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to AI chat with full venture context
    const event = new CustomEvent('open-ai-analysis', {
      detail: { venture }
    });
    window.dispatchEvent(event);
  };

  const toggleBookmark = (ventureId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVentures(ventures.map(v => 
      v.id === ventureId ? { ...v, bookmarked: !v.bookmarked } : v
    ));
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'MVP':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'Pre-Seed':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Seed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'Growth':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const filteredVentures = ventures.filter(venture => {
    const matchesSearch = venture.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venture.tagline.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = filterSector === 'all' || venture.sector === filterSector;
    const matchesStage = filterStage === 'all' || venture.stage === filterStage;
    return matchesSearch && matchesSector && matchesStage && venture.bookmarked;
  });

  // If a venture is selected, show the detail view
  if (selectedVenture) {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          onClick={handleBackToList}
          variant="outline"
          className="hover:bg-[#76B947]/10 hover:border-[#76B947]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Deal Flow
        </Button>

        {/* Venture Detail View */}
        <VentureDetailView venture={selectedVenture} isPublic={false} />
      </div>
    );
  }

  // Otherwise show the grid list view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-2xl p-8 border border-black/5 dark:border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              My Deal Flow 📊
            </h1>
            <p className="text-lg text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Startups you're interested in tracking
            </p>
          </div>
          <div className="glass-button p-6 rounded-2xl">
            <Bookmark className="h-12 w-12 text-[#76B947]" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Bookmarked Startups
                </p>
                <p className="text-3xl mt-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  {ventures.filter(v => v.bookmarked).length}
                </p>
              </div>
              <Bookmark className="h-8 w-8 text-[#76B947]" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Avg Uruti Score
                </p>
                <p className="text-3xl mt-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  {Math.round(ventures.reduce((acc, v) => acc + v.urutiScore, 0) / ventures.length)}
                </p>
              </div>
              <Award className="h-8 w-8 text-[#76B947]" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Total Users
                </p>
                <p className="text-3xl mt-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  {(ventures.reduce((acc, v) => acc + v.activeUsers, 0) / 1000).toFixed(0)}K
                </p>
              </div>
              <Users className="h-8 w-8 text-[#76B947]" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Total Funding
                </p>
                <p className="text-3xl mt-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  $900K
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-[#76B947]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card border-black/5 dark:border-white/10">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search bookmarked startups..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterSector} onValueChange={setFilterSector}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Sectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                <SelectItem value="AgTech">AgTech</SelectItem>
                <SelectItem value="FinTech">FinTech</SelectItem>
                <SelectItem value="HealthTech">HealthTech</SelectItem>
                <SelectItem value="EdTech">EdTech</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="MVP">MVP</SelectItem>
                <SelectItem value="Pre-Seed">Pre-Seed</SelectItem>
                <SelectItem value="Seed">Seed</SelectItem>
                <SelectItem value="Growth">Growth</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Ventures Grid */}
      {isLoading ? (
        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-[#76B947] mb-4" />
            <p className="text-muted-foreground">Loading bookmarked startups...</p>
          </CardContent>
        </Card>
      ) : filteredVentures.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVentures.map((venture) => (
            <Card 
              key={venture.id} 
              className="glass-card border-black/5 dark:border-white/10 hover:border-[#76B947]/50 transition-all hover:shadow-xl cursor-pointer overflow-hidden group"
            >
              {/* Thumbnail */}
              <div className="relative h-48 bg-gray-200 dark:bg-gray-800 overflow-hidden">
                {venture.thumbnailUrl || venture.thumbnail_url ? (
                  <img 
                    src={venture.thumbnailUrl || venture.thumbnail_url} 
                    alt={venture.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#76B947]/10">
                    <Award className="h-16 w-16 text-[#76B947] opacity-50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {venture.stage && (
                  <div className="absolute top-3 right-3">
                    <Badge className={getStageColor(venture.stage)}>
                      {venture.stage}
                    </Badge>
                  </div>
                )}
                {(venture.sector || venture.industry) && (
                  <div className="absolute bottom-3 left-3 right-3">
                    <Badge className="bg-[#76B947]/10 backdrop-blur-sm text-white border-[#76B947]/30">
                      {venture.sector || venture.industry}
                    </Badge>
                  </div>
                )}
              </div>

              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-bold mb-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                      {venture.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2" style={{ fontFamily: 'var(--font-body)' }}>
                      {venture.tagline || venture.description || 'No description available'}
                    </p>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-2 py-3 border-y border-black/5 dark:border-white/10">
                    <div>
                      <p className="text-xs text-muted-foreground">Uruti Score</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Award className="h-4 w-4 text-[#76B947]" />
                        <span className="font-bold dark:text-white">
                          {venture.urutiScore || venture.uruti_score || 'N/A'}/100
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Active Users</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Users className="h-4 w-4 text-[#76B947]" />
                        <span className="font-bold dark:text-white">
                          {venture.activeUsers ? venture.activeUsers.toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Location & Team */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{venture.location || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{venture.teamSize || venture.team_size || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1 bg-[#76B947] hover:bg-[#5a8f35] text-white"
                      size="sm"
                      onClick={() => handleViewVenture(venture)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const confirmed = window.confirm('Remove this startup from deal flow bookmarks?');
                        if (!confirmed) return;

                        try {
                          await apiClient.removeBookmark(venture.id);
                          toast.success('Removed from bookmarks');
                          loadBookmarkedVentures();
                        } catch (error) {
                          console.error('Error removing bookmark:', error);
                          toast.error('Failed to remove bookmark');
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="bg-[#76B947]/10 border-[#76B947] text-[#76B947] hover:bg-[#76B947]/20 transition-all"
                      title="Remove from Deal Flow"
                    >
                      <Bookmark className="h-4 w-4 fill-[#76B947]" />
                    </Button>
                  </div>
                  
                  {/* Analyze Button */}
                  <Button
                    onClick={(e) => handleAnalyzeWithAI(venture, e)}
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 border-purple-200 dark:border-purple-500/20 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-400 dark:hover:border-purple-500 text-purple-600 dark:text-purple-400"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze with AI
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bookmark className="h-20 w-20 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-xl font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              No bookmarked startups yet
            </h3>
            <p className="text-muted-foreground text-center mb-6" style={{ fontFamily: 'var(--font-body)' }}>
              Visit Startup Discovery to bookmark interesting opportunities
            </p>
            <Button className="bg-[#76B947] hover:bg-[#5a8f35] text-white">
              Explore Startups
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}