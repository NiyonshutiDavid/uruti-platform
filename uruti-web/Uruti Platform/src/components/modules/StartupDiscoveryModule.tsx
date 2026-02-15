import { useState } from 'react';
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
  ArrowLeft
} from 'lucide-react';
import { VentureDetailView } from '../VentureDetailView';

// Mock startup/venture data
const mockVentures = [
  {
    id: '1',
    name: 'AgriConnect Rwanda',
    tagline: 'Connecting farmers to modern agriculture technology',
    sector: 'AgriTech',
    stage: 'Pre-Seed',
    thumbnailUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&h=400&fit=crop',
    pitchVideoUrl: '#',
    highlights: [
      '12,000+ active farmers',
      '45% monthly growth',
      '$250K funding raised',
      'Rwanda Innovation Award Winner'
    ],
    problem: 'Small-scale farmers in Rwanda lack access to modern equipment, technical support, and direct market connections. This results in low yields, post-harvest losses of up to 40%, and poor income stability for farming families across the country.',
    solution: 'AgriConnect is an AI-powered platform that connects farmers directly with equipment rental services, agronomists for technical support, and buyers for their produce. Our mobile-first approach works offline and provides real-time market prices, weather forecasts, and farming best practices.',
    competitiveEdge: 'Unlike competitors, we focus exclusively on Rwanda\'s unique agricultural ecosystem with local language support (Kinyarwanda), offline-first technology, and partnerships with all major agricultural cooperatives. Our AI is trained on Rwandan soil and climate data.',
    teamBackground: 'Founded by Jean Paul Uwimana (former Product Manager at TechHub Rwanda) and Marie Mukeshimana (Agricultural Engineer with 10+ years at Rwanda Agriculture Board). Team of 12 including 3 agricultural experts and 4 software engineers.',
    targetMarket: 'Primary: Small-scale farmers in Eastern and Southern Rwanda (50,000+ farmers). Secondary: Agricultural cooperatives and equipment suppliers. Total addressable market: 2M+ smallholder farmers across Rwanda.',
    fundingPlans: 'Seeking $500K seed funding for: 40% product development and AI enhancement, 30% farmer onboarding and training, 20% market expansion to Northern Province, 10% operations and team expansion.',
    urutiScore: 78,
    activeUsers: 12000,
    monthlyGrowth: 45,
    fundingRaised: '$250K',
    location: 'Kigali, Rwanda',
    teamSize: '12 members',
    milestones: [
      {
        title: 'MVP Launch',
        description: 'Launched beta with 500 farmers in Eastern Province, validated core features',
        status: 'completed' as const,
        imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=300&fit=crop'
      },
      {
        title: 'Scale to 10K+ Users',
        description: 'Growing farmer base and expanding to Southern Province with cooperative partnerships',
        status: 'in-progress' as const,
        imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&h=300&fit=crop'
      },
      {
        title: 'Regional Expansion',
        description: 'Launch in Northern Province and begin pilot in neighboring countries',
        status: 'planned' as const,
        imageUrl: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&h=300&fit=crop'
      }
    ]
  },
  {
    id: '2',
    name: 'HealthBridge',
    tagline: 'Blockchain-based health records for Rwanda',
    sector: 'HealthTech',
    stage: 'Seed',
    thumbnailUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop',
    highlights: [
      '15 hospitals integrated',
      'HIPAA compliant',
      '$500K ARR',
      '92% NPS score'
    ],
    problem: 'Healthcare information silos across Rwanda prevent effective patient care coordination. Medical records are fragmented, paper-based in rural areas, and difficult to access during emergencies.',
    solution: 'A blockchain-based health records sharing system that enables secure, instant access to patient data across all healthcare providers in Rwanda.',
    competitiveEdge: 'First mover in Rwanda with government partnership, blockchain ensures data integrity, works offline with sync capabilities.',
    teamBackground: 'Led by Dr. Claude Nzeyimana (former CTO at Rwanda eHealth) and a team of 8 healthcare IT specialists.',
    targetMarket: 'All hospitals, clinics, and health centers in Rwanda. Starting with Kigali network of 50+ facilities.',
    fundingPlans: 'Seeking $1M for nationwide rollout, integration with national health insurance system, and mobile app development.',
    urutiScore: 85,
    activeUsers: 15000,
    monthlyGrowth: 32,
    fundingRaised: '$500K',
    location: 'Kigali, Rwanda',
    teamSize: '8 members',
    milestones: []
  },
  {
    id: '3',
    name: 'EduLearn Rwanda',
    tagline: 'Mobile-first STEM education for remote areas',
    sector: 'EdTech',
    stage: 'MVP',
    thumbnailUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop',
    highlights: [
      '5,000+ students',
      'Offline-first technology',
      '85% course completion',
      'Government partnership'
    ],
    problem: 'Limited access to quality STEM education in remote areas of Rwanda affects thousands of secondary school students.',
    solution: 'A mobile-first learning platform with offline capabilities, interactive lessons, and progress tracking for STEM subjects.',
    competitiveEdge: 'Content aligned with Rwanda Education Board curriculum, works 100% offline, gamification increases engagement.',
    teamBackground: 'Founded by former teachers and EdTech engineers with 15+ years combined experience.',
    targetMarket: 'Secondary school students in Eastern and Southern Provinces. Expanding to all rural areas.',
    fundingPlans: 'Seeking $300K for content creation, teacher training program, and hardware partnerships.',
    urutiScore: 72,
    activeUsers: 5000,
    monthlyGrowth: 28,
    fundingRaised: '$150K',
    location: 'Kigali, Rwanda',
    teamSize: '6 members',
    milestones: []
  },
  {
    id: '4',
    name: 'FinTrack',
    tagline: 'AI-powered bookkeeping for SMEs',
    sector: 'FinTech',
    stage: 'Growth',
    thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
    highlights: [
      '3,000+ SMEs served',
      '$2M ARR',
      'Break-even achieved',
      'Bank integrations live'
    ],
    problem: 'SMEs and microenterprises in Rwanda struggle with financial management and accessing credit due to poor bookkeeping.',
    solution: 'AI-powered bookkeeping and credit scoring platform that helps SMEs manage finances and access loans.',
    competitiveEdge: 'Deep integration with Rwandan banks, AI trained on local SME data, mobile-first interface in Kinyarwanda.',
    teamBackground: 'Founded by fintech veterans from major Rwandan banks with team of 15 engineers and financial experts.',
    targetMarket: '50,000+ SMEs in Kigali and major urban centers, expanding to rural cooperatives.',
    fundingPlans: 'Seeking $2M Series A for product expansion, sales team growth, and regional expansion.',
    urutiScore: 90,
    activeUsers: 3000,
    monthlyGrowth: 22,
    fundingRaised: '$1.2M',
    location: 'Kigali, Rwanda',
    teamSize: '15 members',
    milestones: []
  }
];

export function StartupDiscoveryModule() {
  const [ventures, setVentures] = useState(mockVentures);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [selectedVenture, setSelectedVenture] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredVentures = ventures.filter(venture => {
    const matchesSearch = venture.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venture.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venture.tagline.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = filterSector === 'all' || venture.sector === filterSector;
    const matchesStage = filterStage === 'all' || venture.stage === filterStage;
    return matchesSearch && matchesSector && matchesStage;
  });

  const handleViewVenture = (venture: any) => {
    setSelectedVenture(venture);
  };

  const handleBackToList = () => {
    setSelectedVenture(null);
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'MVP': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'Pre-Seed': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      'Seed': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'Growth': 'bg-[#76B947]/20 text-[#76B947]'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  };

  // If a venture is selected, show the detail view
  if (selectedVenture) {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          onClick={handleBackToList}
          variant="outline"
          className="mb-4 border-black/10 dark:border-white/10 hover:bg-[#76B947]/10 hover:border-[#76B947]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Startups
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Startup Discovery
          </h1>
          <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
            Explore investment-ready startups in Rwanda's ecosystem
          </p>
        </div>
      </div>

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
                  Avg Uruti Score
                </p>
                <p className="text-3xl mt-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  81/100
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
                  Investment Ready
                </p>
                <p className="text-3xl mt-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  {ventures.filter(v => v.urutiScore >= 75).length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-[#76B947]" />
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
                  $2.1M
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
                  placeholder="Search startups by name, sector, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 glass-card"
                />
              </div>
            </div>
            <Select value={filterSector} onValueChange={setFilterSector}>
              <SelectTrigger className="w-full md:w-48 glass-card">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Sectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                <SelectItem value="AgriTech">AgriTech</SelectItem>
                <SelectItem value="FinTech">FinTech</SelectItem>
                <SelectItem value="HealthTech">HealthTech</SelectItem>
                <SelectItem value="EdTech">EdTech</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger className="w-full md:w-48 glass-card">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVentures.map((venture) => (
          <Card 
            key={venture.id} 
            className="glass-card border-black/5 dark:border-white/10 hover:border-[#76B947]/50 transition-all hover:shadow-xl cursor-pointer overflow-hidden group"
          >
            {/* Thumbnail */}
            <div className="relative h-48 bg-gray-200 dark:bg-gray-800 overflow-hidden">
              <img 
                src={venture.thumbnailUrl} 
                alt={venture.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute top-3 right-3">
                <Badge className={getStageColor(venture.stage)}>
                  {venture.stage}
                </Badge>
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <Badge className="bg-[#76B947]/10 backdrop-blur-sm text-white border-[#76B947]/30">
                  {venture.sector}
                </Badge>
              </div>
            </div>

            <CardContent className="pt-4">
              <div className="space-y-3">
                <div>
                  <h3 className="text-xl font-bold mb-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    {venture.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2" style={{ fontFamily: 'var(--font-body)' }}>
                    {venture.tagline}
                  </p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-2 py-3 border-y border-black/5 dark:border-white/10">
                  <div>
                    <p className="text-xs text-muted-foreground">Uruti Score</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Award className="h-4 w-4 text-[#76B947]" />
                      <span className="font-bold dark:text-white">{venture.urutiScore}/100</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Active Users</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Users className="h-4 w-4 text-[#76B947]" />
                      <span className="font-bold dark:text-white">{venture.activeUsers.toLocaleString()}+</span>
                    </div>
                  </div>
                </div>

                {/* Location & Team */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{venture.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{venture.teamSize}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleViewVenture(venture)}
                    className="flex-1 bg-[#76B947] hover:bg-[#5a8f35] text-white"
                    size="sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:bg-[#76B947]/10 hover:border-[#76B947]"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredVentures.length === 0 && (
        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="py-12 text-center">
            <Rocket className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              No startups found
            </h3>
            <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Try adjusting your filters or search terms
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}