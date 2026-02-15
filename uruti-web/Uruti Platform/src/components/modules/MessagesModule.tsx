import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Search, Send, Paperclip, MoreVertical, Star, Archive, Trash2, Phone, Video, X, Mic, MicOff, VideoOff, PhoneOff, Maximize2, Minimize2, Settings, FileText, Image as ImageIcon, Download, Info, Plus } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useCall } from '../../lib/call-context';
import { ChatInfoDialog } from '../ChatInfoDialog';
import { NewMessageDialog } from '../NewMessageDialog';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  read: boolean;
  starred?: boolean;
  attachment?: {
    type: 'image' | 'file' | 'document' | 'idea';
    name: string;
    size: number;
    url?: string;
    ideaData?: {
      id: string;
      name: string;
      sector: string;
      tagline: string;
      problem: string;
      solution: string;
    };
  };
}

interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
  messages: Message[];
  starred?: boolean;
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    name: 'Jean-Paul Uwimana',
    role: 'VC Investor',
    lastMessage: 'Your AgriConnect pitch deck looks promising. Can we schedule a call?',
    timestamp: '2026-02-12T10:30:00',
    unread: 2,
    online: true,
    messages: [
      {
        id: 'm1',
        senderId: 'investor',
        text: 'Hi! I reviewed your AgriConnect startup profile.',
        timestamp: '2026-02-12T09:00:00',
        read: true
      },
      {
        id: 'm2',
        senderId: 'investor',
        text: 'Your AgriConnect pitch deck looks promising. Can we schedule a call?',
        timestamp: '2026-02-12T10:30:00',
        read: false
      },
      {
        id: 'm3',
        senderId: 'me',
        text: 'Thank you for your interest! I\'d love to discuss further.',
        timestamp: '2026-02-12T10:35:00',
        read: true
      },
      {
        id: 'm4',
        senderId: 'investor',
        text: 'Great! How about Thursday at 2 PM EAT?',
        timestamp: '2026-02-12T10:40:00',
        read: false
      }
    ]
  },
  {
    id: '2',
    name: 'Patricia Mukamana',
    role: 'Founder - FinTrack',
    lastMessage: 'Would you be interested in collaborating on a fintech partnership?',
    timestamp: '2026-02-11T14:20:00',
    unread: 0,
    online: false,
    messages: [
      {
        id: 'm1',
        senderId: 'founder',
        text: 'Hi! I saw your AgriConnect profile and think there could be synergies.',
        timestamp: '2026-02-11T14:00:00',
        read: true
      },
      {
        id: 'm2',
        senderId: 'founder',
        text: 'Would you be interested in collaborating on a fintech partnership?',
        timestamp: '2026-02-11T14:20:00',
        read: true
      },
      {
        id: 'm3',
        senderId: 'me',
        text: 'Absolutely! Let\'s explore this further.',
        timestamp: '2026-02-11T15:00:00',
        read: true
      }
    ]
  },
  {
    id: '3',
    name: 'Sarah Williams',
    role: 'Mentor - Marketing',
    lastMessage: 'Your go-to-market strategy needs some refinement. Let\'s discuss.',
    timestamp: '2026-02-10T16:45:00',
    unread: 1,
    online: true,
    messages: [
      {
        id: 'm1',
        senderId: 'mentor',
        text: 'Your go-to-market strategy needs some refinement. Let\'s discuss.',
        timestamp: '2026-02-10T16:45:00',
        read: false
      }
    ]
  },
  {
    id: '4',
    name: 'Dr. Samuel Nkusi',
    role: 'Founder - HealthBridge',
    lastMessage: 'Thanks for the feedback on the healthcare pitch!',
    timestamp: '2026-02-09T11:20:00',
    unread: 0,
    online: false,
    messages: [
      {
        id: 'm1',
        senderId: 'founder',
        text: 'Thanks for the feedback on the healthcare pitch!',
        timestamp: '2026-02-09T11:20:00',
        read: true
      },
      {
        id: 'm2',
        senderId: 'me',
        text: 'Happy to help! Keep me updated on your progress.',
        timestamp: '2026-02-09T11:30:00',
        read: true
      }
    ]
  },
  {
    id: '5',
    name: 'Michael Chen',
    role: 'Angel Investor',
    lastMessage: 'Looking forward to the pitch session next week.',
    timestamp: '2026-02-08T09:15:00',
    unread: 0,
    online: false,
    messages: [
      {
        id: 'm1',
        senderId: 'investor',
        text: 'Looking forward to the pitch session next week.',
        timestamp: '2026-02-08T09:15:00',
        read: true
      }
    ]
  }
];

interface MessagesModuleProps {
  userType: 'founder' | 'investor';
}

export function MessagesModule({ userType = 'founder' }: MessagesModuleProps) {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'online' | 'starred'>('all');
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [showAttachmentDialog, setShowAttachmentDialog] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<{ type: 'image' | 'file' | 'document' | 'idea'; name: string; size: number } | null>(null);
  const { startCall } = useCall();

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread, 0);

  // Dispatch initial unread count and update when it changes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('update-message-count', { 
      detail: { count: totalUnread } 
    }));
  }, [totalUnread]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const handleSendMessage = () => {
    if ((messageText.trim() || selectedAttachment) && selectedConversation) {
      const newMessage: Message = {
        id: `m-${Date.now()}`,
        senderId: 'me',
        text: messageText || (selectedAttachment ? `Attached: ${selectedAttachment.name}` : ''),
        timestamp: new Date().toISOString(),
        read: true,
        attachment: selectedAttachment || undefined
      };

      setConversations(prev =>
        prev.map(conv =>
          conv.id === selectedConversation.id
            ? {
                ...conv,
                messages: [...conv.messages, newMessage],
                lastMessage: newMessage.text,
                timestamp: newMessage.timestamp
              }
            : conv
        )
      );

      setSelectedConversation(prev =>
        prev ? { ...prev, messages: [...prev.messages, newMessage] } : null
      );

      setMessageText('');
      setSelectedAttachment(null);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileType = file.type.startsWith('image/') ? 'image' : 
                      file.type.includes('pdf') || file.type.includes('document') ? 'document' : 'file';
      
      setSelectedAttachment({
        type: fileType,
        name: file.name,
        size: file.size
      });
      
      // Reset the input
      event.target.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleStartCall = (type: 'voice' | 'video') => {
    if (selectedConversation) {
      startCall(type, selectedConversation.name, selectedConversation.avatar, selectedConversation.online);
    }
  };

  const handleToggleStar = () => {
    if (selectedConversation) {
      setConversations(prev =>
        prev.map(conv =>
          conv.id === selectedConversation.id
            ? { ...conv, starred: !conv.starred }
            : conv
        )
      );
      setSelectedConversation(prev => prev ? { ...prev, starred: !prev.starred } : null);
    }
  };

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredConversations = conversations
    .filter(conv => {
      // Apply search filter
      const matchesSearch = conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Apply type filter
      if (filterType === 'unread') return matchesSearch && conv.unread > 0;
      if (filterType === 'online') return matchesSearch && conv.online;
      if (filterType === 'starred') return matchesSearch && conv.starred;
      return matchesSearch;
    });

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setShowChatInfo(false);
    
    // Mark messages as read
    if (conv.unread > 0) {
      setConversations(prev =>
        prev.map(c =>
          c.id === conv.id ? { ...c, unread: 0 } : c
        )
      );
      
      // Dispatch event for each unread message
      for (let i = 0; i < conv.unread; i++) {
        window.dispatchEvent(new CustomEvent('message-read'));
      }
    }
  };

  const handleStartNewConversation = (contact: any) => {
    // Create new conversation
    const newConversation: Conversation = {
      id: `new-${Date.now()}`,
      name: contact.name,
      avatar: contact.avatar,
      role: contact.role,
      lastMessage: 'Start a conversation...',
      timestamp: new Date().toISOString(),
      unread: 0,
      online: contact.online,
      messages: [],
      starred: false
    };

    setConversations(prev => [newConversation, ...prev]);
    setSelectedConversation(newConversation);
    setShowNewMessageDialog(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="glass-card rounded-2xl p-4 sm:p-6 md:p-8 border border-black/5 dark:border-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Messages 💬
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Connect with {userType === 'founder' ? 'investors, mentors, and partners' : 'founders and startups'}
            </p>
          </div>
          {totalUnread > 0 && (
            <Badge className="bg-[#76B947] text-white text-sm sm:text-base md:text-lg px-3 sm:px-4 py-1.5 sm:py-2">
              {totalUnread} unread
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-h-[500px] lg:h-[calc(100vh-280px)]">
        {/* Conversations List */}
        <Card className={`glass-card border-black/5 dark:border-white/10 lg:col-span-1 ${selectedConversation ? 'hidden lg:block' : 'block'}`}>
          <CardContent className="p-3 sm:p-4 h-full flex flex-col">
            <div className="mb-4 space-y-3">
              {/* New Message Button */}
              <Button
                onClick={() => setShowNewMessageDialog(true)}
                className="w-full bg-[#76B947] text-white hover:bg-[#76B947]/90 flex items-center justify-center space-x-2"
                size="lg"
              >
                <Plus className="h-5 w-5" />
                <span style={{ fontFamily: 'var(--font-body)' }}>New Message</span>
              </Button>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              
              {/* Filter Buttons */}
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterType('all')}
                  className={filterType === 'all' ? 'bg-[#76B947] text-white' : 'hover:bg-transparent hover:text-[#76B947] hover:border-[#76B947]'}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={filterType === 'unread' ? 'default' : 'outline'}
                  onClick={() => setFilterType('unread')}
                  className={filterType === 'unread' ? 'bg-[#76B947] text-white' : 'hover:bg-transparent hover:text-[#76B947] hover:border-[#76B947]'}
                >
                  Unread
                </Button>
                <Button
                  size="sm"
                  variant={filterType === 'online' ? 'default' : 'outline'}
                  onClick={() => setFilterType('online')}
                  className={filterType === 'online' ? 'bg-[#76B947] text-white' : 'hover:bg-transparent hover:text-[#76B947] hover:border-[#76B947]'}
                >
                  Online
                </Button>
                <Button
                  size="sm"
                  variant={filterType === 'starred' ? 'default' : 'outline'}
                  onClick={() => setFilterType('starred')}
                  className={filterType === 'starred' ? 'bg-[#76B947] text-white' : 'hover:bg-transparent hover:text-[#76B947] hover:border-[#76B947]'}
                >
                  Starred
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-[#76B947]/10 border border-[#76B947]/30'
                        : 'hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={conversation.avatar} />
                          <AvatarFallback className="bg-[#76B947]/20 text-[#76B947]">
                            {conversation.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-semibold text-sm truncate dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                            {conversation.name}
                          </p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2" style={{ fontFamily: 'var(--font-body)' }}>
                            {formatTimestamp(conversation.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: 'var(--font-body)' }}>
                          {conversation.role}
                        </p>
                        <p className="text-sm text-muted-foreground truncate" style={{ fontFamily: 'var(--font-body)' }}>
                          {conversation.lastMessage}
                        </p>
                        {conversation.unread > 0 && (
                          <Badge className="mt-2 bg-[#76B947] text-white text-xs">
                            {conversation.unread} new
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message Thread */}
        <Card className="glass-card border-black/5 dark:border-white/10 lg:col-span-2">
          {selectedConversation ? (
            showChatInfo ? (
              /* Chat Info View */
              <ChatInfoDialog
                onClose={() => setShowChatInfo(false)}
                contactName={selectedConversation.name}
                contactAvatar={selectedConversation.avatar}
                contactRole={selectedConversation.role}
                contactOnline={selectedConversation.online}
              />
            ) : (
              /* Chat View */
              <div className="h-full flex flex-col">
                {/* Conversation Header */}
                <div className="p-4 border-b dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Back button for mobile */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedConversation(null)}
                        className="lg:hidden hover:bg-[#76B947]/10 -ml-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      </Button>

                      <div className="relative">
                        <Avatar className="h-10 sm:h-12 w-10 sm:w-12">
                          <AvatarImage src={selectedConversation.avatar} />
                          <AvatarFallback className="bg-[#76B947]/20 text-[#76B947]">
                            {selectedConversation.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {selectedConversation.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm sm:text-base dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                          {selectedConversation.name}
                        </p>
                        <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                          {selectedConversation.online ? 'Online' : 'Offline'} • {selectedConversation.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="hover:bg-[#76B947]/10"
                        onClick={() => handleStartCall('voice')}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="hover:bg-[#76B947]/10"
                        onClick={() => handleStartCall('video')}
                      >
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`hover:bg-[#76B947]/10 ${selectedConversation.starred ? 'text-yellow-500' : ''}`}
                        onClick={handleToggleStar}
                      >
                        <Star className={`h-4 w-4 ${selectedConversation.starred ? 'fill-current' : ''}`} />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="hover:bg-[#76B947]/10">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-panel dark:border-white/10">
                          <DropdownMenuItem 
                            className="hover:bg-[#76B947]/10 cursor-pointer"
                            onClick={() => setShowChatInfo(true)}
                          >
                            <Info className="h-4 w-4 mr-2" />
                            Chat Info & Settings
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="hover:bg-[#76B947]/10 cursor-pointer">
                            <Archive className="h-4 w-4 mr-2" />
                            Archive Chat
                          </DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-red-500/10 text-red-600 cursor-pointer">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Chat
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {selectedConversation.messages.map((message) => {
                      const isMyMessage = message.senderId === 'me';
                      return (
                        <div key={message.id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] ${isMyMessage ? 'order-2' : 'order-1'}`}>
                            {!isMyMessage && (
                              <div className="flex items-center space-x-2 mb-1">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={selectedConversation.avatar} />
                                  <AvatarFallback className="bg-[#76B947]/20 text-[#76B947] text-xs">
                                    {selectedConversation.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                  {selectedConversation.name}
                                </span>
                              </div>
                            )}
                            <div
                              className={`rounded-2xl px-4 py-3 ${
                                isMyMessage
                                  ? 'bg-[#76B947] text-white'
                                  : 'glass-panel border border-black/10 dark:border-white/10 dark:text-white'
                              }`}
                            >
                              <p className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                                {message.text}
                              </p>
                              {message.attachment && (
                                <div className="mt-2">
                                  <a href={message.attachment.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-sm text-[#76B947]">
                                    <FileText className="h-4 w-4" />
                                    <span>{message.attachment.name} ({formatFileSize(message.attachment.size)})</span>
                                  </a>
                                </div>
                              )}
                            </div>
                            <p className={`text-xs text-muted-foreground mt-1 ${isMyMessage ? 'text-right' : 'text-left'}`} style={{ fontFamily: 'var(--font-body)' }}>
                              {formatMessageTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t dark:border-gray-700">
                  {/* Attachment Preview */}
                  {selectedAttachment && (
                    <div className="mb-3 glass-panel rounded-lg p-3 border border-[#76B947]/30 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {selectedAttachment.type === 'image' && <ImageIcon className="h-4 w-4 text-[#76B947]" />}
                        {selectedAttachment.type === 'document' && <FileText className="h-4 w-4 text-[#76B947]" />}
                        {selectedAttachment.type === 'file' && <Paperclip className="h-4 w-4 text-[#76B947]" />}
                        <div>
                          <p className="text-sm font-medium dark:text-white" style={{ fontFamily: 'var(--font-body)' }}>
                            {selectedAttachment.name}
                          </p>
                          <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            {formatFileSize(selectedAttachment.size)}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedAttachment(null)}
                        className="hover:bg-red-500/10 text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      id="file-input"
                      className="hidden"
                      onChange={handleFileSelect}
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="hover:bg-[#76B947]/10"
                      onClick={() => document.getElementById('file-input')?.click()}
                    >
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    <Input
                      placeholder="Type your message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 dark:bg-gray-800 dark:border-gray-700"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      className="bg-[#76B947] text-white hover:bg-[#76B947]/90"
                      disabled={!messageText.trim() && !selectedAttachment}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          ) : (
            <CardContent className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#76B947]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-[#76B947]" />
                </div>
                <p className="text-lg text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  Select a conversation to start messaging
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* New Message Dialog */}
      <NewMessageDialog
        open={showNewMessageDialog}
        onOpenChange={setShowNewMessageDialog}
        userType={userType}
        onStartConversation={handleStartNewConversation}
      />
    </div>
  );
}