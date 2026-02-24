import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { UrutiLogo, UrutiLogoText } from '../UrutiLogo';
import { 
  User, 
  Mail, 
  Lock, 
  Building2, 
  MapPin, 
  Phone, 
  Briefcase,
  DollarSign,
  Target,
  Users,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api';

interface SignupPageProps {
  onNavigate: (page: string) => void;
  onSignupComplete: () => void;
}

export function SignupPage({ onNavigate, onSignupComplete }: SignupPageProps) {
  const { signup } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [userType, setUserType] = useState<'founder' | 'investor' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    // Step 1: User Type Selection
    accountType: '',
    
    // Step 2: Basic Information
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    location: '',
    
    // Step 3a: Founder Specific
    startupName: '',
    startupStage: '',
    industry: '',
    teamSize: '',
    fundingStatus: '',
    pitchDeck: '',
    businessDescription: '',
    
    // Step 3b: Investor Specific
    organizationName: '',
    investorType: '',
    investmentRange: '',
    sectors: '',
    investmentStage: '',
    portfolioSize: '',
    investmentCriteria: ''
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUserTypeSelect = (type: 'founder' | 'investor') => {
    setSubmitError(null);
    setUserType(type);
    setFormData(prev => ({ ...prev, accountType: type }));
    setCurrentStep(2);
  };

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      setUserType(null);
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userType) {
      setSubmitError('Please select an account type.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setSubmitError('Password must be at least 8 characters long.');
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await signup({
        email: formData.email,
        full_name: formData.fullName,
        password: formData.password,
        role: userType,
      });

      if (userType === 'founder' && formData.startupName.trim()) {
        await apiClient.createVenture({
          title: formData.startupName.trim(),
          description: formData.businessDescription || undefined,
          industry: formData.industry || undefined,
          stage: formData.startupStage || 'idea',
          problem_statement: formData.businessDescription || undefined,
          target_market: formData.location || undefined,
        });
      }

      onSignupComplete();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Signup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSteps = 3;

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950 flex items-center justify-center p-4 py-12">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#76B947]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <UrutiLogo className="w-auto h-12" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Create Your Account
          </h1>
          <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
            Join Rwanda's leading entrepreneurship ecosystem
          </p>
        </div>

        {/* Progress Bar */}
        {userType && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    currentStep > step 
                      ? 'bg-[#76B947] text-white' 
                      : currentStep === step 
                      ? 'bg-[#76B947] text-white ring-4 ring-[#76B947]/20' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                  }`}>
                    {currentStep > step ? <CheckCircle2 className="h-5 w-5" /> : step}
                  </div>
                  {step < 3 && (
                    <div className={`flex-1 h-1 mx-2 ${
                      currentStep > step ? 'bg-[#76B947]' : 'bg-gray-200 dark:bg-gray-700'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              <span>Account Type</span>
              <span>Basic Info</span>
              <span>{userType === 'founder' ? 'Startup Details' : 'Investment Profile'}</span>
            </div>
          </div>
        )}

        <Card className="glass-card border-black/5 dark:border-white/10 shadow-2xl">
          <CardContent className="p-8 sm:p-12">
            <form onSubmit={handleSubmit}>
              {submitError && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              {/* Step 1: User Type Selection */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                      I am a...
                    </h2>
                    <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                      Choose the option that best describes you
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                      type="button"
                      onClick={() => handleUserTypeSelect('founder')}
                      className="group p-8 rounded-xl border-2 border-black/10 dark:border-white/10 hover:border-[#76B947] hover:bg-[#76B947]/5 transition-all text-left"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Target className="h-8 w-8 text-purple-600" />
                      </div>
                      <h3 className="text-xl font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                        Founder / Entrepreneur
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4" style={{ fontFamily: 'var(--font-body)' }}>
                        I'm building a startup and need guidance, mentorship, and connections to investors
                      </p>
                      <div className="flex items-center text-[#76B947] text-sm font-semibold">
                        Get Started <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUserTypeSelect('investor')}
                      className="group p-8 rounded-xl border-2 border-black/10 dark:border-white/10 hover:border-[#76B947] hover:bg-[#76B947]/5 transition-all text-left"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-[#76B947]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <DollarSign className="h-8 w-8 text-[#76B947]" />
                      </div>
                      <h3 className="text-xl font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                        Investor / VC
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4" style={{ fontFamily: 'var(--font-body)' }}>
                        I'm looking to discover and invest in promising startups in Rwanda and East Africa
                      </p>
                      <div className="flex items-center text-[#76B947] text-sm font-semibold">
                        Get Started <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    </button>
                  </div>

                  <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/10 text-center">
                    <p className="text-sm text-muted-foreground mb-4" style={{ fontFamily: 'var(--font-body)' }}>
                      Already have an account?
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onNavigate('login')}
                      className="border-[#76B947] text-[#76B947] hover:bg-[#76B947]/10"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      Sign In
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Basic Information */}
              {currentStep === 2 && userType && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                      Basic Information
                    </h2>
                    <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                      Tell us about yourself
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-[#76B947]" />
                        <span>Full Name *</span>
                      </Label>
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={(e) => handleChange('fullName', e.target.value)}
                        required
                        className="glass-card border-black/10 dark:border-white/10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-[#76B947]" />
                        <span>Email Address *</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        required
                        className="glass-card border-black/10 dark:border-white/10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="flex items-center space-x-2">
                        <Lock className="h-4 w-4 text-[#76B947]" />
                        <span>Password *</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Min. 8 characters"
                          value={formData.password}
                          onChange={(e) => handleChange('password', e.target.value)}
                          required
                          className="glass-card border-black/10 dark:border-white/10 pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#76B947]"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="flex items-center space-x-2">
                        <Lock className="h-4 w-4 text-[#76B947]" />
                        <span>Confirm Password *</span>
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Re-enter password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange('confirmPassword', e.target.value)}
                        required
                        className="glass-card border-black/10 dark:border-white/10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-[#76B947]" />
                        <span>Phone Number *</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+250 788 000 000"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        required
                        className="glass-card border-black/10 dark:border-white/10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location" className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-[#76B947]" />
                        <span>Location *</span>
                      </Label>
                      <Input
                        id="location"
                        placeholder="Kigali, Rwanda"
                        value={formData.location}
                        onChange={(e) => handleChange('location', e.target.value)}
                        required
                        className="glass-card border-black/10 dark:border-white/10"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3a: Founder Details */}
              {currentStep === 3 && userType === 'founder' && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                      Tell Us About Your Startup
                    </h2>
                    <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                      Help us understand your venture
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startupName" className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-[#76B947]" />
                      <span>Startup Name *</span>
                    </Label>
                    <Input
                      id="startupName"
                      placeholder="What's your startup called?"
                      value={formData.startupName}
                      onChange={(e) => handleChange('startupName', e.target.value)}
                      required
                      className="glass-card border-black/10 dark:border-white/10"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startupStage">Startup Stage *</Label>
                      <select
                        id="startupStage"
                        value={formData.startupStage}
                        onChange={(e) => handleChange('startupStage', e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-lg glass-card border border-black/10 dark:border-white/10 bg-transparent dark:text-white"
                      >
                        <option value="">Select stage</option>
                        <option value="idea">Idea Stage</option>
                        <option value="prototype">Prototype</option>
                        <option value="mvp">MVP</option>
                        <option value="early-traction">Early Traction</option>
                        <option value="growth">Growth</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry *</Label>
                      <select
                        id="industry"
                        value={formData.industry}
                        onChange={(e) => handleChange('industry', e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-lg glass-card border border-black/10 dark:border-white/10 bg-transparent dark:text-white"
                      >
                        <option value="">Select industry</option>
                        <option value="agriculture">Agriculture</option>
                        <option value="fintech">FinTech</option>
                        <option value="healthcare">Healthcare</option>
                        <option value="education">Education</option>
                        <option value="ecommerce">E-commerce</option>
                        <option value="logistics">Logistics</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="teamSize" className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-[#76B947]" />
                        <span>Team Size *</span>
                      </Label>
                      <select
                        id="teamSize"
                        value={formData.teamSize}
                        onChange={(e) => handleChange('teamSize', e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-lg glass-card border border-black/10 dark:border-white/10 bg-transparent dark:text-white"
                      >
                        <option value="">Select team size</option>
                        <option value="solo">Solo Founder</option>
                        <option value="2-5">2-5 members</option>
                        <option value="6-10">6-10 members</option>
                        <option value="11+">11+ members</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fundingStatus">Funding Status *</Label>
                      <select
                        id="fundingStatus"
                        value={formData.fundingStatus}
                        onChange={(e) => handleChange('fundingStatus', e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-lg glass-card border border-black/10 dark:border-white/10 bg-transparent dark:text-white"
                      >
                        <option value="">Select funding status</option>
                        <option value="bootstrapped">Bootstrapped</option>
                        <option value="pre-seed">Pre-Seed</option>
                        <option value="seed">Seed</option>
                        <option value="series-a">Series A</option>
                        <option value="series-b+">Series B+</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessDescription">What does your startup do? *</Label>
                    <Textarea
                      id="businessDescription"
                      placeholder="Describe your business in a few sentences..."
                      value={formData.businessDescription}
                      onChange={(e) => handleChange('businessDescription', e.target.value)}
                      required
                      rows={4}
                      className="glass-card border-black/10 dark:border-white/10 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Step 3b: Investor Details */}
              {currentStep === 3 && userType === 'investor' && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                      Investment Profile
                    </h2>
                    <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                      Help us match you with relevant startups
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organizationName" className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-[#76B947]" />
                      <span>Organization Name *</span>
                    </Label>
                    <Input
                      id="organizationName"
                      placeholder="Your fund or organization"
                      value={formData.organizationName}
                      onChange={(e) => handleChange('organizationName', e.target.value)}
                      required
                      className="glass-card border-black/10 dark:border-white/10"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="investorType">Investor Type *</Label>
                      <select
                        id="investorType"
                        value={formData.investorType}
                        onChange={(e) => handleChange('investorType', e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-lg glass-card border border-black/10 dark:border-white/10 bg-transparent dark:text-white"
                      >
                        <option value="">Select type</option>
                        <option value="angel">Angel Investor</option>
                        <option value="vc">Venture Capital</option>
                        <option value="corporate">Corporate VC</option>
                        <option value="accelerator">Accelerator</option>
                        <option value="family-office">Family Office</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="investmentRange">Investment Range *</Label>
                      <select
                        id="investmentRange"
                        value={formData.investmentRange}
                        onChange={(e) => handleChange('investmentRange', e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-lg glass-card border border-black/10 dark:border-white/10 bg-transparent dark:text-white"
                      >
                        <option value="">Select range</option>
                        <option value="0-50k">$0 - $50K</option>
                        <option value="50k-250k">$50K - $250K</option>
                        <option value="250k-1m">$250K - $1M</option>
                        <option value="1m-5m">$1M - $5M</option>
                        <option value="5m+">$5M+</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="investmentStage">Preferred Stage *</Label>
                      <select
                        id="investmentStage"
                        value={formData.investmentStage}
                        onChange={(e) => handleChange('investmentStage', e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-lg glass-card border border-black/10 dark:border-white/10 bg-transparent dark:text-white"
                      >
                        <option value="">Select stage</option>
                        <option value="pre-seed">Pre-Seed</option>
                        <option value="seed">Seed</option>
                        <option value="series-a">Series A</option>
                        <option value="series-b+">Series B+</option>
                        <option value="any">Any Stage</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="portfolioSize">Portfolio Size *</Label>
                      <select
                        id="portfolioSize"
                        value={formData.portfolioSize}
                        onChange={(e) => handleChange('portfolioSize', e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-lg glass-card border border-black/10 dark:border-white/10 bg-transparent dark:text-white"
                      >
                        <option value="">Current portfolio</option>
                        <option value="0-5">0-5 companies</option>
                        <option value="6-15">6-15 companies</option>
                        <option value="16-30">16-30 companies</option>
                        <option value="31+">31+ companies</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sectors">Preferred Sectors (comma-separated) *</Label>
                    <Input
                      id="sectors"
                      placeholder="e.g., FinTech, Agriculture, Healthcare"
                      value={formData.sectors}
                      onChange={(e) => handleChange('sectors', e.target.value)}
                      required
                      className="glass-card border-black/10 dark:border-white/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="investmentCriteria">Investment Criteria *</Label>
                    <Textarea
                      id="investmentCriteria"
                      placeholder="What do you look for in a startup?"
                      value={formData.investmentCriteria}
                      onChange={(e) => handleChange('investmentCriteria', e.target.value)}
                      required
                      rows={4}
                      className="glass-card border-black/10 dark:border-white/10 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              {currentStep > 1 && (
                <div className="flex gap-4 mt-8 pt-6 border-t border-black/5 dark:border-white/10">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={isSubmitting}
                    className="flex-1 border-black/10 dark:border-white/20"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  {currentStep < totalSteps ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={isSubmitting}
                      className="flex-1 bg-[#76B947] text-white hover:bg-[#76B947]/90"
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-[#76B947] text-white hover:bg-[#76B947]/90"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
                    </Button>
                  )}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <button
            onClick={() => onNavigate('home')}
            className="text-sm text-muted-foreground hover:text-[#76B947] transition-colors"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}