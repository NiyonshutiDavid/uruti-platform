import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Calendar } from '../ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar as CalendarIcon, Clock, Video, Users, Lightbulb, Plus, ExternalLink, Loader2, X as XIcon, UserPlus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../lib/auth-context';
import { toast } from 'sonner';
import { MeetingRequestsModule } from './MeetingRequestsModule';

interface CalendarEvent {
  id: number;
  title: string;
  type: 'pitch' | 'mentor' | 'workshop' | 'deadline' | 'meeting';
  date: Date;
  time: string;
  duration: string;
  venture?: string;
  attendees?: string[];
  location: 'virtual' | 'in-person';
  meetingLink?: string;
  description: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  guest_ids?: number[];
}

interface User {
  id: number;
  full_name: string;
  display_name?: string;
  email: string;
  role: string;
  avatar?: string;
}

export function ReadinessCalendarModule() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [ventures, setVentures] = useState<any[]>([]);
  const [connections, setConnections] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [viewType, setViewType] = useState<'calendar' | 'list'>('calendar');
  
  // Form state
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'meeting' as 'pitch' | 'mentor' | 'workshop' | 'deadline' | 'meeting',
    date: '',
    time: '',
    duration: '30',
    venture_id: '',
    description: '',
    location: 'virtual' as 'virtual' | 'in-person',
    meetingLink: '',
    guest_ids: [] as number[]
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load events/meetings from backend
      const meetingsData = await apiClient.getMeetings();
      const formattedEvents: CalendarEvent[] = meetingsData
        .map((meeting: any) => {
          const startRaw = meeting.start_time || meeting.scheduled_time;
          const endRaw = meeting.end_time;
          if (!startRaw) return null;

          const startDate = new Date(startRaw);
          if (Number.isNaN(startDate.getTime())) return null;

          let durationLabel = '30 min';
          if (endRaw) {
            const endDate = new Date(endRaw);
            if (!Number.isNaN(endDate.getTime())) {
              const mins = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
              durationLabel = `${mins} min`;
            }
          }

          const normalizedStatus = meeting.status === 'scheduled'
            ? 'upcoming'
            : meeting.status === 'cancelled'
              ? 'cancelled'
              : meeting.status === 'completed'
                ? 'completed'
                : 'upcoming';

          return {
            id: meeting.id,
            title: meeting.title || 'Untitled Event',
            type: meeting.meeting_type || meeting.type || 'meeting',
            date: startDate,
            time: startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
            duration: durationLabel,
            venture: meeting.venture?.name,
            attendees: meeting.attendees?.map((a: any) => a.full_name) || [],
            location: meeting.location || 'virtual',
            meetingLink: meeting.meeting_url || meeting.meeting_link,
            description: meeting.description || meeting.notes || '',
            status: normalizedStatus,
            guest_ids: meeting.attendees?.map((a: any) => a.id) || []
          } as CalendarEvent;
        })
        .filter((event): event is CalendarEvent => Boolean(event));
      setEvents(formattedEvents);

      // Load ventures (for founders)
      if (user?.role === 'founder') {
        const venturesData = await apiClient.getVentures();
        setVentures(venturesData);
      }

      // Load connections for guest selection
      const connectionsData = await apiClient.getConnections();
      setConnections(connectionsData);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      setEvents([]);
      setVentures([]);
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    // Validation
    if (!newEvent.title.trim()) {
      toast.error('Please enter an event title');
      return;
    }
    if (!newEvent.date || !newEvent.time) {
      toast.error('Please select date and time');
      return;
    }

    try {
      // Combine date and time
      const scheduledTime = new Date(`${newEvent.date}T${newEvent.time}`);

      const eventData = {
        title: newEvent.title,
        type: newEvent.type,
        scheduled_time: scheduledTime.toISOString(),
        duration: parseInt(newEvent.duration),
        venture_id: newEvent.venture_id ? parseInt(newEvent.venture_id) : null,
        notes: newEvent.description,
        location: newEvent.location,
        meeting_link: newEvent.meetingLink || null,
        attendee_ids: newEvent.guest_ids,
        status: 'scheduled'
      };

      await apiClient.createMeeting(eventData);
      toast.success('Event created successfully!');
      setIsAddEventOpen(false);
      
      // Reset form
      setNewEvent({
        title: '',
        type: 'meeting',
        date: '',
        time: '',
        duration: '30',
        venture_id: '',
        description: '',
        location: 'virtual',
        meetingLink: '',
        guest_ids: []
      });

      // Reload events
      loadData();
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    }
  };

  const toggleGuest = (guestId: number) => {
    setNewEvent(prev => ({
      ...prev,
      guest_ids: prev.guest_ids.includes(guestId)
        ? prev.guest_ids.filter(id => id !== guestId)
        : [...prev.guest_ids, guestId]
    }));
  };

  const getEventTypeConfig = (type: string) => {
    const configs = {
      pitch: { icon: Lightbulb, color: 'bg-[#76B947]/20 text-[#76B947]', label: 'Pitch' },
      mentor: { icon: Users, color: 'bg-blue-100 text-blue-700', label: 'Mentor Session' },
      workshop: { icon: CalendarIcon, color: 'bg-purple-100 text-purple-700', label: 'Workshop' },
      deadline: { icon: Clock, color: 'bg-orange-100 text-orange-700', label: 'Deadline' },
      meeting: { icon: Users, color: 'bg-green-100 text-green-700', label: 'Meeting' }
    };
    return configs[type as keyof typeof configs];
  };

  const eventsOnSelectedDate = selectedDate 
    ? events.filter(event => 
        event.date.getDate() === selectedDate.getDate() &&
        event.date.getMonth() === selectedDate.getMonth() &&
        event.date.getFullYear() === selectedDate.getFullYear()
      )
    : [];

  const upcomingEvents = events
    .filter(e => e.status === 'upcoming')
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const eventDates = events.map(e => e.date);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-[#76B947]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Meeting Calendar</h1>
          <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
            Manage all your meetings, sessions, and deadlines
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Tabs value={viewType} onValueChange={(v) => setViewType(v as 'calendar' | 'list')}>
            <TabsList>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="requests">Meeting Requests</TabsTrigger>
            </TabsList>
          </Tabs>
          <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
            <DialogTrigger asChild>
              <Button className="glass-button bg-black text-white hover:bg-black/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl glass-card max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle style={{ fontFamily: 'var(--font-heading)' }}>Schedule New Event</DialogTitle>
                <DialogDescription style={{ fontFamily: 'var(--font-body)' }}>
                  Add a new event to your calendar
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Event Title *</Label>
                  <Input 
                    placeholder="e.g., Investor Pitch Session" 
                    className="mt-1"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Event Type *</Label>
                    <Select 
                      value={newEvent.type} 
                      onValueChange={(value: any) => setNewEvent(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pitch">Pitch Session</SelectItem>
                        <SelectItem value="mentor">Mentor Meeting</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="deadline">Deadline</SelectItem>
                        <SelectItem value="meeting">General Meeting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {user?.role === 'founder' && (
                    <div>
                      <Label>Related Venture (Optional)</Label>
                      <Select 
                        value={newEvent.venture_id} 
                        onValueChange={(value) => setNewEvent(prev => ({ ...prev, venture_id: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select venture" />
                        </SelectTrigger>
                        <SelectContent>
                          {ventures.map((venture) => (
                            <SelectItem key={venture.id} value={venture.id.toString()}>
                              {venture.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Date *</Label>
                    <Input 
                      type="date" 
                      className="mt-1"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Time *</Label>
                    <Input 
                      type="time" 
                      className="mt-1"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Duration (minutes)</Label>
                    <Input 
                      type="number" 
                      className="mt-1"
                      value={newEvent.duration}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="30"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Location</Label>
                    <Select 
                      value={newEvent.location} 
                      onValueChange={(value: any) => setNewEvent(prev => ({ ...prev, location: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="virtual">Virtual</SelectItem>
                        <SelectItem value="in-person">In-Person</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newEvent.location === 'virtual' && (
                    <div>
                      <Label>Meeting Link (Optional)</Label>
                      <Input 
                        placeholder="https://meet.google.com/..." 
                        className="mt-1"
                        value={newEvent.meetingLink}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, meetingLink: e.target.value }))}
                      />
                    </div>
                  )}
                </div>
                
                {/* Guest Selection from Connections */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Invite Guests from Connections</Label>
                    <Badge variant="outline" className="text-xs">
                      {newEvent.guest_ids.length} selected
                    </Badge>
                  </div>
                  {connections.length === 0 ? (
                    <div className="p-4 border border-dashed rounded-lg text-center text-sm text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No connections yet. Build connections to invite guests!</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg max-h-48 overflow-y-auto">
                      <div className="divide-y">
                        {connections.map((connection) => (
                          <div
                            key={connection.id}
                            className={`flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer transition-colors ${
                              newEvent.guest_ids.includes(connection.id) ? 'bg-[#76B947]/10' : ''
                            }`}
                            onClick={() => toggleGuest(connection.id)}
                          >
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                {connection.avatar && <AvatarImage src={connection.avatar} />}
                                <AvatarFallback className="bg-[#76B947]/20 text-[#76B947] text-xs">
                                  {connection.full_name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{connection.full_name}</p>
                                <p className="text-xs text-muted-foreground">{connection.role}</p>
                              </div>
                            </div>
                            {newEvent.guest_ids.includes(connection.id) && (
                              <Badge className="bg-[#76B947] text-white">
                                Invited
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea 
                    placeholder="Event details..." 
                    className="mt-1" 
                    rows={3}
                    value={newEvent.description}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddEventOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    className="bg-black text-white hover:bg-black/90"
                    onClick={handleCreateEvent}
                  >
                    Create Event
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-black/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Upcoming Events</p>
                <p className="text-3xl mt-1" style={{ fontFamily: 'var(--font-heading)' }}>{upcomingEvents.length}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-[#76B947]" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-black/5">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>This Week</p>
              <p className="text-3xl mt-1 text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                {upcomingEvents.slice(0, 3).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-black/5">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Pitch Sessions</p>
              <p className="text-3xl mt-1" style={{ fontFamily: 'var(--font-heading)' }}>
                {events.filter(e => e.type === 'pitch' && e.status === 'upcoming').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-black/5">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Deadlines</p>
              <p className="text-3xl mt-1 text-orange-600" style={{ fontFamily: 'var(--font-heading)' }}>
                {events.filter(e => e.type === 'deadline' && e.status === 'upcoming').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {events.length === 0 && (
        <Card className="glass-card border-black/5">
          <CardContent className="py-12">
            <div className="text-center">
              <CalendarIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                No events scheduled yet
              </h3>
              <p className="text-muted-foreground mb-6" style={{ fontFamily: 'var(--font-body)' }}>
                Start by creating your first event to manage your calendar
              </p>
              <Button 
                className="bg-black text-white hover:bg-black/90"
                onClick={() => setIsAddEventOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Event
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar/List Views */}
      {events.length > 0 && viewType === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar View */}
          <div className="lg:col-span-2">
            <Card className="glass-card border-black/5">
              <CardHeader>
                <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Event Calendar</CardTitle>
                <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                  Select a date to view scheduled events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border-black/10"
                />
              </CardContent>
            </Card>
          </div>

          {/* Events on Selected Date */}
          <div>
            <Card className="glass-card border-black/5">
              <CardHeader>
                <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>
                  {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'Select a date'}
                </CardTitle>
                <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                  {eventsOnSelectedDate.length} event{eventsOnSelectedDate.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {eventsOnSelectedDate.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No events scheduled for this date
                  </p>
                ) : (
                  eventsOnSelectedDate.map((event) => {
                    const config = getEventTypeConfig(event.type);
                    const Icon = config.icon;
                    
                    return (
                      <Card key={event.id} className="glass-card border-black/5">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <Badge className={config.color}>
                              <Icon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                            {event.location === 'virtual' && event.meetingLink && (
                              <a href={event.meetingLink} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="sm" className="h-6 px-2">
                                  <Video className="h-3 w-3 mr-1" />
                                  Join
                                </Button>
                              </a>
                            )}
                          </div>
                          <h4 className="font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                            {event.title}
                          </h4>
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <Clock className="h-3 w-3 mr-1" />
                            {event.time} • {event.duration}
                          </div>
                          {event.description && (
                            <p className="text-xs text-muted-foreground mb-2">{event.description}</p>
                          )}
                          {event.attendees && event.attendees.length > 0 && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Users className="h-3 w-3 mr-1" />
                              {event.attendees.join(', ')}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* List View */}
      {events.length > 0 && viewType === 'list' && (
        <Card className="glass-card border-black/5">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>All Events</CardTitle>
            <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
              Complete list of your scheduled events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingEvents.map((event) => {
                const config = getEventTypeConfig(event.type);
                const Icon = config.icon;
                
                return (
                  <Card key={event.id} className="glass-card border-black/5">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={config.color}>
                              <Icon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                            {event.venture && (
                              <Badge variant="outline" className="text-xs">
                                {event.venture}
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                            {event.title}
                          </h4>
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            <span className="mx-2">•</span>
                            <Clock className="h-3 w-3 mr-1" />
                            {event.time} • {event.duration}
                          </div>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                          )}
                          {event.attendees && event.attendees.length > 0 && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Users className="h-3 w-3 mr-1" />
                              {event.attendees.join(', ')}
                            </div>
                          )}
                        </div>
                        {event.location === 'virtual' && event.meetingLink && (
                          <a href={event.meetingLink} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="bg-[#76B947] hover:bg-[#76B947]/90 text-white">
                              <Video className="h-4 w-4 mr-2" />
                              Join Meeting
                            </Button>
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meeting Requests View */}
      {viewType === 'requests' && (
        <MeetingRequestsModule />
      )}
    </div>
  );
}