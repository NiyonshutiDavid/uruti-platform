import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { 
  Sparkles, 
  TrendingUp, 
  Users, 
  Target, 
  Award,
  Lightbulb,
  BarChart3,
  MessageSquare,
  Video,
  Calendar,
  ArrowRight,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';
import { LiveChatWidget } from '../LiveChatWidget';

import desktopMockup from '../../assets/mockup-desktop.png';
import mobileMockup from '../../assets/mockup-mobile.png';

const SLIDES = [
  {
    src: desktopMockup,
    alt: 'Uruti platform on desktop — web dashboard',
    label: 'Available on Web',
  },
  {
    src: mobileMockup,
    alt: 'Uruti app on mobile — iOS & Android',
    label: 'Available on Mobile',
  },
];

function HeroMockupCarousel() {
  const [active, setActive] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setActive((prev) => (prev + 1) % SLIDES.length);
        setFading(false);
      }, 500);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden lg:flex flex-col items-center justify-center relative select-none">
      {/* Glow backdrop */}
      <div className="absolute inset-0 flex items-center justify-center -z-10">
        <div className="w-[520px] h-[520px] bg-gradient-to-b from-[#ddffc2] via-[#76b947] to-[#9bcf6e] blur-[120px] opacity-40" />
      </div>

      {/* Mockup image */}
      <div
        className="transition-opacity duration-500"
        style={{ opacity: fading ? 0 : 1 }}
      >
        <img
          src={SLIDES[active].src}
          alt={SLIDES[active].alt}
          className="w-full max-w-[540px] object-contain drop-shadow-2xl"
          draggable={false}
        />
      </div>

      {/* Label badge */}
      <div
        className="mt-4 transition-opacity duration-500"
        style={{ opacity: fading ? 0 : 1 }}
      >
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#76B947]/10 border border-[#76B947]/30 text-[#76B947] text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-[#76B947] animate-pulse" />
          {SLIDES[active].label}
        </span>
      </div>

      {/* Dot indicators */}
      <div className="flex gap-2 mt-4">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => { setFading(true); setTimeout(() => { setActive(i); setFading(false); }, 500); }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === active ? 'bg-[#76B947] w-6' : 'bg-[#76B947]/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

interface LandingHomeProps {
  onNavigate: (page: string) => void;
}

export function LandingHome({ onNavigate }: LandingHomeProps) {
  const features = [
    {
      icon: Lightbulb,
      title: 'Startup Ideation',
      description: 'Transform your ideas into structured business concepts with AI-powered guidance and validation.',
      color: 'text-[#76B947]',
      bg: 'bg-gray-50 dark:bg-gray-800/50'
    },
    {
      icon: BarChart3,
      title: 'Uruti Score Ranking',
      description: 'Get publicly ranked on investment readiness metrics to attract the right investors.',
      color: 'text-[#76B947]',
      bg: 'bg-gray-50 dark:bg-gray-800/50'
    },
    {
      icon: Video,
      title: 'Pitch Performance',
      description: 'Practice and perfect your pitch with AI feedback on delivery, pacing, and confidence.',
      color: 'text-[#76B947]',
      bg: 'bg-gray-50 dark:bg-gray-800/50'
    },
    {
      icon: MessageSquare,
      title: 'AI Advisory Tracks',
      description: 'Navigate structured learning paths across Legal, Finance, Marketing, and Operations.',
      color: 'text-[#76B947]',
      bg: 'bg-gray-50 dark:bg-gray-800/50'
    },
    {
      icon: Users,
      title: 'Mentor Network',
      description: 'Connect with experienced mentors and investors through our comprehensive directory.',
      color: 'text-[#76B947]',
      bg: 'bg-gray-50 dark:bg-gray-800/50'
    },
    {
      icon: Calendar,
      title: 'Readiness Calendar',
      description: 'Track milestones, deadlines, and investment opportunities in one centralized hub.',
      color: 'text-[#76B947]',
      bg: 'bg-gray-50 dark:bg-gray-800/50'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Capture Your Idea',
      description: 'Start with a simple concept and let our AI help you structure it into a viable business model.',
      icon: Lightbulb
    },
    {
      number: '02',
      title: 'Chat with Uruti AI',
      description: 'Get instant guidance from our intelligent chatbot with voice support - your 24/7 entrepreneurship advisor.',
      icon: MessageSquare
    },
    {
      number: '03',
      title: 'Build & Refine',
      description: 'Develop your pitch, financials, and go-to-market strategy with expert mentorship and AI feedback.',
      icon: Target
    },
    {
      number: '04',
      title: 'Connect with Investors',
      description: 'Get matched with relevant investors based on your Uruti Score and industry alignment.',
      icon: TrendingUp
    }
  ];

  const testimonials = [
    {
      name: 'Amina Uwase',
      role: 'Founder, AgriConnect',
      content: 'Uruti transformed how I approached my startup. The AI advisory tracks gave me structure, and within 3 months, I secured seed funding.',
      avatar: 'AU',
      rating: 5
    },
    {
      name: 'Jean-Paul Nkunda',
      role: 'Founder, FinTech Rwanda',
      content: 'The pitch coach feature was a game-changer. I went from nervous presentations to confidently closing investor meetings.',
      avatar: 'JN',
      rating: 5
    },
    {
      name: 'Grace Mukamana',
      role: 'Investor, Kigali Ventures',
      content: 'As an investor, Uruti helps me discover high-quality startups that are truly investment-ready. The scoring system saves me hours of due diligence.',
      avatar: 'GM',
      rating: 5
    }
  ];

  const faqs = [
    {
      question: 'What is the Uruti Digital Ecosystem?',
      answer: 'Uruti is a comprehensive AI-driven platform that bridges the gap between startup ideation and investment funding for Rwandan entrepreneurs. We provide tools, mentorship, and connections to help founders become investment-ready.'
    },
    {
      question: 'How does the Uruti Score work?',
      answer: 'The Uruti Score is a proprietary metric that evaluates your startup across multiple dimensions including business model viability, market opportunity, team strength, and execution progress. Higher scores increase your visibility to investors.'
    },
    {
      question: 'Is Uruti only for tech startups?',
      answer: 'No! While we support tech ventures, Uruti is designed for entrepreneurs across all sectors including agriculture, education, healthcare, manufacturing, and services. Our AI advisory adapts to your industry.'
    },
    {
      question: 'How do I connect with investors?',
      answer: 'Once you achieve a strong Uruti Score, investors can discover your startup through our platform. You can also proactively connect with investors in our directory and schedule meetings through the calendar system.'
    },
    {
      question: 'What does it cost to use Uruti?',
      answer: 'We offer a free tier with core features for all founders. Premium plans unlock advanced AI advisory, unlimited mentor connections, and priority investor matching. Contact us for enterprise pricing.'
    }
  ];

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950">
      <LandingHeader onNavigate={onNavigate} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#76B947]/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#76B947]/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text Content */}
            <div className="text-center lg:text-left">
              <Badge className="mb-6 bg-[#76B947]/10 text-[#76B947] border-[#76B947]/20 hover:bg-[#76B947]/20">
                <Sparkles className="h-3 w-3 mr-1" />
                AI-Powered Entrepreneurship Platform
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 dark:text-white leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                Smart Ideation for every
                <br />
                <span className="text-[#76B947]">Founder</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground mb-10" style={{ fontFamily: 'var(--font-body)' }}>
                Bridge the gap between startup ideation and investment funding. Transform your ideas into investor-ready ventures with AI-driven guidance, expert mentorship, and Rwanda's largest entrepreneurship network.
              </p>

              <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 mb-8">
                <Button 
                  size="lg" 
                  className="bg-[#76B947] text-white hover:bg-[#76B947]/90 text-lg px-8 py-6 w-full sm:w-auto"
                  onClick={() => onNavigate('/signup')}
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Start Building Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-[#76B947] text-[#76B947] hover:bg-[#76B947]/10 text-lg px-8 py-6 w-full sm:w-auto"
                  onClick={() => onNavigate('/how-it-works')}
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  See How It Works
                </Button>
              </div>


            </div>

            {/* Right Side - Mockup Carousel */}
            <HeroMockupCarousel />
          </div>

          {/* Trusted By Section */}
          <div className="mt-20 text-center">
            <p className="text-sm text-muted-foreground mb-6" style={{ fontFamily: 'var(--font-body)' }}>
              Trusted by Rwanda's leading innovation ecosystem
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
              {['kLab', 'Norrsken', 'Westerwelle', 'Impact Hub', 'RDB', 'ICT Chamber'].map((partner) => (
                <div key={partner} className="glass-card px-6 py-3 rounded-lg">
                  <span className="font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    {partner}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-6 w-6 text-[#76B947]" />
        </div>
      </section>

      {/* Three Pillars of Growth */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Three pillars of growth
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-body)' }}>
              Built for Rwandan founders, validated by global investors
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="glass-card border-black/5 dark:border-white/10 hover:shadow-xl transition-shadow group">
              <CardContent className="pt-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Lightbulb className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  AI-driven ideation
                </h3>
                <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Turn rough concepts into structured business models with personalized AI guidance that understands Rwanda's unique market context.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-black/5 dark:border-white/10 hover:shadow-xl transition-shadow group">
              <CardContent className="pt-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#76B947] to-[#5a8f35] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  Data-backed ranking
                </h3>
                <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Get scored and publicly ranked on investment readiness. Higher scores mean better visibility to our network of active investors.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-black/5 dark:border-white/10 hover:shadow-xl transition-shadow group">
              <CardContent className="pt-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  Funding-stage mentorship
                </h3>
                <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Connect with experienced mentors and investors who've built successful ventures in Rwanda and beyond.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#76B947]/5">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Everything you need to succeed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-body)' }}>
              Six powerful modules designed to take you from idea to investment
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="glass-card border-black/5 dark:border-white/10 hover:border-[#76B947]/30 transition-all group">
                <CardContent className="pt-6">
                  <div className={`w-14 h-14 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`h-7 w-7 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              How it works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-body)' }}>
              Your journey from idea to investment in four simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="glass-card p-6 rounded-xl border border-black/5 dark:border-white/10 hover:border-[#76B947]/30 transition-all group h-full">
                  <div className="flex items-start mb-4">
                    <div className="w-12 h-12 rounded-lg bg-[#76B947]/10 flex items-center justify-center group-hover:bg-[#76B947]/20 transition-colors">
                      <step.icon className="h-6 w-6 text-[#76B947]" />
                    </div>
                    <span className="ml-auto text-5xl font-bold text-[#76B947]/20" style={{ fontFamily: 'var(--font-heading)' }}>
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-[#76B947]/30"></div>
                )}
              </div>
            ))}
          </div>

          {/* Visual Feature Showcase with Images */}
          
        </div>
      </section>

      {/* Ready to Build CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <Card className="glass-card border-black/5 dark:border-white/10 bg-gradient-to-br from-[#76B947]/10 to-purple-500/10 overflow-hidden relative">
            <CardContent className="p-12 sm:p-16 text-center relative z-10">
              <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
              <Award className="h-16 w-16 text-[#76B947] mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Ready to build?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8" style={{ fontFamily: 'var(--font-body)' }}>
                Join hundreds of Rwandan founders who are transforming their ideas into investable ventures
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-20">
                <Button 
                  size="lg" 
                  className="bg-[#76B947] text-white hover:bg-[#76B947]/90 text-lg px-8 py-6 cursor-pointer relative z-20"
                  onClick={() => onNavigate('/login')}
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-[#76B947] text-[#76B947] hover:bg-[#76B947]/10 text-lg px-8 py-6 cursor-pointer relative z-20"
                  onClick={() => onNavigate('/contact')}
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Schedule a Demo
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-6" style={{ fontFamily: 'var(--font-body)' }}>
                No credit card required • Free forever plan available
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#76B947]/5">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Real voices
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-body)' }}>
              Hear from founders and investors who are building the future with Uruti
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="glass-card border-black/5 dark:border-white/10">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Award key={i} className="h-4 w-4 text-[#76B947] fill-[#76B947]" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 italic" style={{ fontFamily: 'var(--font-body)' }}>
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-[#76B947]/20 flex items-center justify-center text-[#76B947] font-bold mr-3">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Questions?
            </h2>
            <p className="text-lg text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Everything you need to know about Uruti
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="glass-card border-black/5 dark:border-white/10 hover:border-[#76B947]/30 transition-all">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2 dark:text-white flex items-start" style={{ fontFamily: 'var(--font-heading)' }}>
                    <CheckCircle2 className="h-5 w-5 text-[#76B947] mr-2 mt-0.5 flex-shrink-0" />
                    {faq.question}
                  </h3>
                  <p className="text-muted-foreground ml-7" style={{ fontFamily: 'var(--font-body)' }}>
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-lg text-muted-foreground mb-4" style={{ fontFamily: 'var(--font-body)' }}>
              Still have questions?
            </p>
            <Button 
              variant="outline"
              className="border-[#76B947] text-[#76B947] hover:bg-[#76B947]/10"
              onClick={() => onNavigate('/contact')}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Contact Us
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#76B947]/5">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Stay in the loop
          </h2>
          <p className="text-lg text-muted-foreground mb-8" style={{ fontFamily: 'var(--font-body)' }}>
            Get weekly insights on entrepreneurship, funding opportunities, and success stories from Rwanda's startup ecosystem
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-1 glass-card border-black/10 dark:border-white/10"
              style={{ fontFamily: 'var(--font-body)' }}
            />
            <Button 
              className="bg-[#76B947] text-white hover:bg-[#76B947]/90"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Subscribe
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4" style={{ fontFamily: 'var(--font-body)' }}>
            Join 5,000+ founders already subscribed. Unsubscribe anytime.
          </p>
        </div>
      </section>

      <LandingFooter onNavigate={onNavigate} />
      <LiveChatWidget onNavigate={onNavigate} />
    </div>
  );
}