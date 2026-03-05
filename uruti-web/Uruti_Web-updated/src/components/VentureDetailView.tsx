import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { VentureActivitySection } from './VentureActivitySection';
import { 
  Play, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  Calendar,
  Target,
  Lightbulb,
  Rocket,
  Award,
  DollarSign,
  ArrowRight,
  ExternalLink,
  Edit,
  FileText,
  Download,
  Eye
} from 'lucide-react';

interface VentureDetailViewProps {
  venture: {
    id: string;
    name: string;
    sector: string;
    tagline?: string;
    pitchVideoUrl?: string;
    thumbnailUrl?: string;
    founderId?: number;
    pitchDeckUrl?: string;
    highlights?: string[];
    problem: string;
    solution: string;
    competitiveEdge?: string;
    teamBackground?: string;
    targetMarket?: string;
    fundingPlans?: string;
    urutiScore: number;
    activeUsers?: number;
    monthlyGrowth?: number;
    milestones?: Array<{
      title: string;
      description: string;
      status: 'completed' | 'in-progress' | 'planned';
      imageUrl?: string;
    }>;
    readinessMetrics?: {
      label: string;
      value: string;
      subtitle?: string;
    }[];
    activities?: Array<{
      id: string;
      type: 'milestone' | 'funding' | 'growth' | 'achievement' | 'update';
      title: string;
      description: string;
      date: string;
    }>;
  };
  isPublic?: boolean;
  isOwner?: boolean;
  onAddActivity?: (activity: any) => void;
  onDeleteActivity?: (activityId: string) => void;
  onViewFounder?: (founderId: number) => void;
  onEdit?: () => void;
}

export function VentureDetailView({ venture, isPublic = false, isOwner = false, onAddActivity, onDeleteActivity, onViewFounder, onEdit }: VentureDetailViewProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-[#76B947]" />;
      case 'in-progress':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Edit Button for Owner */}
      {isOwner && onEdit && (
        <div className="flex justify-end">
          <Button
            onClick={onEdit}
            className="bg-[#76B947] hover:bg-[#5a8f35] text-white"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Venture Details
          </Button>
        </div>
      )}

      {/* Header Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Venture Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              {venture.name}
            </h1>
            {venture.tagline && (
              <p className="text-lg text-muted-foreground mb-4" style={{ fontFamily: 'var(--font-body)' }}>
                {venture.tagline}
              </p>
            )}
            <Badge className="bg-[#76B947]/10 text-[#76B947] border border-[#76B947]/30">
              {venture.sector}
            </Badge>
          </div>

          {/* Key Highlights */}
          {venture.highlights && venture.highlights.length > 0 && (
            <Card className="glass-card border-black/5 dark:border-white/10">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-3">
                  {venture.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-[#76B947] flex-shrink-0 mt-0.5" />
                      <span className="text-sm dark:text-white" style={{ fontFamily: 'var(--font-body)' }}>
                        {highlight}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Pitch Video (from Pitch Coach) */}
        <Card className="glass-card border-black/5 dark:border-white/10 overflow-hidden">
          {venture.pitchVideoUrl ? (
            <>
              <div className="relative aspect-video bg-gray-900">
                {isPlaying ? (
                  <video
                    src={venture.pitchVideoUrl}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                  />
                ) : (
                  <>
                    {venture.thumbnailUrl ? (
                      <img 
                        src={venture.thumbnailUrl} 
                        alt="Pitch thumbnail" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-black to-gray-800">
                        <Rocket className="h-16 w-16 text-[#76B947]/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        size="lg"
                        className="rounded-full bg-white hover:bg-gray-100 text-black shadow-2xl"
                        onClick={() => setIsPlaying(true)}
                      >
                        <Play className="h-6 w-6 fill-current" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-[#76B947]" />
                  <span className="font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    Pitch Coach Recording
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2" style={{ fontFamily: 'var(--font-body)' }}>
                  Recorded video pitch from the Uruti Pitch Coach session
                </p>
              </CardContent>
            </>
          ) : (
            <div className="aspect-video flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900">
              <div className="rounded-full bg-gray-200 dark:bg-gray-700 p-6 mb-4">
                <Play className="h-10 w-10 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                Video Unavailable
              </p>
              <p className="text-sm text-muted-foreground px-6 text-center" style={{ fontFamily: 'var(--font-body)' }}>
                {isOwner
                  ? 'Record your pitch using the Pitch Coach to showcase it here'
                  : 'The founder hasn\'t recorded a pitch video yet'}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* About the Startup Section */}
      <Card className="glass-card border-black/5 dark:border-white/10">
        <CardHeader>
          <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>About the startup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* The Problem */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#76B947]" />
              <h3 className="font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                The problem
              </h3>
            </div>
            <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
              {venture.problem}
            </p>
          </div>

          {/* The Solution */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#76B947]" />
              <h3 className="font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                The solution
              </h3>
            </div>
            <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
              {venture.solution}
            </p>
          </div>

          {/* Competitive Edge */}
          {venture.competitiveEdge && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#76B947]" />
                <h3 className="font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  Competitive edge
                </h3>
              </div>
              <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
                {venture.competitiveEdge}
              </p>
            </div>
          )}

          {/* Team Background */}
          {venture.teamBackground && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#76B947]" />
                <h3 className="font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  Team background
                </h3>
              </div>
              <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
                {venture.teamBackground}
              </p>
            </div>
          )}

          {/* Target Market */}
          {venture.targetMarket && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#76B947]" />
                <h3 className="font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  Target market
                </h3>
              </div>
              <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
                {venture.targetMarket}
              </p>
            </div>
          )}

          {/* Funding Plans */}
          {venture.fundingPlans && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#76B947]" />
                <h3 className="font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  Funding plans
                </h3>
              </div>
              <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
                {venture.fundingPlans}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Investment Readiness at a Glance */}
      <Card className="glass-card border-black/5 dark:border-white/10 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <CardContent className="pt-8 pb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Investment readiness at a glance
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-body)' }}>
              {venture.name} scores {venture.urutiScore} out of 100 in MLP analysis
              {venture.activeUsers ? `, with ${venture.activeUsers.toLocaleString()}+ active users` : ''}
              {venture.sector ? ` in the ${venture.sector} sector` : ''}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Uruti Score */}
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2" style={{ fontFamily: 'var(--font-body)' }}>
                Uruti score
              </div>
              <div className="text-5xl font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                {venture.urutiScore}/100
              </div>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                {venture.urutiScore >= 70 ? 'Strong institutional readiness' : venture.urutiScore >= 40 ? 'Developing readiness' : 'Early stage readiness'}
              </p>
            </div>

            {/* Active Users / Customers */}
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2" style={{ fontFamily: 'var(--font-body)' }}>
                Active users
              </div>
              <div className="text-5xl font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                {venture.activeUsers?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                {venture.activeUsers ? 'Growing user base' : 'No users reported yet'}
              </p>
            </div>

            {/* Monthly Growth */}
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2" style={{ fontFamily: 'var(--font-body)' }}>
                Monthly growth
              </div>
              <div className="text-5xl font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                {venture.monthlyGrowth || 0}%
              </div>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                {venture.monthlyGrowth ? 'Growth trajectory' : 'No growth data yet'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity & Updates Section */}
      <VentureActivitySection
        ventureId={venture.id}
        activities={venture.activities}
        isOwner={isOwner}
        onAddActivity={onAddActivity}
        onDeleteActivity={onDeleteActivity}
      />

      {/* Pitch Deck Section */}
      {venture.pitchDeckUrl && (
        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-[#76B947]" />
                <div>
                  <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Pitch Deck</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-body)' }}>
                    View our comprehensive business plan and financial projections
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  // Download the pitch deck
                  const link = document.createElement('a');
                  link.href = venture.pitchDeckUrl!;
                  link.download = `${venture.name}_Pitch_Deck.pdf`;
                  link.click();
                }}
                className="bg-[#76B947] hover:bg-[#5a8f35] text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-[16/10] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-black/5 dark:border-white/10">
              {/* PDF Preview Placeholder */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <FileText className="h-20 w-20 text-[#76B947] mb-4" />
                <p className="text-lg font-semibold dark:text-white mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  {venture.name} Pitch Deck
                </p>
                <p className="text-sm text-muted-foreground mb-4" style={{ fontFamily: 'var(--font-body)' }}>
                  Click the button above to download the full PDF
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    window.open(venture.pitchDeckUrl!, '_blank');
                  }}
                  className="border-[#76B947] text-[#76B947] hover:bg-[#76B947]/10"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ready to Move Forward CTA */}
      <Card className="glass-card border-black/5 dark:border-white/10 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900">
        <CardContent className="py-12 text-center">
          <h2 className="text-3xl font-bold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Ready to move forward
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-body)' }}>
            See the pitch or just get in touch to know different details and talk the founder.
          </p>
          <div className="flex items-center justify-center gap-4">
            {venture.pitchDeckUrl ? (
              <Button
                size="lg"
                className="bg-[#76B947] hover:bg-[#5a8f35] text-white"
                onClick={() => window.open(venture.pitchDeckUrl!, '_blank')}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Pitch Deck
              </Button>
            ) : (
              <Button size="lg" className="bg-[#76B947] hover:bg-[#5a8f35] text-white" disabled>
                <FileText className="h-4 w-4 mr-2" />
                No Pitch Deck Available
              </Button>
            )}
            {venture.founderId && onViewFounder && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => onViewFounder(venture.founderId!)}
              >
                <Users className="h-4 w-4 mr-2" />
                View Founder
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}