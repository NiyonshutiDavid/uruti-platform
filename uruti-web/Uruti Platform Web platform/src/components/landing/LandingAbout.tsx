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

  const team = [
    {
      name: 'David Niyonshuti',
      role: 'Founder & CEO',
      bio: 'Entrepreneur and innovator passionate about democratizing access to entrepreneurship resources in Rwanda.',
      initials: 'DN'
    },
    {
      name: 'Patrick Mugabe',
      role: 'Head of Technology',
      bio: 'Ex-Google AI researcher passionate about democratizing access to intelligent tools.',
      initials: 'PM'
    },
    {
      name: 'Sarah Ndayisenga',
      role: 'Head of Community',
      bio: 'Serial entrepreneur who has raised $5M+ and mentored 200+ founders.',
      initials: 'SN'
    },
    {
      name: 'Emmanuel Habimana',
      role: 'Head of Partnerships',
      bio: 'Built strategic alliances with leading accelerators and investor networks across Africa.',
      initials: 'EH'
    }
  ];

  const milestones = [
    { year: '2023', event: 'Uruti founded with seed funding from Norrsken Foundation' },
    { year: '2024', event: 'Launched beta with 50 pilot founders' },
    { year: '2025', event: 'Supported 500+ startups, facilitated $12M in funding' },
    { year: '2026', event: 'Expanded to Kenya and Uganda, 2000+ active founders' }
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

      {/* Team Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Meet Our Team
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-body)' }}>
              Passionate leaders building the future of African entrepreneurship
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="glass-card border-black/5 dark:border-white/10 hover:shadow-xl transition-all text-center group">
                <CardContent className="pt-8 pb-6">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#76B947] to-[#5a8f35] flex items-center justify-center text-white text-2xl font-bold group-hover:scale-110 transition-transform">
                    {member.initials}
                  </div>
                  <h3 className="text-lg font-bold mb-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    {member.name}
                  </h3>
                  <p className="text-sm text-[#76B947] mb-3" style={{ fontFamily: 'var(--font-body)' }}>
                    {member.role}
                  </p>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    {member.bio}
                  </p>
                </CardContent>
              </Card>
            ))}
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
              onClick={() => onNavigate('login')}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Get Started Today
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-[#76B947] text-[#76B947] hover:bg-[#76B947]/10"
              onClick={() => onNavigate('contact')}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Partner With Us
            </Button>
          </div>
        </div>
      </section>

      <LandingFooter onNavigate={onNavigate} />
    </div>
  );
}