import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Calendar, Upload } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface AddExperienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (experience: any) => void;
}

export function AddExperienceDialog({ open, onOpenChange, onAdd }: AddExperienceDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
  });

  const handleAdd = () => {
    if (!formData.title || !formData.company || !formData.startDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    onAdd(formData);
    toast.success('Experience added successfully');
    setFormData({
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-heading)' }}>Add Experience</DialogTitle>
          <DialogDescription>Add a new work experience to your profile</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="title">Job Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Founder & CEO"
            />
          </div>

          <div>
            <Label htmlFor="company">Company *</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Company name"
            />
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="City, Country"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                placeholder="e.g., Jan 2023"
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                placeholder="e.g., Present"
                disabled={formData.current}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="current"
              checked={formData.current}
              onChange={(e) => setFormData({ ...formData, current: e.target.checked, endDate: e.target.checked ? 'Present' : '' })}
              className="rounded border-gray-300 text-[#76B947] focus:ring-[#76B947]"
            />
            <Label htmlFor="current" className="font-normal">I currently work here</Label>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your role and achievements..."
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="bg-[#76B947] hover:bg-[#5a8f35] text-white" onClick={handleAdd}>
            Add Experience
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface AddAchievementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (achievement: any) => void;
}

export function AddAchievementDialog({ open, onOpenChange, onAdd }: AddAchievementDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    issuer: '',
    date: '',
  });

  const handleAdd = () => {
    if (!formData.title || !formData.issuer || !formData.date) {
      toast.error('Please fill in all fields');
      return;
    }
    onAdd(formData);
    toast.success('Achievement added successfully');
    setFormData({ title: '', issuer: '', date: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-heading)' }}>Add Achievement</DialogTitle>
          <DialogDescription>Add a certification, award, or achievement</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="achievementTitle">Achievement Title *</Label>
            <Input
              id="achievementTitle"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Top 10 African AgriTech Startups"
            />
          </div>

          <div>
            <Label htmlFor="issuer">Issuing Organization *</Label>
            <Input
              id="issuer"
              value={formData.issuer}
              onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
              placeholder="e.g., Africa Tech Summit"
            />
          </div>

          <div>
            <Label htmlFor="achievementDate">Date *</Label>
            <Input
              id="achievementDate"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              placeholder="e.g., Feb 2024"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="bg-[#76B947] hover:bg-[#5a8f35] text-white" onClick={handleAdd}>
            Add Achievement
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface AddActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (activity: any) => void;
}

export function AddActivityDialog({ open, onOpenChange, onAdd }: AddActivityDialogProps) {
  const [formData, setFormData] = useState({
    type: 'milestone',
    content: '',
    date: 'Today',
  });

  const handleAdd = () => {
    if (!formData.content) {
      toast.error('Please enter activity content');
      return;
    }
    onAdd(formData);
    toast.success('Activity added successfully');
    setFormData({ type: 'milestone', content: '', date: 'Today' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-heading)' }}>Add Activity</DialogTitle>
          <DialogDescription>Share a recent achievement or update</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="activityType">Activity Type</Label>
            <select
              id="activityType"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="milestone">Milestone</option>
              <option value="pitch">Pitch</option>
              <option value="funding">Funding</option>
              <option value="investment">Investment</option>
              <option value="event">Event</option>
            </select>
          </div>

          <div>
            <Label htmlFor="activityContent">Activity Description *</Label>
            <Textarea
              id="activityContent"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Describe your activity or achievement..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="bg-[#76B947] hover:bg-[#5a8f35] text-white" onClick={handleAdd}>
            Add Activity
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
