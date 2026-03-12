import { useEffect, useState } from 'react';
import { useConfirmDialog } from '../ui/confirm-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Plus, Search, Filter, TrendingUp, Edit, Eye, Trash2, Sparkles, Award, X, ArrowLeft, Lightbulb } from 'lucide-react';
import { Progress } from '../ui/progress';
import { EnhancedCaptureIdeaDialog } from '../EnhancedCaptureIdeaDialog';
import { VentureDetailView } from '../VentureDetailView';
import { EditVentureDialog } from '../EditVentureDialog';
import { apiClient } from '../../lib/api-client';
import { formatLocalDate } from '../../lib/datetime';
import { toast } from 'sonner';

interface Startup {
  id: string;
  name: string;
  logoUrl?: string;
  bannerUrl?: string;
  sector: string;
  problemStatement: string;
  solutionHypothesis: string;
  targetMarket: string;
  readinessScore: number;
  developmentTrack: string;
  createdDate: string;
  status: 'idea' | 'validation' | 'development' | 'ready';
  urutiScore?: number;
}

export function StartupHubModule({ onOpenAIChat }: { onOpenAIChat?: (context: { name: string; description: string }) => void }) {
  const { confirm } = useConfirmDialog();
  const [startups, setStartups] = useState<Startup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showScoreToast, setShowScoreToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewingStartup, setViewingStartup] = useState<any | null>(null);
  const [isCreatingVenture, setIsCreatingVenture] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDeletingStartupId, setIsDeletingStartupId] = useState<string | null>(null);

  const mapIndustryToEnum = (sector: string | undefined) => {
    const normalized = (sector || '').trim().toLowerCase();

    if (normalized.includes('fin')) return 'fintech';
    if (normalized.includes('agri')) return 'agriculture';
    if (normalized.includes('health') || normalized.includes('med')) return 'healthcare';
    if (normalized.includes('edu')) return 'education';
    if (normalized.includes('manufact')) return 'manufacturing';
    if (normalized.includes('retail') || normalized.includes('commerce')) return 'retail';
    if (normalized.includes('service') || normalized.includes('consult')) return 'services';
    if (normalized.includes('tech') || normalized.includes('software') || normalized.includes('ai')) return 'technology';
    return 'other';
  };

  const mapVentureToStartup = (venture: any): Startup => ({
    id: String(venture.id),
    name: venture.name,
    logoUrl: venture.logo_url || '',
    bannerUrl: venture.banner_url || '',
    sector: venture.industry || 'other',
    problemStatement: venture.problem_statement || '',
    solutionHypothesis: venture.solution || '',
    targetMarket: venture.target_market || '',
    readinessScore: venture.uruti_score || 0,
    developmentTrack: venture.stage || 'foundation',
    createdDate: venture.created_at || new Date().toISOString(),
    status:
      venture.stage === 'validation'
        ? 'validation'
        : venture.stage === 'mvp' || venture.stage === 'early_traction' || venture.stage === 'growth'
          ? 'development'
          : venture.stage === 'scale'
            ? 'ready'
            : 'idea',
    urutiScore: venture.uruti_score || 0,
  });

  useEffect(() => {
    const loadVentures = async () => {
      try {
        const ventures = await apiClient.getMyVentures();
        setStartups((ventures || []).map(mapVentureToStartup));
      } catch (error) {
        console.error('Failed to load ventures:', error);
      }
    };

    loadVentures();
  }, []);

  useEffect(() => {
    const handleVentureVideoUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ ventureId?: number; videoUrl?: string }>).detail;
      const ventureId = Number(detail?.ventureId);
      const videoUrl = detail?.videoUrl;
      if (!ventureId || !videoUrl) return;

      setViewingStartup((prev: any) => {
        if (!prev || Number(prev.id) !== ventureId) return prev;
        return { ...prev, pitchVideoUrl: videoUrl };
      });
    };

    window.addEventListener('venture-video-updated', handleVentureVideoUpdated as EventListener);
    return () => {
      window.removeEventListener('venture-video-updated', handleVentureVideoUpdated as EventListener);
    };
  }, []);

  const handleViewUrutiScore = (startup: Startup) => {
    setSelectedStartup(startup);
    setToastMessage(`${startup.name} - Uruti Score: ${startup.urutiScore}/100 (Ranked #${5 - Math.floor((startup.urutiScore || 0) / 20)} publicly)`);
    setShowScoreToast(true);
  };

  const handleAnalyzeAgain = async () => {
    if (!selectedStartup) return;

    setIsAnalyzing(true);
    try {
      const analyzed = await apiClient.analyzeVenture(Number(selectedStartup.id));
      const mapped = mapVentureToStartup(analyzed);

      setStartups((prev) => prev.map((s) => (s.id === mapped.id ? mapped : s)));
      setSelectedStartup(mapped);
      setToastMessage(
        `${mapped.name} - Updated Uruti Score: ${mapped.urutiScore}/100 (Re-analyzed on ${formatLocalDate(new Date())})`,
      );
      toast.success('Venture analyzed with MLP model.');
    } catch (error: any) {
      console.error('Failed to analyze venture:', error);
      toast.error(error?.message || 'Failed to analyze venture. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleViewDetails = async (startup: Startup) => {
    try {
      // Fetch full venture details from backend
      const venture = await apiClient.getVentureById(Number(startup.id));

      // Map snake_case API response to camelCase for VentureDetailView
      const ventureData = {
        id: String(venture.id),
        name: venture.name || startup.name,
        sector: venture.industry || startup.sector,
        tagline: venture.tagline || '',
        problem: venture.problem_statement || startup.problemStatement || '',
        solution: venture.solution || startup.solutionHypothesis || '',
        targetMarket: venture.target_market || startup.targetMarket || '',
        urutiScore: venture.uruti_score || 0,
        activeUsers: venture.customers || 0,
        monthlyGrowth: venture.mrr ? Math.round((venture.mrr / Math.max(venture.monthly_burn_rate || 1, 1)) * 100) : 0,
        highlights: venture.highlights || [],
        teamBackground: venture.team_background || '',
        competitiveEdge: venture.competitive_edge || '',
        fundingPlans: venture.funding_plans || '',
        milestones: venture.milestones || [],
        activities: venture.activities || [],
        pitchDeckUrl: venture.pitch_deck_url || '',
        pitchVideoUrl: venture.demo_video_url || '',
        thumbnailUrl: venture.banner_url || '',
        fundingGoal: venture.funding_goal || 0,
        fundingRaised: venture.funding_raised || 0,
        teamSize: venture.team_size || 1,
        stage: venture.stage || '',
        founderId: venture.founder_id || 0,
      };

      setViewingStartup(ventureData);
    } catch (error) {
      console.error('Failed to load venture details:', error);
      toast.error('Failed to load venture details');
    }
  };

  const handleEditVenture = (startup: Startup) => {
    setSelectedStartup(startup);
    setIsEditDialogOpen(true);
  };

  const handleDeleteStartup = async (startup: Startup) => {
    const confirmed = await confirm({
      title: 'Delete Startup',
      description: `Delete "${startup.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      setIsDeletingStartupId(startup.id);
      await apiClient.deleteVenture(Number(startup.id));

      setStartups((prev) => prev.filter((item) => item.id !== startup.id));
      if (selectedStartup?.id === startup.id) {
        setSelectedStartup(null);
      }
      if (viewingStartup?.id === startup.id) {
        setViewingStartup(null);
      }

      toast.success(`Deleted ${startup.name}`);
    } catch (error: any) {
      console.error('Failed to delete startup:', error);
      toast.error(error?.message || 'Failed to delete startup. Please try again.');
    } finally {
      setIsDeletingStartupId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      idea: { label: 'Idea', className: 'bg-gray-100 text-gray-800' },
      validation: { label: 'Validation', className: 'bg-blue-100 text-blue-800' },
      development: { label: 'Development', className: 'bg-yellow-100 text-yellow-800' },
      ready: { label: 'Investment Ready', className: 'bg-[#76B947]/20 text-[#76B947]' }
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'text-[#76B947]';
    if (score >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const filteredStartups = startups.filter(startup => {
    const matchesSearch = startup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         startup.sector.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = filterSector === 'all' || startup.sector === filterSector;
    return matchesSearch && matchesSector;
  });

  // If viewing a startup in full-page mode, show VentureDetailView
  if (viewingStartup) {
    return (
      <div className="space-y-6">
        <Button
          onClick={() => setViewingStartup(null)}
          variant="outline"
          className="border-black/10 dark:border-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Startup Hub
        </Button>
        <VentureDetailView
          venture={viewingStartup}
          isOwner={true}
          onEdit={() => {
            // Convert viewing startup back to Startup format for edit
            const startupForEdit = startups.find(s => s.id === viewingStartup.id);
            if (startupForEdit) {
              handleEditVenture(startupForEdit);
            }
          }}
          onAddActivity={async (activity) => {
            // Persist activity to backend
            const updatedActivities = [activity, ...(viewingStartup.activities || [])];
            try {
              await apiClient.updateVenture(Number(viewingStartup.id), {
                activities: updatedActivities,
              });
              setViewingStartup({
                ...viewingStartup,
                activities: updatedActivities,
              });
            } catch (error) {
              console.error('Failed to save activity:', error);
              toast.error('Failed to save activity update');
            }
          }}
          onDeleteActivity={async (activityId) => {
            // Remove activity and persist to backend
            const updatedActivities = (viewingStartup.activities || []).filter(
              (a: any) => a.id !== activityId
            );
            try {
              await apiClient.updateVenture(Number(viewingStartup.id), {
                activities: updatedActivities,
              });
              setViewingStartup({
                ...viewingStartup,
                activities: updatedActivities,
              });
            } catch (error) {
              console.error('Failed to delete activity:', error);
              toast.error('Failed to delete activity');
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Startup Hub</h1>
          <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
            Manage your portfolio of startup ventures
          </p>
        </div>
        <Button 
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-[#76B947] hover:bg-[#5a8f35] text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Venture
        </Button>
      </div>

      {/* Enhanced Capture Idea Dialog */}
      <EnhancedCaptureIdeaDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSave={async (ventureData) => {
          setIsCreatingVenture(true);
          try {
            // Map frontend fields to backend schema
            const venturePayload = {
              name: ventureData.name,
              tagline: ventureData.tagline,
              logo_url: ventureData.iconLogoUrl || undefined,
              banner_url: ventureData.landscapeLogoUrl || undefined,
              industry: mapIndustryToEnum(ventureData.sector),
              problem_statement: ventureData.problem,
              solution: ventureData.solution,
              target_market: ventureData.targetMarket,
              business_model: ventureData.competitiveEdge,
              stage: 'ideation', // Default to ideation stage
            };

            let newVenture = await apiClient.createVenture(venturePayload);

            if (ventureData.iconLogoFile instanceof File) {
              newVenture = await apiClient.uploadVentureLogo(Number(newVenture.id), ventureData.iconLogoFile);
            }

            if (ventureData.landscapeLogoFile instanceof File) {
              newVenture = await apiClient.uploadVentureBanner(Number(newVenture.id), ventureData.landscapeLogoFile);
            }

            setStartups((prev) => [mapVentureToStartup(newVenture), ...prev]);
            setIsAddDialogOpen(false);
            toast.success('Venture created successfully!');
          } catch (error: any) {
            console.error('Failed to create venture:', error);
            toast.error(error.message || 'Failed to create venture. Please try again.');
          } finally {
            setIsCreatingVenture(false);
          }
        }}
      />

      {/* Uruti Score Toast Notification */}
      {showScoreToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <Card className="glass-card border-[#76B947] shadow-2xl max-w-md">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#76B947] to-[#5a8f35] flex items-center justify-center flex-shrink-0">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-black dark:text-white mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                    Uruti Score
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3" style={{ fontFamily: 'var(--font-body)' }}>
                    {toastMessage}
                  </p>
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge className="bg-[#76B947]/20 text-[#76B947]">
                      MLP Verified
                    </Badge>
                    <Badge variant="outline" className="border-[#76B947] text-[#76B947]">
                      Public Ranking
                    </Badge>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => void handleAnalyzeAgain()}
                    disabled={isAnalyzing}
                    className="bg-[#76B947] hover:bg-[#5a8f35] text-white w-full"
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    {isAnalyzing ? 'Analyzing…' : 'Analyze Again'}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowScoreToast(false)}
                  className="hover:bg-[#76B947]/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-black/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Total Ventures</p>
                <p className="text-3xl mt-1" style={{ fontFamily: 'var(--font-heading)' }}>{startups.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-[#76B947]" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-black/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Investment Ready</p>
                <p className="text-3xl mt-1" style={{ fontFamily: 'var(--font-heading)' }}>
                  {startups.filter(s => s.status === 'ready').length}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-[#76B947]/20 flex items-center justify-center">
                <span className="text-[#76B947]">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-black/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Avg Readiness</p>
                <p className="text-3xl mt-1" style={{ fontFamily: 'var(--font-heading)' }}>
                  {Math.round(startups.reduce((acc, s) => acc + s.readinessScore, 0) / startups.length)}%
                </p>
              </div>
              <Progress value={79} className="w-12 h-12" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-black/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Avg Uruti Score</p>
                <p className="text-3xl mt-1" style={{ fontFamily: 'var(--font-heading)' }}>
                  {startups.length > 0
                    ? Math.round(startups.reduce((sum, s) => sum + (s.urutiScore || 0), 0) / startups.length)
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search */}
      <Card className="glass-card border-black/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search ventures by name or sector..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterSector} onValueChange={setFilterSector}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                <SelectItem value="AgTech">AgTech</SelectItem>
                <SelectItem value="EdTech">EdTech</SelectItem>
                <SelectItem value="HealthTech">HealthTech</SelectItem>
                <SelectItem value="FinTech">FinTech</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Startups Table */}
      <Card className="glass-card border-black/5">
        <CardHeader>
          <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Your Startup Ventures</CardTitle>
          <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
            {filteredStartups.length} venture{filteredStartups.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStartups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-[#76B947]/10 flex items-center justify-center mb-6">
                <Lightbulb className="h-10 w-10 text-[#76B947]" />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                No Startups Yet
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md" style={{ fontFamily: 'var(--font-body)' }}>
                Start your entrepreneurial journey by capturing your first startup idea. The Uruti ecosystem is here to guide you from ideation to investment readiness.
              </p>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-[#76B947] hover:bg-[#5a8f35] text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Venture
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ fontFamily: 'var(--font-heading)' }}>Venture Name</TableHead>
                  <TableHead style={{ fontFamily: 'var(--font-heading)' }}>Sector</TableHead>
                  <TableHead style={{ fontFamily: 'var(--font-heading)' }}>Status</TableHead>
                  <TableHead style={{ fontFamily: 'var(--font-heading)' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStartups.map((startup) => (
                  <TableRow key={startup.id} className="hover:bg-[#76B947]/5">
                    <TableCell>
                      <div>
                        <p className="font-medium" style={{ fontFamily: 'var(--font-heading)' }}>{startup.name}</p>
                        <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                          Created {formatLocalDate(startup.createdDate)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-black/5">{startup.sector}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(startup.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center flex-wrap gap-2">
                        {onOpenAIChat && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => onOpenAIChat({ 
                              name: startup.name, 
                              description: startup.solutionHypothesis 
                            })}
                            className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white"
                          >
                            <Sparkles className="h-4 w-4 mr-1" />
                            Refine with AI
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewUrutiScore(startup)}
                          className="bg-[#76B947] hover:bg-[#5a8f35] text-white"
                        >
                          <Award className="h-4 w-4 mr-1" />
                          Uruti Score: {startup.urutiScore}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hover:bg-[#76B947]/10"
                          onClick={() => handleViewDetails(startup)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hover:bg-[#76B947]/10"
                          onClick={() => handleEditVenture(startup)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-destructive/10 text-destructive"
                          disabled={isDeletingStartupId === startup.id}
                          onClick={() => handleDeleteStartup(startup)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl glass-card">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)' }}>Venture Details</DialogTitle>
            <DialogDescription style={{ fontFamily: 'var(--font-body)' }}>
              View detailed information about the selected venture
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedStartup && (
              <>
                <div>
                  <Label>Venture Name</Label>
                  <Input placeholder="e.g., AgriConnect" className="mt-1" value={selectedStartup.name} readOnly />
                </div>
                <div>
                  <Label>Industry Sector</Label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select sector" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agtech">AgTech</SelectItem>
                      <SelectItem value="edtech">EdTech</SelectItem>
                      <SelectItem value="healthtech">HealthTech</SelectItem>
                      <SelectItem value="fintech">FinTech</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Problem Statement</Label>
                  <Textarea 
                    placeholder="What problem are you solving?" 
                    className="mt-1"
                    rows={3}
                    value={selectedStartup.problemStatement}
                    readOnly
                  />
                </div>
                <div>
                  <Label>Solution Hypothesis</Label>
                  <Textarea 
                    placeholder="How will you solve this problem?" 
                    className="mt-1"
                    rows={3}
                    value={selectedStartup.solutionHypothesis}
                    readOnly
                  />
                </div>
                <div>
                  <Label>Target Rwandan Market</Label>
                  <Textarea 
                    placeholder="Describe your target market in Rwanda" 
                    className="mt-1"
                    rows={2}
                    value={selectedStartup.targetMarket}
                    readOnly
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Venture Dialog */}
      {selectedStartup && (
        <EditVentureDialog 
          open={isEditDialogOpen} 
          onOpenChange={setIsEditDialogOpen}
          venture={selectedStartup}
          onSave={async (updatedVenture) => {
            try {
              const payload = {
                name: updatedVenture.name,
                tagline: updatedVenture.tagline || undefined,
                logo_url: updatedVenture.iconLogoUrl || undefined,
                banner_url: updatedVenture.landscapeLogoUrl || undefined,
                industry: mapIndustryToEnum(updatedVenture.sector),
                stage: updatedVenture.stage || undefined,
                problem_statement: updatedVenture.problem || undefined,
                solution: updatedVenture.solution || undefined,
                target_market: updatedVenture.targetMarket || undefined,
                business_model: updatedVenture.competitiveEdge || undefined,
                demo_video_url: updatedVenture.pitchVideoUrl?.trim()
                  ? updatedVenture.pitchVideoUrl.trim()
                  : null,
              };

              const ventureId = Number(updatedVenture.id);
              let savedVenture = await apiClient.updateVenture(ventureId, payload);

              if (updatedVenture.iconLogoFile instanceof File) {
                savedVenture = await apiClient.uploadVentureLogo(ventureId, updatedVenture.iconLogoFile);
              }

              if (updatedVenture.landscapeLogoFile instanceof File) {
                savedVenture = await apiClient.uploadVentureBanner(ventureId, updatedVenture.landscapeLogoFile);
              }

              const mapped = mapVentureToStartup(savedVenture);
              setStartups(prev => prev.map(s => s.id === mapped.id ? mapped : s));
              toast.success('Venture updated successfully');
            } catch (error: any) {
              console.error('Failed to update venture:', error);
              toast.error(error?.message || 'Failed to update venture');
            }
          }}
        />
      )}
    </div>
  );
}