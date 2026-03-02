import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Check, X, Clock, Video, Phone, Calendar, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../lib/auth-context';

interface Meeting {
  id: number;
  host_id: number;
  participant_id: number;
  title: string;
  description?: string;
  meeting_type: string;
  start_time: string;
  end_time: string;
  meeting_url?: string;
  location?: string;
  status: string;
  host?: {
    id: number;
    full_name: string;
    avatar_url?: string;
    email?: string;
  };
  participant?: {
    id: number;
    full_name: string;
    avatar_url?: string;
    email?: string;
  };
}

export function MeetingRequestsModule() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getMeetings();
      // Filter for meetings where current user is participant and status is scheduled (pending acceptance)
      const pendingMeetings = data.filter((m: Meeting) => 
        m.participant_id === user?.id && m.status === 'scheduled'
      );
      setMeetings(pendingMeetings);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast.error('Failed to load meeting requests');
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptMeeting = async (meetingId: number) => {
    try {
      await apiClient.acceptMeeting(meetingId);
      toast.success('Meeting accepted!');
      
      // Trigger notification refresh
      window.dispatchEvent(new CustomEvent('new-notification'));
      
      fetchMeetings(); // Refresh list
    } catch (error) {
      console.error('Error accepting meeting:', error);
      toast.error('Failed to accept meeting');
    }
  };

  const handleRejectMeeting = async (meetingId: number) => {
    try {
      await apiClient.rejectMeeting(meetingId);
      toast.success('Meeting declined');
      
      // Trigger notification refresh
      window.dispatchEvent(new CustomEvent('new-notification'));
      
      fetchMeetings(); // Refresh list
    } catch (error) {
      console.error('Error rejecting meeting:', error);
      toast.error('Failed to decline meeting');
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'voice':
      case 'call':
        return <Phone className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card className="glass-card border-black/5 dark:border-white/10">
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-muted-foreground">Loading meeting requests...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (meetings.length === 0) {
    return (
      <Card className="glass-card border-black/5 dark:border-white/10">
        <CardContent className="py-16">
          <div className="text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              No pending meeting requests
            </p>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Meeting invitations will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
          Meeting Requests
        </h1>
        <p className="text-lg text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
          You have {meetings.length} pending meeting {meetings.length === 1 ? 'request' : 'requests'}
        </p>
      </div>

      {/* Meeting Cards */}
      <div className="space-y-4">
        {meetings.map((meeting) => {
          const host = meeting.host;
          const hostInitials = host?.full_name?.split(' ').map(n => n[0]).join('') || '?';
          
          return (
            <Card key={meeting.id} className="glass-card border-black/5 dark:border-white/10 hover:border-[#76B947]/30 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  {/* Host Avatar */}
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={host?.avatar_url} alt={host?.full_name} />
                    <AvatarFallback className="bg-[#76B947]/20 text-[#76B947]">
                      {hostInitials}
                    </AvatarFallback>
                  </Avatar>

                  {/* Meeting Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                          {meeting.title}
                        </h3>
                        <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                          with {host?.full_name || 'Unknown User'}
                        </p>
                      </div>
                      <Badge variant="outline" className="flex items-center space-x-1">
                        {getMeetingTypeIcon(meeting.meeting_type)}
                        <span className="capitalize text-xs">{meeting.meeting_type || 'Meeting'}</span>
                      </Badge>
                    </div>

                    {meeting.description && (
                      <p className="text-sm text-muted-foreground mb-3" style={{ fontFamily: 'var(--font-body)' }}>
                        {meeting.description}
                      </p>
                    )}

                    {/* Meeting Time */}
                    <div className="flex items-center text-sm text-muted-foreground mb-3">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{formatDateTime(meeting.start_time)}</span>
                    </div>

                    {/* Location/URL */}
                    {(meeting.meeting_url || meeting.location) && (
                      <div className="text-sm text-muted-foreground mb-3">
                        {meeting.meeting_url && (
                          <div className="flex items-center">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            <span className="truncate">Meeting URL provided</span>
                          </div>
                        )}
                        {meeting.location && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{meeting.location}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        className="bg-[#76B947] text-white hover:bg-[#5a8f35]"
                        onClick={() => handleAcceptMeeting(meeting.id)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 dark:hover:bg-red-900/20"
                        onClick={() => handleRejectMeeting(meeting.id)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                      {meeting.meeting_url && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[#76B947] hover:bg-[#76B947]/10"
                          onClick={() => window.open(meeting.meeting_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open Link
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
