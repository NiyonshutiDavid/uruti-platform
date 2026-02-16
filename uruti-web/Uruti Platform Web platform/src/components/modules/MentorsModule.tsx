import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { MessageCircle, Calendar, Star, Search, Filter, TrendingUp, Briefcase, GraduationCap, Users, Clock, Video, MapPin, Send, CalendarPlus, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface MentorsModuleProps {
  onModuleChange?: (module: string) => void;
}

interface Mentor {
  id: string;
  name: string;
  specialty: string;
  expertise: string[];
  experience: string;
  relationshipRating: number;
  sessionsCompleted: number;
  availableSlots: number;
  bio: string;
  investorType?: 'VC' | 'Angel' | 'Corporate';
  focus: string[];
  status: 'active' | 'pending' | 'inactive';
  avatar?: string;
  investmentRequirements?: {
    stages: string[];
    ticketSize: string;
    geography: string[];
    requiredMetrics: string[];
    dealFlow: string;
  };
  availability?: {
    [key: string]: string[]; // day: time slots
  };
}

const mockMentors: Mentor[] = [
  {
    id: '1',
    name: 'Jean-Paul Uwimana',
    specialty: 'Venture Capital Expert',
    expertise: ['Seed Funding', 'Series A', 'Due Diligence', 'Term Sheets'],
    experience: '15+ years in African VC',
    relationshipRating: 5,
    sessionsCompleted: 8,
    availableSlots: 3,
    bio: 'Managing Partner at Rwanda Innovation Fund. Invested in 50+ African startups with successful exits in AgTech and FinTech.',
    investorType: 'VC',
    focus: ['AgTech', 'FinTech', 'HealthTech'],
    status: 'active',
    investmentRequirements: {
      stages: ['Seed', 'Series A'],
      ticketSize: '$100K - $2M',
      geography: ['Rwanda', 'East Africa', 'Sub-Saharan Africa'],
      requiredMetrics: ['Product-Market Fit', 'Revenue Traction', 'Strong Team', 'Scalable Model'],
      dealFlow: 'Actively reviewing 10-15 deals per month'
    },
    availability: {
      'Monday': ['09:00', '10:00', '14:00', '15:00'],
      'Wednesday': ['10:00', '11:00', '14:00'],
      'Friday': ['09:00', '10:00', '11:00']
    }
  },
  {
    id: '2',
    name: 'Marie Umutoni',
    specialty: 'AgTech Sector Specialist',
    expertise: ['Agricultural Innovation', 'Market Entry', 'Supply Chain', 'Rural Distribution'],
    experience: '10 years in African agriculture',
    relationshipRating: 4,
    sessionsCompleted: 5,
    availableSlots: 5,
    bio: 'Former CEO of successful AgTech startup. Expert in navigating regulatory challenges and building farmer networks across East Africa.',
    focus: ['AgTech', 'Supply Chain', 'Market Validation'],
    status: 'active',
    availability: {
      'Tuesday': ['09:00', '10:00', '14:00', '15:00', '16:00'],
      'Thursday': ['10:00', '11:00', '14:00', '15:00']
    }
  },
  {
    id: '3',
    name: 'Dr. Samuel Nkusi',
    specialty: 'HealthTech Innovation Advisor',
    expertise: ['Healthcare Systems', 'Regulatory Compliance', 'Clinical Validation', 'Data Privacy'],
    experience: 'Former Rwanda Health Ministry advisor',
    relationshipRating: 5,
    sessionsCompleted: 12,
    availableSlots: 2,
    bio: 'Healthcare innovation specialist with deep understanding of Rwanda\'s health ecosystem. Advised multiple successful HealthTech ventures.',
    focus: ['HealthTech', 'Regulatory', 'Clinical Trials'],
    status: 'active',
    availability: {
      'Monday': ['14:00', '15:00'],
      'Wednesday': ['09:00', '10:00']
    }
  },
  {
    id: '4',
    name: 'Patricia Mukamana',
    specialty: 'Angel Investor & EdTech Expert',
    expertise: ['Early-stage Investment', 'Education Technology', 'Impact Investing', 'Business Models'],
    experience: 'Angel investor in 20+ startups',
    relationshipRating: 3,
    sessionsCompleted: 3,
    availableSlots: 4,
    bio: 'Serial entrepreneur and angel investor focusing on education and social impact. Passionate about empowering youth through technology.',
    investorType: 'Angel',
    focus: ['EdTech', 'Impact', 'Business Models'],
    status: 'active',
    investmentRequirements: {
      stages: ['Pre-Seed', 'Seed'],
      ticketSize: '$25K - $150K',
      geography: ['Rwanda', 'Kenya', 'Uganda'],
      requiredMetrics: ['Strong Founder', 'Social Impact', 'Clear Problem-Solution Fit', 'MVP Ready'],
      dealFlow: 'Reviewing 5-8 opportunities per quarter'
    },
    availability: {
      'Tuesday': ['10:00', '11:00', '15:00'],
      'Friday': ['14:00', '15:00', '16:00']
    }
  },
  {
    id: '5',
    name: 'Emmanuel Habimana',
    specialty: 'FinTech Regulatory Expert',
    expertise: ['Financial Regulation', 'Compliance', 'Mobile Money', 'Banking Partnerships'],
    experience: 'Former Central Bank regulator',
    relationshipRating: 0,
    sessionsCompleted: 0,
    availableSlots: 6,
    bio: 'Deep expertise in Rwanda\'s financial regulatory landscape. Helps FinTech startups navigate licensing and compliance requirements.',
    focus: ['FinTech', 'Regulatory', 'Compliance'],
    status: 'pending',
    availability: {
      'Monday': ['09:00', '10:00', '11:00'],
      'Wednesday': ['14:00', '15:00', '16:00'],
      'Thursday': ['09:00', '10:00']
    }
  }
];

export function MentorsModule({ onModuleChange }: MentorsModuleProps) {
  const [mentors] = useState<Mentor[]>(mockMentors);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFocus, setFilterFocus] = useState('all');
  const [selectedMentor, setSelectedMentor] = useState<Mentor>(mentors[0]);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isRequestConnectionDialogOpen, setIsRequestConnectionDialogOpen] = useState(false);
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  const [bookingForm, setBookingForm] = useState({
    duration: '60',
    sessionType: 'pitch-review',
    message: ''
  });
  
  const [connectionForm, setConnectionForm] = useState({
    reason: '',
    introduction: '',
    interest: ''
  });

  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    time: '',
    description: ''
  });

  const handleBookSession = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setSelectedDate(null);
    setSelectedTime('');
    setIsBookingDialogOpen(true);
  };

  const handleSendMessage = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    // Navigate to messages module instead of showing dialog
    if (onModuleChange) {
      onModuleChange('messages');
    }
  };

  const handleSubmitBooking = () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select a date and time slot');
      return;
    }
    console.log('Booking submitted:', {
      mentor: selectedMentor.name,
      date: selectedDate,
      time: selectedTime,
      ...bookingForm
    });
    setIsBookingDialogOpen(false);
    setBookingForm({
      duration: '60',
      sessionType: 'pitch-review',
      message: ''
    });
    setSelectedDate(null);
    setSelectedTime('');
  };

  const handleSubmitConnection = () => {
    console.log('Connection request:', connectionForm);
    setIsRequestConnectionDialogOpen(false);
    setConnectionForm({
      reason: '',
      introduction: '',
      interest: ''
    });
  };

  const handleSubmitEvent = () => {
    console.log('Event created:', eventForm);
    setIsAddEventDialogOpen(false);
    setEventForm({
      title: '',
      date: '',
      time: '',
      description: ''
    });
  };

  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentor.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFocus = filterFocus === 'all' || mentor.focus.includes(filterFocus);
    return matchesSearch && matchesFocus;
  });

  const activeMentors = mentors.filter(m => m.status === 'active').length;
  const totalSessions = mentors.reduce((acc, m) => acc + m.sessionsCompleted, 0);

  // Calendar helpers
  const getDaysInWeek = (startDate: Date) => {
    const days = [];
    const start = new Date(startDate);
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getAvailableTimesForDate = (date: Date) => {
    const dayName = getDayName(date);
    return selectedMentor.availability?.[dayName] || [];
  };

  const nextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const prevWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const weekDays = getDaysInWeek(currentWeekStart);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Mentor & Investor Directory</h1>
          <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
            Connect with experienced professionals and investors
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            className="glass-button bg-black text-white hover:bg-black/90"
            onClick={() => setIsRequestConnectionDialogOpen(true)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Request Connection
          </Button>
          <Button 
            className="glass-button bg-[#76B947] text-white hover:bg-[#76B947]/90"
            onClick={() => setIsAddEventDialogOpen(true)}
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Total Network</p>
                <p className="text-3xl mt-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>{mentors.length}</p>
              </div>
              <Users className="h-8 w-8 text-[#76B947]" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Active Connections</p>
              <p className="text-3xl mt-1 text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                {activeMentors}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Total Sessions</p>
              <p className="text-3xl mt-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>{totalSessions}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Avg Rating</p>
              <div className="flex items-center space-x-2 mt-1">
                <Star className="h-6 w-6 text-[#76B947] fill-[#76B947]" />
                <p className="text-3xl dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  {(mentors.reduce((acc, m) => acc + m.relationshipRating, 0) / mentors.filter(m => m.relationshipRating > 0).length).toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="glass-card border-black/5 dark:border-white/10">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search mentors by name or specialty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Tabs value={filterFocus} onValueChange={setFilterFocus} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="AgTech">AgTech</TabsTrigger>
                <TabsTrigger value="FinTech">FinTech</TabsTrigger>
                <TabsTrigger value="HealthTech">HealthTech</TabsTrigger>
                <TabsTrigger value="EdTech">EdTech</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mentor List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredMentors.map((mentor) => (
            <Card 
              key={mentor.id} 
              className={`glass-card border-black/5 dark:border-white/10 cursor-pointer transition-all hover:shadow-lg ${
                selectedMentor.id === mentor.id ? 'ring-2 ring-[#76B947]' : ''
              }`}
              onClick={() => setSelectedMentor(mentor)}
            >
              <CardHeader>
                <div className="flex items-start space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={mentor.avatar} />
                    <AvatarFallback className="bg-[#76B947]/20 text-[#76B947] text-xl" style={{ fontFamily: 'var(--font-heading)' }}>
                      {mentor.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="mb-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>{mentor.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mb-2" style={{ fontFamily: 'var(--font-body)' }}>
                          {mentor.specialty}
                        </p>
                      </div>
                      {mentor.investorType && (
                        <Badge className="bg-[#76B947]/20 text-[#76B947]">{mentor.investorType}</Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                      <span className="flex items-center" style={{ fontFamily: 'var(--font-body)' }}>
                        <Briefcase className="h-4 w-4 mr-1" />
                        {mentor.experience}
                      </span>
                      {mentor.relationshipRating > 0 && (
                        <span className="flex items-center">
                          <Star className="h-4 w-4 mr-1 text-[#76B947] fill-[#76B947]" />
                          <span style={{ fontFamily: 'var(--font-heading)' }}>{mentor.relationshipRating}/5</span>
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {mentor.focus.map((area, index) => (
                        <Badge key={index} variant="outline" className="bg-black/5 dark:bg-white/5 text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        className="bg-black dark:bg-[#76B947] text-white hover:bg-black/90 dark:hover:bg-[#76B947]/90" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendMessage(mentor);
                        }}
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Message
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="hover:bg-[#76B947]/10 hover:border-[#76B947] dark:border-white/20" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookSession(mentor);
                        }}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Book Session
                      </Button>
                      <span className="text-xs text-muted-foreground ml-auto" style={{ fontFamily: 'var(--font-body)' }}>
                        {mentor.availableSlots} slots available
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Mentor Details */}
        <div className="space-y-6">
          <Card className="glass-card border-black/5 dark:border-white/10">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedMentor.avatar} />
                  <AvatarFallback className="bg-[#76B947]/20 text-[#76B947] text-xl" style={{ fontFamily: 'var(--font-heading)' }}>
                    {selectedMentor.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>{selectedMentor.name}</CardTitle>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    {selectedMentor.specialty}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>Biography</h4>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    {selectedMentor.bio}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>Expertise Areas</h4>
                  <div className="space-y-2">
                    {selectedMentor.expertise.map((skill, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-[#76B947] rounded-full"></div>
                        <span className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Investment Requirements for Investors */}
                {selectedMentor.investmentRequirements && (
                  <div className="pt-4 border-t border-black/10 dark:border-white/10">
                    <h4 className="text-sm mb-3 text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                      💼 Investment Criteria
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: 'var(--font-body)' }}>
                          Investment Stages
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {selectedMentor.investmentRequirements.stages.map((stage, index) => (
                            <Badge key={index} className="bg-[#76B947] text-white text-xs">
                              {stage}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: 'var(--font-body)' }}>
                          Ticket Size
                        </p>
                        <p className="text-sm font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                          {selectedMentor.investmentRequirements.ticketSize}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: 'var(--font-body)' }}>
                          Geographic Focus
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {selectedMentor.investmentRequirements.geography.map((geo, index) => (
                            <Badge key={index} variant="outline" className="bg-black/5 dark:bg-white/5 text-xs">
                              {geo}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: 'var(--font-body)' }}>
                          Required Metrics
                        </p>
                        <div className="space-y-1">
                          {selectedMentor.investmentRequirements.requiredMetrics.map((metric, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <div className="w-1.5 h-1.5 bg-[#76B947] rounded-full"></div>
                              <span className="text-xs" style={{ fontFamily: 'var(--font-body)' }}>{metric}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground italic" style={{ fontFamily: 'var(--font-body)' }}>
                          📊 {selectedMentor.investmentRequirements.dealFlow}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedMentor.sessionsCompleted > 0 && (
                  <div className="pt-4 border-t border-black/10 dark:border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>Relationship Rating</span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < selectedMentor.relationshipRating
                                ? 'text-[#76B947] fill-[#76B947]'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                      Based on {selectedMentor.sessionsCompleted} completed sessions
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-black/5 dark:border-white/10">
            <CardHeader>
              <CardTitle className="dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>Session History</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedMentor.sessionsCompleted > 0 ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-[#76B947]/10">
                    <p className="text-sm mb-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>Financial Model Review</p>
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Jan 28, 2026 • 60 min</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#76B947]/10">
                    <p className="text-sm mb-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>Pitch Deck Feedback</p>
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Jan 15, 2026 • 45 min</p>
                  </div>
                  <Button variant="outline" className="w-full mt-2 hover:bg-[#76B947]/10 hover:border-[#76B947] dark:border-white/20">
                    View All Sessions
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4" style={{ fontFamily: 'var(--font-body)' }}>
                  No sessions yet. Schedule your first meeting!
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-black/5 dark:border-white/10 bg-gradient-to-br from-[#76B947]/10 to-black/5 dark:to-white/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <TrendingUp className="h-8 w-8 text-[#76B947] mx-auto" />
                <p className="text-sm dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  Share Document
                </p>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Share your pitch deck or business plan for feedback
                </p>
                <Button size="sm" className="glass-button w-full">
                  Upload Document
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Booking Dialog with Calendar View */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book a Session with {selectedMentor.name}</DialogTitle>
            <DialogDescription>
              Select an available time slot from the calendar below
            </DialogDescription>
          </DialogHeader>
          
          {/* Calendar View */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <Button variant="outline" size="sm" onClick={prevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <p className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                {formatDate(weekDays[0])} - {formatDate(weekDays[6])}
              </p>
              <Button variant="outline" size="sm" onClick={nextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, index) => {
                const dayName = getDayName(day);
                const availableTimes = getAvailableTimesForDate(day);
                const isSelected = selectedDate && selectedDate.toDateString() === day.toDateString();
                
                return (
                  <div key={index} className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`text-sm font-medium mb-2 ${isSelected ? 'text-[#76B947]' : ''}`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {availableTimes.length > 0 ? (
                        availableTimes.map((time, timeIndex) => (
                          <Button
                            key={timeIndex}
                            size="sm"
                            variant={isSelected && selectedTime === time ? 'default' : 'outline'}
                            className={`w-full text-xs py-1 h-auto ${
                              isSelected && selectedTime === time
                                ? 'bg-[#76B947] text-white hover:bg-[#76B947]/90'
                                : 'hover:bg-[#76B947]/10 hover:border-[#76B947]'
                            }`}
                            onClick={() => {
                              setSelectedDate(day);
                              setSelectedTime(time);
                            }}
                          >
                            {time}
                          </Button>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No slots</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected slot info */}
            {selectedDate && selectedTime && (
              <div className="p-3 bg-[#76B947]/10 rounded-lg border border-[#76B947]/20">
                <p className="text-sm font-medium text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Selected: {getDayName(selectedDate)}, {formatDate(selectedDate)} at {selectedTime}
                </p>
              </div>
            )}

            {/* Booking Details */}
            <div className="space-y-3 pt-3 border-t">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select
                  value={bookingForm.duration}
                  onValueChange={(value) => setBookingForm({ ...bookingForm, duration: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sessionType">Session Type</Label>
                <Select
                  value={bookingForm.sessionType}
                  onValueChange={(value) => setBookingForm({ ...bookingForm, sessionType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select session type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pitch-review">Pitch Deck Review</SelectItem>
                    <SelectItem value="financial-model">Financial Model Review</SelectItem>
                    <SelectItem value="market-entry">Market Entry Strategy</SelectItem>
                    <SelectItem value="mentorship">General Mentorship</SelectItem>
                    <SelectItem value="investment-discussion">Investment Discussion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Additional Message</Label>
                <Textarea
                  id="message"
                  value={bookingForm.message}
                  onChange={(e) => setBookingForm({ ...bookingForm, message: e.target.value })}
                  placeholder="Add any special notes or requirements..."
                  rows={3}
                />
              </div>
            </div>

            <Button
              className="w-full bg-[#76B947] text-white hover:bg-[#76B947]/90"
              onClick={handleSubmitBooking}
              disabled={!selectedDate || !selectedTime}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Confirm Booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Connection Dialog */}
      <Dialog open={isRequestConnectionDialogOpen} onOpenChange={setIsRequestConnectionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request New Connection</DialogTitle>
            <DialogDescription>
              Reach out to mentors or investors who aren't in your network yet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Connection Reason</Label>
              <Select
                value={connectionForm.reason}
                onValueChange={(value) => setConnectionForm({ ...connectionForm, reason: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mentorship">Seeking Mentorship</SelectItem>
                  <SelectItem value="investment">Investment Opportunity</SelectItem>
                  <SelectItem value="advice">Sector-Specific Advice</SelectItem>
                  <SelectItem value="partnership">Potential Partnership</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="introduction">Brief Introduction</Label>
              <Textarea
                id="introduction"
                value={connectionForm.introduction}
                onChange={(e) => setConnectionForm({ ...connectionForm, introduction: e.target.value })}
                placeholder="Tell them about yourself and your startup..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="interest">Why This Connection?</Label>
              <Textarea
                id="interest"
                value={connectionForm.interest}
                onChange={(e) => setConnectionForm({ ...connectionForm, interest: e.target.value })}
                placeholder="Explain why you'd like to connect with this person..."
                rows={3}
              />
            </div>

            <Button
              className="w-full bg-[#76B947] text-white hover:bg-[#76B947]/90"
              onClick={handleSubmitConnection}
              disabled={!connectionForm.reason || !connectionForm.introduction}
            >
              <Send className="mr-2 h-4 w-4" />
              Send Connection Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Event Dialog */}
      <Dialog open={isAddEventDialogOpen} onOpenChange={setIsAddEventDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
            <DialogDescription>
              Schedule a custom event or meeting
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eventTitle">Event Title</Label>
              <Input
                id="eventTitle"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="e.g., Team Planning Session"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventDate">Date</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={eventForm.date}
                  onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="eventTime">Time</Label>
                <Input
                  id="eventTime"
                  type="time"
                  value={eventForm.time}
                  onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="eventDescription">Description</Label>
              <Textarea
                id="eventDescription"
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="Add event details..."
                rows={4}
              />
            </div>

            <Button
              className="w-full bg-[#76B947] text-white hover:bg-[#76B947]/90"
              onClick={handleSubmitEvent}
              disabled={!eventForm.title || !eventForm.date || !eventForm.time}
            >
              <CalendarPlus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
