import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Plus, Search, Filter, TrendingUp, Edit, Eye, Trash2, Sparkles, Award, X, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { Progress } from '../ui/progress';
import { EnhancedCaptureIdeaDialog } from '../EnhancedCaptureIdeaDialog';
import { VentureDetailView } from '../VentureDetailView';
import { EditVentureDialog } from '../EditVentureDialog';
import apiClient from '../../services/api';
import { useEffect } from 'react';

interface Startup {
  id: string;
  name: string;
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
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showScoreToast, setShowScoreToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewingStartup, setViewingStartup] = useState<any | null>(null);

  // Load ventures from API
  useEffect(() => {
    const loadVentures = async () => {
      try {
        setLoading(true);
        setError(null);
        const ventures = await apiClient.getVentures();
        
        // Map ventures to Startup interface
        const mappedStartups: Startup[] = ventures.map((v: any) => ({
          id: v.id?.toString() || Math.random().toString(),
          name: v.title || 'Untitled Venture',
          sector: v.industry || 'Technology',
          problemStatement: v.problem_statement || 'No problem statement',
          solutionHypothesis: v.solution || 'Solution in development',
          targetMarket: v.target_market || 'Market to be defined',
          readinessScore: v.investment_score || 0,
          developmentTrack: v.stage || 'Ideation',
          createdDate: v.created_at || new Date().toISOString(),
          status: 'development' as const,
          urutiScore: v.pitch_score || 0
        }));
        
        setStartups(mappedStartups);
      } catch (err) {
        console.error('Error loading ventures:', err);
        setError('Failed to load ventures. Please try again.');
        // Fallback to empty array
        setStartups([]);
      } finally {
        setLoading(false);
      }
    };

    loadVentures();
  }, []);

  const handleViewUrutiScore = (startup: Startup) => {
    setSelectedStartup(startup);
    setToastMessage(`${startup.name} - Uruti Score: ${startup.urutiScore}/100 (Ranked #${5 - Math.floor((startup.urutiScore || 0) / 20)} publicly)`);
    setShowScoreToast(true);
  };

  const handleAnalyzeAgain = () => {
    if (selectedStartup) {
      // Simulate re-analysis with a slightly different score
      const newScore = Math.min(100, (selectedStartup.urutiScore || 0) + Math.floor(Math.random() * 5) - 2);
      setToastMessage(`${selectedStartup.name} - Updated Uruti Score: ${newScore}/100 (Re-analyzed on ${new Date().toLocaleDateString()})`);
      
      // Update the startup score
      setStartups(startups.map(s => 
        s.id === selectedStartup.id ? { ...s, urutiScore: newScore } : s
      ));
      setSelectedStartup({ ...selectedStartup, urutiScore: newScore });
    }
  };

  const handleViewDetails = (startup: Startup) => {
    // Convert startup to venture format for VentureDetailView
    const ventureData = {
      id: startup.id,
      name: startup.name,
      sector: startup.sector,
      tagline: startup.solutionHypothesis,
      problem: startup.problemStatement,
      solution: startup.solutionHypothesis,
      targetMarket: startup.targetMarket,
      urutiScore: startup.urutiScore || 0,
      activeUsers: 1250,
      monthlyGrowth: 15,
      highlights: [
        'AI-powered matching algorithm',
        'Growing user base of 1,250+ farmers',
        'Partnership with 3 major equipment providers',
        'Proven 15% monthly growth'
      ],
      teamBackground: 'Our team combines agricultural expertise with cutting-edge technology. Led by experienced professionals passionate about transforming farming in Rwanda.',
      competitiveEdge: 'First-to-market AI solution specifically designed for Rwandan farming communities with proven traction.',
      fundingPlans: 'Expand to new regions, develop mobile app features, and scale partnerships.',
      milestones: [
        {
          title: 'Platform Launch',
          description: 'Successfully launched MVP and onboarded first 100 farmers',
          status: 'completed' as const
        },
        {
          title: 'Market Validation',
          description: 'Achieved product-market fit with 1,250+ active users',
          status: 'completed' as const
        },
        {
          title: 'Scale & Growth',
          description: 'Expand to 3 additional provinces and reach 5,000 farmers',
          status: 'in-progress' as const
        }
      ],
      activities: [
        {
          id: '1',
          type: 'milestone' as const,
          title: 'Milestone Achieved',
          description: 'Reached 1,250 active farmers on our platform! This represents a 200% growth from our initial launch.',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          type: 'funding' as const,
          title: 'Funding Update',
          description: 'Completed seed funding round of $250K from local angel investors. Funds will be used for platform development and market expansion.',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };
    
    setViewingStartup(ventureData);
  };

  const handleEditVenture = (startup: Startup) => {
    setSelectedStartup(startup);
    setIsEditDialogOpen(true);
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
          onAddActivity={(activity) => {
            // Handle adding activity
            setViewingStartup({
              ...viewingStartup,
              activities: [activity, ...(viewingStartup.activities || [])]
            });
          }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#76B947]" />
          <p className="text-muted-foreground">Loading your ventures...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-3xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Startup Hub</div>
        <Card className="glass-card border-red-200 bg-red-50/50 dark:bg-red-900/10">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-600">{error}</p>
            </div>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-[#76B947] hover:bg-[#5a8f35]"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
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
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#76B947] hover:bg-[#5a8f35] text-white">
              <Plus className="mr-2 h-4 w-4" />
              Add New Venture
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl glass-card">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: 'var(--font-heading)' }}>Create New Startup Venture</DialogTitle>
              <DialogDescription style={{ fontFamily: 'var(--font-body)' }}>
                Capture your startup idea and begin the validation journey
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Venture Name</Label>
                <Input placeholder="e.g., AgriConnect" className="mt-1" />
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
                />
              </div>
              <div>
                <Label>Solution Hypothesis</Label>
                <Textarea 
                  placeholder="How will you solve this problem?" 
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <Label>Target Rwandan Market</Label>
                <Textarea 
                  placeholder="Describe your target market in Rwanda" 
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-black text-white hover:bg-black/90">
                  Create Venture
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
                    onClick={handleAnalyzeAgain}
                    className="bg-[#76B947] hover:bg-[#5a8f35] text-white w-full"
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    Analyze Again
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
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Active Tracks</p>
                <p className="text-3xl mt-1" style={{ fontFamily: 'var(--font-heading)' }}>
                  {new Set(startups.map(s => s.developmentTrack)).size}
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ fontFamily: 'var(--font-heading)' }}>Venture Name</TableHead>
                <TableHead style={{ fontFamily: 'var(--font-heading)' }}>Sector</TableHead>
                <TableHead style={{ fontFamily: 'var(--font-heading)' }}>Development Track</TableHead>
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
                        Created {new Date(startup.createdDate).toLocaleDateString()}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-black/5">{startup.sector}</Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>{startup.developmentTrack}</p>
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
                      <Button variant="ghost" size="sm" className="hover:bg-destructive/10 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
          onSave={(updatedVenture) => {
            setStartups(startups.map(s => 
              s.id === updatedVenture.id ? { ...s, ...updatedVenture } : s
            ));
          }}
        />
      )}
    </div>
  );
}