import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { useTheme } from '../../lib/theme-context';
import { Bell, Lock, Palette, Save, Eye, EyeOff, Shield, Users, UserPlus, UserMinus, MessageCircle, TrendingUp, Briefcase, Building2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner@2.0.3';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';

interface SettingsModuleProps {
  userType: 'founder' | 'investor';
}

export function SettingsModule({ userType }: SettingsModuleProps) {
  const { theme, toggleTheme } = useTheme();
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

  // Mock connections data
  const mockConnections = [
    {
      id: '1',
      name: 'Jean-Paul Uwimana',
      role: 'VC Investor',
      type: 'investor',
      company: 'Rwanda Ventures',
      online: true,
      avatar: undefined,
      connected: '2 months ago'
    },
    {
      id: '2',
      name: 'Patricia Mukamana',
      role: 'Founder',
      type: 'founder',
      company: 'FinTrack',
      online: false,
      avatar: undefined,
      connected: '3 weeks ago'
    },
    {
      id: '4',
      name: 'Dr. Samuel Nkusi',
      role: 'Founder',
      type: 'founder',
      company: 'HealthBridge',
      online: false,
      avatar: undefined,
      connected: '2 weeks ago'
    },
    {
      id: '5',
      name: 'Michael Chen',
      role: 'Angel Investor',
      type: 'investor',
      company: 'East Africa Angels',
      online: false,
      avatar: undefined,
      connected: '1 week ago'
    },
    {
      id: '7',
      name: 'David Kamau',
      role: 'Founder',
      type: 'founder',
      company: 'LogiTech',
      online: true,
      avatar: undefined,
      connected: '5 days ago'
    },
    {
      id: '8',
      name: 'Linda Mutesi',
      role: 'Impact Investor',
      type: 'investor',
      company: 'Impact Ventures',
      online: false,
      avatar: undefined,
      connected: '3 days ago'
    },
    {
      id: '10',
      name: 'Grace Nyirahabimana',
      role: 'Founder',
      type: 'founder',
      company: 'EduTech Rwanda',
      online: true,
      avatar: undefined,
      connected: '1 week ago'
    },
    {
      id: '11',
      name: 'Robert Niyonshuti',
      role: 'Venture Capital Partner',
      type: 'investor',
      company: 'Africa Tech Ventures',
      online: true,
      avatar: undefined,
      connected: '2 days ago'
    }
  ];

  const [searchConnections, setSearchConnections] = useState('');

  const filteredConnections = mockConnections.filter(conn =>
    conn.name.toLowerCase().includes(searchConnections.toLowerCase()) ||
    conn.role.toLowerCase().includes(searchConnections.toLowerCase()) ||
    conn.company.toLowerCase().includes(searchConnections.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'investor':
        return 'bg-[#76B947]/10 text-[#76B947] border-[#76B947]/20';
      case 'founder':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'investor':
        return <TrendingUp className="h-4 w-4" />;
      case 'founder':
        return <Building2 className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const handleRemoveConnection = (id: string) => {
    toast.success('Connection removed successfully');
  };

  const handleMessageConnection = (name: string) => {
    toast.success(`Opening message with ${name}`);
  };

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      toast.success('Settings saved successfully!');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  };

  const handlePasswordUpdate = () => {
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

    // Simulate password update
    toast.success('Password updated successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
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
          <TabsTrigger value="connections">
            <Users className="mr-2 h-4 w-4" />
            Connections
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="mr-2 h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Lock className="mr-2 h-4 w-4" />
            Privacy & Security
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

        <TabsContent value="connections" className="space-y-6">
          <Card className="glass-card border-black/5 dark:border-white/10">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Connections Settings</CardTitle>
              <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                Manage your connections and collaborations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Invite New Connections</Label>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Send invitations to potential collaborators
                  </p>
                </div>
                <Button variant="outline" size="sm">Invite</Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Manage Existing Connections</Label>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    View and manage your current connections
                  </p>
                </div>
                <Button variant="outline" size="sm">Manage</Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Connection Requests</Label>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Review and respond to connection requests
                  </p>
                </div>
                <Button variant="outline" size="sm">Requests</Button>
              </div>

              <div className="space-y-2">
                <Label>Search Connections</Label>
                <Input 
                  type="text" 
                  placeholder="Search by name, role, or company" 
                  className="dark:bg-gray-800 dark:border-gray-700"
                  value={searchConnections}
                  onChange={(e) => setSearchConnections(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-lg">Your Connections ({filteredConnections.length})</Label>
                  <Badge variant="secondary" className="bg-[#76B947]/10 text-[#76B947]">
                    {mockConnections.length} Total
                  </Badge>
                </div>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {filteredConnections.map(conn => (
                      <div 
                        key={conn.id} 
                        className="p-4 glass-card rounded-lg border border-black/5 dark:border-white/10 hover:border-[#76B947]/30 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="relative">
                              <Avatar className="h-12 w-12">
                                {conn.avatar && <AvatarImage src={conn.avatar} />}
                                <AvatarFallback className="bg-[#76B947]/20 text-[#76B947]">
                                  {conn.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              {conn.online && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <div>
                                  <p className="font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                                    {conn.name}
                                  </p>
                                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                    {conn.role}
                                  </p>
                                </div>
                                <Badge variant="outline" className={`${getTypeColor(conn.type)} flex items-center space-x-1 ml-2`}>
                                  {getTypeIcon(conn.type)}
                                  <span className="capitalize text-xs">{conn.type}</span>
                                </Badge>
                              </div>
                              
                              <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                                <div className="flex items-center">
                                  <Building2 className="h-3 w-3 mr-1" />
                                  {conn.company}
                                </div>
                                <div className="flex items-center">
                                  <Users className="h-3 w-3 mr-1" />
                                  {conn.connected}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="hover:bg-[#76B947]/10 hover:border-[#76B947]"
                              onClick={() => handleMessageConnection(conn.name)}
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Message
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 hover:text-red-600"
                              onClick={() => handleRemoveConnection(conn.id)}
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
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
                <Select defaultValue={language} onValueChange={handleLanguageChange}>
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
                <Select defaultValue={timezone} onValueChange={handleTimezoneChange}>
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
                  <Button variant="outline" className="hover:bg-[#76B947]/10" onClick={handlePasswordUpdate}>Update Password</Button>
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
      </Tabs>
    </div>
  );
}