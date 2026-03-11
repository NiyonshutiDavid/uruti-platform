import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { 
  MessageCircle, 
  Calendar, 
  Briefcase, 
  MapPin, 
  Mail, 
  Building2,
  TrendingUp,
  Target,
  Award,
  ArrowLeft,
  Video,
  Phone,
  Clock,
  UserPlus,
  X as XIcon,
  Globe,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../lib/auth-context';
import { BookingWeekDialog } from '../BookingWeekDialog';

interface ProfileViewModuleProps {
  userId: number;
  onBack?: () => void;
  onModuleChange?: (module: string) => void;
}

interface UserProfile {
  id: number;
  full_name: string;
  display_name?: string;
  email: string;
  role: string;
  avatar_url?: string;
  cover_image_url?: string;
  bio?: string;
  company?: string;
  location?: string;
  phone?: string;
  website_url?: string;
  linkedin_url?: string;
  industry?: string;
  expertise?: string[];
  investment_focus?: string[];
  preferred_sectors?: string[];
  stage?: string;
  funding_amount?: string;
  years_experience?: number;
  achievements?: string[];
  connections?: number;
}

export function ProfileViewModule({ userId, onBack, onModuleChange }: ProfileViewModuleProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'connected'>('none');
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
    if (user?.id && userId !== user.id) {
      checkConnectionStatus();
    }
  }, [userId]);

  const fetchProfile = async () => {
    setLoading(true);
    setProfileError(false);
    try {
      const [data, connCount] = await Promise.all([
        apiClient.getUserById(userId),
        apiClient.getConnectionCount(userId).catch(() => 0),
      ]);
      setProfile({ ...data, connections: connCount });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile');
      setProfileError(true);
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const status = await apiClient.checkConnectionStatus(userId);
      setConnectionStatus(status.status || 'none');
    } catch (error) {
      console.error('Failed to check connection status:', error);
    }
  };

  const handleSendMessage = () => {
    if (onModuleChange) {
      // Navigate to messages module with this user selected
      onModuleChange('messages');
      // Store selected user ID for messages module to pick up
      sessionStorage.setItem('selectedMessageUserId', userId.toString());
    }
  };

  const handleBookSession = async () => {
    try {
      // Check if they're connected
      if (connectionStatus !== 'connected') {
        toast.error('You must be connected to book a session');
        return;
      }

      setBookingDialogOpen(true);
    } catch (error) {
      console.error('Failed to initiate booking:', error);
      toast.error('Failed to start booking process');
    }
  };

  const handleConnect = async () => {
    try {
      await apiClient.sendConnectionRequest(userId);
      setConnectionStatus('pending');
      toast.success('Connection request sent!');
    } catch (error) {
      console.error('Failed to send connection request:', error);
      toast.error('Failed to send connection request');
    }
  };

  const handleCancelRequest = async () => {
    try {
      // Find the request ID for this user
      const requestId = await apiClient.cancelSentConnectionRequest(userId);
      setConnectionStatus('none');
      toast.success('Connection request cancelled');
    } catch (error) {
      console.error('Failed to cancel request:', error);
      toast.error('Failed to cancel connection request');
    }
  };

  const handleInitiateCall = async (type: 'video' | 'voice') => {
    try {
      if (connectionStatus !== 'connected') {
        toast.error('You must be connected to initiate a call');
        return;
      }

      const meeting = await apiClient.initiateCall(userId, type);
      toast.success(`${type === 'video' ? 'Video' : 'Voice'} call initiated!`);
      
      // Could open a call dialog or navigate to call interface
      if (meeting?.meeting_url) {
        window.open(meeting.meeting_url, '_blank');
      }
    } catch (error) {
      console.error('Failed to initiate call:', error);
      toast.error('Failed to start call');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#76B947] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Could not load this profile.</p>
          {onBack && (
            <Button variant="outline" onClick={onBack} className="hover:bg-[#76B947]/10 hover:border-[#76B947]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  const isFounder = profile.role === 'founder';
  const isInvestor = profile.role === 'investor';
  const roleColor = isFounder ? 'bg-blue-500' : isInvestor ? 'bg-purple-500' : 'bg-gray-500';
  const roleLabel = profile.role.charAt(0).toUpperCase() + profile.role.slice(1);

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto">
      {/* Header with back button */}
      {onBack && (
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      )}

      {/* Cover Image & Profile Header */}
      <Card className="glass-card border-black/5 dark:border-white/10 dark:bg-slate-900/50 overflow-hidden">
        {/* Cover Photo */}
        <div className="relative h-48 bg-gradient-to-r from-black via-gray-800 to-[#76B947]">
          {profile.cover_image_url && (
            <img 
              src={profile.cover_image_url} 
              alt="Cover" 
              className="w-full h-full object-cover opacity-40"
            />
          )}
        </div>

        <CardContent className="pt-0">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between -mt-16 md:-mt-20 gap-4">
            {/* Avatar & Basic Info */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4">
              <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-white dark:border-gray-900 shadow-xl">
                <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                <AvatarFallback className="bg-[#76B947] text-white text-4xl font-semibold">
                  {profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </AvatarFallback>
              </Avatar>

              <div className="text-center md:text-left space-y-2 mb-4">
                <div>
                  <h1 className="text-3xl font-bold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    {profile.full_name}
                  </h1>
                  <p className="text-lg text-muted-foreground dark:text-gray-400" style={{ fontFamily: 'var(--font-body)' }}>
                    {roleLabel}
                  </p>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground dark:text-gray-400">
                  {profile.company && (
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      <span>{profile.company}</span>
                    </div>
                  )}
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.connections !== undefined && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{profile.connections} connections</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {user?.id !== userId && (
        <Card className="glass-card border-black/5 dark:border-white/10 dark:bg-slate-900/50">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              {connectionStatus === 'connected' ? (
                <>
                  <Button 
                    onClick={handleSendMessage}
                    className="bg-[#76B947] text-white hover:bg-[#5a8f35] dark:bg-green-600 dark:hover:bg-green-700"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                  <Button 
                    onClick={handleBookSession}
                    variant="outline"
                    className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-slate-800"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Book a Session
                  </Button>
                  <Button 
                    onClick={() => handleInitiateCall('video')}
                    variant="outline"
                    className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-slate-800"
                  >
                    <Video className="mr-2 h-4 w-4" />
                    Video Call
                  </Button>
                  <Button 
                    onClick={() => handleInitiateCall('voice')}
                    variant="outline"
                    className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-slate-800"
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Voice Call
                  </Button>
                </>
              ) : connectionStatus === 'pending' ? (
                <>
                  <Button 
                    disabled 
                    variant="outline"
                    className="dark:border-gray-700 dark:text-gray-400 dark:bg-gray-800/30"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Connection Pending
                  </Button>
                  <Button 
                    onClick={handleCancelRequest}
                    variant="outline"
                    className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:border-red-700 dark:text-red-400 dark:border-red-900"
                  >
                    <XIcon className="mr-2 h-4 w-4" />
                    Cancel Request
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={handleConnect}
                  className="bg-[#76B947] text-white hover:bg-[#5a8f35] dark:bg-green-600 dark:hover:bg-green-700"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Connection
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Details Grid */}
      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact & Social Info */}
        <Card className="glass-card border-black/5 dark:border-white/10 dark:bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.email && (
              <div className="flex items-start space-x-2">
                <Mail className="h-4 w-4 mt-0.5 text-[#76B947]" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground dark:text-gray-400">Email</p>
                  <p className="text-sm font-medium dark:text-white truncate">{profile.email}</p>
                </div>
              </div>
            )}
            {profile.phone && (
              <div className="flex items-start space-x-2">
                <Phone className="h-4 w-4 mt-0.5 text-[#76B947]" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground dark:text-gray-400">Phone</p>
                  <p className="text-sm font-medium dark:text-white">{profile.phone}</p>
                </div>
              </div>
            )}
            {profile.linkedin_url && (
              <div className="flex items-start space-x-2">
                <Award className="h-4 w-4 mt-0.5 text-[#76B947]" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground dark:text-gray-400">LinkedIn</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-[#76B947] dark:text-green-400"
                    onClick={() => window.open(profile.linkedin_url, '_blank')}
                  >
                    View Profile
                  </Button>
                </div>
              </div>
            )}
            {profile.website_url && (
              <div className="flex items-start space-x-2">
                <Globe className="h-4 w-4 mt-0.5 text-[#76B947]" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground dark:text-gray-400">Website</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-[#76B947] dark:text-green-400"
                    onClick={() => window.open(profile.website_url, '_blank')}
                  >
                    Visit
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="lg:col-span-2 glass-card border-black/5 dark:border-white/10 dark:bg-slate-900/50">
          <CardHeader>
            <CardTitle className="dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bio */}
            {profile.bio && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  Bio
                </h3>
                <p className="text-sm text-muted-foreground dark:text-gray-400 leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Industry/Focus Area */}
            {(profile.industry || profile.investment_focus || profile.preferred_sectors) && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  <Target className="mr-2 h-4 w-4 text-[#76B947]" />
                  {isFounder ? 'Industry Focus' : 'Investment Focus'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {isInvestor && profile.preferred_sectors ? (
                    profile.preferred_sectors.map((sector, idx) => (
                      <Badge key={idx} variant="secondary" className="dark:bg-gray-800 dark:text-gray-300">
                        {sector}
                      </Badge>
                    ))
                  ) : isInvestor && profile.investment_focus ? (
                    profile.investment_focus.map((focus, idx) => (
                      <Badge key={idx} variant="secondary" className="dark:bg-gray-800 dark:text-gray-300">
                        {focus}
                      </Badge>
                    ))
                  ) : profile.industry ? (
                    <Badge variant="secondary" className="dark:bg-gray-800 dark:text-gray-300">{profile.industry}</Badge>
                  ) : null}
                </div>
              </div>
            )}

            {/* Expertise */}
            {profile.expertise && profile.expertise.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  <Award className="mr-2 h-4 w-4 text-[#76B947]" />
                  Expertise
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.expertise.map((skill, idx) => (
                    <Badge key={idx} variant="outline" className="border-[#76B947] text-[#76B947] dark:border-green-600 dark:text-green-400">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Founder-specific: Stage & Funding */}
            {isFounder && (profile.stage || profile.funding_amount) && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  <TrendingUp className="mr-2 h-4 w-4 text-[#76B947]" />
                  Startup Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {profile.stage && (
                    <div>
                      <p className="text-muted-foreground dark:text-gray-400 mb-1">Stage</p>
                      <Badge className="dark:bg-gray-800 dark:text-gray-300">{profile.stage}</Badge>
                    </div>
                  )}
                  {profile.funding_amount && (
                    <div>
                      <p className="text-muted-foreground dark:text-gray-400 mb-1">Funding</p>
                      <p className="font-medium dark:text-white">{profile.funding_amount}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Investor-specific: Experience */}
            {isInvestor && profile.years_experience && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  <TrendingUp className="mr-2 h-4 w-4 text-[#76B947]" />
                  Experience
                </h3>
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  {profile.years_experience} years in venture capital and startup investment
                </p>
              </div>
            )}

            {/* Achievements */}
            {profile.achievements && profile.achievements.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  <Award className="mr-2 h-4 w-4 text-[#76B947]" />
                  Achievements
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground dark:text-gray-400">
                  {profile.achievements.map((achievement, idx) => (
                    <li key={idx}>{achievement}</li>
                  ))}
                </ul>
              </div>
            )}

            {!profile.bio && 
             !profile.industry && 
             !profile.investment_focus && 
             !profile.expertise?.length &&
             !profile.stage &&
             !profile.funding_amount &&
             !profile.years_experience &&
             !profile.achievements?.length && (
              <div className="text-center py-8 text-muted-foreground dark:text-gray-400">
                <p>No additional profile information available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BookingWeekDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        targetUserId={userId}
        targetUserName={profile.full_name}
      />
    </div>
  );
}
