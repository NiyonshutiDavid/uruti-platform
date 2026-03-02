import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { useTheme } from '../../lib/theme-context';
import { Bell, Lock, Palette, Save, Eye, EyeOff, Shield, TrendingUp, Briefcase, Building2, HelpCircle, BookOpen, Mail, Phone, RotateCcw, Users, MessageCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { useAuth } from '../../lib/auth-context';
import { apiClient } from '../../lib/api-client';

interface SettingsModuleProps {
  userType: 'founder' | 'investor';
}

export function SettingsModule({ userType }: SettingsModuleProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('eat');
  
  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('uruti_settings_language');
    const savedTimezone = localStorage.getItem('uruti_settings_timezone');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
    if (savedTimezone) {
      setTimezone(savedTimezone);
    }
  }, []);

  const navigateToModule = (module: string) => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { module } }));
  };

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      localStorage.setItem('uruti_settings_language', language);
      localStorage.setItem('uruti_settings_timezone', timezone);
      setSaveStatus('saved');
      toast.success('Settings saved successfully!');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  };

  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      setUpdatingPassword(true);
      await apiClient.updateAdminCredentials({
        email: user?.email || '',
        current_password: currentPassword,
        new_password: newPassword,
      });

      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    toast.success(`Language changed to ${value === 'en' ? 'English' : value === 'rw' ? 'Kinyarwanda' : 'Français'}`);
  };

  const handleTimezoneChange = (value: string) => {
    setTimezone(value);
    toast.success('Timezone updated successfully');
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-8 border border-black/5 dark:border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Account Settings ⚙️
            </h1>
            <p className="text-lg text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Manage your profile and preferences
            </p>
          </div>
          <Button 
            onClick={handleSave}
            className="bg-[#76B947] text-white hover:bg-[#76B947]/90"
            disabled={saveStatus !== 'idle'}
          >
            <Save className="mr-2 h-4 w-4" />
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="glass-card">
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="mr-2 h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Lock className="mr-2 h-4 w-4" />
            Privacy & Security
          </TabsTrigger>
          <TabsTrigger value="support">
            <HelpCircle className="mr-2 h-4 w-4" />
            Support & Help
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="glass-card border-black/5 dark:border-white/10">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Notification Preferences</CardTitle>
              <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Receive notifications via email
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Receive browser push notifications
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">New Messages</Label>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Get notified when you receive messages
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              {userType === 'founder' && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Investment Interest</Label>
                      <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        When investors bookmark your startups
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Pitch Feedback</Label>
                      <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        AI-generated feedback on your pitches
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Milestone Achievements</Label>
                      <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        Celebrate when you hit important milestones
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </>
              )}

              {userType === 'investor' && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">New Opportunities</Label>
                      <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        When new startups match your criteria
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Uruti Score Updates</Label>
                      <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        When bookmarked startups improve their scores
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Meeting Reminders</Label>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Reminders before scheduled meetings
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Weekly Summary</Label>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Weekly digest of your activity
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card className="glass-card border-black/5 dark:border-white/10">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Appearance Settings</CardTitle>
              <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                Customize how Uruti looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Enable dark theme for better viewing at night
                  </p>
                </div>
                <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
              </div>

              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="rw">Kinyarwanda</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={timezone} onValueChange={handleTimezoneChange}>
                  <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eat">East Africa Time (EAT)</SelectItem>
                    <SelectItem value="utc">UTC</SelectItem>
                    <SelectItem value="est">Eastern Standard Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Reduced Motion</Label>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Minimize animations and transitions
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Compact View</Label>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Show more content in less space
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card className="glass-card border-black/5 dark:border-white/10">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Privacy & Security</CardTitle>
              <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                Manage your privacy and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Profile Visibility</Label>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Make your profile visible to others
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              {userType === 'founder' && (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Show Startup Progress</Label>
                    <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                      Display your startup metrics to investors
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Add an extra layer of security
                  </p>
                </div>
                <Button variant="outline" size="sm">Enable</Button>
              </div>

              <div className="space-y-2">
                <Label>Change Password</Label>
                <div className="space-y-3">
                  <Input 
                    type={showCurrentPassword ? 'text' : 'password'} 
                    placeholder="Current password" 
                    className="dark:bg-gray-800 dark:border-gray-700"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <div className="flex items-center">
                    <Input 
                      type={showNewPassword ? 'text' : 'password'} 
                      placeholder="New password" 
                      className="dark:bg-gray-800 dark:border-gray-700"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="ml-2"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex items-center">
                    <Input 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      placeholder="Confirm new password" 
                      className="dark:bg-gray-800 dark:border-gray-700"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="ml-2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button variant="outline" className="hover:bg-[#76B947]/10" onClick={handlePasswordUpdate} disabled={updatingPassword}>
                    {updatingPassword ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </div>

              <div className="pt-6 border-t dark:border-gray-700">
                <h3 className="text-sm font-semibold text-red-600 mb-2">Danger Zone</h3>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    Deactivate Account
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          {/* Help Center Card */}
          <Card className="glass-card border-black/5 dark:border-white/10">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Help Center</CardTitle>
              <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                Browse our comprehensive knowledge base and guides
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Getting Started */}
                <div className="glass-panel p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-[#76B947]/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-5 w-5 text-[#76B947]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                        Getting Started
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3" style={{ fontFamily: 'var(--font-body)' }}>
                        Learn the basics of using Uruti
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full border-[#76B947] text-[#76B947] hover:bg-[#76B947]/10"
                        onClick={() => window.open('/help-center', '_blank')}
                      >
                        View Articles
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Account & Profile */}
                <div className="glass-panel p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                        Account & Profile
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3" style={{ fontFamily: 'var(--font-body)' }}>
                        Manage your account settings
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full border-blue-500 text-blue-500 hover:bg-blue-500/10"
                        onClick={() => window.open('/help-center', '_blank')}
                      >
                        View Articles
                      </Button>
                    </div>
                  </div>
                </div>

                {/* For Founders/Investors */}
                <div className="glass-panel p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      {userType === 'founder' ? (
                        <Briefcase className="h-5 w-5 text-purple-500" />
                      ) : (
                        <TrendingUp className="h-5 w-5 text-purple-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                        For {userType === 'founder' ? 'Founders' : 'Investors'}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3" style={{ fontFamily: 'var(--font-body)' }}>
                        {userType === 'founder' ? 'Build your startup' : 'Find investments'}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full border-purple-500 text-purple-500 hover:bg-purple-500/10"
                        onClick={() => window.open('/help-center', '_blank')}
                      >
                        View Articles
                      </Button>
                    </div>
                  </div>
                </div>

                {/* All Help Articles */}
                <div className="glass-panel p-4 rounded-lg bg-gradient-to-br from-[#76B947]/10 to-transparent">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-[#76B947]/20 flex items-center justify-center flex-shrink-0">
                      <HelpCircle className="h-5 w-5 text-[#76B947]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                        Browse All Articles
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3" style={{ fontFamily: 'var(--font-body)' }}>
                        Access the full help center
                      </p>
                      <Button 
                        className="w-full bg-[#76B947] text-white hover:bg-[#5a8f35]"
                        size="sm"
                        onClick={() => window.open('/help-center', '_blank')}
                      >
                        Open Help Center →
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Onboarding Tour Card */}
          <Card className="glass-card border-black/5 dark:border-white/10 bg-gradient-to-br from-[#76B947]/5 to-transparent">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Platform Tour</CardTitle>
              <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                Take a guided tour of the platform to learn about all features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 glass-panel rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-[#76B947]/10 flex items-center justify-center">
                    <RotateCcw className="h-5 w-5 text-[#76B947]" />
                  </div>
                  <div>
                    <Label className="text-base">Restart Onboarding Tour</Label>
                    <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                      Walk through the platform features again
                    </p>
                  </div>
                </div>
                <Button 
                  className="bg-[#76B947] text-white hover:bg-[#5a8f35]"
                  size="sm"
                  onClick={() => {
                    if (user) {
                      localStorage.removeItem(`uruti_tour_completed_${user.id}`);
                      toast.success('Tour will restart when you refresh the page');
                      setTimeout(() => {
                        window.location.reload();
                      }, 1500);
                    }
                  }}
                >
                  Restart Tour
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contact Support Card */}
          <Card className="glass-card border-black/5 dark:border-white/10">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Contact Support</CardTitle>
              <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                Get in touch with our support team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Live Chat */}
              <div className="flex items-center justify-between p-4 glass-panel rounded-lg hover:bg-[#76B947]/5 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-[#76B947]/10 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-[#76B947]" />
                  </div>
                  <div>
                    <Label className="text-base">Live Chat Support</Label>
                    <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                      Chat with our team in real-time
                    </p>
                  </div>
                </div>
                <Button 
                  className="bg-[#76B947] text-white hover:bg-[#5a8f35]"
                  size="sm"
                  onClick={() => toast.success('Opening chat support...')}
                >
                  Start Chat
                </Button>
              </div>

              {/* Email Support */}
              <div className="flex items-center justify-between p-4 glass-panel rounded-lg hover:bg-blue-500/5 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <Label className="text-base">Email Support</Label>
                    <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                      uruti.info@gmail.com
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  size="sm"
                  className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
                  onClick={() => window.location.href = 'mailto:uruti.info@gmail.com'}
                >
                  Send Email
                </Button>
              </div>

              {/* Phone Support */}
              <div className="flex items-center justify-between p-4 glass-panel rounded-lg hover:bg-purple-500/5 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <Label className="text-base">Phone Support</Label>
                    <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                      +250 790 636 128
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  size="sm"
                  className="border-purple-500 text-purple-500 hover:bg-purple-500/10"
                  onClick={() => window.location.href = 'tel:+250790636128'}
                >
                  Call Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* FAQs Card */}
          <Card className="glass-card border-black/5 dark:border-white/10">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Frequently Asked Questions</CardTitle>
              <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                Quick answers to common questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 glass-panel rounded-lg hover:bg-[#76B947]/5 transition-colors cursor-pointer">
                <p className="font-semibold text-sm mb-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  How do I reset my password?
                </p>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Go to Privacy & Security tab and click "Change Password"
                </p>
              </div>
              
              <div className="p-3 glass-panel rounded-lg hover:bg-[#76B947]/5 transition-colors cursor-pointer">
                <p className="font-semibold text-sm mb-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  How do I update my profile?
                </p>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Navigate to your profile page and click "Edit Profile"
                </p>
              </div>
              
              <div className="p-3 glass-panel rounded-lg hover:bg-[#76B947]/5 transition-colors cursor-pointer">
                <p className="font-semibold text-sm mb-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  {userType === 'founder' ? 'How do I create a startup profile?' : 'How do I find startups to invest in?'}
                </p>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  {userType === 'founder' 
                    ? 'Visit the Startup Hub and click "Create New Startup"'
                    : 'Go to Startup Discovery and use filters to find opportunities'
                  }
                </p>
              </div>

              <Button 
                variant="outline" 
                className="w-full mt-4 border-[#76B947] text-[#76B947] hover:bg-[#76B947]/10"
                onClick={() => window.open('/help-center', '_blank')}
              >
                View All FAQs
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}