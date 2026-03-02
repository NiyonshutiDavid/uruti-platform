import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { MessageCircle, Search, Users, UserPlus, TrendingUp, Briefcase, MapPin, Calendar, Check, X as XIcon, Clock, Code, ChevronDown, ChevronUp, Video, Phone } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../lib/auth-context';
import { CallDialog } from '../CallDialog';

interface BuildConnectionsModuleProps {
  onModuleChange?: (module: string) => void;
  userType?: 'founder' | 'investor';
}

interface User {
  id: number;
  full_name: string;
  display_name?: string;
  email: string;
  role: string;
  avatar?: string;  // For backward compatibility
  avatar_url?: string;  // Backend field
  bio?: string;
  company?: string;
  location?: string;
  isConnected?: boolean;
  connectionStatus?: 'none' | 'pending' | 'connected';
}

type RequestStatus = 'pending' | 'accepted' | 'rejected';

export function BuildConnectionsModule({ onModuleChange, userType = 'founder' }: BuildConnectionsModuleProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [connections, setConnections] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [requestStatusFilter, setRequestStatusFilter] = useState<RequestStatus>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageDialog, setMessageDialog] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [directMessageDialog, setDirectMessageDialog] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(10); // Pagination state
  
  // Call state
  const [callDialog, setCallDialog] = useState(false);
  const [callType, setCallType] = useState<'video' | 'voice'>('video');
  const [callContact, setCallContact] = useState<User | null>(null);
  const [currentMeetingId, setCurrentMeetingId] = useState<number | null>(null);

  // Get localStorage data for debugging
  const getLocalStorageData = () => {
    try {
      const authToken = localStorage.getItem('authToken');
      const userDataStr = localStorage.getItem('user');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      
      // Get all localStorage keys
      const allKeys = Object.keys(localStorage);
      const allData: Record<string, any> = {};
      allKeys.forEach(key => {
        try {
          const value = localStorage.getItem(key);
          allData[key] = value ? (value.startsWith('{') || value.startsWith('[') ? JSON.parse(value) : value) : null;
        } catch {
          allData[key] = localStorage.getItem(key);
        }
      });

      return {
        hasAuthToken: !!authToken,
        authTokenPreview: authToken ? `${authToken.substring(0, 20)}...` : 'None',
        currentUser: userData,
        allLocalStorageKeys: allKeys,
        allLocalStorageData: allData
      };
    } catch (error) {
      return {
        error: 'Failed to read localStorage',
        details: String(error)
      };
    }
  };

  // Fetch all users and connections on mount
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    refreshRequestSections(requestStatusFilter);
  }, [requestStatusFilter]);

  const refreshRequestSections = async (status: RequestStatus) => {
    try {
      const sentData = await apiClient.getSentConnectionRequests(status);
      const receivedData = await apiClient.getReceivedConnectionRequests(status);
      setSentRequests(sentData || []);
      setReceivedRequests(receivedData || []);
    } catch (error) {
      console.error('Error fetching request sections:', error);
      setSentRequests([]);
      setReceivedRequests([]);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all users
      const usersData = await apiClient.getUsers();
      console.log('Build Connections - Users fetched:', usersData);
      console.log('Build Connections - Total users in system:', usersData.length);
      setUsers(usersData);

      // Fetch connections
      const connectionsData = await apiClient.getConnections();
      console.log('Build Connections - Connections fetched:', connectionsData);
      setConnections(connectionsData);

      // Fetch pending requests
      const pendingData = await apiClient.getPendingConnectionRequests();
      console.log('Build Connections - Pending requests:', pendingData);
      setPendingRequests(pendingData);

      await refreshRequestSections(requestStatusFilter);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
      setUsers([]);
      setConnections([]);
      setPendingRequests([]);
      setSentRequests([]);
      setReceivedRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendConnectionRequest = async (userId: number) => {
    try {
      await apiClient.sendConnectionRequest(userId);
      toast.success('Connection request sent!');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error('Failed to send connection request');
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await apiClient.acceptConnectionRequest(requestId);
      toast.success('Connection request accepted!');
      
      // Trigger notification refresh for the user who sent the request
      window.dispatchEvent(new CustomEvent('new-notification'));
      
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      await apiClient.rejectConnectionRequest(requestId);
      toast.success('Connection request rejected');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

  const handleCancelSentRequest = async (requestId: number) => {
    try {
      await apiClient.cancelSentConnectionRequest(requestId);
      toast.success('Connection request cancelled');
      fetchData();
    } catch (error) {
      console.error('Error cancelling sent request:', error);
      toast.error('Failed to cancel request');
    }
  };

  const handleRemoveConnection = async (userId: number) => {
    const confirmed = window.confirm('Remove this connection from your network?');
    if (!confirmed) return;

    try {
      await apiClient.removeConnection(userId);
      toast.success('Connection removed');
      fetchData();
    } catch (error) {
      console.error('Error removing connection:', error);
      toast.error('Failed to remove connection');
    }
  };

  const handleSendMessage = (user: User) => {
    const connectionIds = connections.map(c => c.id);
    
    if (connectionIds.includes(user.id)) {
      // Connected - can send message directly
      setSelectedUser(user);
      setMessageDialog(true);
    } else {
      // Not connected - show info toast
      toast.info('You must be connected to send messages. Send a connection request first!');
    }
  };

  const handleDirectMessage = async () => {
    if (!recipientName.trim()) {
      toast.error('Please enter a recipient name');
      return;
    }

    if (!messageText.trim()) {
      toast.error('Please enter a message');
      return;
    }

    // Find user by name
    const recipient = users.find(u => 
      u.full_name.toLowerCase().includes(recipientName.toLowerCase()) ||
      (u.display_name || '').toLowerCase().includes(recipientName.toLowerCase()) ||
      u.email.toLowerCase().includes(recipientName.toLowerCase())
    );

    if (!recipient) {
      toast.error('User not found. Please check the name and try again.');
      return;
    }

    try {
      await apiClient.sendMessage(recipient.id, messageText);
      toast.success(`Message sent to ${recipient.full_name}!`);
      setDirectMessageDialog(false);
      setRecipientName('');
      setMessageText('');
      onModuleChange?.('messages');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleSendMessageToConnection = async () => {
    if (!selectedUser || !messageText.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      await apiClient.sendMessage(selectedUser.id, messageText);
      toast.success(`Message sent to ${selectedUser.full_name}!`);
      setMessageDialog(false);
      setMessageText('');
      onModuleChange?.('messages');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleViewProfile = (targetUserId: number) => {
    onModuleChange?.(`profile/${targetUserId}`);
  };

  const handleBookSession = (targetUserId: number) => {
    sessionStorage.setItem('bookSessionUserId', targetUserId.toString());
    onModuleChange?.('calendar');
    toast.info('Choose a time slot to book a session.');
  };

  const handleInitiateCall = async (user: User, type: 'video' | 'voice') => {
    try {
      const meeting = await apiClient.initiateCall(user.id, type);
      setCurrentMeetingId(meeting?.id ?? null);
      setCallContact(user);
      setCallType(type);
      setCallDialog(true);
    } catch (error) {
      console.error('Error initiating call:', error);
      toast.error(`Failed to start ${type} call. Please try again.`);
    }
  };

  const checkConnectionStatus = (userId: number): 'none' | 'pending' | 'connected' => {
    if (connections.some(c => c.id === userId)) return 'connected';
    if (pendingRequests.some(r => r.user_id === userId || r.requester_id === userId)) return 'pending';
    return 'none';
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  // Filter connections
  const filteredConnections = connections.filter(conn => {
    return conn.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           conn.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           conn.company?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Filter directory to show only users not connected to and exclude self
  const directoryUsers = filteredUsers.filter((candidate) => {
    const isSelf = Number(candidate.id) === Number(user?.id);
    const hasConnection = connections.some(c => Number(c.id) === Number(candidate.id));
    return !isSelf && !hasConnection;
  });

  // Helper to find sent request ID by user ID
  const findSentRequestIdByUserId = (userId: number): number => {
    const request = pendingRequests.find(r => r.receiver_id === userId && r.requester_id === user?.id);
    return request?.id || 0;
  };

  const resolveRequest = (request: any) => {
    const currentUserId = Number(user?.id);
    const requesterId = Number(request.requester_id);
    const receiverId = Number(request.receiver_id);
    const otherUserId = requesterId === currentUserId ? receiverId : requesterId;
    const matchedUser = users.find((candidate) => Number(candidate.id) === otherUserId);
    const counterpart = request.counterpart || null;

    const resolvedName =
      counterpart?.full_name ||
      counterpart?.display_name ||
      request.name ||
      matchedUser?.full_name ||
      matchedUser?.display_name;

    return {
      ...request,
      name: resolvedName,
      avatar:
        counterpart?.avatar_url ||
        request.avatar ||
        matchedUser?.avatar_url ||
        matchedUser?.avatar,
      counterpartUserId: Number(counterpart?.id || otherUserId),
      status: request.status || 'pending',
      direction:
        request.direction ||
        (requesterId === currentUserId ? 'sent' : 'received'),
    };
  };

  const resolvedSentRequests = sentRequests
    .map(resolveRequest)
    .filter((request) => Boolean(request.name));

  const resolvedReceivedRequests = receivedRequests
    .map(resolveRequest)
    .filter((request) => Boolean(request.name));

  const totalPendingCount = pendingRequests.length;
  const statusLabel = requestStatusFilter.charAt(0).toUpperCase() + requestStatusFilter.slice(1);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'investor':
        return 'bg-[#76B947]/10 text-[#76B947] border-[#76B947]/20';
      case 'founder':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'investor':
        return <TrendingUp className="h-4 w-4" />;
      case 'founder':
        return <Briefcase className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Build Connections
          </h1>
          <p className="text-lg text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
            Connect with {userType === 'founder' ? 'investors, mentors, and fellow founders' : 'founders and entrepreneurs'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setDirectMessageDialog(true)}
            className="bg-[#76B947] text-white hover:bg-[#5a8f35]"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Send Direct Message
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Total Network
                </p>
                <p className="text-3xl mt-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  {filteredUsers.length}
                </p>
              </div>
              <Users className="h-8 w-8 text-[#76B947]" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  My Connections
                </p>
                <p className="text-3xl mt-1 text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                  {connections.length}
                </p>
              </div>
              <Check className="h-8 w-8 text-[#76B947]" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Pending Requests
                </p>
                <p className="text-3xl mt-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  {totalPendingCount}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="glass-card border-black/5 dark:border-white/10">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>
            <Tabs value={filterRole} onValueChange={setFilterRole} className="w-full md:w-auto">
              <TabsList className="glass-card border border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-900/70">
                <TabsTrigger value="all" className="data-[state=active]:bg-[#76B947] data-[state=active]:text-white dark:text-gray-300">All</TabsTrigger>
                <TabsTrigger value="founder" className="data-[state=active]:bg-[#76B947] data-[state=active]:text-white dark:text-gray-300">Founders</TabsTrigger>
                <TabsTrigger value="investor" className="data-[state=active]:bg-[#76B947] data-[state=active]:text-white dark:text-gray-300">Investors</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="discover" className="space-y-6">
        <TabsList className="glass-card border border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-900/70">
          <TabsTrigger value="discover" className="data-[state=active]:bg-[#76B947] data-[state=active]:text-white dark:text-gray-300">
            <Search className="mr-2 h-4 w-4" />
            Discover People
          </TabsTrigger>
          <TabsTrigger value="connections" className="data-[state=active]:bg-[#76B947] data-[state=active]:text-white dark:text-gray-300">
            <Users className="mr-2 h-4 w-4" />
            My Connections ({connections.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="data-[state=active]:bg-[#76B947] data-[state=active]:text-white dark:text-gray-300">
            <Clock className="mr-2 h-4 w-4" />
            Pending Requests ({totalPendingCount})
          </TabsTrigger>
        </TabsList>

        {/* Discover People Tab */}
        <TabsContent value="discover" className="space-y-4">
          {loading ? (
            <Card className="glass-card border-black/5 dark:border-white/10">
              <CardContent className="py-12">
                <div className="text-center">
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              </CardContent>
            </Card>
          ) : directoryUsers.length === 0 ? (
            <Card className="glass-card border-black/5 dark:border-white/10">
              <CardContent className="py-16">
                <div className="text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-semibold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    No people available to connect
                  </p>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    You've connected with everyone or all have pending requests. Try adjusting your search filters.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  People you may know
                </h2>
                <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                  Show all
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {directoryUsers.slice(0, displayedCount).map((person) => {
                  const status = checkConnectionStatus(person.id);
                  const requestId = findSentRequestIdByUserId(person.id);

                  return (
                    <div
                      key={`directory-${person.id}`}
                      className="glass-card rounded-lg border border-black/5 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 overflow-hidden hover:shadow-lg dark:hover:shadow-lg dark:hover:shadow-green-600/20 transition-all duration-200"
                    >
                      {/* Uruti Banner - Black to Green Gradient */}
                      <div className="bg-gradient-to-r from-black via-green-800 to-green-600 h-24 relative"></div>

                      {/* Card content */}
                      <div className="px-4 pb-4">
                        {/* Avatar overlapping banner */}
                        <div className="flex justify-center -mt-12 mb-3 relative z-10">
                          <Avatar className="h-24 w-24 border-4 border-white dark:border-slate-900 shadow-lg">
                            <AvatarImage src={person.avatar_url || person.avatar} alt={person.full_name} />
                            <AvatarFallback className="bg-[#76B947] text-white text-lg font-semibold">
                              {person.full_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        </div>

                        {/* Name and role */}
                        <div className="text-center mb-2">
                          <h3 className="font-semibold dark:text-white text-base" style={{ fontFamily: 'var(--font-heading)' }}>
                            {person.full_name}
                            {person.role === 'investor' && <span className="ml-1">✓</span>}
                          </h3>
                        </div>

                        {/* Role Badge */}
                        <div className="flex justify-center mb-2">
                          <Badge className={`${getRoleColor(person.role)} flex items-center space-x-1`}>
                            {getRoleIcon(person.role)}
                            <span className="capitalize text-xs">{person.role}</span>
                          </Badge>
                        </div>

                        {/* Subtitle/Title */}
                        {person.bio && (
                          <p className="text-xs text-center text-muted-foreground line-clamp-2 mb-2 dark:text-gray-400" style={{ fontFamily: 'var(--font-body)' }}>
                            {person.bio}
                          </p>
                        )}

                        {/* Location and company */}
                        {(person.company || person.location) && (
                          <div className="text-xs text-center text-muted-foreground mb-3 space-y-1 dark:text-gray-400" style={{ fontFamily: 'var(--font-body)' }}>
                            {person.company && <p>{person.company}</p>}
                            {person.location && (
                              <p className="flex items-center justify-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {person.location}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Mutual connections */}
                        <div className="mb-4 py-3 border-t border-black/5 dark:border-white/10">
                          <p className="text-xs text-muted-foreground text-center dark:text-gray-400" style={{ fontFamily: 'var(--font-body)' }}>
                            <Users className="h-3 w-3 inline mr-1" />
                            12 mutual connections
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                          {/* Connect/Add or Cancel Request Button */}
                          {status === 'none' ? (
                            <Button
                              className="w-full bg-[#76B947] hover:bg-[#5a8f35] text-white font-semibold py-2 dark:bg-green-600 dark:hover:bg-green-700 transition-colors"
                              onClick={() => handleSendConnectionRequest(person.id)}
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Add Connection
                            </Button>
                          ) : status === 'pending' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full hover:bg-red-50 hover:border-red-300 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:border-red-700 dark:text-red-400 dark:border-red-900 transition-colors"
                              onClick={() => handleCancelSentRequest(requestId)}
                            >
                              <XIcon className="h-4 w-4 mr-1" />
                              Cancel Request
                            </Button>
                          ) : (
                            <Button
                              className="w-full bg-[#76B947] hover:bg-[#5a8f35] text-white font-semibold py-2 dark:bg-green-600 dark:hover:bg-green-700 transition-colors"
                              onClick={() => handleSendMessage(person)}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Message
                            </Button>
                          )}

                          {/* View Profile Button - Always shown */}
                          <Button
                            variant="outline"
                            className="w-full hover:bg-[#76B947]/10 hover:border-[#76B947] dark:hover:bg-green-950/30 dark:hover:border-green-700 dark:border-gray-700 dark:text-gray-300 transition-colors"
                            onClick={() => handleViewProfile(person.id)}
                          >
                            View Profile
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load More Button */}
              {displayedCount < directoryUsers.length && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={() => setDisplayedCount(prev => Math.min(prev + 10, directoryUsers.length))}
                    className="bg-[#76B947] hover:bg-[#5a8f35] text-white dark:bg-green-600 dark:hover:bg-green-700"
                  >
                    Load More People ({directoryUsers.length - displayedCount} remaining)
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* My Connections Tab */}
        <TabsContent value="connections" className="space-y-4">
          {filteredConnections.length === 0 ? (
            <Card className="glass-card border-black/5 dark:border-white/10">
              <CardContent className="py-16">
                <div className="text-center">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-semibold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    No connections yet
                  </p>
                  <p className="text-sm text-muted-foreground mb-4" style={{ fontFamily: 'var(--font-body)' }}>
                    Start building your network by connecting with {userType === 'founder' ? 'investors and mentors' : 'founders'}
                  </p>
                  <Button
                    onClick={() => document.querySelector('[value="discover"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))}
                    className="bg-[#76B947] text-white hover:bg-[#5a8f35]"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Discover People
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredConnections.map((conn) => (
              <Card key={conn.id} className="glass-card border-black/5 dark:border-white/10">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={conn.avatar_url || conn.avatar} />
                        <AvatarFallback className="bg-[#76B947]/20 text-[#76B947]">
                          {conn.full_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <h3 className="font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                              {conn.full_name}
                            </h3>
                            <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                              {conn.email}
                            </p>
                          </div>
                          <Badge variant="outline" className={`${getRoleColor(conn.role)} flex items-center space-x-1`}>
                            {getRoleIcon(conn.role)}
                            <span className="capitalize text-xs">{conn.role}</span>
                          </Badge>
                        </div>

                        <div className="flex items-center space-x-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="hover:bg-[#76B947]/10 hover:border-[#76B947]"
                            onClick={() => handleViewProfile(conn.id)}
                          >
                            View Profile
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="hover:bg-[#76B947]/10 hover:border-[#76B947]"
                            onClick={() => handleBookSession(conn.id)}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Book Session
                          </Button>
                          <Button
                            size="sm"
                            className="bg-[#76B947] text-white hover:bg-[#5a8f35]"
                            onClick={() => handleInitiateCall(conn, 'video')}
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Video Call
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="hover:bg-[#76B947]/10 hover:border-[#76B947]"
                            onClick={() => handleInitiateCall(conn, 'voice')}
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Voice Call
                          </Button>
                          <Button
                            size="sm"
                            className="bg-[#76B947] text-white hover:bg-[#5a8f35]"
                            onClick={() => handleSendMessage(conn)}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Message
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Pending Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <Card className="glass-card border-black/5 dark:border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={requestStatusFilter === 'pending' ? 'default' : 'outline'}
                  className={requestStatusFilter === 'pending' ? 'bg-[#76B947] text-white hover:bg-[#5a8f35]' : 'hover:bg-[#76B947]/10 hover:border-[#76B947]'}
                  onClick={() => setRequestStatusFilter('pending')}
                >
                  Pending
                </Button>
                <Button
                  size="sm"
                  variant={requestStatusFilter === 'accepted' ? 'default' : 'outline'}
                  className={requestStatusFilter === 'accepted' ? 'bg-[#76B947] text-white hover:bg-[#5a8f35]' : 'hover:bg-[#76B947]/10 hover:border-[#76B947]'}
                  onClick={() => setRequestStatusFilter('accepted')}
                >
                  Accepted
                </Button>
                <Button
                  size="sm"
                  variant={requestStatusFilter === 'rejected' ? 'default' : 'outline'}
                  className={requestStatusFilter === 'rejected' ? 'bg-[#76B947] text-white hover:bg-[#5a8f35]' : 'hover:bg-[#76B947]/10 hover:border-[#76B947]'}
                  onClick={() => setRequestStatusFilter('rejected')}
                >
                  Rejected
                </Button>
              </div>
            </CardContent>
          </Card>

          {resolvedReceivedRequests.length + resolvedSentRequests.length === 0 ? (
            <Card className="glass-card border-black/5 dark:border-white/10">
              <CardContent className="py-16">
                <div className="text-center">
                  <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-semibold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    No {requestStatusFilter} requests
                  </p>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Sent and received {requestStatusFilter} requests will appear here
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Received requests (action required) */}
              <Card className="glass-card border-black/5 dark:border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    {statusLabel} Received ({resolvedReceivedRequests.length})
                  </CardTitle>
                </CardHeader>
              </Card>

              {resolvedReceivedRequests.length === 0 ? (
                <Card className="glass-card border-black/5 dark:border-white/10">
                  <CardContent className="py-8 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    No incoming pending requests.
                  </CardContent>
                </Card>
              ) : (
                resolvedReceivedRequests.map((request) => (
                  <Card key={`received-${request.id}`} className="glass-card border-black/5 dark:border-white/10">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={request.avatar} />
                            <AvatarFallback className="bg-[#76B947]/20 text-[#76B947]">
                              {request.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <h3 className="font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                              {request.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3" style={{ fontFamily: 'var(--font-body)' }}>
                              {requestStatusFilter === 'pending' ? 'Sent you a connection request' : `Request ${requestStatusFilter}`}
                            </p>

                            <div className="flex items-center space-x-2">
                              {requestStatusFilter === 'pending' ? (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-[#76B947] text-white hover:bg-[#5a8f35]"
                                    onClick={() => handleAcceptRequest(request.id)}
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                                    onClick={() => handleRejectRequest(request.id)}
                                  >
                                    <XIcon className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                </>
                              ) : (
                                <Badge className={requestStatusFilter === 'accepted' ? 'bg-[#76B947]/20 text-[#76B947]' : 'bg-red-100 text-red-700'}>
                                  {statusLabel}
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="hover:bg-[#76B947]/10 hover:border-[#76B947]"
                                onClick={() => handleViewProfile(request.counterpartUserId)}
                              >
                                View Profile
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="hover:bg-[#76B947]/10 hover:border-[#76B947]"
                                onClick={() => handleBookSession(request.counterpartUserId)}
                              >
                                <Calendar className="h-4 w-4 mr-2" />
                                Book Session
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}

              {/* Sent requests (awaiting response) */}
              <Card className="glass-card border-black/5 dark:border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    {statusLabel} Sent ({resolvedSentRequests.length})
                  </CardTitle>
                </CardHeader>
              </Card>

              {resolvedSentRequests.length === 0 ? (
                <Card className="glass-card border-black/5 dark:border-white/10">
                  <CardContent className="py-8 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    No sent pending requests.
                  </CardContent>
                </Card>
              ) : (
                resolvedSentRequests.map((request) => (
                  <Card key={`sent-${request.id}`} className="glass-card border-black/5 dark:border-white/10">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={request.avatar} />
                            <AvatarFallback className="bg-[#76B947]/20 text-[#76B947]">
                              {request.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <h3 className="font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                              {request.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3" style={{ fontFamily: 'var(--font-body)' }}>
                              {requestStatusFilter === 'pending' ? 'You sent this connection request' : `Request ${requestStatusFilter}`}
                            </p>

                            <div className="flex items-center space-x-2">
                              {requestStatusFilter === 'pending' ? (
                                <>
                                  <Badge className="bg-orange-100 text-orange-700">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Awaiting response
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                                    onClick={() => handleCancelSentRequest(request.id)}
                                  >
                                    <XIcon className="h-4 w-4 mr-2" />
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <Badge className={requestStatusFilter === 'accepted' ? 'bg-[#76B947]/20 text-[#76B947]' : 'bg-red-100 text-red-700'}>
                                  {statusLabel}
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="hover:bg-[#76B947]/10 hover:border-[#76B947]"
                                onClick={() => handleViewProfile(request.counterpartUserId)}
                              >
                                View Profile
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="hover:bg-[#76B947]/10 hover:border-[#76B947]"
                                onClick={() => handleBookSession(request.counterpartUserId)}
                              >
                                <Calendar className="h-4 w-4 mr-2" />
                                Book Session
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Send Message Dialog (for connections) */}
      <Dialog open={messageDialog} onOpenChange={setMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)' }}>
              Send Message to {selectedUser?.full_name}
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'var(--font-body)' }}>
              Send a direct message to your connection
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Type your message here..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={5}
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setMessageDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#76B947] text-white hover:bg-[#5a8f35]"
              onClick={handleSendMessageToConnection}
            >
              Send Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Direct Message Dialog (by name) */}
      <Dialog open={directMessageDialog} onOpenChange={setDirectMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)' }}>
              Send Direct Message
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'var(--font-body)' }}>
              If you know the person's name, you can send them a direct message
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="recipient">Recipient Name</Label>
              <Input
                id="recipient"
                placeholder="Enter full name or email..."
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div>
              <Label htmlFor="direct-message">Message</Label>
              <Textarea
                id="direct-message"
                placeholder="Type your message here..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={5}
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDirectMessageDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#76B947] text-white hover:bg-[#5a8f35]"
              onClick={handleDirectMessage}
            >
              Send Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Debug Panel */}
      <Dialog open={showDebugPanel} onOpenChange={setShowDebugPanel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)' }}>
              Debug Panel
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'var(--font-body)' }}>
              View and debug localStorage data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="auth-token">Auth Token</Label>
              <Input
                id="auth-token"
                value={getLocalStorageData().authTokenPreview}
                readOnly
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div>
              <Label htmlFor="current-user">Current User</Label>
              <Textarea
                id="current-user"
                value={JSON.stringify(getLocalStorageData().currentUser, null, 2)}
                readOnly
                rows={5}
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div>
              <Label htmlFor="all-keys">All LocalStorage Keys</Label>
              <Textarea
                id="all-keys"
                value={getLocalStorageData().allLocalStorageKeys.join('\n')}
                readOnly
                rows={5}
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div>
              <Label htmlFor="all-data">All LocalStorage Data</Label>
              <Textarea
                id="all-data"
                value={JSON.stringify(getLocalStorageData().allLocalStorageData, null, 2)}
                readOnly
                rows={10}
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDebugPanel(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Call Dialog */}
      <CallDialog
        open={callDialog}
        onClose={() => {
          setCallDialog(false);
          setCallContact(null);
          setCurrentMeetingId(null);
        }}
        type={callType}
        contactName={callContact?.full_name || ''}
        contactAvatar={callContact?.avatar_url || callContact?.avatar}
        contactOnline={true}
      />
    </div>
  );
}