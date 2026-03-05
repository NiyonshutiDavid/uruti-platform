import { useState, useEffect, useRef } from 'react';
import { useConfirmDialog } from '../ui/confirm-dialog';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Search, Send, Paperclip, MoreVertical, Star, Archive, Trash2, Phone, Video, X, Mic, MicOff, VideoOff, PhoneOff, Maximize2, Minimize2, Settings, FileText, Image as ImageIcon, Download, Info, Plus, MessageSquare, StopCircle, Play, Pause } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useCall } from '../../lib/call-context';
import { ChatInfoDialog } from '../ChatInfoDialog';
import { NewMessageDialog } from '../NewMessageDialog';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../lib/auth-context';
import { toast } from 'sonner';

/* ─── Inline Audio Player ─── */
function VoiceNotePlayer({ src, isOwn }: { src: string; isOwn: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('timeupdate', () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    });
    audio.addEventListener('ended', () => { setPlaying(false); setProgress(0); });
    return () => { audio.pause(); audio.src = ''; };
  }, [src]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); } else { audio.play(); }
    setPlaying(!playing);
  };

  const fmt = (s: number) => {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      <button onClick={toggle} className={`shrink-0 rounded-full w-8 h-8 flex items-center justify-center ${isOwn ? 'bg-white/20 hover:bg-white/30' : 'bg-[#76B947]/20 hover:bg-[#76B947]/30'}`}>
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </button>
      <div className="flex-1 flex flex-col gap-0.5">
        <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${isOwn ? 'bg-white/70' : 'bg-[#76B947]'}`} style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="text-[10px] opacity-70">{fmt(duration)}</span>
      </div>
      <Mic className="h-3.5 w-3.5 opacity-50 shrink-0" />
    </div>
  );
}

/* ─── Date-label helper ─── */
function getDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (today.getTime() - msgDay.getTime()) / 86400000;
  if (diff < 1) return 'Today';
  if (diff < 2) return 'Yesterday';
  if (diff < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  read: boolean;
  starred?: boolean;
  attachment?: {
    type: 'image' | 'file' | 'document' | 'idea' | 'audio';
    name: string;
    size: number;
    url?: string;
    duration?: number;
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
  userId: number;
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

const mockConversations: Conversation[] = [];

interface MessagesModuleProps {
  userType: 'founder' | 'investor';
}

export function MessagesModule({ userType = 'founder' }: MessagesModuleProps) {
  const { confirm } = useConfirmDialog();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'online' | 'starred'>('all');
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [showAttachmentDialog, setShowAttachmentDialog] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<{ type: 'image' | 'file' | 'document' | 'idea' | 'audio'; name: string; size: number; file?: File } | null>(null);
  const [loading, setLoading] = useState(false);
  const { startCall } = useCall();

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const parseServerTimestamp = (timestamp?: string | null): Date => {
    const value = (timestamp || '').trim();
    if (!value) return new Date(0);
    const normalized = /z$|[+-]\d{2}:?\d{2}$/i.test(value) ? value : `${value}Z`;
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
  };

  useEffect(() => {
    void loadConversations();
  }, [user?.id]);

  useEffect(() => {
    const token = sessionStorage.getItem('uruti_token');
    if (!token) return;

    const socket = apiClient.createMessagesWebSocket(token);

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed?.event === 'message_created') {
          void loadConversations();
        }
      } catch {
        // ignore malformed realtime payloads
      }
    };

    const ping = window.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ event: 'ping' }));
      }
    }, 15000);

    return () => {
      window.clearInterval(ping);
      socket.close();
    };
  }, [user?.id]);

  const mapApiMessages = (messages: any[], currentUserId: number): Message[] => {
    return messages.map((message: any) => {
      // Extract attachment from the message's attachments array if present
      let attachment: Message['attachment'] | undefined;
      const rawAttachments = message.attachments;
      if (Array.isArray(rawAttachments) && rawAttachments.length > 0) {
        const att = rawAttachments[0]; // Use first attachment
        const url = typeof att === 'string' ? att : att?.url || att?.file_url || '';
        const name = (typeof att === 'object' ? att?.name || att?.filename : '') || url.split('/').pop() || 'file';
        const size = typeof att === 'object' ? att?.size || 0 : 0;
        const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(url);
        const isAudio = /\.(webm|ogg|mp3|m4a|wav|aac)(\?|$)/i.test(url) || (typeof att === 'object' && att?.content_type?.startsWith?.('audio'));
        attachment = {
          type: isAudio ? 'audio' : isImage ? 'image' : 'document',
          name,
          size,
          url,
        };
      }

      return {
        id: String(message.id),
        senderId: Number(message.sender_id) === currentUserId ? 'me' : String(message.sender_id),
        text: message.body || '',
        timestamp: parseServerTimestamp(message.created_at).toISOString(),
        read: Boolean(message.is_read),
        ...(attachment ? { attachment } : {}),
      };
    });
  };

  const loadConversations = async () => {
    const currentUserId = Number(user?.id);
    if (!currentUserId) return;

    setLoading(true);
    try {
      const connections = await apiClient.getConnections();
      const builtConversations = await Promise.all(
        connections.map(async (connection: any) => {
          const rawMessages = await apiClient.getMessages(Number(connection.id), 0, 200);
          const mappedMessages = mapApiMessages(rawMessages, currentUserId);
          const lastMessage = mappedMessages.length > 0 ? mappedMessages[mappedMessages.length - 1] : null;
          const unread = rawMessages.filter(
            (message: any) => Number(message.receiver_id) === currentUserId && !message.is_read
          ).length;

          const isOnline = (() => {
            if (!connection.is_active) return false;
            if (!connection.last_login) return false;
            const lastLogin = parseServerTimestamp(connection.last_login);
            return (Date.now() - lastLogin.getTime()) < 10 * 60 * 1000; // 10 minutes
          })();

          return {
            id: String(connection.id),
            userId: Number(connection.id),
            name: connection.display_name || connection.full_name || connection.email,
            avatar: connection.avatar_url || connection.avatar,
            role: connection.role || 'Connection',
            lastMessage: lastMessage?.text || 'Start a conversation...',
            timestamp: lastMessage?.timestamp || new Date().toISOString(),
            unread,
            online: isOnline,
            messages: mappedMessages,
            starred: false,
          } as Conversation;
        })
      );

      builtConversations.sort((left, right) =>
        parseServerTimestamp(right.timestamp).getTime() -
        parseServerTimestamp(left.timestamp).getTime()
      );

      setConversations(builtConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread, 0);

  // Dispatch initial unread count and update when it changes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('update-message-count', { 
      detail: { count: totalUnread } 
    }));
  }, [totalUnread]);

  const formatTimestamp = (timestamp: string) => {
    const date = parseServerTimestamp(timestamp);
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
    const date = parseServerTimestamp(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const handleSendMessage = () => {
    void (async () => {
      if (!(messageText.trim() || selectedAttachment) || !selectedConversation) return;

      const outgoingText = messageText || (selectedAttachment ? `Attached: ${selectedAttachment.name}` : '');
      try {
        let attachUrls: string[] | undefined;

        // Upload file attachment if present
        if (selectedAttachment?.file) {
          const uploaded = await apiClient.uploadMessageAttachment(selectedAttachment.file);
          const url = uploaded.url.startsWith('http') ? uploaded.url : `${(apiClient as any).baseUrl}${uploaded.url}`;
          attachUrls = [url];
        }

        await apiClient.sendMessage(selectedConversation.userId, outgoingText, attachUrls);

        const newMessage: Message = {
          id: `m-${Date.now()}`,
          senderId: 'me',
          text: outgoingText,
          timestamp: new Date().toISOString(),
          read: true,
          attachment: selectedAttachment ? {
            ...selectedAttachment,
            url: attachUrls?.[0],
          } : undefined
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
      } catch (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
      }
    })();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileType = file.type.startsWith('image/') ? 'image' : 
                      file.type.includes('pdf') || file.type.includes('document') ? 'document' : 'file';
      
      setSelectedAttachment({
        type: fileType as any,
        name: file.name,
        size: file.size,
        file,
      });
      
      // Reset the input
      event.target.value = '';
    }
  };

  // ── Voice Recording ──
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
        const dur = recordingDuration;
        setRecordingDuration(0);

        if (!selectedConversation) return;

        // Upload and send
        try {
          const uploaded = await apiClient.uploadMessageAttachment(file);
          const attachUrl = uploaded.url.startsWith('http') ? uploaded.url : `${(apiClient as any).baseUrl}${uploaded.url}`;
          await apiClient.sendMessage(selectedConversation.userId, '🎤 Voice note', [attachUrl]);

          const newMsg: Message = {
            id: `m-${Date.now()}`,
            senderId: 'me',
            text: '🎤 Voice note',
            timestamp: new Date().toISOString(),
            read: true,
            attachment: { type: 'audio', name: file.name, size: file.size, url: attachUrl, duration: dur },
          };

          setConversations(prev =>
            prev.map(c =>
              c.id === selectedConversation.id
                ? { ...c, messages: [...c.messages, newMsg], lastMessage: '🎤 Voice note', timestamp: newMsg.timestamp }
                : c
            )
          );
          setSelectedConversation(prev =>
            prev ? { ...prev, messages: [...prev.messages, newMsg] } : null
          );
          toast.success('Voice note sent');
        } catch {
          toast.error('Failed to send voice note');
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = window.setInterval(() => setRecordingDuration(d => d + 1), 1000);
    } catch {
      toast.error('Microphone access denied. Please allow microphone in browser settings.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      // Remove the onstop handler so we don't send
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingDuration(0);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleStartCall = (type: 'voice' | 'video') => {
    if (selectedConversation) {
      void startCall(
        type,
        selectedConversation.userId,
        selectedConversation.name,
        selectedConversation.avatar,
        selectedConversation.online,
      );
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
      userId: Number(contact.id),
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

  const handleDeleteChat = async (conversationId: string) => {
    const confirmed = await confirm({
      title: 'Delete Conversation',
      description: 'Are you sure you want to delete this chat conversation? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;

    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="glass-card rounded-2xl p-4 sm:p-6 md:p-8 border border-black/5 dark:border-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>Messages            </h1>
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
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-semibold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                      No conversations yet
                    </p>
                    <p className="text-sm text-muted-foreground mb-4" style={{ fontFamily: 'var(--font-body)' }}>
                      {loading
                        ? 'Loading your conversations...'
                        : `Start a new conversation to connect with ${userType === 'founder' ? 'investors and mentors' : 'founders'}`}
                    </p>
                    <Button
                      onClick={() => setShowNewMessageDialog(true)}
                      className="bg-[#76B947] text-white hover:bg-[#76B947]/90"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Message
                    </Button>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
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
                  ))
                )}
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
                messages={selectedConversation.messages}
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
                      <div
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setShowChatInfo(true)}
                      >
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
                          <DropdownMenuItem className="hover:bg-red-500/10 text-red-600 cursor-pointer" onClick={() => handleDeleteChat(selectedConversation.id)}>
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
                    {(() => {
                      let lastDateLabel = '';
                      return selectedConversation.messages.map((message) => {
                        const isMyMessage = message.senderId === 'me';
                        const dateLabel = getDateLabel(message.timestamp);
                        const showDateSeparator = dateLabel !== lastDateLabel;
                        lastDateLabel = dateLabel;

                        return (
                          <div key={message.id}>
                            {/* Date separator */}
                            {showDateSeparator && dateLabel && (
                              <div className="flex items-center gap-3 my-4">
                                <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
                                <span className="text-xs font-medium text-muted-foreground px-3 py-1 rounded-full bg-black/5 dark:bg-white/5" style={{ fontFamily: 'var(--font-body)' }}>
                                  {dateLabel}
                                </span>
                                <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
                              </div>
                            )}

                            <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
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
                                  {/* Voice note player */}
                                  {message.attachment?.type === 'audio' && message.attachment.url ? (
                                    <VoiceNotePlayer src={message.attachment.url} isOwn={isMyMessage} />
                                  ) : (
                                    <>
                                      <p className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                                        {message.text}
                                      </p>
                                      {message.attachment && message.attachment.type !== 'audio' && (
                                        <div className="mt-2">
                                          {message.attachment.type === 'image' && message.attachment.url ? (
                                            <img src={message.attachment.url} alt={message.attachment.name} className="rounded-lg max-w-full max-h-48 object-cover" />
                                          ) : (
                                            <a href={message.attachment.url} target="_blank" rel="noopener noreferrer" className={`flex items-center space-x-2 text-sm ${isMyMessage ? 'text-white/80 hover:text-white' : 'text-[#76B947]'}`}>
                                              <FileText className="h-4 w-4" />
                                              <span>{message.attachment.name} ({formatFileSize(message.attachment.size)})</span>
                                            </a>
                                          )}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                                <p className={`text-xs text-muted-foreground mt-1 ${isMyMessage ? 'text-right' : 'text-left'}`} style={{ fontFamily: 'var(--font-body)' }}>
                                  {formatMessageTime(message.timestamp)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
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
                  
                  {isRecording ? (
                    /* Recording in progress bar */
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg border border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10">
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-red-600 dark:text-red-400" style={{ fontFamily: 'var(--font-body)' }}>
                          Recording {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelRecording}
                        className="text-red-500 hover:bg-red-500/10"
                        title="Cancel"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                      <Button
                        onClick={stopRecording}
                        className="bg-[#76B947] text-white hover:bg-[#76B947]/90"
                        title="Send voice note"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
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
                        variant="ghost"
                        size="sm"
                        className="hover:bg-[#76B947]/10"
                        onClick={startRecording}
                        title="Record voice note"
                      >
                        <Mic className="h-5 w-5" />
                      </Button>
                      <Button 
                        onClick={handleSendMessage}
                        className="bg-[#76B947] text-white hover:bg-[#76B947]/90"
                        disabled={!messageText.trim() && !selectedAttachment}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
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