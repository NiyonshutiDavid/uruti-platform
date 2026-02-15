import { LayoutDashboard, Lightbulb, TrendingUp, GraduationCap, Users, Calendar, Video, BarChart3, Briefcase, DollarSign, Home, BookOpen, Mic, Target, Sparkles, MessageSquare, User, X, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { EnhancedCaptureIdeaDialog } from './EnhancedCaptureIdeaDialog';
import { useState, useEffect } from 'react';

interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
  userType?: 'founder' | 'investor';
  onUserTypeChange?: (type: 'founder' | 'investor') => void;
  isMobileSidebarOpen?: boolean;
  setIsMobileSidebarOpen?: (open: boolean) => void;
}

const founderNavItems = [
  { id: 'dashboard', label: 'Founder Snapshot', icon: Home },
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'startups', label: 'Startup Hub', icon: Lightbulb },
  { id: 'pitch-performance', label: 'Pitch Performance', icon: TrendingUp },
  { id: 'ai-chat', label: 'Uruti AI Chat', icon: Sparkles },
  { id: 'advisory-tracks', label: 'AI Advisory Tracks', icon: BookOpen },
  { id: 'mentors', label: 'Mentor & Investor Directory', icon: Users },
  { id: 'calendar', label: 'Readiness Calendar', icon: Calendar },
  { id: 'availability', label: 'My Availability', icon: Clock },
  { id: 'pitch-coach', label: 'Pitch Coach', icon: Mic },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
];

const investorNavItems = [
  { id: 'investor-dashboard', label: 'Investor Dashboard', icon: Home },
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'startup-discovery', label: 'Startup Discovery', icon: Target },
  { id: 'mentors', label: 'Network Directory', icon: Users },
  { id: 'ai-chat', label: 'Uruti AI Chat', icon: Sparkles },
  { id: 'notifications', label: 'Deal Flow', icon: TrendingUp },
  { id: 'calendar', label: 'Meeting Calendar', icon: Calendar },
  { id: 'availability', label: 'Availability & Booking', icon: Clock },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
];

export function Sidebar({ activeModule, onModuleChange, userType = 'founder', onUserTypeChange, isMobileSidebarOpen, setIsMobileSidebarOpen }: SidebarProps) {
  const navigationItems = userType === 'founder' ? founderNavItems : investorNavItems;
  const [captureDialogOpen, setCaptureDialogOpen] = useState(false);
  const [newIdea, setNewIdea] = useState({
    name: '',
    sector: '',
    problem: '',
    solution: '',
    targetMarket: ''
  });

  const handleCaptureIdea = () => {
    // Save the new idea (in a real app, this would save to a database)
    console.log('New Idea Captured:', newIdea);
    setCaptureDialogOpen(false);
    setNewIdea({
      name: '',
      sector: '',
      problem: '',
      solution: '',
      targetMarket: ''
    });
    // Navigate to startup hub to show the new idea
    onModuleChange('startups');
  };

  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isMobileSidebarOpen]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen?.(false)}
        />
      )}

      <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 glass-panel bg-white/95 dark:bg-gray-900/95 border-r border-black/10 dark:border-white/10 p-4 overflow-y-auto z-50 transition-transform duration-300 lg:translate-x-0 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Close button for mobile */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileSidebarOpen?.(false)}
          className="lg:hidden absolute top-2 right-2 hover:bg-[#76B947]/10"
        >
          <X className="h-5 w-5 text-black dark:text-white" />
        </Button>

        {/* User Type Toggle */}
        {onUserTypeChange && (
          <div className="mb-4 p-3 glass-card dark:bg-transparent dark:border dark:border-white/20 rounded-lg">
            <p className="text-xs text-muted-foreground mb-2" style={{ fontFamily: 'var(--font-body)' }}>SWITCH VIEW</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant={userType === 'founder' ? 'default' : 'outline'}
                className={userType === 'founder' ? 'bg-black dark:bg-[#76B947] text-white hover:bg-black/90 dark:hover:bg-[#76B947]/90' : 'hover:bg-transparent hover:text-[#76B947] hover:border-[#76B947] dark:border-white/20'}
                onClick={() => onUserTypeChange('founder')}
              >
                Founder
              </Button>
              <Button
                size="sm"
                variant={userType === 'investor' ? 'default' : 'outline'}
                className={userType === 'investor' ? 'bg-black dark:bg-[#76B947] text-white hover:bg-black/90 dark:hover:bg-[#76B947]/90' : 'hover:bg-transparent hover:text-[#76B947] hover:border-[#76B947] dark:border-white/20'}
                onClick={() => onUserTypeChange('investor')}
              >
                Investor
              </Button>
            </div>
          </div>
        )}

        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <Button
                key={item.id}
                variant={isActive ? 'default' : 'ghost'}
                className={`w-full justify-start ${
                  isActive
                    ? 'bg-black dark:bg-[#76B947] text-white hover:bg-black/90 dark:hover:bg-[#76B947]/90'
                    : 'hover:bg-transparent hover:text-[#76B947] hover:border hover:border-[#76B947] text-black dark:text-white'
                }`}
                onClick={() => onModuleChange(item.id)}
              >
                <Icon className="mr-2 h-5 w-5" />
                <span style={{ fontFamily: 'var(--font-body)' }}>{item.label}</span>
              </Button>
            );
          })}
        </nav>
        
        <div className="mt-8 p-4 glass-card dark:bg-transparent dark:border dark:border-white/20 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="h-5 w-5 text-[#76B947]" />
            <span className="text-sm text-black dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              {userType === 'founder' ? 'Innovation Network' : 'Deal Flow'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
            {userType === 'founder' ? '8 active startups' : '8 opportunities'}
          </p>
          <div className="mt-3 w-full bg-[#76B947]/20 rounded-full h-2">
            <div className="w-3/5 bg-[#76B947] h-2 rounded-full"></div>
          </div>
          <p className="text-xs text-muted-foreground mt-2" style={{ fontFamily: 'var(--font-body)' }}>
            {userType === 'founder' ? '60% Investment Ready' : '60% Evaluated'}
          </p>
        </div>
        
        {userType === 'founder' && (
          <>
            <div 
              onClick={() => setCaptureDialogOpen(true)}
              className="mt-4 p-4 glass-button rounded-lg cursor-pointer hover:scale-105 transition-transform"
            >
              <div className="text-center">
                <Lightbulb className="h-8 w-8 text-[#76B947] mx-auto mb-2" />
                <p className="text-xs text-black dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>Capture New Idea</p>
              </div>
            </div>
            
            <EnhancedCaptureIdeaDialog 
              open={captureDialogOpen}
              onOpenChange={setCaptureDialogOpen}
              onSave={(ventureData) => {
                console.log('New Venture Captured:', ventureData);
                onModuleChange('startups');
              }}
            />
          </>
        )}
      </aside>
    </>
  );
}