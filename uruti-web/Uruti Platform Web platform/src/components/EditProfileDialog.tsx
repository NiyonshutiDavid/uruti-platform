import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Camera, Upload, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: any;
  onSave: (updatedProfile: any) => void;
}

export function EditProfileDialog({ open, onOpenChange, profile, onSave }: EditProfileDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    location: '',
    bio: '',
    email: '',
    phone: '',
    website: '',
    linkedIn: '',
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  // Update form data when dialog opens or profile changes
  useEffect(() => {
    if (open && profile) {
      setFormData({
        name: profile.name || '',
        role: profile.role || '',
        location: profile.location || '',
        bio: profile.bio || '',
        email: profile.email || '',
        phone: profile.phone || '',
        website: profile.website || '',
        linkedIn: profile.linkedIn || '',
      });
      setSkills(profile.skills || []);
    }
  }, [open, profile]);

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleSave = () => {
    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    
    onSave({ ...formData, skills });
    toast.success('Profile updated successfully');
    onOpenChange(false);
  };

  const isFormValid = formData.name.trim() && formData.email.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-heading)' }}>Edit Profile</DialogTitle>
          <DialogDescription>Update your profile information</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Profile Picture */}
          <div className="flex items-center gap-4">
            <Avatar className="h-24 w-24 border-2 border-[#76B947]">
              <AvatarImage src={profile?.avatar} />
              <AvatarFallback className="bg-[#76B947]/20 text-[#76B947] text-2xl">
                {formData.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button variant="outline" size="sm">
                <Camera className="h-4 w-4 mr-2" />
                Change Photo
              </Button>
              <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max size 5MB</p>
            </div>
          </div>

          {/* Cover Photo */}
          <div>
            <Label>Cover Photo</Label>
            <div className="mt-2 relative h-32 bg-gradient-to-r from-black via-gray-800 to-[#76B947] rounded-lg overflow-hidden">
              <img src={profile?.coverImage} alt="Cover" className="w-full h-full object-cover opacity-40" />
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white hover:bg-black/70"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Cover
              </Button>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your full name"
              />
            </div>
            <div>
              <Label htmlFor="role">Professional Role</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g., Tech Entrepreneur"
              />
            </div>
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

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </div>

          {/* Skills */}
          <div className="space-y-3">
            <Label>Skills & Expertise</Label>
            <div className="flex items-center gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                placeholder="Add a skill (press Enter)"
                className="flex-1 dark:bg-gray-800 dark:border-gray-700"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddSkill}
                className="hover:bg-[#76B947]/10 hover:border-[#76B947]"
              >
                Add
              </Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                {skills.map((skill, index) => (
                  <Badge
                    key={index}
                    className="bg-[#76B947]/10 text-[#76B947] hover:bg-[#76B947]/20 border border-[#76B947]/30 pl-3 pr-1 py-1.5 flex items-center gap-2"
                  >
                    <span style={{ fontFamily: 'var(--font-body)' }}>{skill}</span>
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:bg-[#76B947]/30 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your.email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+250 XXX XXX XXX"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="www.example.com"
                />
              </div>
              <div>
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={formData.linkedIn}
                  onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
                  placeholder="linkedin.com/in/yourprofile"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="bg-[#76B947] hover:bg-[#5a8f35] text-white" onClick={handleSave} disabled={!isFormValid}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}