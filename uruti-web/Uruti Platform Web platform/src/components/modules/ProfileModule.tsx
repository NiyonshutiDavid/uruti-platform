import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { EditProfileDialog } from '../EditProfileDialog';
import { AddExperienceDialog, AddAchievementDialog, AddActivityDialog } from '../AddProfileContentDialogs';
import { StartupDetailsDialog } from '../StartupDetailsDialog';
import { ShareProfileDialog } from '../ShareProfileDialog';
import { 
  MapPin, 
  Link as LinkIcon, 
  Mail, 
  Phone,
  Edit,
  Share2,
  MessageSquare,
  Star,
  Briefcase,
  GraduationCap,
  Award,
  TrendingUp,
  Users,
  FileText,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Building2,
  Rocket,
  DollarSign,
  Target,
  Globe,
  Plus
} from 'lucide-react';

interface ProfileModuleProps {
  userId?: string;
  userType?: 'founder' | 'investor';
  isOwnProfile?: boolean;
  onEdit?: () => void;
  onMessage?: () => void;
}

// Mock data for founder profile
const mockFounderProfile = {
  id: '1',
  name: 'Jean Paul Uwimana',
  role: 'Tech Entrepreneur & Founder',
  location: 'Kigali, Rwanda',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
  coverImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=300&fit=crop',
  bio: 'Passionate entrepreneur building innovative solutions for African agriculture. Founder of AgriConnect, empowering farmers through technology and data-driven insights. Committed to sustainable development and food security across Rwanda and East Africa.',
  email: 'jean.uwimana@agriconnect.rw',
  phone: '+250 788 123 456',
  website: 'www.agriconnect.rw',
  linkedIn: 'linkedin.com/in/jeanuwimana',
  connections: 342,
  followers: 1205,
  verified: true,
  skills: ['AgriTech', 'Business Development', 'Product Management', 'Fundraising', 'Team Leadership', 'Market Strategy'],
  experience: [
    {
      title: 'Founder & CEO',
      company: 'AgriConnect',
      location: 'Kigali, Rwanda',
      startDate: 'Jan 2023',
      endDate: 'Present',
      current: true,
      description: 'Leading a team of 12 to build Rwanda\'s premier agricultural marketplace connecting farmers directly to buyers. Raised $250K in pre-seed funding.',
      logo: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=100&h=100&fit=crop'
    },
    {
      title: 'Product Manager',
      company: 'TechHub Rwanda',
      location: 'Kigali, Rwanda',
      startDate: 'Jun 2021',
      endDate: 'Dec 2022',
      current: false,
      description: 'Managed product development for mobile banking solutions serving 50K+ users across Rwanda.',
      logo: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=100&h=100&fit=crop'
    }
  ],
  education: [
    {
      institution: 'University of Rwanda',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: '2017',
      endDate: '2021',
      logo: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=100&h=100&fit=crop'
    }
  ],
  startups: [
    {
      name: 'AgriConnect',
      stage: 'Pre-Seed',
      industry: 'AgriTech',
      fundingRaised: '$250K',
      readinessScore: 78,
      description: 'Agricultural marketplace connecting farmers to buyers',
      logo: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=100&h=100&fit=crop'
    }
  ],
  achievements: [
    { title: 'Top 10 African AgriTech Startups 2024', issuer: 'Africa Tech Summit', date: 'Feb 2024' },
    { title: 'Rwanda Innovation Challenge Winner', issuer: 'Government of Rwanda', date: 'Nov 2023' },
    { title: 'Certified Scrum Product Owner', issuer: 'Scrum Alliance', date: 'Mar 2022' }
  ],
  activity: [
    { type: 'pitch', content: 'Completed pitch at Rwanda Tech Investors Summit', date: '2 days ago' },
    { type: 'milestone', content: 'Reached 1,000 registered farmers on AgriConnect', date: '1 week ago' },
    { type: 'funding', content: 'Closed $250K pre-seed round', date: '2 weeks ago' }
  ]
};

// Mock data for investor profile
const mockInvestorProfile = {
  id: '2',
  name: 'Sarah Mutesi',
  role: 'Angel Investor & Venture Partner',
  location: 'Kigali, Rwanda',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
  coverImage: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=1200&h=300&fit=crop',
  bio: 'Angel investor focused on early-stage African tech startups. Partner at East Africa Ventures. Former COO at Rwanda Digital Solutions. Passionate about empowering entrepreneurs and driving innovation across East Africa.',
  email: 'sarah.mutesi@eaventures.com',
  phone: '+250 788 987 654',
  website: 'www.sarahmutesi.com',
  linkedIn: 'linkedin.com/in/sarahmutesi',
  connections: 856,
  followers: 3420,
  verified: true,
  skills: ['Venture Capital', 'Investment Strategy', 'Due Diligence', 'Portfolio Management', 'Mentorship', 'Business Strategy'],
  experience: [
    {
      title: 'Venture Partner',
      company: 'East Africa Ventures',
      location: 'Kigali, Rwanda',
      startDate: 'Jan 2022',
      endDate: 'Present',
      current: true,
      description: 'Managing a $5M fund focused on early-stage tech startups in East Africa. Led 12 investments with average returns of 3.2x.',
      logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop'
    },
    {
      title: 'Chief Operating Officer',
      company: 'Rwanda Digital Solutions',
      location: 'Kigali, Rwanda',
      startDate: 'Mar 2019',
      endDate: 'Dec 2021',
      current: false,
      description: 'Led operations for Rwanda\'s leading digital transformation consultancy. Grew team from 15 to 60 employees.',
      logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&h=100&fit=crop'
    }
  ],
  education: [
    {
      institution: 'INSEAD',
      degree: 'MBA',
      field: 'Business Administration',
      startDate: '2015',
      endDate: '2017',
      logo: 'https://images.unsplash.com/photo-1562774053-701939374585?w=100&h=100&fit=crop'
    },
    {
      institution: 'University of Rwanda',
      degree: 'Bachelor of Commerce',
      field: 'Finance',
      startDate: '2009',
      endDate: '2013',
      logo: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=100&h=100&fit=crop'
    }
  ],
  portfolio: [
    {
      name: 'AgriConnect',
      stage: 'Pre-Seed',
      industry: 'AgriTech',
      investmentAmount: '$50K',
      investmentDate: 'Jan 2024',
      equity: '8%',
      status: 'Active',
      logo: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=100&h=100&fit=crop'
    },
    {
      name: 'HealthTech Rwanda',
      stage: 'Seed',
      industry: 'HealthTech',
      investmentAmount: '$100K',
      investmentDate: 'Sep 2023',
      equity: '12%',
      status: 'Active',
      logo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=100&h=100&fit=crop'
    },
    {
      name: 'EduPlatform',
      stage: 'Series A',
      industry: 'EdTech',
      investmentAmount: '$200K',
      investmentDate: 'Mar 2023',
      equity: '5%',
      status: 'Exited',
      logo: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=100&h=100&fit=crop'
    }
  ],
  investmentFocus: ['AgriTech', 'FinTech', 'HealthTech', 'EdTech', 'CleanTech'],
  checkSize: '$25K - $250K',
  totalInvestments: 18,
  activeInvestments: 12,
  achievements: [
    { title: 'Top 50 African Investors 2024', issuer: 'African Business Magazine', date: 'Mar 2024' },
    { title: 'Rwanda Business Leader Award', issuer: 'Rwanda Chamber of Commerce', date: 'Dec 2023' },
    { title: 'Women in Tech Mentor of the Year', issuer: 'Rwanda Tech Community', date: 'Aug 2023' }
  ],
  activity: [
    { type: 'investment', content: 'Invested $50K in AgriConnect', date: '3 days ago' },
    { type: 'event', content: 'Speaking at East Africa Tech Summit', date: '1 week ago' },
    { type: 'milestone', content: 'Portfolio company HealthTech Rwanda raised Series A', date: '2 weeks ago' }
  ]
};

export function ProfileModule({ 
  userId, 
  userType = 'founder', 
  isOwnProfile = true,
  onEdit,
  onMessage 
}: ProfileModuleProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [addExperienceOpen, setAddExperienceOpen] = useState(false);
  const [addAchievementOpen, setAddAchievementOpen] = useState(false);
  const [addActivityOpen, setAddActivityOpen] = useState(false);
  const [shareProfileOpen, setShareProfileOpen] = useState(false);
  const [startupDetailsOpen, setStartupDetailsOpen] = useState(false);
  const [selectedStartup, setSelectedStartup] = useState<any>(null);
  
  // Use mock data based on user type
  const [profile, setProfile] = useState(userType === 'founder' ? mockFounderProfile : mockInvestorProfile);

  const handleSaveProfile = (updatedProfile: any) => {
    setProfile({ ...profile, ...updatedProfile });
  };

  const handleAddExperience = (experience: any) => {
    setProfile({
      ...profile,
      experience: [experience, ...profile.experience]
    });
  };

  const handleAddAchievement = (achievement: any) => {
    setProfile({
      ...profile,
      achievements: [achievement, ...profile.achievements]
    });
  };

  const handleAddActivity = (activity: any) => {
    setProfile({
      ...profile,
      activity: [activity, ...profile.activity]
    });
  };

  const handleViewStartupDetails = (startup: any) => {
    setSelectedStartup(startup);
    setStartupDetailsOpen(true);
  };

  const profileUrl = `https://uruti.rw/profile/${profile.id}/${profile.name.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Cover Image & Profile Header */}
      <Card className="glass-card border-black/5 dark:border-white/10 overflow-hidden">
        {/* Cover Photo */}
        <div className="relative h-48 bg-gradient-to-r from-black via-gray-800 to-[#76B947]">
          <img 
            src={profile.coverImage} 
            alt="Cover" 
            className="w-full h-full object-cover opacity-40"
          />
          {isOwnProfile && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 hover:text-white hover:border-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Cover
            </Button>
          )}
        </div>

        <CardContent className="pt-0">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between -mt-16 md:-mt-20 gap-4">
            {/* Avatar & Basic Info */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4">
              <div className="relative">
                <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-white dark:border-gray-900 shadow-xl">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback className="bg-[#76B947]/20 text-[#76B947] text-4xl">
                    {profile.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {profile.verified && (
                  <div className="absolute bottom-2 right-2 bg-[#76B947] rounded-full p-1.5">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>

              <div className="text-center md:text-left space-y-2 mb-4">
                <div>
                  <h1 className="text-3xl font-bold dark:text-white flex items-center justify-center md:justify-start gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
                    {profile.name}
                  </h1>
                  <p className="text-lg text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    {profile.role}
                  </p>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{profile.connections} connections</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-[#76B947] fill-[#76B947]" />
                    <span>{profile.followers} followers</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              {isOwnProfile ? (
                <Button
                  onClick={() => setEditProfileOpen(true)}
                  className="bg-[#76B947] hover:bg-[#5a8f35] text-white"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('navigate-to-messages'));
                    }}
                    className="bg-[#76B947] hover:bg-[#5a8f35] text-white"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => setShareProfileOpen(true)}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <Card className="glass-card border-black/5 dark:border-white/10">
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0">
            <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-[#76B947] rounded-none">
              Overview
            </TabsTrigger>
            <TabsTrigger value="experience" className="data-[state=active]:border-b-2 data-[state=active]:border-[#76B947] rounded-none">
              Experience
            </TabsTrigger>
            <TabsTrigger value={userType === 'founder' ? 'startups' : 'portfolio'} className="data-[state=active]:border-b-2 data-[state=active]:border-[#76B947] rounded-none">
              {userType === 'founder' ? 'Startups' : 'Portfolio'}
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:border-b-2 data-[state=active]:border-[#76B947] rounded-none">
              Activity
            </TabsTrigger>
          </TabsList>
        </Card>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* About Section */}
              <Card className="glass-card border-black/5 dark:border-white/10">
                <CardHeader>
                  <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
                    {profile.bio}
                  </p>
                </CardContent>
              </Card>

              {/* Skills */}
              <Card className="glass-card border-black/5 dark:border-white/10">
                <CardHeader>
                  <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Skills & Expertise</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <Badge 
                        key={index} 
                        className="bg-[#76B947]/10 text-[#76B947] hover:bg-[#76B947]/20 border border-[#76B947]/30"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Experience Preview */}
              <Card className="glass-card border-black/5 dark:border-white/10">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Experience</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('experience')}>
                    View all
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.experience.slice(0, 2).map((exp, index) => (
                    <div key={index} className="flex gap-4">
                      <Avatar className="h-12 w-12 border border-[#76B947]/30">
                        <AvatarImage src={exp.logo} />
                        <AvatarFallback className="bg-[#76B947]/10 text-[#76B947]">
                          {exp.company.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                          {exp.title}
                        </h4>
                        <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                          {exp.company}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {exp.startDate} - {exp.endDate} • {exp.location}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Contact Info */}
              <Card className="glass-card border-black/5 dark:border-white/10">
                <CardHeader>
                  <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-[#76B947]" />
                    <span className="text-muted-foreground">{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-[#76B947]" />
                    <span className="text-muted-foreground">{profile.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="h-4 w-4 text-[#76B947]" />
                    <a href={`https://${profile.website}`} className="text-[#76B947] hover:underline">
                      {profile.website}
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <LinkIcon className="h-4 w-4 text-[#76B947]" />
                    <a href={`https://${profile.linkedIn}`} className="text-[#76B947] hover:underline">
                      LinkedIn Profile
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Investment Focus (for investors) or Startup Info (for founders) */}
              {userType === 'investor' ? (
                <Card className="glass-card border-black/5 dark:border-white/10">
                  <CardHeader>
                    <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Investment Focus</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">INDUSTRIES</p>
                      <div className="flex flex-wrap gap-2">
                        {mockInvestorProfile.investmentFocus.map((focus, index) => (
                          <Badge key={index} variant="outline" className="border-[#76B947] text-[#76B947]">
                            {focus}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">CHECK SIZE</p>
                      <p className="font-semibold text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                        {mockInvestorProfile.checkSize}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">TOTAL INVESTMENTS</p>
                        <p className="text-2xl font-bold text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                          {mockInvestorProfile.totalInvestments}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">ACTIVE</p>
                        <p className="text-2xl font-bold text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                          {mockInvestorProfile.activeInvestments}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="glass-card border-black/5 dark:border-white/10">
                  <CardHeader>
                    <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Current Venture</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border border-[#76B947]/30">
                          <AvatarImage src={mockFounderProfile.startups[0].logo} />
                          <AvatarFallback className="bg-[#76B947]/10 text-[#76B947]">
                            AC
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                            {mockFounderProfile.startups[0].name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {mockFounderProfile.startups[0].industry}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Readiness Score</span>
                          <span className="font-semibold text-[#76B947]">
                            {mockFounderProfile.startups[0].readinessScore}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Stage</span>
                          <Badge className="bg-[#76B947] text-white">
                            {mockFounderProfile.startups[0].stage}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Funding Raised</span>
                          <span className="font-semibold dark:text-white">
                            {mockFounderProfile.startups[0].fundingRaised}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Achievements */}
              <Card className="glass-card border-black/5 dark:border-white/10">
                <CardHeader>
                  <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>
                    <Award className="h-5 w-5 inline mr-2 text-[#76B947]" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.achievements.map((achievement, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#76B947]/10 flex items-center justify-center flex-shrink-0">
                        <Award className="h-5 w-5 text-[#76B947]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                          {achievement.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {achievement.issuer} • {achievement.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Experience Tab */}
        <TabsContent value="experience" className="space-y-6">
          {/* Experience */}
          <Card className="glass-card border-black/5 dark:border-white/10">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>
                <Briefcase className="h-5 w-5 inline mr-2 text-[#76B947]" />
                Professional Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile.experience.map((exp, index) => (
                <div key={index} className="flex gap-4 pb-6 border-b last:border-b-0 dark:border-gray-700">
                  <Avatar className="h-14 w-14 border border-[#76B947]/30">
                    <AvatarImage src={exp.logo} />
                    <AvatarFallback className="bg-[#76B947]/10 text-[#76B947]">
                      {exp.company.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-lg dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                          {exp.title}
                        </h4>
                        <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                          {exp.company}
                        </p>
                      </div>
                      {exp.current && (
                        <Badge className="bg-[#76B947] text-white">Current</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {exp.startDate} - {exp.endDate} • {exp.location}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
                      {exp.description}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Education */}
          <Card className="glass-card border-black/5 dark:border-white/10">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>
                <GraduationCap className="h-5 w-5 inline mr-2 text-[#76B947]" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile.education.map((edu, index) => (
                <div key={index} className="flex gap-4">
                  <Avatar className="h-14 w-14 border border-[#76B947]/30">
                    <AvatarImage src={edu.logo} />
                    <AvatarFallback className="bg-[#76B947]/10 text-[#76B947]">
                      {edu.institution.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                      {edu.institution}
                    </h4>
                    <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                      {edu.degree} in {edu.field}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {edu.startDate} - {edu.endDate}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Startups/Portfolio Tab */}
        <TabsContent value={userType === 'founder' ? 'startups' : 'portfolio'} className="space-y-6">
          <Card className="glass-card border-black/5 dark:border-white/10">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>
                {userType === 'founder' ? (
                  <>
                    <Rocket className="h-5 w-5 inline mr-2 text-[#76B947]" />
                    My Startups
                  </>
                ) : (
                  <>
                    <DollarSign className="h-5 w-5 inline mr-2 text-[#76B947]" />
                    Investment Portfolio
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userType === 'founder' ? (
                mockFounderProfile.startups.map((startup, index) => (
                  <div key={index} className="glass-panel p-6 rounded-xl hover:bg-[#76B947]/5 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex gap-4">
                        <Avatar className="h-16 w-16 border border-[#76B947]/30">
                          <AvatarImage src={startup.logo} />
                          <AvatarFallback className="bg-[#76B947]/10 text-[#76B947]">
                            {startup.name.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-lg dark:text-white mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                            {startup.name}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2" style={{ fontFamily: 'var(--font-body)' }}>
                            {startup.description}
                          </p>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="border-[#76B947] text-[#76B947]">
                              {startup.industry}
                            </Badge>
                            <Badge className="bg-[#76B947] text-white">
                              {startup.stage}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">FUNDING RAISED</p>
                        <p className="text-lg font-bold text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                          {startup.fundingRaised}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">READINESS SCORE</p>
                        <p className="text-lg font-bold text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                          {startup.readinessScore}%
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => handleViewStartupDetails(startup)}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                mockInvestorProfile.portfolio.map((investment, index) => (
                  <div key={index} className="glass-panel p-6 rounded-xl hover:bg-[#76B947]/5 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex gap-4">
                        <Avatar className="h-16 w-16 border border-[#76B947]/30">
                          <AvatarImage src={investment.logo} />
                          <AvatarFallback className="bg-[#76B947]/10 text-[#76B947]">
                            {investment.name.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-lg dark:text-white mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                            {investment.name}
                          </h4>
                          <div className="flex gap-2 mb-2">
                            <Badge variant="outline" className="border-[#76B947] text-[#76B947]">
                              {investment.industry}
                            </Badge>
                            <Badge className={investment.status === 'Active' ? 'bg-[#76B947] text-white' : 'bg-gray-500 text-white'}>
                              {investment.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">INVESTMENT</p>
                        <p className="text-lg font-bold text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                          {investment.investmentAmount}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">EQUITY</p>
                        <p className="text-lg font-bold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                          {investment.equity}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">DATE</p>
                        <p className="text-sm font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                          {investment.investmentDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm">
                        <Target className="h-4 w-4 mr-2" />
                        View Startup
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card className="glass-card border-black/5 dark:border-white/10">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>
                <TrendingUp className="h-5 w-5 inline mr-2 text-[#76B947]" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.activity.map((item, index) => (
                <div key={index} className="glass-panel p-4 rounded-lg hover:bg-[#76B947]/5 transition-all">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      item.type === 'pitch' ? 'bg-blue-500/10' :
                      item.type === 'milestone' ? 'bg-[#76B947]/10' :
                      item.type === 'funding' ? 'bg-purple-500/10' :
                      item.type === 'investment' ? 'bg-green-500/10' :
                      'bg-gray-500/10'
                    }`}>
                      {item.type === 'pitch' && <FileText className="h-5 w-5 text-blue-500" />}
                      {item.type === 'milestone' && <Target className="h-5 w-5 text-[#76B947]" />}
                      {item.type === 'funding' && <DollarSign className="h-5 w-5 text-purple-500" />}
                      {item.type === 'investment' && <TrendingUp className="h-5 w-5 text-green-500" />}
                      {item.type === 'event' && <Calendar className="h-5 w-5 text-orange-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm dark:text-white" style={{ fontFamily: 'var(--font-body)' }}>
                        {item.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{item.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <EditProfileDialog
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
        profile={profile}
        onSave={handleSaveProfile}
      />
      <AddExperienceDialog
        open={addExperienceOpen}
        onOpenChange={setAddExperienceOpen}
        onAdd={handleAddExperience}
      />
      <AddAchievementDialog
        open={addAchievementOpen}
        onOpenChange={setAddAchievementOpen}
        onAdd={handleAddAchievement}
      />
      <AddActivityDialog
        open={addActivityOpen}
        onOpenChange={setAddActivityOpen}
        onAdd={handleAddActivity}
      />
      <ShareProfileDialog
        open={shareProfileOpen}
        onOpenChange={setShareProfileOpen}
        profileName={profile.name}
        profileUrl={profileUrl}
      />
      {selectedStartup && (
        <StartupDetailsDialog
          open={startupDetailsOpen}
          onOpenChange={setStartupDetailsOpen}
          startup={selectedStartup}
        />
      )}
    </div>
  );
}