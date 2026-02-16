import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { 
  Lightbulb, 
  Target, 
  Users, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2,
  Upload,
  X,
  ArrowRight,
  ArrowLeft,
  Video,
  FileText,
  Presentation
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface EditVentureFullDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venture: any;
  onSave: (ventureData: any) => void;
  onNavigateToPitchCoach?: () => void;
}

export function EditVentureFullDialog({ open, onOpenChange, venture, onSave, onNavigateToPitchCoach }: EditVentureFullDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    name: venture?.name || '',
    tagline: venture?.tagline || '',
    sector: venture?.sector || '',
    stage: venture?.stage || '',
    location: venture?.location || 'Kigali, Rwanda',
    
    // Step 2: Problem & Solution
    problem: venture?.problem || venture?.problemStatement || '',
    solution: venture?.solution || venture?.solutionHypothesis || '',
    competitiveEdge: venture?.competitiveEdge || '',
    targetMarket: venture?.targetMarket || '',
    
    // Step 3: Highlights & Team
    highlights: venture?.highlights || ['', '', '', ''],
    teamBackground: venture?.teamBackground || '',
    teamSize: venture?.teamSize || '',
    
    // Step 4: Milestones, Funding & Media
    milestones: venture?.milestones || [
      { title: '', description: '', status: 'planned' as const },
      { title: '', description: '', status: 'planned' as const },
      { title: '', description: '', status: 'planned' as const }
    ],
    fundingPlans: venture?.fundingPlans || '',
    fundingTarget: venture?.fundingTarget || '',
    expectedUsers: venture?.expectedUsers || '',
    expectedGrowth: venture?.expectedGrowth || '',
    pitchVideoUrl: venture?.pitchVideoUrl || '',
    pitchDeckUrl: venture?.pitchDeckUrl || ''
  });

  const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setPitchDeckFile(file);
        // In real implementation, this would upload to server
        // For now, create a mock URL
        const mockUrl = URL.createObjectURL(file);
        setFormData(prev => ({ ...prev, pitchDeckUrl: mockUrl }));
        toast.success('Pitch deck uploaded successfully!');
      } else {
        toast.error('Please upload a PDF file');
      }
    }
  };

  const handleNext = () => {
    // Validate current step
    if (currentStep === 1) {
      if (!formData.name || !formData.sector) {
        toast.error('Please fill in all required fields');
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.problem || !formData.solution) {
        toast.error('Please describe the problem and solution');
        return;
      }
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // Final validation
    if (!formData.name || !formData.sector || !formData.problem || !formData.solution) {
      toast.error('Please complete all required fields');
      return;
    }

    // Clean up highlights (remove empty ones)
    const cleanedHighlights = formData.highlights.filter(h => h.trim());

    // Clean up milestones (remove empty ones)
    const cleanedMilestones = formData.milestones.filter(m => m.title.trim() && m.description.trim());

    const ventureData = {
      ...venture,
      ...formData,
      highlights: cleanedHighlights,
      milestones: cleanedMilestones,
      // Keep existing fields
      id: venture.id,
      urutiScore: venture.urutiScore,
      status: venture.status,
      createdDate: venture.createdDate
    };

    onSave(ventureData);
    toast.success('Venture updated successfully!');
    onOpenChange(false);
    setCurrentStep(1); // Reset to first step
  };

  const progress = (currentStep / totalSteps) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-card">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-heading)' }} className="text-2xl">
            Edit Your Venture
          </DialogTitle>
          <DialogDescription style={{ fontFamily: 'var(--font-body)' }}>
            Update your startup information to create the perfect investor presentation
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                  currentStep >= step 
                    ? 'border-[#76B947] bg-[#76B947] text-white' 
                    : 'border-gray-300 dark:border-gray-600 text-gray-400'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`h-0.5 flex-1 ${
                    currentStep > step ? 'bg-[#76B947]' : 'bg-gray-300 dark:bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Basic Info</span>
            <span>Problem & Solution</span>
            <span>Team & Highlights</span>
            <span>Milestones & Media</span>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-[#76B947]" />
              <h3 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                Basic Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Venture Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., AgriConnect"
                  className="glass-card"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Kigali, Rwanda"
                  className="glass-card"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">One-line Tagline</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="Describe your venture in one powerful sentence"
                className="glass-card"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sector">Industry Sector *</Label>
                <select
                  id="sector"
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-card border border-black/10 dark:border-white/10 bg-transparent dark:text-white"
                >
                  <option value="">Select sector</option>
                  <option value="AgriTech">AgriTech</option>
                  <option value="FinTech">FinTech</option>
                  <option value="HealthTech">HealthTech</option>
                  <option value="EdTech">EdTech</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage">Stage</Label>
                <select
                  id="stage"
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-card border border-black/10 dark:border-white/10 bg-transparent dark:text-white"
                >
                  <option value="">Select stage</option>
                  <option value="MVP">MVP</option>
                  <option value="Pre-Seed">Pre-Seed</option>
                  <option value="Seed">Seed</option>
                  <option value="Growth">Growth</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="teamSize">Team Size</Label>
                <Input
                  id="teamSize"
                  value={formData.teamSize}
                  onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                  placeholder="e.g., 5 members"
                  className="glass-card"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Problem & Solution */}
        {currentStep === 2 && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-[#76B947]" />
              <h3 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                Problem & Solution
              </h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="problem">The Problem *</Label>
              <Textarea
                id="problem"
                value={formData.problem}
                onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                placeholder="Describe the problem you're solving..."
                rows={4}
                className="glass-card resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="solution">The Solution *</Label>
              <Textarea
                id="solution"
                value={formData.solution}
                onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                placeholder="Explain your innovative solution..."
                rows={4}
                className="glass-card resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="competitiveEdge">Competitive Edge</Label>
              <Textarea
                id="competitiveEdge"
                value={formData.competitiveEdge}
                onChange={(e) => setFormData({ ...formData, competitiveEdge: e.target.value })}
                placeholder="What makes you different from competitors?"
                rows={3}
                className="glass-card resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetMarket">Target Market in Rwanda</Label>
              <Textarea
                id="targetMarket"
                value={formData.targetMarket}
                onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value })}
                placeholder="Describe your target market..."
                rows={3}
                className="glass-card resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: Highlights & Team */}
        {currentStep === 3 && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-[#76B947]" />
              <h3 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                Team & Key Highlights
              </h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamBackground">Team Background</Label>
              <Textarea
                id="teamBackground"
                value={formData.teamBackground}
                onChange={(e) => setFormData({ ...formData, teamBackground: e.target.value })}
                placeholder="Tell investors about your team's experience and expertise..."
                rows={4}
                className="glass-card resize-none"
              />
            </div>

            <div className="space-y-3">
              <Label>Key Highlights (up to 4)</Label>
              <p className="text-sm text-muted-foreground">What makes your venture stand out?</p>
              {formData.highlights.map((highlight, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#76B947] flex-shrink-0" />
                  <Input
                    value={highlight}
                    onChange={(e) => {
                      const newHighlights = [...formData.highlights];
                      newHighlights[index] = e.target.value;
                      setFormData({ ...formData, highlights: newHighlights });
                    }}
                    placeholder={`Highlight ${index + 1}`}
                    className="glass-card"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Milestones, Funding & Media */}
        {currentStep === 4 && (
          <div className="space-y-6 py-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-[#76B947]" />
              <h3 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                Milestones, Funding & Media
              </h3>
            </div>

            {/* Pitch Video */}
            <div className="space-y-2 p-4 glass-card rounded-lg border border-black/5 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-[#76B947]" />
                  <Label>Pitch Video</Label>
                </div>
                {!formData.pitchVideoUrl && onNavigateToPitchCoach && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onNavigateToPitchCoach();
                      onOpenChange(false);
                    }}
                    className="border-[#76B947] text-[#76B947] hover:bg-[#76B947]/10"
                  >
                    <Presentation className="h-4 w-4 mr-2" />
                    Practice in Pitch Coach
                  </Button>
                )}
              </div>
              <Input
                value={formData.pitchVideoUrl}
                onChange={(e) => setFormData({ ...formData, pitchVideoUrl: e.target.value })}
                placeholder="Paste your pitch video URL (YouTube, Vimeo, etc.)"
                className="glass-card"
              />
              {!formData.pitchVideoUrl && (
                <p className="text-xs text-muted-foreground">
                  Don't have a video yet? Use our Pitch Coach to practice and record your pitch!
                </p>
              )}
            </div>

            {/* Pitch Deck Upload */}
            <div className="space-y-2 p-4 glass-card rounded-lg border border-black/5 dark:border-white/10">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#76B947]" />
                <Label htmlFor="pitchDeck">Pitch Deck (PDF)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="pitchDeck"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="glass-card flex-1"
                />
                {formData.pitchDeckUrl && (
                  <Badge className="bg-[#76B947]/20 text-[#76B947]">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Uploaded
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Upload your pitch deck PDF. Investors will be able to view and download it.
              </p>
            </div>

            {/* Funding Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fundingTarget">Funding Target</Label>
                <Input
                  id="fundingTarget"
                  value={formData.fundingTarget}
                  onChange={(e) => setFormData({ ...formData, fundingTarget: e.target.value })}
                  placeholder="$500,000"
                  className="glass-card"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedUsers">Expected Users (Year 1)</Label>
                <Input
                  id="expectedUsers"
                  value={formData.expectedUsers}
                  onChange={(e) => setFormData({ ...formData, expectedUsers: e.target.value })}
                  placeholder="10,000"
                  className="glass-card"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedGrowth">Expected Monthly Growth</Label>
                <Input
                  id="expectedGrowth"
                  value={formData.expectedGrowth}
                  onChange={(e) => setFormData({ ...formData, expectedGrowth: e.target.value })}
                  placeholder="25%"
                  className="glass-card"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fundingPlans">Funding Plans</Label>
              <Textarea
                id="fundingPlans"
                value={formData.fundingPlans}
                onChange={(e) => setFormData({ ...formData, fundingPlans: e.target.value })}
                placeholder="How will you use the funding?"
                rows={3}
                className="glass-card resize-none"
              />
            </div>

            {/* Milestones */}
            <div className="space-y-3">
              <Label>Key Milestones (up to 3)</Label>
              {formData.milestones.map((milestone, index) => (
                <div key={index} className="p-4 glass-card rounded-lg border border-black/5 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-muted-foreground">Milestone {index + 1}</span>
                    <select
                      value={milestone.status}
                      onChange={(e) => {
                        const newMilestones = [...formData.milestones];
                        newMilestones[index] = { ...milestone, status: e.target.value as any };
                        setFormData({ ...formData, milestones: newMilestones });
                      }}
                      className="text-xs px-2 py-1 rounded glass-card border border-black/10 dark:border-white/10"
                    >
                      <option value="completed">Completed</option>
                      <option value="in-progress">In Progress</option>
                      <option value="planned">Planned</option>
                    </select>
                  </div>
                  <Input
                    value={milestone.title}
                    onChange={(e) => {
                      const newMilestones = [...formData.milestones];
                      newMilestones[index] = { ...milestone, title: e.target.value };
                      setFormData({ ...formData, milestones: newMilestones });
                    }}
                    placeholder="Milestone title"
                    className="glass-card"
                  />
                  <Textarea
                    value={milestone.description}
                    onChange={(e) => {
                      const newMilestones = [...formData.milestones];
                      newMilestones[index] = { ...milestone, description: e.target.value };
                      setFormData({ ...formData, milestones: newMilestones });
                    }}
                    placeholder="Milestone description"
                    rows={2}
                    className="glass-card resize-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-black/5 dark:border-white/10">
          <Button
            type="button"
            onClick={handleBack}
            variant="outline"
            disabled={currentStep === 1}
            className="border-black/10 dark:border-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep < totalSteps ? (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-[#76B947] hover:bg-[#5a8f35] text-white"
            >
              Next Step
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              className="bg-[#76B947] hover:bg-[#5a8f35] text-white"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
