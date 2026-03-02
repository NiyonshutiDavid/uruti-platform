import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../lib/api-client';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: any;
  onSave: (updatedProfile: any) => Promise<void>;
  userType?: 'founder' | 'investor';
}

export function EditProfileDialog({ open, onOpenChange, profile, onSave, userType = 'founder' }: EditProfileDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    location: '',
    bio: '',
    email: '',
    phone: '',
    website: '',
    linkedIn: '',
    // Investor-specific fields (all from signup)
    organizationName: '',
    investorType: '',
    investmentRange: '',
    investmentStage: '',
    portfolioSize: '',
    investmentThesis: '',
    ticketSize: '',
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  
  // Investor-specific fields
  const [preferredSectors, setPreferredSectors] = useState<string[]>([]);
  const [newSector, setNewSector] = useState('');
  
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);

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
        // Investor-specific fields
        organizationName: profile.organizationName || '',
        investorType: profile.investorType || '',
        investmentRange: profile.investmentRange || '',
        investmentStage: profile.investmentStage || '',
        portfolioSize: profile.portfolioSize || '',
        investmentThesis: profile.investmentThesis || '',
        ticketSize: profile.ticketSize || '',
      });
      setSkills(profile.skills || []);
      setPreferredSectors(profile.preferredSectors || []);
      setProfileImage(profile.avatar || null);
      setCoverImage(profile.coverImage || null);
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

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp|heic|heif)/)) {
        toast.error('Only JPG, PNG, GIF, WEBP, HEIC, and HEIF images are allowed');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
        toast.success('Profile photo updated!');
      };
      reader.onerror = () => {
        toast.error('Failed to load image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp|heic|heif)/)) {
        toast.error('Only JPG, PNG, GIF, WEBP, HEIC, and HEIF images are allowed');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result as string);
        toast.success('Cover photo updated!');
      };
      reader.onerror = () => {
        toast.error('Failed to load image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProfileImage = () => {
    setProfileImage('');
    toast.success('Profile photo removed');
  };

  const handleRemoveCoverImage = () => {
    setCoverImage('');
    toast.success('Cover photo removed');
  };

  const handleAddSector = () => {
    if (newSector.trim() && !preferredSectors.includes(newSector.trim())) {
      setPreferredSectors([...preferredSectors, newSector.trim()]);
      setNewSector('');
    }
  };

  const handleRemoveSector = (sectorToRemove: string) => {
    setPreferredSectors(preferredSectors.filter(sector => sector !== sectorToRemove));
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    try {
      await onSave({ ...formData, skills, avatar: profileImage, coverImage, preferredSectors });
      toast.success('Profile updated successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Profile save failed:', error);
      toast.error('Failed to update profile. Please try again.');
    }
  };

  const isFormValid = formData.name.trim() && formData.email.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-heading)' }}>Edit Profile</DialogTitle>
          <DialogDescription>Update your profile information</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Profile Picture */}
          <div className="flex items-center gap-4">
            <Avatar className="h-24 w-24 border-2 border-[#76B947]">
              <AvatarImage src={profileImage || profile?.avatar} />
              <AvatarFallback className="bg-[#76B947]/20 text-[#76B947] text-2xl">
                {formData.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button variant="outline" size="sm" onClick={() => profileImageInputRef.current?.click()}>
                <Camera className="h-4 w-4 mr-2" />
                Change Photo
              </Button>
              <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max size 5MB</p>
              <input
                type="file"
                ref={profileImageInputRef}
                className="hidden"
                accept="image/jpeg, image/png, image/gif, image/webp, image/heic, image/heif"
                onChange={handleProfileImageChange}
              />
              {(profileImage ?? profile?.avatar) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleRemoveProfileImage}
                >
                  Remove Photo
                </Button>
              )}
            </div>
          </div>

          {/* Cover Photo */}
          <div>
            <Label>Cover Photo</Label>
            <div className="mt-2 relative h-32 bg-gradient-to-r from-black via-gray-800 to-[#76B947] rounded-lg overflow-hidden">
              <img src={coverImage || profile?.coverImage} alt="Cover" className="w-full h-full object-cover opacity-40" />
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white hover:bg-black/70"
                onClick={() => coverImageInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Cover
              </Button>
              <input
                type="file"
                ref={coverImageInputRef}
                className="hidden"
                accept="image/jpeg, image/png, image/gif, image/webp, image/heic, image/heif"
                onChange={handleCoverImageChange}
              />
              {(coverImage ?? profile?.coverImage) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white hover:bg-black/70"
                  onClick={handleRemoveCoverImage}
                >
                  Remove Cover
                </Button>
              )}
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

          {/* Investor-specific fields */}
          {userType === 'investor' && (
            <div className="space-y-4">
              <h3 className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Investor Information</h3>
              
              {/* Organization Name */}
              <div>
                <Label htmlFor="organizationName">Organization / Fund Name</Label>
                <Input
                  id="organizationName"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  placeholder="Your fund or organization"
                />
              </div>

              {/* Investor Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="investorType">Investor Type</Label>
                  <select
                    id="investorType"
                    value={formData.investorType}
                    onChange={(e) => setFormData({ ...formData, investorType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg glass-card border border-black/10 dark:border-white/10 bg-transparent dark:text-white"
                  >
                    <option value="">Select type</option>
                    <option value="angel">Angel Investor</option>
                    <option value="vc">Venture Capital</option>
                    <option value="corporate">Corporate Investor</option>
                    <option value="accelerator">Accelerator/Incubator</option>
                    <option value="family-office">Family Office</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="investmentRange">Investment Range</Label>
                  <select
                    id="investmentRange"
                    value={formData.investmentRange}
                    onChange={(e) => setFormData({ ...formData, investmentRange: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg glass-card border border-black/10 dark:border-white/10 bg-transparent dark:text-white"
                  >
                    <option value="">Select range</option>
                    <option value="0-50k">$0 - $50K</option>
                    <option value="50k-100k">$50K - $100K</option>
                    <option value="100k-500k">$100K - $500K</option>
                    <option value="500k-1m">$500K - $1M</option>
                    <option value="1m-5m">$1M - $5M</option>
                    <option value="5m+">$5M+</option>
                  </select>
                </div>
              </div>

              {/* Investment Stage & Portfolio Size */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="investmentStage">Preferred Stage</Label>
                  <select
                    id="investmentStage"
                    value={formData.investmentStage}
                    onChange={(e) => setFormData({ ...formData, investmentStage: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg glass-card border border-black/10 dark:border-white/10 bg-transparent dark:text-white"
                  >
                    <option value="">Select stage</option>
                    <option value="pre-seed">Pre-Seed</option>
                    <option value="seed">Seed</option>
                    <option value="series-a">Series A</option>
                    <option value="series-b">Series B</option>
                    <option value="series-c+">Series C+</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="portfolioSize">Portfolio Size</Label>
                  <Input
                    id="portfolioSize"
                    value={formData.portfolioSize}
                    onChange={(e) => setFormData({ ...formData, portfolioSize: e.target.value })}
                    placeholder="e.g., 12 companies"
                  />
                </div>
              </div>

              {/* Investment Thesis & Ticket Size */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="investmentThesis">Investment Thesis</Label>
                  <Textarea
                    id="investmentThesis"
                    value={formData.investmentThesis}
                    onChange={(e) => setFormData({ ...formData, investmentThesis: e.target.value })}
                    placeholder="Describe your investment thesis..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="ticketSize">Check Size / Ticket Size</Label>
                  <Input
                    id="ticketSize"
                    value={formData.ticketSize}
                    onChange={(e) => setFormData({ ...formData, ticketSize: e.target.value })}
                    placeholder="e.g., $100K - $500K"
                    className="mb-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your typical investment amount per deal
                  </p>
                </div>
              </div>
              
              {/* Preferred Sectors */}
              <div className="space-y-3">
                <Label>Preferred Sectors</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={newSector}
                    onChange={(e) => setNewSector(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSector()}
                    placeholder="Add a sector (press Enter)"
                    className="flex-1 dark:bg-gray-800 dark:border-gray-700"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddSector}
                    className="hover:bg-[#76B947]/10 hover:border-[#76B947]"
                  >
                    Add
                  </Button>
                </div>
                {preferredSectors.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    {preferredSectors.map((sector, index) => (
                      <Badge
                        key={index}
                        className="bg-[#76B947]/10 text-[#76B947] hover:bg-[#76B947]/20 border border-[#76B947]/30 pl-3 pr-1 py-1.5 flex items-center gap-2"
                      >
                        <span style={{ fontFamily: 'var(--font-body)' }}>{sector}</span>
                        <button
                          onClick={() => handleRemoveSector(sector)}
                          className="hover:bg-[#76B947]/30 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
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