import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { 
  Building2, 
  Target, 
  Users, 
  TrendingUp, 
  DollarSign,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Upload
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface EditVentureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venture: any;
  onSave: (updatedVenture: any) => void;
}

export function EditVentureDialog({ open, onOpenChange, venture, onSave }: EditVentureDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: venture?.name || '',
    tagline: venture?.tagline || '',
    sector: venture?.sector || '',
    stage: venture?.stage || '',
    teamSize: venture?.teamSize || '',
    location: venture?.location || '',
    
    problem: venture?.problem || '',
    solution: venture?.solution || '',
    competitiveEdge: venture?.competitiveEdge || '',
    targetMarket: venture?.targetMarket || '',
    
    teamBackground: venture?.teamBackground || '',
    highlights: venture?.highlights || ['', '', '', ''],
    
    fundingPlans: venture?.fundingPlans || '',
    fundingTarget: venture?.fundingTarget || '',
    expectedUsers: venture?.expectedUsers || '',
    expectedGrowth: venture?.expectedGrowth || '',
    
    milestones: venture?.milestones || [
      { title: '', description: '', status: 'planned' as const, imageUrl: '' },
      { title: '', description: '', status: 'planned' as const, imageUrl: '' },
      { title: '', description: '', status: 'planned' as const, imageUrl: '' }
    ]
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleHighlightChange = (index: number, value: string) => {
    const newHighlights = [...formData.highlights];
    newHighlights[index] = value;
    handleChange('highlights', newHighlights);
  };

  const handleMilestoneChange = (index: number, field: string, value: any) => {
    const newMilestones = [...formData.milestones];
    newMilestones[index] = { ...newMilestones[index], [field]: value };
    handleChange('milestones', newMilestones);
  };

  const handleNext = () => {
    setCurrentStep(prev => Math.min(4, prev + 1));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSave = () => {
    const updatedVenture = {
      ...venture,
      ...formData,
      highlights: formData.highlights.filter(h => h.trim() !== ''),
      milestones: formData.milestones.filter(m => m.title.trim() !== '')
    };
    
    onSave(updatedVenture);
    toast.success('Venture details updated successfully!');
    onOpenChange(false);
  };

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-card">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-heading)' }}>
            Edit Venture Details
          </DialogTitle>
          <DialogDescription style={{ fontFamily: 'var(--font-body)' }}>
            Update your venture information to improve your investor presentation
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2 mb-6">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#76B947]" />
                  Venture Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Your startup name"
                  className="glass-card"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
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
                onChange={(e) => handleChange('tagline', e.target.value)}
                placeholder="Describe your venture in one sentence"
                className="glass-card"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sector">Industry Sector *</Label>
                <select
                  id="sector"
                  value={formData.sector}
                  onChange={(e) => handleChange('sector', e.target.value)}
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
                  onChange={(e) => handleChange('stage', e.target.value)}
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
                  onChange={(e) => handleChange('teamSize', e.target.value)}
                  placeholder="e.g., 5 members"
                  className="glass-card"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Problem & Solution */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Problem & Solution
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="problem" className="flex items-center gap-2">
                <Target className="h-4 w-4 text-[#76B947]" />
                The Problem *
              </Label>
              <Textarea
                id="problem"
                value={formData.problem}
                onChange={(e) => handleChange('problem', e.target.value)}
                placeholder="Describe the problem your venture solves..."
                rows={4}
                className="glass-card resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="solution">The Solution *</Label>
              <Textarea
                id="solution"
                value={formData.solution}
                onChange={(e) => handleChange('solution', e.target.value)}
                placeholder="Explain your solution..."
                rows={4}
                className="glass-card resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="competitiveEdge">Competitive Edge</Label>
              <Textarea
                id="competitiveEdge"
                value={formData.competitiveEdge}
                onChange={(e) => handleChange('competitiveEdge', e.target.value)}
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
                onChange={(e) => handleChange('targetMarket', e.target.value)}
                placeholder="Describe your target market..."
                rows={3}
                className="glass-card resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: Team & Highlights */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Team & Key Highlights
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="teamBackground" className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#76B947]" />
                Team Background
              </Label>
              <Textarea
                id="teamBackground"
                value={formData.teamBackground}
                onChange={(e) => handleChange('teamBackground', e.target.value)}
                placeholder="Tell investors about your team's experience and expertise..."
                rows={4}
                className="glass-card resize-none"
              />
            </div>

            <div className="space-y-3">
              <Label>Key Highlights (up to 4)</Label>
              {formData.highlights.map((highlight, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#76B947] flex-shrink-0" />
                  <Input
                    value={highlight}
                    onChange={(e) => handleHighlightChange(index, e.target.value)}
                    placeholder={`Highlight ${index + 1}`}
                    className="glass-card"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Milestones & Funding */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Milestones & Funding
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fundingTarget">Funding Target</Label>
                <Input
                  id="fundingTarget"
                  value={formData.fundingTarget}
                  onChange={(e) => handleChange('fundingTarget', e.target.value)}
                  placeholder="$500,000"
                  className="glass-card"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedUsers">Expected Users (Year 1)</Label>
                <Input
                  id="expectedUsers"
                  value={formData.expectedUsers}
                  onChange={(e) => handleChange('expectedUsers', e.target.value)}
                  placeholder="10,000"
                  className="glass-card"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedGrowth">Expected Monthly Growth</Label>
                <Input
                  id="expectedGrowth"
                  value={formData.expectedGrowth}
                  onChange={(e) => handleChange('expectedGrowth', e.target.value)}
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
                onChange={(e) => handleChange('fundingPlans', e.target.value)}
                placeholder="How will you use the funding?"
                rows={3}
                className="glass-card resize-none"
              />
            </div>

            <div className="space-y-3">
              <Label>Milestones (up to 3)</Label>
              {formData.milestones.map((milestone, index) => (
                <div key={index} className="p-4 glass-card rounded-lg border border-black/5 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-muted-foreground">Milestone {index + 1}</span>
                    <select
                      value={milestone.status}
                      onChange={(e) => handleMilestoneChange(index, 'status', e.target.value)}
                      className="text-xs px-2 py-1 rounded glass-card border border-black/10 dark:border-white/10"
                    >
                      <option value="completed">Completed</option>
                      <option value="in-progress">In Progress</option>
                      <option value="planned">Planned</option>
                    </select>
                  </div>
                  <Input
                    value={milestone.title}
                    onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
                    placeholder="Milestone title"
                    className="glass-card"
                  />
                  <Textarea
                    value={milestone.description}
                    onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
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
              onClick={handleNext}
              className="bg-[#76B947] hover:bg-[#5a8f35] text-white"
            >
              Next Step
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
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
