import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { MapPin, Link as LinkIcon, Mail, Phone, Edit, Save, X, AlertCircle, Loader2 } from 'lucide-react';
import ChangePasswordDialog from '../dialogs/ChangePasswordDialog';
import apiClient from '@/services/api';

interface ProfileModuleProps {
  userType?: 'founder' | 'investor';
}

export function ProfileModule({ userType }: ProfileModuleProps) {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [editData, setEditData] = useState({
    full_name: '',
    bio: '',
    phone: '',
    location: '',
    website: '',
    linkedin: '',
    twitter: '',
    headline: '',
    skills: '',
    avatar_url: '',
  });

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getProfile();
      setProfile(data);
      setEditData({
        full_name: data.full_name || '',
        bio: data.bio || '',
        phone: data.phone || '',
        location: data.location || '',
        website: data.website || '',
        linkedin: data.linkedin || '',
        twitter: data.twitter || '',
        headline: data.headline || '',
        skills: data.skills || '',
        avatar_url: data.avatar_url || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      const updatedProfile = await apiClient.updateProfile(editData);
      setProfile(updatedProfile);
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      full_name: profile.full_name || '',
      bio: profile.bio || '',
      phone: profile.phone || '',
      location: profile.location || '',
      website: profile.website || '',
      linkedin: profile.linkedin || '',
      twitter: profile.twitter || '',
      headline: profile.headline || '',
      skills: profile.skills || '',
      avatar_url: profile.avatar_url || '',
    });
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#76B947]" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Profile</h1>
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-[#76B947] hover:bg-[#76B947]/90"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg bg-green-50 p-4 text-green-700">
          {successMessage}
        </div>
      )}

      {!isEditing ? (
        /* View Mode */
        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="border-black/5 dark:border-white/10">
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                    <AvatarFallback className="bg-[#76B947]/10 text-[#76B947] text-xl">
                      {profile?.full_name?.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold mb-2">{profile?.full_name || 'User'}</h2>
                    {profile?.headline && (
                      <p className="text-lg text-muted-foreground mb-4">{profile.headline}</p>
                    )}
                    {profile?.bio && (
                      <p className="text-muted-foreground max-w-2xl mb-4">{profile.bio}</p>
                    )}
                    <div className="flex flex-wrap gap-3">
                      {profile?.location && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {profile.location}
                        </div>
                      )}
                      {profile?.email && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          {profile.email}
                        </div>
                      )}
                      {profile?.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          {profile.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details & Settings */}
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              <Card className="border-black/5 dark:border-white/10">
                <CardHeader>
                  <CardTitle>Profile Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile?.headline && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Headline</p>
                      <p className="mt-1">{profile.headline}</p>
                    </div>
                  )}
                  {profile?.bio && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Bio</p>
                      <p className="mt-1 whitespace-pre-wrap">{profile.bio}</p>
                    </div>
                  )}
                  {profile?.location && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Location</p>
                      <p className="mt-1">{profile.location}</p>
                    </div>
                  )}
                  {profile?.skills && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Skills</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profile.skills.split(',').map((skill: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-[#76B947]/10 text-[#76B947] rounded-full text-sm"
                          >
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Links Tab */}
            <TabsContent value="links" className="space-y-4">
              <Card className="border-black/5 dark:border-white/10">
                <CardHeader>
                  <CardTitle>Social Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile?.website && (
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-muted-foreground" />
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#76B947] hover:underline"
                      >
                        {profile.website}
                      </a>
                    </div>
                  )}
                  {profile?.linkedin && (
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-muted-foreground" />
                      <a
                        href={profile.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#76B947] hover:underline"
                      >
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                  {profile?.twitter && (
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-muted-foreground" />
                      <a
                        href={profile.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#76B947] hover:underline"
                      >
                        Twitter Profile
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-4">
              <Card className="border-black/5 dark:border-white/10">
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="pb-4 border-b border-black/10 dark:border-white/10">
                    <p className="font-medium mb-2">Password</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Manage your account password
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setShowChangePassword(true)}
                      className="border-[#76B947] text-[#76B947] hover:bg-[#76B947]/10"
                    >
                      Change Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        /* Edit Mode */
        <Card className="border-black/5 dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Edit Profile</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={saving}
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <Input
                  value={editData.full_name}
                  onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                  placeholder="Your full name"
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Headline</label>
                <Input
                  value={editData.headline}
                  onChange={(e) => setEditData({ ...editData, headline: e.target.value })}
                  placeholder="e.g., Tech Entrepreneur & Founder"
                  disabled={saving}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <Textarea
                value={editData.bio}
                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <Input
                  value={editData.location}
                  onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                  placeholder="e.g., Kigali, Rwanda"
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <Input
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  placeholder="Your phone number"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Website</label>
                <Input
                  value={editData.website}
                  onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                  placeholder="e.g., www.example.com"
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">LinkedIn</label>
                <Input
                  value={editData.linkedin}
                  onChange={(e) => setEditData({ ...editData, linkedin: e.target.value })}
                  placeholder="Your LinkedIn profile URL"
                  disabled={saving}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Twitter</label>
              <Input
                value={editData.twitter}
                onChange={(e) => setEditData({ ...editData, twitter: e.target.value })}
                placeholder="Your Twitter profile URL"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Skills (comma-separated)</label>
              <Input
                value={editData.skills}
                onChange={(e) => setEditData({ ...editData, skills: e.target.value })}
                placeholder="e.g., AgriTech, Business Development, Fundraising"
                disabled={saving}
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-black/10 dark:border-white/10">
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-[#76B947] hover:bg-[#76B947]/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                onClick={handleCancel}
                disabled={saving}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ChangePasswordDialog
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSuccess={() => {
          setSuccessMessage('Password changed successfully!');
          setTimeout(() => setSuccessMessage(null), 3000);
        }}
      />
    </div>
  );
}
