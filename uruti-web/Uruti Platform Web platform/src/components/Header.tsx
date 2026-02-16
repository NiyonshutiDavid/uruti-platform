import { User, LogOut, Bell, Settings, Moon, Sun, MessageCircle, Sparkles, Menu } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { useTheme } from '../lib/theme-context';
import { useState, useEffect } from 'react';
import { UrutiLogo, UrutiLogoText } from './UrutiLogo';

interface HeaderProps {
  userType?: 'founder' | 'investor';
  onNavigate: (module: string) => void;
  onToggleSidebar?: () => void;
  onLogout?: () => void;
}

export function Header({ userType = 'founder', onNavigate, onToggleSidebar, onLogout }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const userData = userType === 'founder' 
    ? { name: 'Founder Kwizera', role: 'Entrepreneur', initials: 'FK' }
    : { name: 'Jean-Paul Uwimana', role: 'VC Investor', initials: 'JU' };

  // State for unread counts - start at 0, will be updated by modules
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const handleLogoutClick = () => {
    setIsLogoutDialogOpen(true);
  };

  const handleConfirmLogout = () => {
    setIsLogoutDialogOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  // Listen for events to update counts
  useEffect(() => {
    const handleMessageRead = (e: CustomEvent) => {
      setUnreadMessages(prev => Math.max(0, prev - 1));
    };

    const handleNotificationRead = (e: CustomEvent) => {
      setUnreadNotifications(prev => Math.max(0, prev - 1));
    };

    const handleMarkAllMessagesRead = () => {
      setUnreadMessages(0);
    };

    const handleMarkAllNotificationsRead = () => {
      setUnreadNotifications(0);
    };

    const handleNewMessage = () => {
      setUnreadMessages(prev => prev + 1);
    };

    const handleNewNotification = () => {
      setUnreadNotifications(prev => prev + 1);
    };

    const handleUpdateMessageCount = (e: CustomEvent) => {
      setUnreadMessages(e.detail.count);
    };

    const handleUpdateNotificationCount = (e: CustomEvent) => {
      setUnreadNotifications(e.detail.count);
    };

    window.addEventListener('message-read', handleMessageRead as EventListener);
    window.addEventListener('notification-read', handleNotificationRead as EventListener);
    window.addEventListener('mark-all-messages-read', handleMarkAllMessagesRead);
    window.addEventListener('mark-all-notifications-read', handleMarkAllNotificationsRead);
    window.addEventListener('new-message', handleNewMessage);
    window.addEventListener('new-notification', handleNewNotification);
    window.addEventListener('update-message-count', handleUpdateMessageCount as EventListener);
    window.addEventListener('update-notification-count', handleUpdateNotificationCount as EventListener);

    return () => {
      window.removeEventListener('message-read', handleMessageRead as EventListener);
      window.removeEventListener('notification-read', handleNotificationRead as EventListener);
      window.removeEventListener('mark-all-messages-read', handleMarkAllMessagesRead);
      window.removeEventListener('mark-all-notifications-read', handleMarkAllNotificationsRead);
      window.removeEventListener('new-message', handleNewMessage);
      window.removeEventListener('new-notification', handleNewNotification);
      window.removeEventListener('update-message-count', handleUpdateMessageCount as EventListener);
      window.removeEventListener('update-notification-count', handleUpdateNotificationCount as EventListener);
    };
  }, []);

  return (
    <header className="glass-panel bg-white/95 dark:bg-gray-900/95 border-b border-black/10 dark:border-white/10 px-3 sm:px-4 md:px-6 h-16 sticky top-0 z-50">
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="lg:hidden hover:bg-[#76B947]/10"
          >
            <Menu className="h-6 w-6 text-black dark:text-white" />
          </Button>

          <div className="flex items-center space-x-2">
            <UrutiLogo className="h-8 sm:h-10 w-auto" />
            <div className="hidden sm:block">
              <h1 className="text-base sm:text-xl text-black dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>Digital Ecosystem</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden md:block" style={{ fontFamily: 'var(--font-body)' }}>
                {userType === 'founder' ? 'Smart Ideation for Every Founder' : 'Discover Investment Opportunities'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* AI Chatbot Button - Founder only - Hidden on small screens */}
          {userType === 'founder' && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onNavigate('ai-chat')}
              className="hidden md:flex relative hover:bg-transparent hover:text-[#76B947] hover:border hover:border-[#76B947] text-purple-600 dark:text-purple-400 items-center space-x-1"
            >
              <Sparkles className="h-4 w-4" />
              <span className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Uruti AI</span>
            </Button>
          )}

          {/* Messages */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onNavigate('messages')}
            className="relative hover:bg-[#76B947]/10"
          >
            <MessageCircle className="h-5 w-5 text-black dark:text-white" />
            {unreadMessages > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold px-1.5 py-0 rounded-full border-2 border-white dark:border-gray-900"
              >
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </Badge>
            )}
          </Button>

          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onNavigate('notifications')}
            className="relative hover:bg-[#76B947]/10"
          >
            <Bell className="h-5 w-5 text-black dark:text-white" />
            {unreadNotifications > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold px-1.5 py-0 rounded-full border-2 border-white dark:border-gray-900"
              >
                {unreadNotifications > 99 ? '99+' : unreadNotifications}
              </Badge>
            )}
          </Button>

          {/* Dark Mode Toggle */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleTheme}
            className="hover:bg-[#76B947]/10"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5 text-black" />
            )}
          </Button>
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 p-2 hover:bg-[#76B947]/10">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback className="bg-[#76B947]/20 text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                    {userData.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden md:block">
                  <p className="text-sm text-black dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>{userData.name}</p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>{userData.role}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-card dark:bg-gray-800">
              <DropdownMenuItem 
                onClick={() => onNavigate('settings')}
                className="hover:bg-[#76B947]/10"
              >
                <Settings className="mr-2 h-4 w-4" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive hover:bg-destructive/10" onClick={handleLogoutClick}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Logout Dialog */}
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="sm:max-w-md glass-card border-black/5 dark:border-white/10">
          <DialogHeader className="text-center space-y-4 pb-4">
            <div className="mx-auto w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-2 animate-pulse">
              <LogOut className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-2xl dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Confirm Logout
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Are you sure you want to logout from Uruti? You'll need to sign in again to access your dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsLogoutDialogOpen(false)}
              className="flex-1 border-black/10 dark:border-white/20 hover:bg-[#76B947]/10"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmLogout}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Yes, Logout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}