import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { 
  Target, 
  Users, 
  Globe, 
  Award,
  Lightbulb,
  Heart,
  TrendingUp
} from 'lucide-react';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';
import { LiveChatWidget } from '../LiveChatWidget';
import davidImage from 'figma:asset/b38d5413c55bf04f2a0cb1c3d346a2a056ec152d.png';

interface LandingAboutProps {
  onNavigate: (page: string) => void;
}

export function LandingAbout({ onNavigate }: LandingAboutProps) {
  const values = [
    {
      icon: Lightbulb,
      title: 'Innovation First',
      description: 'We believe every Rwandan has the potential to build world-class ventures. Our AI-driven approach democratizes access to entrepreneurship resources.'
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Success is collective. We foster a supportive ecosystem where founders, mentors, and investors collaborate to build Rwanda\'s future.'
    },
    {
      icon: Target,
      title: 'Impact Focused',
      description: 'We measure success by the startups funded, jobs created, and lives transformed across Rwanda and East Africa.'
    },
    {
      icon: Heart,
      title: 'Founder Empathy',
      description: 'Built by founders, for founders. We understand the challenges because we\'ve lived them, and we design solutions that truly help.'
    }
  ];

  const milestones = [
    { year: '2023', event: 'Uruti idea was born - Vision to democratize access to entrepreneurship resources' },
    { year: '2024', event: 'Started development focusing on web platform connecting founders and investors' },
    { year: '2025', event: 'Started working on AI models to provide intelligent guidance and pitch feedback' },
    { year: '2026', event: 'Integrated RL (Reinforcement Learning) models and started developing mobile app' }
  ];

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950">
      <LandingHeader onNavigate={onNavigate} />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Building Rwanda's
            <br />
            <span className="text-[#76B947]">Innovation Future</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto" style={{ fontFamily: 'var(--font-body)' }}>
            Uruti was born from a simple belief: every Rwandan entrepreneur deserves world-class tools, guidance, and connections to transform their ideas into investable ventures.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#76B947]/5">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card className="glass-card border-black/5 dark:border-white/10">
              <CardContent className="p-8 sm:p-12">
                <div className="w-16 h-16 rounded-2xl bg-[#76B947]/10 flex items-center justify-center mb-6">
                  <Target className="h-8 w-8 text-[#76B947]" />
                </div>
                <h2 className="text-3xl font-bold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  Our Mission
                </h2>
                <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
                  To bridge the gap between startup ideation and investment funding by providing AI-driven tools, expert mentorship, and a vibrant community that empowers Rwandan entrepreneurs to build scalable, sustainable ventures.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-black/5 dark:border-white/10">
              <CardContent className="p-8 sm:p-12">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center mb-6">
                  <Globe className="h-8 w-8 text-[#76B947]" />
                </div>
                <h2 className="text-3xl font-bold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  Our Vision
                </h2>
                <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
                  To position Rwanda as Africa's leading hub for AI-enabled entrepreneurship, where every founder has access to the resources, knowledge, and networks needed to compete globally and attract international investment.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Our Story
          </h2>
          <div className="space-y-6 text-lg text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
            <p>
              In 2023, our founder David Niyonshuti noticed a critical gap in Rwanda's entrepreneurship ecosystem. Talented founders with brilliant ideas were struggling to access the resources they needed to become investment-ready.
            </p>
            <p>
              The challenges were clear: entrepreneurs had to wait for pitch fest events just to get feedback on their pitch decks. They went through countless appointments trying to connect with the right investors or mentors. And on the other side, investors were overwhelmed analyzing ideas and projects, spending weeks in due diligence that could have been streamlined.
            </p>
            <p>
              David realized that the traditional approach wasn't scalable. Not everyone could attend pitch fests. Not every founder had access to the right networks. And investors were missing out on promising startups simply because the discovery process was inefficient.
            </p>
            <p>
              That's when the vision for Uruti was born: What if we could use AI to give every founder instant feedback on their pitch? What if we could eliminate the appointment chase by creating a centralized platform for connections? What if we could help investors quickly identify and evaluate promising startups through data-driven scoring?
            </p>
            <p>
              Today, Uruti is that solution. We're democratizing access to pitch feedback, simplifying founder-investor connections, and using AI to reduce the stress of analysis for both sides. We're proud to support over 2,000 active founders, facilitate millions in funding, and build the digital infrastructure that's accelerating Rwanda's innovation economy.
            </p>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#76B947]/5">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Our Values
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-body)' }}>
              The principles that guide everything we build
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="glass-card border-black/5 dark:border-white/10 hover:border-[#76B947]/30 transition-all group">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-xl bg-[#76B947]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <value.icon className="h-7 w-7 text-[#76B947]" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Founder Section - Redesigned Hero Style */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-white via-gray-100 to-[#76B947] dark:from-black dark:via-gray-800 dark:to-[#76B947] min-h-[700px] lg:min-h-[800px]">
            
            {/* Image - Positioned absolutely on the right side, behind content */}
            <div className="absolute right-0 top-0 bottom-0 w-full lg:w-1/2 flex items-stretch justify-center lg:justify-end pointer-events-none">
              <img 
                src={davidImage} 
                alt="David Niyonshuti - Founder" 
                className="h-full w-auto object-cover object-center max-w-md lg:max-w-none lg:w-full"
              />
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 sm:p-12 lg:p-16 items-start lg:items-stretch h-full">
              
              {/* Left Side - Content */}
              <div className="order-2 lg:order-1 space-y-6 flex flex-col justify-center lg:py-8">
                <div>
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-black dark:text-white leading-tight whitespace-nowrap" style={{ fontFamily: 'var(--font-heading)' }}>
                    DAVID NIYONSHUTI
                  </h2>
                  <p className="text-lg sm:text-xl text-black/80 dark:text-white/90 mb-2" style={{ fontFamily: 'var(--font-body)' }}>
                    Founder & CEO
                  </p>
                </div>

                <div className="space-y-4 text-black/70 dark:text-white/80" style={{ fontFamily: 'var(--font-body)' }}>
                  <p className="text-base sm:text-lg leading-relaxed">
                    David Niyonshuti is an entrepreneur and innovator passionate about democratizing access to entrepreneurship resources across Rwanda and East Africa.
                  </p>
                  <p className="text-base sm:text-lg leading-relaxed">
                    With a deep understanding of the challenges facing African founders, David founded Uruti to bridge critical gaps in access to mentorship, capital, and structured guidance.
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-6 pt-4">
                  <div className="glass-card border-black/10 dark:border-white/20 p-6 bg-white/50 dark:bg-white/10 rounded-[5px]">
                    <p className="text-4xl font-bold text-[#76B947] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>2023</p>
                    <p className="text-sm text-black/60 dark:text-white/70" style={{ fontFamily: 'var(--font-body)' }}>Founded Uruti</p>
                  </div>
                  <div className="glass-card border-black/10 dark:border-white/20 p-6 bg-white/50 dark:bg-white/10 rounded-[5px]">
                    <p className="text-4xl font-bold text-[#76B947] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>2,000+</p>
                    <p className="text-sm text-black/60 dark:text-white/70" style={{ fontFamily: 'var(--font-body)' }}>Founders Empowered</p>
                  </div>
                </div>
              </div>

              {/* Right Side - Empty spacer for desktop layout */}
              <div className="order-1 lg:order-2 hidden lg:block">
                {/* This maintains the grid layout while image is positioned absolutely */}
              </div>
            </div>

            {/* Bottom Section - Quote - Now overlays the image */}
            <div className="relative z-20 px-8 sm:px-12 lg:px-16 pb-8 lg:pb-12">
              <div className="glass-card border-black/10 dark:border-white/20 p-6 sm:p-8 max-w-4xl bg-white/60 dark:bg-black/60 backdrop-blur-md rounded-[5px]">
                <p className="text-base sm:text-lg italic text-black/80 dark:text-white/90 mb-4" style={{ fontFamily: 'var(--font-body)' }}>
                  "Every founder in Rwanda deserves the same access to resources, guidance, and capital as their counterparts in Silicon Valley. Uruti exists to make that vision a reality."
                </p>
                <p className="text-sm text-[#76B947] font-semibold" style={{ fontFamily: 'var(--font-body)' }}>
                  — David Niyonshuti
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#76B947]/5">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Our Journey
            </h2>
            <p className="text-lg text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Key milestones in building Rwanda's innovation infrastructure
            </p>
          </div>

          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-start gap-6 group">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-xl bg-[#76B947]/10 flex items-center justify-center group-hover:bg-[#76B947]/20 transition-colors">
                    <span className="text-2xl font-bold text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                      {milestone.year}
                    </span>
                  </div>
                </div>
                <Card className="flex-1 glass-card border-black/5 dark:border-white/10 group-hover:border-[#76B947]/30 transition-all">
                  <CardContent className="p-6">
                    <p className="text-lg dark:text-white" style={{ fontFamily: 'var(--font-body)' }}>
                      {milestone.event}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="glass-card rounded-2xl p-12 border border-black/5 dark:border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="flex items-center justify-center mb-3">
                  <Users className="h-8 w-8 text-[#76B947] mr-2" />
                  <span className="text-4xl font-bold text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>2,000+</span>
                </div>
                <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Active Founders</p>
              </div>
              <div>
                <div className="flex items-center justify-center mb-3">
                  <TrendingUp className="h-8 w-8 text-[#76B947] mr-2" />
                  <span className="text-4xl font-bold text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>$12M+</span>
                </div>
                <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Funding Facilitated</p>
              </div>
              <div>
                <div className="flex items-center justify-center mb-3">
                  <Award className="h-8 w-8 text-[#76B947] mr-2" />
                  <span className="text-4xl font-bold text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>350+</span>
                </div>
                <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Startups Funded</p>
              </div>
              <div>
                <div className="flex items-center justify-center mb-3">
                  <Globe className="h-8 w-8 text-[#76B947] mr-2" />
                  <span className="text-4xl font-bold text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>3</span>
                </div>
                <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Countries</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#76B947]/5">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Join Our Mission
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8" style={{ fontFamily: 'var(--font-body)' }}>
            Whether you're a founder, investor, or mentor, there's a place for you in the Uruti ecosystem
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-[#76B947] text-white hover:bg-[#76B947]/90"
              onClick={() => onNavigate('/login')}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Get Started Today
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-[#76B947] text-[#76B947] hover:bg-[#76B947]/10"
              onClick={() => onNavigate('/contact')}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Partner With Us
            </Button>
          </div>
        </div>
      </section>

      <LandingFooter onNavigate={onNavigate} />
      <LiveChatWidget onNavigate={onNavigate} />
    </div>
  );
}