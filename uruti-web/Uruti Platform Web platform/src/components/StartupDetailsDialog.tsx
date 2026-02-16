import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent } from './ui/card';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  MapPin,
  ExternalLink,
  Target,
  BarChart3,
  FileText,
  Rocket
} from 'lucide-react';

interface StartupDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startup: {
    name: string;
    stage: string;
    industry: string;
    fundingRaised?: string;
    readinessScore?: number;
    description: string;
    logo: string;
    founded?: string;
    location?: string;
    teamSize?: number;
    website?: string;
    founderName?: string;
  };
}

export function StartupDetailsDialog({ open, onOpenChange, startup }: StartupDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-[#76B947]">
              <AvatarImage src={startup.logo} />
              <AvatarFallback className="bg-[#76B947]/20 text-[#76B947] text-xl">
                {startup.name.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-2xl" style={{ fontFamily: 'var(--font-heading)' }}>
                {startup.name}
              </DialogTitle>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="border-[#76B947] text-[#76B947]">
                  {startup.industry}
                </Badge>
                <Badge className="bg-[#76B947] text-white">
                  {startup.stage}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {startup.readinessScore && (
              <Card className="glass-card border-black/5 dark:border-white/10">
                <CardContent className="pt-6 text-center">
                  <BarChart3 className="h-6 w-6 text-[#76B947] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                    {startup.readinessScore}%
                  </p>
                  <p className="text-xs text-muted-foreground">Readiness Score</p>
                </CardContent>
              </Card>
            )}
            {startup.fundingRaised && (
              <Card className="glass-card border-black/5 dark:border-white/10">
                <CardContent className="pt-6 text-center">
                  <DollarSign className="h-6 w-6 text-[#76B947] mx-auto mb-2" />
                  <p className="text-2xl font-bold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    {startup.fundingRaised}
                  </p>
                  <p className="text-xs text-muted-foreground">Funding Raised</p>
                </CardContent>
              </Card>
            )}
            {startup.teamSize && (
              <Card className="glass-card border-black/5 dark:border-white/10">
                <CardContent className="pt-6 text-center">
                  <Users className="h-6 w-6 text-[#76B947] mx-auto mb-2" />
                  <p className="text-2xl font-bold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    {startup.teamSize}
                  </p>
                  <p className="text-xs text-muted-foreground">Team Members</p>
                </CardContent>
              </Card>
            )}
            {startup.founded && (
              <Card className="glass-card border-black/5 dark:border-white/10">
                <CardContent className="pt-6 text-center">
                  <Calendar className="h-6 w-6 text-[#76B947] mx-auto mb-2" />
                  <p className="text-2xl font-bold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    {startup.founded}
                  </p>
                  <p className="text-xs text-muted-foreground">Founded</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* About */}
          <div>
            <h3 className="text-lg font-semibold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              About
            </h3>
            <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
              {startup.description}
            </p>
          </div>

          {/* Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {startup.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-[#76B947]" />
                  <span className="text-muted-foreground">{startup.location}</span>
                </div>
              )}
              {startup.website && (
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink className="h-4 w-4 text-[#76B947]" />
                  <a href={`https://${startup.website}`} className="text-[#76B947] hover:underline">
                    {startup.website}
                  </a>
                </div>
              )}
              {startup.founderName && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-[#76B947]" />
                  <span className="text-muted-foreground">Founded by {startup.founderName}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-[#76B947]" />
                <span className="text-muted-foreground">Stage: {startup.stage}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button className="bg-[#76B947] hover:bg-[#5a8f35] text-white flex-1">
              <Rocket className="h-4 w-4 mr-2" />
              View Full Details
            </Button>
            <Button variant="outline" className="flex-1">
              <FileText className="h-4 w-4 mr-2" />
              Request Pitch Deck
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
