import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
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
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface EnhancedCaptureIdeaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (ventureData: any) => void;
}

export function EnhancedCaptureIdeaDialog({ open, onOpenChange, onSave }: EnhancedCaptureIdeaDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    name: '',
    tagline: '',
    sector: '',
    
    // Step 2: Problem & Solution
    problem: '',
    solution: '',
    competitiveEdge: '',
    targetMarket: '',
    
    // Step 3: Highlights & Team
    highlights: ['', '', '', ''],
    teamBackground: '',
    teamSize: '',
    
    // Step 4: Milestones & Funding
    milestones: [
      { title: '', description: '', status: 'planned' as const },
      { title: '', description: '', status: 'planned' as const },
      { title: '', description: '', status: 'planned' as const }
    ],
    fundingPlans: '',
    fundingTarget: '',
    expectedUsers: '',
    expectedGrowth: ''
  });

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
      ...formData,
      highlights: cleanedHighlights,
      milestones: cleanedMilestones,
      createdAt: new Date().toISOString()
    };

    onSave?.(ventureData);
    toast.success('Venture idea captured successfully!');
    onOpenChange(false);
    
    // Reset form
    setCurrentStep(1);
    setFormData({
      name: '',
      tagline: '',
      sector: '',
      problem: '',
      solution: '',
      competitiveEdge: '',
      targetMarket: '',
      highlights: ['', '', '', ''],
      teamBackground: '',
      teamSize: '',
      milestones: [
        { title: '', description: '', status: 'planned' },
        { title: '', description: '', status: 'planned' },
        { title: '', description: '', status: 'planned' }
      ],
      fundingPlans: '',
      fundingTarget: '',
      expectedUsers: '',
      expectedGrowth: ''
    });
  };

  const updateHighlight = (index: number, value: string) => {
    const newHighlights = [...formData.highlights];
    newHighlights[index] = value;
    setFormData({ ...formData, highlights: newHighlights });
  };

  const updateMilestone = (index: number, field: 'title' | 'description', value: string) => {
    const newMilestones = [...formData.milestones];
    newMilestones[index] = { ...newMilestones[index], [field]: value };
    setFormData({ ...formData, milestones: newMilestones });
  };

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto glass-card">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
            <Lightbulb className="h-6 w-6 text-[#76B947]" />
            Capture Your Venture Idea
          </DialogTitle>
          <DialogDescription style={{ fontFamily: 'var(--font-body)' }}>
            Step {currentStep} of {totalSteps}: Share your vision with investors and the ecosystem
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Basic Info</span>
            <span>Problem & Solution</span>
            <span>Team & Highlights</span>
            <span>Milestones & Funding</span>
          </div>
        </div>

        <div className="space-y-6 py-4">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-5">
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-[#76B947]/10 text-[#76B947] border border-[#76B947]/30">
                  Step 1: Basic Information
                </Badge>
              </div>

              <div>
                <Label htmlFor="name">
                  Venture Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., AgriConnect Rwanda"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="tagline">One-Line Tagline</Label>
                <Input
                  id="tagline"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="e.g., Connecting farmers to modern agriculture technology"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="sector">
                  Industry Sector <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.sector} onValueChange={(value) => setFormData({ ...formData, sector: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AgriTech">AgriTech</SelectItem>
                    <SelectItem value="FinTech">FinTech</SelectItem>
                    <SelectItem value="HealthTech">HealthTech</SelectItem>
                    <SelectItem value="EdTech">EdTech</SelectItem>
                    <SelectItem value="CleanTech">CleanTech</SelectItem>
                    <SelectItem value="E-commerce">E-commerce</SelectItem>
                    <SelectItem value="Logistics">Logistics</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="teamSize">Team Size</Label>
                <Input
                  id="teamSize"
                  value={formData.teamSize}
                  onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                  placeholder="e.g., 5 members"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Step 2: Problem & Solution */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-5">
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-[#76B947]/10 text-[#76B947] border border-[#76B947]/30">
                  Step 2: Problem & Solution
                </Badge>
              </div>

              <div>
                <Label htmlFor="problem">
                  The Problem <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="problem"
                  value={formData.problem}
                  onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                  placeholder="What problem are you solving? Be specific about the pain point."
                  className="mt-1"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="solution">
                  The Solution <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="solution"
                  value={formData.solution}
                  onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                  placeholder="How does your solution address this problem?"
                  className="mt-1"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="competitiveEdge">Competitive Edge</Label>
                <Textarea
                  id="competitiveEdge"
                  value={formData.competitiveEdge}
                  onChange={(e) => setFormData({ ...formData, competitiveEdge: e.target.value })}
                  placeholder="What makes your solution unique? What advantages do you have?"
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="targetMarket">Target Market in Rwanda</Label>
                <Textarea
                  id="targetMarket"
                  value={formData.targetMarket}
                  onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value })}
                  placeholder="Describe your target customers and market size in Rwanda"
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 3: Team & Highlights */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-5">
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-[#76B947]/10 text-[#76B947] border border-[#76B947]/30">
                  Step 3: Team & Key Highlights
                </Badge>
              </div>

              <div>
                <Label htmlFor="teamBackground">Team Background</Label>
                <Textarea
                  id="teamBackground"
                  value={formData.teamBackground}
                  onChange={(e) => setFormData({ ...formData, teamBackground: e.target.value })}
                  placeholder="Tell us about your team's experience and expertise"
                  className="mt-1"
                  rows={4}
                />
              </div>

              <div>
                <Label>Key Highlights (Up to 4)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  What are the standout features or achievements?
                </p>
                <div className="space-y-2">
                  {formData.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#76B947] flex-shrink-0" />
                      <Input
                        value={highlight}
                        onChange={(e) => updateHighlight(index, e.target.value)}
                        placeholder={`Highlight ${index + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Milestones & Funding */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-5">
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-[#76B947]/10 text-[#76B947] border border-[#76B947]/30">
                  Step 4: Roadmap & Funding
                </Badge>
              </div>

              <div>
                <Label>Key Milestones (Up to 3)</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  What are your major milestones from idea to market?
                </p>
                <div className="space-y-4">
                  {formData.milestones.map((milestone, index) => (
                    <Card key={index} className="glass-panel p-4 border border-gray-200 dark:border-gray-700">
                      <div className="space-y-2">
                        <Input
                          value={milestone.title}
                          onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                          placeholder={`Milestone ${index + 1} title`}
                          className="font-medium"
                        />
                        <Textarea
                          value={milestone.description}
                          onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                          placeholder="Describe this milestone"
                          rows={2}
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fundingTarget">Funding Target</Label>
                  <Input
                    id="fundingTarget"
                    value={formData.fundingTarget}
                    onChange={(e) => setFormData({ ...formData, fundingTarget: e.target.value })}
                    placeholder="e.g., $250,000"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="expectedUsers">Expected Users (Year 1)</Label>
                  <Input
                    id="expectedUsers"
                    value={formData.expectedUsers}
                    onChange={(e) => setFormData({ ...formData, expectedUsers: e.target.value })}
                    placeholder="e.g., 12,000"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="expectedGrowth">Expected Monthly Growth Rate</Label>
                <Input
                  id="expectedGrowth"
                  value={formData.expectedGrowth}
                  onChange={(e) => setFormData({ ...formData, expectedGrowth: e.target.value })}
                  placeholder="e.g., 45%"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="fundingPlans">Funding Plans</Label>
                <Textarea
                  id="fundingPlans"
                  value={formData.fundingPlans}
                  onChange={(e) => setFormData({ ...formData, fundingPlans: e.target.value })}
                  placeholder="How will you use the funding? What are your plans?"
                  className="mt-1"
                  rows={4}
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {currentStep < totalSteps ? (
              <Button
                className="bg-[#76B947] hover:bg-[#5a8f35] text-white"
                onClick={handleNext}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                className="bg-[#76B947] hover:bg-[#5a8f35] text-white"
                onClick={handleSubmit}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Capture Idea
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Import Card for the milestones section
import { Card } from './ui/card';
