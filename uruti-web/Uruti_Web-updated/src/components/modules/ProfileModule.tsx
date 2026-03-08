import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { EditProfileDialog } from '../EditProfileDialog';
import { AddAchievementDialog } from '../AddProfileContentDialogs';
import { StartupDetailsDialog } from '../StartupDetailsDialog';
import { ShareProfileDialog } from '../ShareProfileDialog';
import { useAuth } from '../../lib/auth-context';
import { apiClient } from '../../lib/api-client';
import { toast } from 'sonner';
import { 
  MapPin, 
  Link as LinkIcon, 
  Mail, 
  Phone,
  Edit,
  Share2,
  MessageSquare,
  Award,
  Users,
  ExternalLink,
  CheckCircle2,
  Rocket,
  DollarSign,
  Target,
  Globe,
} from 'lucide-react';

interface ProfileModuleProps {
  userId?: string;
  userType?: 'founder' | 'investor';
  isOwnProfile?: boolean;
  onEdit?: () => void;
  onMessage?: () => void;
}

export function ProfileModule({ 
  userId, 
  userType = 'founder', 
  isOwnProfile = true,
  onEdit,
  onMessage 
}: ProfileModuleProps) {
  const { user, updateUser } = useAuth();
  const isPersistableMediaUrl = (value?: string) => {
    if (!value) return false;
    return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/');
  };

  const mapUserToProfile = (source: any) => ({
    id: source?.id || '1',
    name: source?.full_name || source?.name || 'User',
    role: source?.role === 'founder' ? 'Entrepreneur' : source?.role === 'investor' ? 'Investor' : 'User',
    location: source?.location || '',
    avatar: source?.avatar_url || '',
    coverImage: source?.cover_image_url || '',
    bio: source?.bio || '',
    email: source?.email || '',
    phone: source?.phone || '',
    website: source?.website_url || '',
    linkedIn: source?.linkedin_url || '',
    company: source?.company || '',
    skills: source?.expertise || [],
    achievements: source?.achievements || [],
    investmentFocus: source?.investment_focus || [],
    preferredSectors: source?.preferred_sectors || [],
    industry: source?.industry || '',
    stage: source?.stage || '',
    funding_amount: source?.funding_amount || '',
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [addAchievementOpen, setAddAchievementOpen] = useState(false);
  const [shareProfileOpen, setShareProfileOpen] = useState(false);
  const [refreshingProfile, setRefreshingProfile] = useState(false);
  const [startupDetailsOpen, setStartupDetailsOpen] = useState(false);
  const [selectedStartup, setSelectedStartup] = useState<any>(null);
  
  // Initialize profile with data from account creation
  const [profile, setProfile] = useState({
    ...mapUserToProfile(user),
    connections: 0,
    verified: false,
    skills: mapUserToProfile(user).skills,
    startups: [] as any[],
    achievements: mapUserToProfile(user).achievements,
    investments: [] as any[],
    portfolio: [] as any[],
    investmentThesis: '',
    ticketSize: '',
    preferredSectors: mapUserToProfile(user).preferredSectors,
    investmentFocus: mapUserToProfile(user).investmentFocus,
    company: mapUserToProfile(user).company,
    industry: mapUserToProfile(user).industry,
    stage: mapUserToProfile(user).stage,
    funding_amount: mapUserToProfile(user).funding_amount,
  });

  const hydrateProfile = async () => {
    if (!user) return;
    try {
      const [latestUser, connections, myVentures] = await Promise.all([
        apiClient.getCurrentUser(),
        apiClient.getConnections().catch(() => []),
        userType === 'founder' ? apiClient.getMyVentures().catch(() => []) : Promise.resolve([]),
      ]);
      const mapped = mapUserToProfile(latestUser);

      // Use actual connection list length (all returned connections are accepted)
      const connectionCount = (connections || []).length;

      // Map ventures to the profile startup format
      const startups = (myVentures || []).map((v: any) => ({
        name: v.name || '',
        description: v.tagline || v.description || '',
        industry: v.industry || v.sector || '',
        stage: v.stage || '',
        fundingRaised: v.funding_amount || v.funding_raised || '$0',
        readinessScore: v.uruti_score || v.readiness_score || 0,
        logo: v.logo_url || '',
        id: v.id,
      }));

      setProfile((prev) => ({
        ...prev,
        ...mapped,
        connections: connectionCount,
        startups,
      }));

      updateUser({
        full_name: latestUser.full_name,
        avatar_url: latestUser.avatar_url,
        bio: latestUser.bio,
      });
    } catch (error) {
      console.error('Error hydrating profile data:', error);
    }
  };

  useEffect(() => {
    hydrateProfile();
  }, [user?.id]);

  const handleRefreshProfile = async () => {
    setRefreshingProfile(true);
    try {
      await hydrateProfile();
      toast.success('Profile refreshed');
    } finally {
      setRefreshingProfile(false);
    }
  };

  const handleSaveProfile = async (updatedProfile: any) => {
    try {
      // Prepare profile data for backend
      const profileData: any = {
        full_name: updatedProfile.name,
        bio: updatedProfile.bio,
        location: updatedProfile.location,
        phone: updatedProfile.phone,
        website_url: updatedProfile.website,
        linkedin_url: updatedProfile.linkedIn,
        twitter_url: updatedProfile.twitter,
        expertise: updatedProfile.skills || [],
        company: updatedProfile.company || '',
      };

      // Add founder-specific fields
      if (userType === 'founder') {
        if (updatedProfile.industry) profileData.industry = updatedProfile.industry;
        if (updatedProfile.stage) profileData.stage = updatedProfile.stage;
        if (updatedProfile.funding_amount) profileData.funding_amount = updatedProfile.funding_amount;
      }

      // Add investor-specific fields if user is investor
      if (userType === 'investor') {
        if (updatedProfile.organizationName) profileData.company = updatedProfile.organizationName;
        if (updatedProfile.investorType) profileData.investor_type = updatedProfile.investorType;
        if (updatedProfile.investmentRange) profileData.investment_range = updatedProfile.investmentRange;
        if (updatedProfile.investmentStage) profileData.investment_stage = updatedProfile.investmentStage;
        if (updatedProfile.portfolioSize) profileData.portfolio_size = updatedProfile.portfolioSize;
        if (updatedProfile.investmentThesis) profileData.investment_thesis = updatedProfile.investmentThesis;
        if (updatedProfile.ticketSize) profileData.ticket_size = updatedProfile.ticketSize;
        if (updatedProfile.preferredSectors && updatedProfile.preferredSectors.length > 0) {
          profileData.preferred_sectors = updatedProfile.preferredSectors;
        }
        if (updatedProfile.investmentFocus && updatedProfile.investmentFocus.length > 0) {
          profileData.investment_focus = updatedProfile.investmentFocus;
        }
      }

      // Common fields for both roles
      if (updatedProfile.achievements && updatedProfile.achievements.length > 0) {
        profileData.achievements = updatedProfile.achievements;
      }

      // Upload avatar if it's a new image (base64 data)
      if (updatedProfile.avatar && updatedProfile.avatar.startsWith('data:image')) {
        try {
          console.log('Uploading avatar image...');
          // Convert base64 to blob
          const response = await fetch(updatedProfile.avatar);
          const blob = await response.blob();
          const file = new File([blob], 'avatar.png', { type: blob.type });
          
          // Upload to backend
          const avatarResponse = await apiClient.uploadAvatar(file);
          console.log('Avatar upload response:', avatarResponse);
          if (avatarResponse && avatarResponse.avatar_url) {
            console.log('Avatar URL set to:', avatarResponse.avatar_url);
            updatedProfile.avatar = avatarResponse.avatar_url;
          } else {
            console.warn('Avatar upload response missing avatar_url field:', avatarResponse);
          }
        } catch (avatarError) {
          console.error('Avatar upload error:', avatarError);
          toast.error('Failed to upload avatar. Profile saved without avatar update.');
        }
      }

      // Upload cover image if it's a new image (base64 data)
      if (updatedProfile.coverImage && updatedProfile.coverImage.startsWith('data:image')) {
        try {
          console.log('Uploading cover image...');
          // Convert base64 to blob
          const response = await fetch(updatedProfile.coverImage);
          const blob = await response.blob();
          const file = new File([blob], 'cover.png', { type: blob.type });
          
          // Upload to backend
          const coverResponse = await apiClient.uploadCoverImage(file);
          console.log('Cover image upload response:', coverResponse);
          if (coverResponse && coverResponse.cover_image_url) {
            console.log('Cover image URL set to:', coverResponse.cover_image_url);
            updatedProfile.coverImage = coverResponse.cover_image_url;
          } else {
            console.warn('Cover image upload response missing cover_image_url field:', coverResponse);
          }
        } catch (coverError) {
          console.error('Cover image upload error:', coverError);
          toast.error('Failed to upload cover image. Profile saved without cover update.');
        }
      }

      if (updatedProfile.avatar === '' || updatedProfile.avatar === null) {
        profileData.avatar_url = null;
      } else if (isPersistableMediaUrl(updatedProfile.avatar)) {
        profileData.avatar_url = updatedProfile.avatar;
      } else if (isPersistableMediaUrl(profile.avatar)) {
        profileData.avatar_url = profile.avatar;
      }

      if (updatedProfile.coverImage === '' || updatedProfile.coverImage === null) {
        profileData.cover_image_url = null;
      } else if (isPersistableMediaUrl(updatedProfile.coverImage)) {
        profileData.cover_image_url = updatedProfile.coverImage;
      } else if (isPersistableMediaUrl(profile.coverImage)) {
        profileData.cover_image_url = profile.coverImage;
      }

      // Update profile data on backend
      console.log('Saving profile data to backend:', profileData);
      const savedUser = await apiClient.updateProfile(profileData);
      const mapped = mapUserToProfile(savedUser);
      
      // Update local state
      setProfile((prev) => ({ ...prev, ...updatedProfile, ...mapped }));

      updateUser({
        full_name: savedUser?.full_name,
        avatar_url: savedUser?.avatar_url,
        bio: savedUser?.bio,
      });
      
      // Dispatch event to update avatar in header and everywhere else
      window.dispatchEvent(new CustomEvent('profile-updated', { 
        detail: { 
          avatar: mapped.avatar,
          name: mapped.name,
          fullProfile: { ...profile, ...updatedProfile, ...mapped }
        } 
      }));

    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile. Please try again.');
      throw error;
    }
  };

  const handleAddAchievement = (achievement: any) => {
    setProfile({
      ...profile,
      achievements: [achievement, ...profile.achievements]
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
          {profile.coverImage && (
            <img 
              src={profile.coverImage} 
              alt="Cover" 
              className="w-full h-full object-cover opacity-40"
            />
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
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              {isOwnProfile ? (
                <>
                  <Button
                    onClick={() => setEditProfileOpen(true)}
                    className="bg-[#76B947] hover:bg-[#5a8f35] text-white"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button variant="outline" onClick={handleRefreshProfile} disabled={refreshingProfile}>
                    {refreshingProfile ? 'Refreshing...' : 'Refresh Profile'}
                  </Button>
                </>
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
            <TabsTrigger value={userType === 'founder' ? 'startups' : 'portfolio'} className="data-[state=active]:border-b-2 data-[state=active]:border-[#76B947] rounded-none">
              {userType === 'founder' ? 'Startups' : 'Portfolio'}
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
                        {profile.preferredSectors.length > 0 ? (
                          profile.preferredSectors.map((sector, index) => (
                            <Badge key={index} variant="outline" className="border-[#76B947] text-[#76B947]">
                              {sector}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No sectors specified</p>
                        )}
                      </div>
                    </div>
                    {profile.ticketSize && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">CHECK SIZE</p>
                        <p className="font-semibold text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                          {profile.ticketSize}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">TOTAL INVESTMENTS</p>
                        <p className="text-2xl font-bold text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                          {profile.investments.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">ACTIVE</p>
                        <p className="text-2xl font-bold text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                          {profile.investments.filter((inv: any) => inv.status === 'Active').length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                profile.startups.length > 0 ? (
                  <Card className="glass-card border-black/5 dark:border-white/10">
                    <CardHeader>
                      <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Current Venture</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 border border-[#76B947]/30">
                            <AvatarImage src={profile.startups[0].logo} />
                            <AvatarFallback className="bg-[#76B947]/10 text-[#76B947]">
                              {profile.startups[0].name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                              {profile.startups[0].name}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {profile.startups[0].industry}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Readiness Score</span>
                            <span className="font-semibold text-[#76B947]">
                              {profile.startups[0].readinessScore}%
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Stage</span>
                            <Badge className="bg-[#76B947] text-white">
                              {profile.startups[0].stage}
                            </Badge>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Funding Raised</span>
                            <span className="font-semibold dark:text-white">
                              {profile.startups[0].fundingRaised}
                            </span>
                          </div>
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
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No startups added yet
                      </p>
                    </CardContent>
                  </Card>
                )
              )}

            </div>
          </div>
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
                profile.startups.length > 0 ? (
                  profile.startups.map((startup, index) => (
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
                  <div className="text-center py-12">
                    <Rocket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                      No startups added yet. Add your first venture to get started!
                    </p>
                  </div>
                )
              ) : (
                profile.portfolio.length > 0 ? (
                  profile.portfolio.map((investment, index) => (
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
                ) : (
                  <div className="text-center py-12">
                    <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                      No investments in portfolio yet.
                    </p>
                  </div>
                )
              )}
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
        userType={userType}
      />
      <ShareProfileDialog
        open={shareProfileOpen}
        onOpenChange={setShareProfileOpen}
        profileName={profile.name}
        profileUrl={profileUrl}
      />
    </div>
  );
}