import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Bell, Check, Trash2, TrendingUp, MessageCircle, Calendar, Users, Award, DollarSign, X } from 'lucide-react';

interface Notification {
  id: string;
  type: 'message' | 'milestone' | 'meeting' | 'investment' | 'achievement' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'investment',
    title: 'New Investment Interest',
    message: 'Jean-Paul Uwimana bookmarked your AgriConnect startup',
    timestamp: '2026-02-12T10:30:00',
    read: false
  },
  {
    id: '2',
    type: 'meeting',
    title: 'Upcoming Mentor Session',
    message: 'Your session with Sarah Williams starts in 30 minutes',
    timestamp: '2026-02-12T09:15:00',
    read: false
  },
  {
    id: '3',
    type: 'achievement',
    title: 'Milestone Achieved! 🎉',
    message: 'Your Uruti Score increased to 92 - Growth Ready status!',
    timestamp: '2026-02-11T16:45:00',
    read: false
  },
  {
    id: '4',
    type: 'message',
    title: 'New Message',
    message: 'Patricia Mukamana sent you a message about FinTech collaboration',
    timestamp: '2026-02-11T14:20:00',
    read: true
  },
  {
    id: '5',
    type: 'milestone',
    title: 'Pitch Performance Update',
    message: 'Your last pitch scored 8.5/10 - view detailed feedback',
    timestamp: '2026-02-10T11:00:00',
    read: true
  },
  {
    id: '6',
    type: 'system',
    title: 'New AI Advisory Track',
    message: 'Check out the new "Go-to-Market Strategy" track',
    timestamp: '2026-02-09T09:00:00',
    read: true
  }
];

export function NotificationsModule() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  // Dispatch initial unread count and update when it changes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('update-notification-count', { 
      detail: { count: unreadCount } 
    }));
  }, [unreadCount]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'milestone':
        return <TrendingUp className="h-5 w-5 text-[#76B947]" />;
      case 'meeting':
        return <Calendar className="h-5 w-5 text-purple-500" />;
      case 'investment':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'achievement':
        return <Award className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
    // Dispatch event to update header count
    window.dispatchEvent(new CustomEvent('notification-read'));
  };

  const markAllAsRead = () => {
    const unreadCount = notifications.filter(n => !n.read).length;
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    // Dispatch event for each unread notification
    for (let i = 0; i < unreadCount; i++) {
      window.dispatchEvent(new CustomEvent('notification-read'));
    }
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="glass-card rounded-2xl p-4 sm:p-6 md:p-8 border border-black/5 dark:border-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Notifications 🔔
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Stay updated with your startup journey
            </p>
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-[#76B947] text-white text-sm sm:text-base md:text-lg px-3 sm:px-4 py-1.5 sm:py-2">
              {unreadCount} unread
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
          <TabsList>
            <TabsTrigger value="all">All Notifications</TabsTrigger>
            <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          </TabsList>
        </Tabs>

        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            onClick={markAllAsRead}
            className="hover:bg-[#76B947]/10 w-full sm:w-auto"
          >
            <Check className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card className="glass-card border-black/5 dark:border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                No notifications
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card 
              key={notification.id}
              className={`glass-card border-black/5 dark:border-white/10 transition-all hover:shadow-lg ${
                !notification.read ? 'bg-[#76B947]/5 border-l-4 border-l-[#76B947]' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`mt-1 p-2 rounded-full ${!notification.read ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-700'}`}>
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
                        {formatTimestamp(notification.timestamp)}
                      </span>
                    </div>
                    <p 
                      className="text-sm text-muted-foreground mb-3" 
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center space-x-2">
                      {!notification.read && (
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
                      {notification.actionUrl && (
                        <Button 
                          size="sm" 
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