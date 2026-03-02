import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../lib/api-client';

interface TimeSlot {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface BookingWeekDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: number;
  targetUserName: string;
}

const meetingTypes = [
  { value: 'general_meeting', label: 'General Meeting' },
  { value: 'pitch', label: 'Pitch Session' },
  { value: 'mentor_session', label: 'Mentor Session' },
  { value: 'workshop', label: 'Workshop' },
];

const parseTime = (value: string) => {
  const [hoursRaw, minutesRaw] = value.split(':');
  return {
    hours: Number(hoursRaw || 0),
    minutes: Number(minutesRaw || 0),
  };
};

const startOfWeek = (date: Date) => {
  const result = new Date(date);
  const mondayOffset = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - mondayOffset);
  result.setHours(0, 0, 0, 0);
  return result;
};

const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTimeRange = (start: string, end: string) => {
  const [sh, sm] = start.split(':');
  const [eh, em] = end.split(':');
  return `${sh}:${sm} - ${eh}:${em}`;
};

export function BookingWeekDialog({
  open,
  onOpenChange,
  targetUserId,
  targetUserName,
}: BookingWeekDialogProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingType, setMeetingType] = useState('general_meeting');

  useEffect(() => {
    if (!open) {
      setWeekOffset(0);
      setSelectedDate('');
      setSelectedSlotId(null);
      setDescription('');
      setTitle('');
      setMeetingType('general_meeting');
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const data = await apiClient.getAvailability(targetUserId);
        setSlots((data || []).filter((slot: TimeSlot) => slot.is_available));
      } catch (error) {
        console.error('Failed to fetch availability:', error);
        toast.error('Could not load availability slots');
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open, targetUserId]);

  useEffect(() => {
    if (!open) return;
    setTitle(`Session with ${targetUserName}`);
  }, [open, targetUserName]);

  const weekStart = useMemo(() => {
    const now = new Date();
    const currentWeekStart = startOfWeek(now);
    currentWeekStart.setDate(currentWeekStart.getDate() + weekOffset * 7);
    return currentWeekStart;
  }, [weekOffset]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + index);
      return day;
    });
  }, [weekStart]);

  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId) || null;

  const slotsForDay = (date: Date) => {
    const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1;
    return slots
      .filter((slot) => slot.day_of_week === dayOfWeek)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const handlePickSlot = (slot: TimeSlot, date: Date) => {
    setSelectedSlotId(slot.id);
    setSelectedDate(toIsoDate(date));
  };

  const handleSubmit = async () => {
    if (!selectedSlot || !selectedDate) {
      toast.error('Select an available slot first');
      return;
    }

    const [year, month, day] = selectedDate.split('-').map(Number);
    const startClock = parseTime(selectedSlot.start_time);
    const endClock = parseTime(selectedSlot.end_time);
    const startDate = new Date(year, month - 1, day, startClock.hours, startClock.minutes, 0, 0);
    const endDate = new Date(year, month - 1, day, endClock.hours, endClock.minutes, 0, 0);

    if (startDate <= new Date()) {
      toast.error('Choose a future time slot');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.createMeeting({
        participant_id: targetUserId,
        title: title.trim() || `Session with ${targetUserName}`,
        meeting_type: meetingType,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        timezone: 'Africa/Kigali',
        ...(description.trim() ? { description: description.trim() } : {}),
      });

      toast.success('Session booked successfully');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to book session:', error);
      toast.error(error?.message || 'Failed to book session');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Book Session with {targetUserName}</DialogTitle>
          <DialogDescription>Select an available slot from the week view.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset((prev) => Math.max(0, prev - 1))}
              disabled={weekOffset === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Badge variant="outline">
              {weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} -{' '}
              {weekDays[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </Badge>
            <Button type="button" variant="outline" size="sm" onClick={() => setWeekOffset((prev) => prev + 1)}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {loading ? (
            <div className="py-10 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading slots...
            </div>
          ) : slots.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground border rounded-lg">
              No available slots configured for this person yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const daySlots = slotsForDay(day);
                const dayLabel = day.toLocaleDateString(undefined, { weekday: 'short' });
                const dayDate = day.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

                return (
                  <div key={day.toISOString()} className="border rounded-lg p-2 space-y-2 bg-background/40">
                    <div className="text-center">
                      <p className="text-xs font-semibold">{dayLabel}</p>
                      <p className="text-[11px] text-muted-foreground">{dayDate}</p>
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {daySlots.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground text-center py-2">No slots</p>
                      ) : (
                        daySlots.map((slot) => {
                          const selected = selectedSlotId === slot.id && selectedDate === toIsoDate(day);
                          return (
                            <button
                              key={`${slot.id}-${toIsoDate(day)}`}
                              type="button"
                              onClick={() => handlePickSlot(slot, day)}
                              className={`w-full text-left text-[11px] px-2 py-1 rounded border transition-colors ${
                                selected
                                  ? 'bg-[#76B947] text-white border-[#76B947]'
                                  : 'hover:bg-[#76B947]/10 border-border text-foreground'
                              }`}
                            >
                              {formatTimeRange(slot.start_time, slot.end_time)}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Session title" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {meetingTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Agenda or context for this session"
            />
          </div>

          <div className="flex justify-end">
            <Button type="button" onClick={handleSubmit} disabled={loading || submitting || !selectedSlot}>
              {submitting ? 'Booking...' : 'Book Session'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
