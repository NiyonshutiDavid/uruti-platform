import { useState, useEffect } from 'react';
import { useConfirmDialog } from '../ui/confirm-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  X, 
  Save,
  Users,
  Video,
  MapPin,
  DollarSign
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { toast } from 'sonner';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../lib/auth-context';
import { formatLocalDate } from '../../lib/datetime';

interface TimeSlot {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface BookingSettings {
  sessionDuration: number;
  bufferTime: number;
  maxDailyBookings: number;
  advanceBookingDays: number;
  meetingType: 'virtual' | 'in-person' | 'both';
  virtualPlatform: string;
  location: string;
  sessionFee: number;
  autoApprove: boolean;
  bookingInstructions: string;
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function AvailabilityModule() {
  const { confirm } = useConfirmDialog();
  const { user } = useAuth();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [newSlot, setNewSlot] = useState({
    day_of_week: 0,
    start_time: '09:00',
    end_time: '10:00',
    is_available: true
  });

  const [bookingSettings, setBookingSettings] = useState<BookingSettings>({
    sessionDuration: 60,
    bufferTime: 15,
    maxDailyBookings: 5,
    advanceBookingDays: 14,
    meetingType: 'both',
    virtualPlatform: 'Zoom',
    location: 'Kigali, Rwanda',
    sessionFee: 0,
    autoApprove: true,
    bookingInstructions: 'Please prepare your pitch deck and key questions before our session.'
  });

  useEffect(() => {
    if (user?.id) {
      fetchAvailability();
      fetchMeetings();
    }
  }, [user?.id]);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const slots = await apiClient.getMyAvailability();
      setTimeSlots(slots);
    } catch (error) {
      console.error('Failed to fetch availability:', error);
      toast.error('Failed to load availability slots');
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetings = async () => {
    try {
      const meetings = await apiClient.getMeetings();
      setBookings(meetings);
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
    }
  };

  const handleAddSlot = async () => {
    const [startHour, startMinute] = newSlot.start_time.split(':').map((v) => parseInt(v, 10));
    const [endHour, endMinute] = newSlot.end_time.split(':').map((v) => parseInt(v, 10));
    const startTotal = (Number.isFinite(startHour) ? startHour : 0) * 60 + (Number.isFinite(startMinute) ? startMinute : 0);
    const endTotal = (Number.isFinite(endHour) ? endHour : 0) * 60 + (Number.isFinite(endMinute) ? endMinute : 0);

    if (endTotal <= startTotal) {
      toast.error('End time must be after start time (for example 09:00 - 10:00).');
      return;
    }

    try {
      const slot = await apiClient.createAvailability(newSlot);
      setTimeSlots([...timeSlots, slot]);
      setNewSlot({ day_of_week: 0, start_time: '09:00', end_time: '10:00', is_available: true });
      setIsAddingSlot(false);
      toast.success('Time slot added successfully!');
    } catch (error: any) {
      console.error('Failed to create slot:', error);
      toast.error(error.message || 'Failed to add time slot');
    }
  };

  const handleDeleteSlot = async (id: number) => {
    const confirmed = await confirm({
      title: 'Delete Time Slot',
      description: 'Delete this availability slot? Anyone who booked this time will be notified.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await apiClient.deleteAvailability(id);
      setTimeSlots(timeSlots.filter(slot => slot.id !== id));
      toast.success('Time slot deleted');
    } catch (error) {
      console.error('Failed to delete slot:', error);
      toast.error('Failed to delete time slot');
    }
  };

  const handleToggleSlot = async (id: number) => {
    const slot = timeSlots.find(s => s.id === id);
    if (!slot) return;

    try {
      const updated = await apiClient.updateAvailability(id, { 
        is_available: !slot.is_available 
      });
      setTimeSlots(timeSlots.map(s => s.id === id ? updated : s));
      toast.success(updated.is_available ? 'Slot activated' : 'Slot deactivated');
    } catch (error) {
      console.error('Failed to toggle slot:', error);
      toast.error('Failed to update slot');
    }
  };

  const groupedSlots = timeSlots.reduce((acc, slot) => {
    const day = daysOfWeek[slot.day_of_week];
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  const totalAvailableHours = timeSlots
    .filter(slot => slot.is_available)
    .reduce((acc, slot) => {
      const start = parseInt(slot.start_time.split(':')[0]);
      const end = parseInt(slot.end_time.split(':')[0]);
      return acc + (end - start);
    }, 0);

  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-black/5 dark:border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>Availability & Booking Management            </h1>
            <p className="text-base sm:text-lg text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Set your availability and manage booking requests from founders
            </p>
          </div>
          <Button 
            className="bg-[#76B947] text-white hover:bg-[#76B947]/90 lg:self-start"
            onClick={() => setIsAddingSlot(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Time Slot
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Weekly Hours
                </p>
                <p className="text-3xl mt-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  {totalAvailableHours}
                </p>
              </div>
              <Clock className="h-8 w-8 text-[#76B947]" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                Confirmed Bookings
              </p>
              <p className="text-3xl mt-1 text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                {confirmedBookings}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                Pending Requests
              </p>
              <p className="text-3xl mt-1 text-orange-600" style={{ fontFamily: 'var(--font-heading)' }}>
                {pendingBookings}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                Active Slots
              </p>
              <p className="text-3xl mt-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                {timeSlots.filter(s => s.is_available).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Availability Schedule */}
        <div className="space-y-4">
          <Card className="glass-card border-black/5 dark:border-white/10">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Weekly Availability</CardTitle>
              <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                Manage your recurring time slots for founder meetings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Add New Slot Form */}
                {isAddingSlot && (
                  <div className="p-4 border border-[#76B947] rounded-lg space-y-3 bg-[#76B947]/5">
                    <div className="grid grid-cols-3 gap-2">
                      <Select 
                        value={newSlot.day_of_week.toString()} 
                        onValueChange={(value: string) => setNewSlot({ ...newSlot, day_of_week: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                        <SelectContent>
                          {daysOfWeek.map((day, idx) => (
                            <SelectItem key={day} value={idx.toString()}>{day}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Input
                        type="time"
                        value={newSlot.start_time}
                        onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                      />
                      
                      <Input
                        type="time"
                        value={newSlot.end_time}
                        onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddingSlot(false)}
                      >
                        <X className="mr-1 h-3 w-3" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="bg-[#76B947] text-white hover:bg-[#76B947]/90"
                        onClick={handleAddSlot}
                      >
                        <Save className="mr-1 h-3 w-3" />
                        Save Slot
                      </Button>
                    </div>
                  </div>
                )}

                {/* Grouped Time Slots */}
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading availability...
                  </div>
                ) : timeSlots.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                      No time slots configured yet. Add your first slot to get started.
                    </p>
                  </div>
                ) : (
                  daysOfWeek.map(day => {
                    const daySlots = groupedSlots[day] || [];
                    if (daySlots.length === 0) return null;
                    
                    return (
                      <div key={day} className="space-y-2">
                        <p className="text-sm font-medium dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                          {day}
                        </p>
                        {daySlots.map(slot => (
                          <div
                            key={slot.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              slot.is_available 
                                ? 'border-black/5 dark:border-white/10 bg-white/50 dark:bg-white/5' 
                                : 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 opacity-60'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <Switch
                                checked={slot.is_available}
                                onCheckedChange={() => handleToggleSlot(slot.id)}
                              />
                              <div>
                                <p className="text-sm font-medium dark:text-white" style={{ fontFamily: 'var(--font-body)' }}>
                                  {slot.start_time} - {slot.end_time}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {Math.abs(parseInt(slot.end_time.split(':')[0]) - parseInt(slot.start_time.split(':')[0]))} hours
                                </p>
                              </div>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSlot(slot.id)}
                              className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Settings */}
        <div className="space-y-4">
          <Card className="glass-card border-black/5 dark:border-white/10">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Booking Settings</CardTitle>
              <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                Configure how founders can book sessions with you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sessionDuration">Session Duration (minutes)</Label>
                <Select 
                  value={bookingSettings.sessionDuration.toString()}
                  onValueChange={(value: string) => setBookingSettings({ ...bookingSettings, sessionDuration: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bufferTime">Buffer Time (minutes)</Label>
                <Select 
                  value={bookingSettings.bufferTime.toString()}
                  onValueChange={(value: string) => setBookingSettings({ ...bookingSettings, bufferTime: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No buffer</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meetingType">Meeting Type</Label>
                <Select 
                  value={bookingSettings.meetingType}
                  onValueChange={(value: any) => setBookingSettings({ ...bookingSettings, meetingType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="virtual">Virtual Only</SelectItem>
                    <SelectItem value="in-person">In-Person Only</SelectItem>
                    <SelectItem value="both">Both Virtual & In-Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(bookingSettings.meetingType === 'virtual' || bookingSettings.meetingType === 'both') && (
                <div className="space-y-2">
                  <Label htmlFor="virtualPlatform">Virtual Platform</Label>
                  <div className="relative">
                    <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="virtualPlatform"
                      value={bookingSettings.virtualPlatform}
                      onChange={(e) => setBookingSettings({ ...bookingSettings, virtualPlatform: e.target.value })}
                      className="pl-10"
                      placeholder="Zoom, Google Meet, etc."
                    />
                  </div>
                </div>
              )}

              {(bookingSettings.meetingType === 'in-person' || bookingSettings.meetingType === 'both') && (
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={bookingSettings.location}
                      onChange={(e) => setBookingSettings({ ...bookingSettings, location: e.target.value })}
                      className="pl-10"
                      placeholder="City, venue, etc."
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="sessionFee">Session Fee (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="sessionFee"
                    type="number"
                    value={bookingSettings.sessionFee}
                    onChange={(e) => setBookingSettings({ ...bookingSettings, sessionFee: parseInt(e.target.value) })}
                    className="pl-10"
                    placeholder="0 for free"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#76B947]/5 border border-[#76B947]/20">
                <div>
                  <p className="text-sm font-medium dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    Auto-approve bookings
                  </p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Automatically confirm booking requests
                  </p>
                </div>
                <Switch
                  checked={bookingSettings.autoApprove}
                  onCheckedChange={(checked: boolean) => setBookingSettings({ ...bookingSettings, autoApprove: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Booking Instructions</Label>
                <Textarea
                  id="instructions"
                  value={bookingSettings.bookingInstructions}
                  onChange={(e) => setBookingSettings({ ...bookingSettings, bookingInstructions: e.target.value })}
                  placeholder="Special instructions for founders..."
                  rows={3}
                />
              </div>

              <Button className="w-full bg-[#76B947] text-white hover:bg-[#76B947]/90">
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upcoming Bookings */}
      <Card className="glass-card border-black/5 dark:border-white/10">
        <CardHeader>
          <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Upcoming Bookings</CardTitle>
          <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
            Manage your scheduled sessions with founders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bookings.map(booking => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 rounded-lg border border-black/5 dark:border-white/10 hover:bg-[#76B947]/5 transition-colors"
              >
                <div className="flex items-start space-x-4 flex-1">
                  <div className="p-2 rounded-lg bg-[#76B947]/20">
                    <Users className="h-5 w-5 text-[#76B947]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                        {booking.founderName}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {booking.startupName}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(booking.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {booking.time} ({booking.duration} min)
                      </span>
                      <span className="text-[#76B947]">{booking.type}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {booking.status === 'pending' ? (
                    <>
                      <Button size="sm" className="bg-[#76B947] text-white hover:bg-[#76B947]/90">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="hover:bg-red-50 hover:text-red-600 hover:border-red-600">
                        <X className="mr-1 h-3 w-3" />
                        Decline
                      </Button>
                    </>
                  ) : (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      Confirmed
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}