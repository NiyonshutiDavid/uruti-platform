import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Lightbulb,
  FileText,
  Sparkles,
  BarChart3,
  Users,
  Calendar,
  Video,
  MessageSquare,
  Award,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Package,
  Smartphone,
  Brain
} from 'lucide-react';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';

interface LandingHowItWorksProps {
  onNavigate: (page: string) => void;
}

export function LandingHowItWorks({ onNavigate }: LandingHowItWorksProps) {
  const steps = [
    {
      number: '01',
      title: 'Sign Up & Capture Your Idea',
      description: 'Create your free account in under 2 minutes. Start by capturing your startup idea in our simple, guided form.',
      icon: Lightbulb,
      features: [
        'Quick registration process',
        'AI-powered idea structuring',
        'Industry and market selection',
        'Initial business model canvas'
      ],
      color: 'from-purple-500 to-purple-700'
    },
    {
      number: '02',
      title: 'Get Your Uruti Score',
      description: 'Our AI analyzes your startup across 50+ metrics and generates your investment readiness score.',
      icon: BarChart3,
      features: [
        'Comprehensive scoring algorithm',
        'Industry-specific benchmarks',
        'Public ranking on leaderboard',
        'Visibility to investors'
      ],
      color: 'from-[#76B947] to-[#5a8f35]'
    },
    {
      number: '03',
      title: 'Follow AI Advisory Tracks',
      description: 'Navigate personalized learning paths across Legal, Finance, Marketing, and Operations to build a solid foundation.',
      icon: Sparkles,
      features: [
        'Structured learning modules',
        '4 specialized advisory tracks',
        'Progress tracking',
        'Certificate of completion'
      ],
      color: 'from-blue-500 to-blue-700'
    },
    {
      number: '04',
      title: 'Perfect Your Pitch',
      description: 'Practice your investor pitch with our AI coach. Get real-time feedback on delivery, pacing, and confidence.',
      icon: Video,
      features: [
        'Video recording & playback',
        'AI performance analysis',
        'Delivery tips and improvements',
        'Confidence building exercises'
      ],
      color: 'from-orange-500 to-orange-700'
    },
    {
      number: '05',
      title: 'Connect with Mentors & Investors',
      description: 'Access our directory of experienced mentors and active investors. Schedule meetings and build relationships.',
      icon: Users,
      features: [
        'Curated mentor network',
        'Investor matching',
        'Calendar integration',
        'Connection requests'
      ],
      color: 'from-pink-500 to-pink-700'
    },
    {
      number: '06',
      title: 'Track Progress & Secure Funding',
      description: 'Monitor milestones, manage deadlines, and stay on top of investment opportunities through your readiness calendar.',
      icon: TrendingUp,
      features: [
        'Milestone tracking',
        'Deadline reminders',
        'Investment pipeline',
        'Success metrics'
      ],
      color: 'from-cyan-500 to-cyan-700'
    }
  ];

  const modules = [
    {
      icon: FileText,
      title: 'Startup Hub',
      description: 'Centralized repository for all your ventures, ideas, and projects with status tracking.',
      color: 'text-[#76B947]',
      bg: 'bg-gray-50 dark:bg-gray-800/50'
    },
    {
      icon: Sparkles,
      title: 'AI Chatbot',
      description: 'Get instant answers to entrepreneurship questions with context-aware AI assistance.',
      color: 'text-[#76B947]',
      bg: 'bg-gray-50 dark:bg-gray-800/50'
    },
    {
      icon: Video,
      title: 'Pitch Performance',
      description: 'Record, analyze, and improve your pitch delivery with detailed AI feedback.',
      color: 'text-[#76B947]',
      bg: 'bg-gray-50 dark:bg-gray-800/50'
    },
    {
      icon: MessageSquare,
      title: 'Advisory Tracks',
      description: 'Navigate structured learning paths across Legal, Finance, Marketing, and Operations.',
      color: 'text-[#76B947]',
      bg: 'bg-gray-50 dark:bg-gray-800/50'
    },
    {
      icon: Users,
      title: 'Mentor Directory',
      description: 'Connect with experienced mentors and investors through our comprehensive network.',
      color: 'text-[#76B947]',
      bg: 'bg-gray-50 dark:bg-gray-800/50'
    },
    {
      icon: Calendar,
      title: 'Readiness Calendar',
      description: 'Track milestones, deadlines, and investment opportunities in one place.',
      color: 'text-[#76B947]',
      bg: 'bg-gray-50 dark:bg-gray-800/50'
    }
  ];

  const benefits = [
    {
      title: 'For Founders',
      items: [
        'Structured guidance from idea to investment',
        'AI-powered business model validation',
        'Access to mentors and investors',
        'Pitch coaching and feedback',
        'Public visibility through Uruti Score',
        'Community of peer founders'
      ]
    },
    {
      title: 'For Investors',
      items: [
        'Pre-screened investment opportunities',
        'Data-driven startup evaluation',
        'Reduced due diligence time',
        'Access to top-ranked ventures',
        'Direct founder connections',
        'Portfolio tracking tools'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950">
      <LandingHeader onNavigate={onNavigate} />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-[#76B947]/10 text-[#76B947] border-[#76B947]/20 hover:bg-[#76B947]/20">
            <Sparkles className="h-3 w-3 mr-1" />
            Your Journey to Investment Readiness
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            How <span className="text-[#76B947]">Uruti</span> Works
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto" style={{ fontFamily: 'var(--font-body)' }}>
            A step-by-step guide to transforming your startup idea into an investor-ready venture
          </p>
        </div>
      </section>

      {/* Step-by-Step Process */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          <div className="space-y-16">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute left-[32px] top-[80px] w-0.5 h-32 bg-gradient-to-b from-[#76B947] to-[#76B947]/20"></div>
                )}
                
                <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 ${index % 2 === 0 ? '' : 'lg:flex-row-reverse'}`}>
                  {/* Step Number & Icon */}
                  <div className={`lg:col-span-3 flex ${index % 2 === 0 ? 'lg:justify-start' : 'lg:justify-end lg:order-2'}`}>
                    <div className="flex flex-col items-center">
                      <step.icon className="h-16 w-16 text-[#76B947] mb-4" />
                      <span className="text-6xl font-bold text-[#76B947]/20" style={{ fontFamily: 'var(--font-heading)' }}>
                        {step.number}
                      </span>
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className={`lg:col-span-9 ${index % 2 === 0 ? '' : 'lg:order-1'}`}>
                    <Card className="glass-card border-black/5 dark:border-white/10 hover:border-[#76B947]/30 transition-all">
                      <CardContent className="p-8">
                        <h3 className="text-2xl font-bold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                          {step.title}
                        </h3>
                        <p className="text-lg text-muted-foreground mb-6" style={{ fontFamily: 'var(--font-body)' }}>
                          {step.description}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {step.features.map((feature, featureIndex) => (
                            <div key={featureIndex} className="flex items-start">
                              <CheckCircle2 className="h-5 w-5 text-[#76B947] mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                {feature}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Modules */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#76B947]/5">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm text-muted-foreground mb-2" style={{ fontFamily: 'var(--font-body)' }}>
              Learn module works alone or together
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Six Powerful Modules
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-body)' }}>
              All the tools you need in one integrated platform
            </p>
          </div>

          {/* Traditional Module Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => (
              <Card key={index} className="glass-card border-black/5 dark:border-white/10 hover:border-[#76B947]/30 transition-all group">
                <CardContent className="pt-6">
                  <module.icon className="h-10 w-10 text-[#76B947] mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    {module.title}
                  </h3>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    {module.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Built for Everyone
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-body)' }}>
              Whether you're building or investing, Uruti has you covered
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="glass-card border-black/5 dark:border-white/10">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    {benefit.title}
                  </h3>
                  <div className="space-y-4">
                    {benefit.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start">
                        <div className="w-6 h-6 rounded-full bg-[#76B947]/20 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                          <CheckCircle2 className="h-4 w-4 text-[#76B947]" />
                        </div>
                        <span className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#76B947]/5">
        <div className="container mx-auto">
          <Card className="glass-card border-black/5 dark:border-white/10 bg-gradient-to-br from-[#76B947]/10 to-purple-500/10 overflow-hidden relative">
            <CardContent className="p-12 sm:p-16 text-center relative z-10">
              <Award className="h-16 w-16 text-[#76B947] mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Ready to Get Started?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8" style={{ fontFamily: 'var(--font-body)' }}>
                Join thousands of founders who are building the future with Uruti
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button 
                  size="lg" 
                  className="bg-[#76B947] text-white hover:bg-[#76B947]/90 text-lg px-8 py-6"
                  onClick={() => onNavigate('login')}
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-[#76B947] text-[#76B947] hover:bg-[#76B947]/10 text-lg px-8 py-6"
                  onClick={() => onNavigate('contact')}
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Schedule a Demo
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-6" style={{ fontFamily: 'var(--font-body)' }}>
                Free forever • No credit card required • Setup in 2 minutes
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <LandingFooter onNavigate={onNavigate} />
    </div>
  );
}