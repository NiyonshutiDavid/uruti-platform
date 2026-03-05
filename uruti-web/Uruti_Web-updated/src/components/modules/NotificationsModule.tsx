import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfirmDialog } from '../ui/confirm-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Bell, Check, Trash2, TrendingUp, MessageCircle, Calendar, Users, Award, DollarSign, X, UserPlus, Link as LinkIcon } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { toast } from 'sonner';

interface Notification {
  id: number;
  type: 'connection_request' | 'connection_accepted' | 'message' | 'milestone' | 'meeting' | 'investment' | 'achievement' | 'system';
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  action_url?: string;
  actor_id?: number;
  actor_name?: string;
  related_entity_id?: number;
  related_entity_type?: string;
  data?: Record<string, any>;
}

export function NotificationsModule() {
  const { confirm } = useConfirmDialog();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
    
    // Set up polling for new notifications every 30 seconds
    const pollInterval = setInterval(() => {
      fetchNotifications(true);
    }, 30000);

    return () => clearInterval(pollInterval);
  }, []);

  // Dispatch initial unread count and update when it changes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('update-notification-count', { 
      detail: { count: unreadCount } 
    }));
  }, [unreadCount]);

  // Listen for new notification events from other parts of the app
  useEffect(() => {
    const handleNewNotification = () => {
      fetchNotifications(true);
    };

    window.addEventListener('new-notification', handleNewNotification);
    return () => window.removeEventListener('new-notification', handleNewNotification);
  }, []);

  const fetchNotifications = async (silent: boolean = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    
    try {
      const data = await apiClient.getNotifications(0, 50);
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (!silent) {
        toast.error('Failed to load notifications');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'connection_request':
        return <UserPlus className="h-5 w-5 text-black dark:text-white" />;
      case 'connection_accepted':
        return <LinkIcon className="h-5 w-5 text-black dark:text-white" />;
      case 'message':
        return <MessageCircle className="h-5 w-5 text-black dark:text-white" />;
      case 'milestone':
        return <TrendingUp className="h-5 w-5 text-black dark:text-white" />;
      case 'meeting':
        return <Calendar className="h-5 w-5 text-black dark:text-white" />;
      case 'investment':
        return <DollarSign className="h-5 w-5 text-black dark:text-white" />;
      case 'achievement':
        return <Award className="h-5 w-5 text-black dark:text-white" />;
      default:
        return <Bell className="h-5 w-5 text-black dark:text-white" />;
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await apiClient.markNotificationAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
      // Dispatch event to update header count
      window.dispatchEvent(new CustomEvent('notification-read'));
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.markAllNotificationsAsRead();
      const unreadCount = notifications.filter(n => !n.is_read).length;
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      // Dispatch event for each unread notification
      for (let i = 0; i < unreadCount; i++) {
        window.dispatchEvent(new CustomEvent('notification-read'));
      }
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (id: number) => {
    const confirmed = await confirm({
      title: 'Delete Notification',
      description: 'Are you sure you want to delete this notification? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      // Delete via API
      await apiClient.deleteNotification(id);
      
      // Update UI
      setNotifications(notifications.filter(n => n.id !== id));
      
      // If the notification was unread, update the count
      const notification = notifications.find(n => n.id === id);
      if (notification && !notification.is_read) {
        window.dispatchEvent(new CustomEvent('notification-read'));
      }
      
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const handleViewDetails = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    const route =
      notification.data?.route ||
      notification.action_url ||
      (notification.type === 'meeting' ? '/dashboard/availability' : '/dashboard/notifications');

    navigate(route);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="glass-card rounded-2xl p-4 sm:p-6 md:p-8 border border-black/5 dark:border-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Notifications
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Stay updated with your startup journey
            </p>
          </div>
          <div className="flex items-center gap-3">
            {refreshing && (
              <div className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                Checking for new...
              </div>
            )}
            {unreadCount > 0 && (
              <Badge className="bg-[#76B947] text-white text-sm sm:text-base md:text-lg px-3 sm:px-4 py-1.5 sm:py-2">
                {unreadCount} unread
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
          <TabsList>
            <TabsTrigger value="all">All Notifications</TabsTrigger>
            <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={() => fetchNotifications(false)}
            disabled={loading}
            className="hover:bg-[#76B947]/10 flex-1 sm:flex-initial"
          >
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              onClick={markAllAsRead}
              className="hover:bg-[#76B947]/10 flex-1 sm:flex-initial"
            >
              <Check className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <Card className="glass-card border-black/5 dark:border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#76B947] mb-4"></div>
              <p className="text-lg text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                Loading notifications...
              </p>
            </CardContent>
          </Card>
        ) : filteredNotifications.length === 0 ? (
          <Card className="glass-card border-black/5 dark:border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-semibold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
              <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                {filter === 'unread' 
                  ? "You're all caught up! Switch to 'All' to see previous notifications."
                  : "You'll see notifications here when you receive connection requests, messages, and updates"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card 
              key={notification.id}
              className={`glass-card border-black/5 dark:border-white/10 transition-all hover:shadow-lg ${
                !notification.is_read ? 'bg-[#76B947]/5 border-l-4 border-l-[#76B947]' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`mt-1 p-2 rounded-full ${!notification.is_read ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 
                        className="font-semibold dark:text-white" 
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        {notification.title}
                      </h3>
                      <span 
                        className="text-xs text-muted-foreground whitespace-nowrap ml-2" 
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        {formatTimestamp(notification.created_at)}
                      </span>
                    </div>
                    
                    {notification.actor_name && (
                      <p 
                        className="text-xs text-[#76B947] mb-1" 
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        From: {notification.actor_name}
                      </p>
                    )}
                    
                    <p 
                      className="text-sm text-muted-foreground mb-3" 
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center space-x-2">
                      {!notification.is_read && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => markAsRead(notification.id)}
                          className="hover:bg-[#76B947]/10"
                        >
                          <Check className="mr-1 h-3 w-3" />
                          Mark as Read
                        </Button>
                      )}
                      {notification.action_url && (
                        <Button 
                          size="sm" 
                          onClick={() => void handleViewDetails(notification)}
                          className="bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black"
                        >
                          View Details
                        </Button>
                      )}
                      {!notification.action_url && notification.type === 'meeting' && (
                        <Button
                          size="sm"
                          onClick={() => void handleViewDetails(notification)}
                          className="bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black"
                        >
                          View Details
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => deleteNotification(notification.id)}
                        className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}