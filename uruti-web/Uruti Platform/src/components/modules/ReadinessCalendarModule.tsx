import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar } from '../ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar as CalendarIcon, Clock, Video, Users, Lightbulb, Plus, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface CalendarEvent {
  id: string;
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
}

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Investor Pitch Day - AgriConnect',
    type: 'pitch',
    date: new Date(2026, 1, 15), // Feb 15, 2026
    time: '14:00',
    duration: '30 min',
    venture: 'AgriConnect',
    attendees: ['Rwanda Innovation Fund Panel', 'Jean-Paul Uwimana'],
    location: 'virtual',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    description: 'Final pitch presentation to Rwanda Innovation Fund investment committee.',
    status: 'upcoming'
  },
  {
    id: '2',
    title: 'Mentor Session with Marie Umutoni',
    type: 'mentor',
    date: new Date(2026, 1, 8), // Feb 8, 2026
    time: '10:00',
    duration: '60 min',
    venture: 'AgriConnect',
    attendees: ['Marie Umutoni'],
    location: 'virtual',
    meetingLink: 'https://meet.google.com/xyz-abcd-efg',
    description: 'Market validation strategy review for rural farmer onboarding.',
    status: 'upcoming'
  },
  {
    id: '3',
    title: 'Financial Model Workshop',
    type: 'workshop',
    date: new Date(2026, 1, 12), // Feb 12, 2026
    time: '15:00',
    duration: '90 min',
    attendees: ['Uruti AI Facilitator', '15+ founders'],
    location: 'in-person',
    description: 'Interactive workshop on building investor-ready financial projections.',
    status: 'upcoming'
  },
  {
    id: '4',
    title: 'FinTrack Pitch Deck Deadline',
    type: 'deadline',
    date: new Date(2026, 1, 10), // Feb 10, 2026
    time: '23:59',
    duration: 'Deadline',
    venture: 'FinTrack',
    description: 'Final version of pitch deck due for investor review.',
    status: 'upcoming'
  },
  {
    id: '5',
    title: 'Q1 Founders Meetup',
    type: 'meeting',
    date: new Date(2026, 1, 20), // Feb 20, 2026
    time: '18:00',
    duration: '2 hours',
    attendees: ['Uruti Founder Community'],
    location: 'in-person',
    description: 'Quarterly networking event for Uruti ecosystem founders.',
    status: 'upcoming'
  },
  {
    id: '6',
    title: 'Pitch Coach Session',
    type: 'pitch',
    date: new Date(2026, 1, 3), // Feb 3, 2026
    time: '09:00',
    duration: '45 min',
    venture: 'HealthBridge',
    location: 'virtual',
    description: 'AI-powered pitch practice session.',
    status: 'completed'
  }
];

export function ReadinessCalendarModule() {
  const [events] = useState<CalendarEvent[]>(mockEvents);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [viewType, setViewType] = useState<'calendar' | 'list'>('calendar');

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Readiness Calendar</h1>
          <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
            Manage all your critical sessions, deadlines, and meetings
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Tabs value={viewType} onValueChange={(v) => setViewType(v as 'calendar' | 'list')}>
            <TabsList>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>
          <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
            <DialogTrigger asChild>
              <Button className="glass-button bg-black text-white hover:bg-black/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl glass-card">
              <DialogHeader>
                <DialogTitle style={{ fontFamily: 'var(--font-heading)' }}>Schedule New Event</DialogTitle>
                <DialogDescription style={{ fontFamily: 'var(--font-body)' }}>
                  Add a new event to your readiness calendar
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Event Title</Label>
                  <Input placeholder="e.g., Investor Pitch - AgriConnect" className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Event Type</Label>
                    <Select>
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
                  <div>
                    <Label>Related Venture</Label>
                    <Select>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select venture" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agriconnect">AgriConnect</SelectItem>
                        <SelectItem value="fintrack">FinTrack</SelectItem>
                        <SelectItem value="healthbridge">HealthBridge</SelectItem>
                        <SelectItem value="edulearn">EduLearn Rwanda</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input type="date" className="mt-1" />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input type="time" className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea placeholder="Event details..." className="mt-1" rows={3} />
                </div>
                <div>
                  <Label>Meeting Link (Optional)</Label>
                  <Input placeholder="https://meet.google.com/..." className="mt-1" />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddEventOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-black text-white hover:bg-black/90">
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

      {viewType === 'calendar' ? (
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
                  {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Select a date'}
                </CardTitle>
                <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                  {eventsOnSelectedDate.length} event{eventsOnSelectedDate.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {eventsOnSelectedDate.length > 0 ? (
                  <div className="space-y-3">
                    {eventsOnSelectedDate.map((event) => {
                      const config = getEventTypeConfig(event.type);
                      const Icon = config.icon;
                      return (
                        <div key={event.id} className="p-3 rounded-lg glass-panel border border-black/5 hover:shadow-md transition-shadow">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${config.color}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm mb-1 truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                                {event.title}
                              </p>
                              <p className="text-xs text-muted-foreground mb-2" style={{ fontFamily: 'var(--font-body)' }}>
                                {event.time} • {event.duration}
                              </p>
                              {event.meetingLink && (
                                <Button size="sm" variant="outline" className="w-full text-xs hover:bg-[#76B947]/10">
                                  <Video className="mr-1 h-3 w-3" />
                                  Join Meeting
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8" style={{ fontFamily: 'var(--font-body)' }}>
                    No events scheduled for this date
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* List View */
        <Card className="glass-card border-black/5">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>All Upcoming Events</CardTitle>
            <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
              Chronological list of your scheduled events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event) => {
                const config = getEventTypeConfig(event.type);
                const Icon = config.icon;
                return (
                  <div key={event.id} className="p-4 rounded-lg glass-panel border border-black/5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`p-3 rounded-lg ${config.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{event.title}</h4>
                              <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                {event.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                            <Badge className={config.color}>{config.label}</Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                            <span className="flex items-center" style={{ fontFamily: 'var(--font-body)' }}>
                              <Clock className="h-4 w-4 mr-1" />
                              {event.time} • {event.duration}
                            </span>
                            {event.location === 'virtual' && (
                              <span className="flex items-center" style={{ fontFamily: 'var(--font-body)' }}>
                                <Video className="h-4 w-4 mr-1" />
                                Virtual
                              </span>
                            )}
                          </div>
                          <p className="text-sm mb-3" style={{ fontFamily: 'var(--font-body)' }}>{event.description}</p>
                          {event.venture && (
                            <Badge variant="outline" className="bg-black/5 mb-2">{event.venture}</Badge>
                          )}
                          {event.meetingLink && (
                            <Button size="sm" className="glass-button mt-2">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Join Meeting
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
