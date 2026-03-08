import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { 
  Send, 
  Sparkles, 
  Lightbulb, 
  TrendingUp, 
  Target, 
  Users, 
  DollarSign,
  Plus,
  Mic,
  Paperclip,
  Image as ImageIcon,
  FileText,
  X,
  Search,
  MessageSquare,
  Clock,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  PieChart,
  Trash2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../lib/auth-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
  startup?: {
    name: string;
    sector: string;
  };
}

interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'audio';
  url?: string;
}

interface ChatHistory {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  unread: boolean;
  startup?: {
    name: string;
    sector: string;
  };
}

interface Venture {
  id: number;
  name: string;
  sector: string;
  stage?: string;
  industry?: string;
  description?: string;
  problem_statement?: string;
  solution?: string;
  target_market?: string;
  business_model?: string;
  uruti_score?: number;
}

interface BackendAiModel {
  id: string;
  name: string;
  description: string;
  type: 'chatbot' | 'analysis';
  requires_venture_context: boolean;
  fixed_prompt?: string | null;
  is_default?: boolean;
}

interface AIChatModuleProps {
  userType?: 'founder' | 'investor';
  startupContext?: { name: string; description: string };
  analysisContext?: any;
}

const founderQuickActions = [
  { icon: Lightbulb, label: 'Refine Idea', prompt: 'Help me refine my startup idea', color: 'text-yellow-500' },
  { icon: TrendingUp, label: 'Market Analysis', prompt: 'Analyze the market for my startup', color: 'text-blue-500' },
  { icon: Target, label: 'Go-to-Market', prompt: 'Help me create a go-to-market strategy', color: 'text-green-500' },
  { icon: Users, label: 'Target Audience', prompt: 'Who should be my target customers?', color: 'text-purple-500' },
  { icon: DollarSign, label: 'Revenue Model', prompt: 'What revenue model would work best?', color: 'text-emerald-500' },
];

const investorQuickActions = [
  { icon: BarChart3, label: 'Investment Analysis', prompt: 'Analyze investment potential of this startup', color: 'text-blue-500' },
  { icon: PieChart, label: 'Portfolio Fit', prompt: 'How does this startup fit my investment portfolio?', color: 'text-purple-500' },
  { icon: TrendingUp, label: 'Growth Potential', prompt: 'What is the growth potential and scalability?', color: 'text-green-500' },
  { icon: Target, label: 'Risk Assessment', prompt: 'What are the key risks I should consider?', color: 'text-red-500' },
  { icon: DollarSign, label: 'Valuation Analysis', prompt: 'Is the valuation reasonable for this stage?', color: 'text-emerald-500' },
];

export function AIChatModule({ userType = 'founder', startupContext, analysisContext }: AIChatModuleProps) {
  const { user } = useAuth();
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [bookmarkedVentures, setBookmarkedVentures] = useState<Venture[]>([]);
  const [isLoadingVentures, setIsLoadingVentures] = useState(true);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedStartup, setSelectedStartup] = useState<Venture | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<BackendAiModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<BackendAiModel | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [modelSelectOpen, setModelSelectOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quickActions = userType === 'founder' ? founderQuickActions : investorQuickActions;

  const shortenModelDescription = (description: string, maxLength: number = 82) => {
    const normalized = (description || '').trim().replace(/\s+/g, ' ');
    if (normalized.length <= maxLength) {
      return normalized;
    }
    return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
  };

  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, lineIndex) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={`${lineIndex}-${line}`}>
          {parts.map((part, partIndex) => {
            const isBold = part.startsWith('**') && part.endsWith('**') && part.length > 4;
            if (isBold) {
              return <strong key={`${lineIndex}-${partIndex}`}>{part.slice(2, -2)}</strong>;
            }
            return <span key={`${lineIndex}-${partIndex}`}>{part}</span>;
          })}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      );
    });
  };

  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoadingModels(true);
        const data = await apiClient.getAiModels();
        const models: BackendAiModel[] = (data || []).map((model: any) => ({
          id: String(model.id),
          name: String(model.name || model.id),
          description: String(model.description || ''),
          type: model.type === 'analysis' ? 'analysis' : 'chatbot',
          requires_venture_context: Boolean(model.requires_venture_context),
          fixed_prompt: model.fixed_prompt ?? null,
          is_default: Boolean(model.is_default),
        }));

        setAvailableModels(models);
        const defaultModel = models.find((m) => m.is_default) || models.find((m) => m.type === 'chatbot') || models[0] || null;
        setSelectedModel(defaultModel);
      } catch (error) {
        setAvailableModels([]);
        setSelectedModel(null);
      } finally {
        setIsLoadingModels(false);
      }
    };

    if (user) {
      loadModels();
    }
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  // Load ventures from backend
  useEffect(() => {
    const loadVentures = async () => {
      try {
        setIsLoadingVentures(true);
        
        if (userType === 'founder') {
          // Load only founder's own ventures
          const data = await apiClient.getMyVentures();
          setVentures(
            (data || []).map((venture: any) => ({
              ...venture,
              sector: venture.sector || venture.industry || 'General',
            }))
          );
        } else {
          // Load bookmarked ventures for investors
          const bookmarks = await apiClient.getBookmarks();
          setBookmarkedVentures(
            (bookmarks || [])
              .map((bookmark: any) => bookmark?.venture)
              .filter(Boolean)
              .map((venture: any) => ({
                ...venture,
                sector: venture.sector || venture.industry || 'General',
              }))
          );
        }
      } catch (error) {
        // Silently handle error - backend might not be running or endpoints not ready
        if (userType === 'founder') {
          setVentures([]);
        } else {
          setBookmarkedVentures([]);
        }
      } finally {
        setIsLoadingVentures(false);
      }
    };

    if (user) {
      loadVentures();
    }
  }, [user, userType]);

  // Load chat history from backend
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setIsLoadingChats(true);
        const sessions = await apiClient.getAiHistorySessions();
        
        const formattedHistory: ChatHistory[] = (sessions || []).map((session: any) => ({
          id: session.session_id,
          title: (session.first_message || 'New Chat').slice(0, 50),
          lastMessage: session.first_message || 'No messages yet',
          timestamp: new Date(session.created_at),
          unread: false,
          startup: undefined,
        }));

        formattedHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        setChatHistories(formattedHistory);

        // Open the latest conversation by default so users land on newest messages.
        if (formattedHistory.length > 0 && !currentChatId && messages.length === 0) {
          const latest = formattedHistory[0];
          setCurrentChatId(latest.id);
          try {
            const messagesData = await apiClient.getAiSessionMessages(latest.id);
            const formattedMessages: Message[] = messagesData.map((msg: any) => ({
              id: String(msg.id),
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.created_at),
              startup: undefined,
            }));
            setMessages(formattedMessages);
          } catch {
            // Keep app usable even if a session fetch fails.
          }
        }
      } catch (error) {
        // Silently handle error - AI chat endpoints might not be implemented yet
        setChatHistories([]);
      } finally {
        setIsLoadingChats(false);
      }
    };

    if (user) {
      loadChatHistory();
    }
  }, [user]);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // Handle startup context from external navigation
  useEffect(() => {
    if (!startupContext || messages.length > 0) return;

    const scopedVentures = userType === 'investor' ? bookmarkedVentures : ventures;
    const matched = scopedVentures.find((v) => v.name === startupContext.name);

    setCurrentChatId(null);

    if (!matched) {
      const notAllowedText = userType === 'founder'
        ? 'Requested context was not attached because it is not one of your created ventures.'
        : 'Requested context was not attached because it is not in your bookmarked ideas.';

      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: notAllowedText,
          timestamp: new Date(),
        },
      ]);
      return;
    }

    setSelectedStartup(matched);
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: `Context attached: ${matched.name}. Ask your question and I'll use this context in the backend model response.`,
        timestamp: new Date(),
      },
    ]);
  }, [startupContext, userType, ventures, bookmarkedVentures, messages.length]);

  // Handle AI analysis context for investors
  useEffect(() => {
    if (analysisContext && userType === 'investor') {
      const matchedBookmarked = bookmarkedVentures.find((venture) => venture.id === analysisContext.id);
      if (!matchedBookmarked) {
        setCurrentChatId(null);
        setSelectedStartup(null);
        setMessages([
          {
            id: '1',
            role: 'assistant',
            content: 'This startup is not in your bookmarked ideas. Bookmark it first, then attach it as context.',
            timestamp: new Date(),
          },
        ]);
        return;
      }

      const contextStartup: Venture = {
        id: matchedBookmarked.id,
        name: matchedBookmarked.name,
        sector: matchedBookmarked.sector || matchedBookmarked.industry || 'General',
        uruti_score: matchedBookmarked.uruti_score ?? analysisContext.urutiScore
      };
      setSelectedStartup(contextStartup);
      
      setCurrentChatId(null);
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: `Context attached: ${contextStartup.name}. Choose a chatbot model and ask your investment question.`,
          timestamp: new Date()
        }
      ]);
    }
  }, [analysisContext, userType, bookmarkedVentures]);

  const handleSend = async (text?: string) => {
    if (!selectedModel) return;

    const typedText = (text || inputText.trim()).trim();
    const isAnalysisModel = selectedModel.type === 'analysis';

    if (isAnalysisModel && userType !== 'founder') {
      const blockedMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'The analysis model is only available for founders analyzing their own ventures.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, blockedMessage]);
      return;
    }

    if (isAnalysisModel && !selectedStartup) {
      const blockedMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Please attach one of your ventures as context before using the analysis model.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, blockedMessage]);
      return;
    }

    const messageText = isAnalysisModel
      ? (selectedModel.fixed_prompt || 'analyse my venture')
      : typedText;

    if (!messageText && attachments.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText || 'Shared attachments',
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
      startup: selectedStartup ? { name: selectedStartup.name, sector: selectedStartup.sector } : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setAttachments([]);
    setIsTyping(true);

    try {
      const response = await apiClient.sendAiChat({
        message: messageText,
        model: selectedModel.id,
        session_id: currentChatId || undefined,
        startup_context: selectedStartup
          ? {
              venture_id: selectedStartup.id,
              name: selectedStartup.name,
              description: selectedStartup.description,
              stage: selectedStartup.stage,
              industry: selectedStartup.industry || selectedStartup.sector,
              problem_statement: selectedStartup.problem_statement,
              solution: selectedStartup.solution,
              target_market: selectedStartup.target_market,
              business_model: selectedStartup.business_model,
            }
          : undefined,
      });

      setCurrentChatId(response.session_id);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);

      const sessions = await apiClient.getAiHistorySessions();
      const formattedHistory: ChatHistory[] = (sessions || []).map((session: any) => ({
        id: session.session_id,
        title: (session.first_message || 'New Chat').slice(0, 50),
        lastMessage: session.first_message || 'No messages yet',
        timestamp: new Date(session.created_at),
        unread: false,
        startup: undefined,
      }));
      setChatHistories(formattedHistory);
    } catch (error) {
      console.error('Error saving message:', error);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Failed to send message. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const attachment: Attachment = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        url: URL.createObjectURL(file)
      };
      setAttachments(prev => [...prev, attachment]);
    });
    setAttachDialogOpen(false);
  };

  const handleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
      const mimeType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size > 0) {
          const extension = (recorder.mimeType || 'audio/webm').includes('mp4') ? 'm4a' : 'webm';
          const attachment: Attachment = {
            id: Date.now().toString(),
            name: `Voice Note ${new Date().toLocaleTimeString()}.${extension}`,
            type: 'audio',
            url: URL.createObjectURL(blob),
          };
          setAttachments((prev) => [...prev, attachment]);
        }
        setIsRecording(false);
        audioStreamRef.current?.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Voice recording failed:', error);
      setIsRecording(false);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const startNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setAttachments([]);
    setSelectedStartup(null);
  };

  const loadChatHistory = async (chatId: string) => {
    try {
      setCurrentChatId(chatId);
      const chat = chatHistories.find(c => c.id === chatId);
      if (chat?.startup) {
        const foundVenture = ventures.find(v => v.name === chat.startup?.name) || bookmarkedVentures.find(v => v.name === chat.startup?.name);
        setSelectedStartup(foundVenture || null);
      }

      const messagesData = await apiClient.getAiSessionMessages(chatId);
      const formattedMessages: Message[] = messagesData.map((msg: any) => ({
        id: String(msg.id),
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        startup: undefined,
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  const handleDeleteChat = async () => {
    if (!chatToDelete) return;

    try {
      await apiClient.deleteAiSessionHistory(chatToDelete);
      setChatHistories(prev => prev.filter(chat => chat.id !== chatToDelete));
      
      if (currentChatId === chatToDelete) {
        startNewChat();
      }

      setDeleteDialogOpen(false);
      setChatToDelete(null);
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const filteredHistories = chatHistories.filter(chat =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };


  const availableVentures = userType === 'investor' ? bookmarkedVentures : ventures;
  const isAnalysisSelected = selectedModel?.type === 'analysis';

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-card border-purple-200 dark:border-purple-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: 'var(--font-heading)' }}>Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this conversation and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setChatToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChat}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Chat History Sidebar */}
      <aside
        className={`w-80 shrink-0 border-r border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-900/70 flex h-full min-h-0 flex-col overflow-hidden backdrop-blur supports-[backdrop-filter]:bg-white/80 supports-[backdrop-filter]:dark:bg-slate-900/70 ${
          isSidebarOpen ? 'flex' : 'hidden md:flex'
        }`}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-black dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  Uruti AI
                </h2>
                <p className="text-xs text-muted-foreground">{userType === 'founder' ? 'Advisory' : 'Investment'} Assistant</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(false)}
              className="h-8 w-8 hover:bg-[#76B947] hover:text-white transition-all md:hidden"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            onClick={startNewChat}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:from-purple-700 hover:to-purple-900 mb-3"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          {isLoadingChats ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          ) : filteredHistories.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {filteredHistories.map((chat) => (
                <div key={chat.id} className="rounded-xl">
                  <Card
                    className={`glass-card cursor-pointer transition-all hover:scale-[1.02] hover:bg-[#76B947]/10 dark:hover:bg-[#76B947]/20 border-gray-200 dark:border-gray-700 ${
                      currentChatId === chat.id ? 'bg-purple-100/50 dark:bg-purple-900/30 border-purple-400 dark:border-purple-500' : ''
                    }`}
                  >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-1">
                      <div 
                        className="flex items-center space-x-2 flex-1 min-w-0"
                        onClick={() => loadChatHistory(chat.id)}
                      >
                        <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                        <h3 className="text-sm font-medium text-black dark:text-white truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                          {chat.title}
                        </h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          setChatToDelete(chat.id);
                          setDeleteDialogOpen(true);
                        }}
                        className="h-6 w-6 hover:bg-red-100 dark:hover:bg-red-900/30 flex-shrink-0"
                      >
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>
                    <div onClick={() => loadChatHistory(chat.id)}>
                      <p className="text-xs text-muted-foreground truncate mb-2">
                        {chat.lastMessage}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(chat.timestamp)}</span>
                        </div>
                        {chat.startup && (
                          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 text-xs">
                            {chat.startup.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex min-h-0 flex-col overflow-hidden">
        
        {/* Chat Header - Fixed at top */}
        <div className="sticky top-0 z-10 flex-shrink-0 border-b border-slate-200 dark:border-slate-800 p-4 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="h-8 w-8 hover:bg-[#76B947] hover:text-white transition-all md:hidden"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-black dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  {userType === 'founder' ? 'Uruti AI Advisor' : 'AI Investment Assistant'}
                </h1>
                <p className="text-sm text-muted-foreground">Always here to help you succeed</p>
              </div>
            </div>
            {selectedStartup && (
              <Badge className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-4 py-2 max-w-[250px] truncate">
                <Lightbulb className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  {selectedStartup.name} • {selectedStartup.sector}
                  {selectedStartup.uruti_score && ` • Score: ${selectedStartup.uruti_score}`}
                </span>
              </Badge>
            )}
          </div>
        </div>

        {/* Messages Area - Scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain" ref={scrollRef}>
            <div className="max-w-4xl mx-auto p-6 w-full">
              {/* Welcome Message when no messages */}
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    Hi! I'm your AI {userType === 'founder' ? 'Advisory' : 'Investment'} Assistant
                  </h2>
                  <p className="text-muted-foreground mb-8" style={{ fontFamily: 'var(--font-body)' }}>
                    {userType === 'founder' 
                      ? "I'm here to help you refine your startup idea, develop strategies, and prepare for investors."
                      : "I'm here to help you analyze investment opportunities and make data-driven decisions."}
                  </p>
                  
                  {/* Quick Actions */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground mb-3" style={{ fontFamily: 'var(--font-body)' }}>
                      Quick actions to get started:
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <Button
                            key={action.label}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSend(action.prompt)}
                            className="glass-button hover:scale-105 transition-transform border-purple-200 dark:border-purple-500/30"
                          >
                            <Icon className={`mr-2 h-4 w-4 ${action.color}`} />
                            {action.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Actual Messages */}
              {messages.length > 0 && (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-3 max-w-[75%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          {message.role === 'user' ? (
                            <>
                              {user?.avatar_url && <AvatarImage src={user.avatar_url} alt={user.full_name} />}
                              <AvatarFallback className="bg-[#76B947]/20 text-[#76B947]">
                                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </>
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-800 text-white">
                              <Sparkles className="h-5 w-5" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                          {message.startup && message.role === 'user' && (
                            <Badge className="mb-1 bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                              Context: {message.startup.name}
                            </Badge>
                          )}
                          <div
                            className={`rounded-2xl px-5 py-4 glass-card ${
                              message.role === 'user'
                                ? 'bg-gradient-to-br from-[#76B947] to-[#5a8f35] border-none'
                                : 'bg-gradient-to-br from-white to-purple-50 border border-purple-200 dark:from-slate-900 dark:to-purple-950/40 dark:border-purple-800/60'
                            }`}
                          >
                            <p className={`text-sm whitespace-pre-wrap ${message.role === 'user' ? 'text-black dark:text-white' : ''}`} style={{ fontFamily: 'var(--font-body)' }}>
                              {renderFormattedText(message.content)}
                            </p>
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {message.attachments.map((attachment) => (
                                  <div
                                    key={attachment.id}
                                    className="flex items-center space-x-2 p-2 rounded-lg bg-white/20 dark:bg-black/20"
                                  >
                                    {attachment.type === 'audio' ? (
                                      <div className="w-full space-y-1">
                                        <div className="flex items-center gap-2">
                                          <Mic className="h-4 w-4" />
                                          <span className="text-xs">{attachment.name}</span>
                                        </div>
                                        <audio controls src={attachment.url} className="w-full" preload="metadata" />
                                      </div>
                                    ) : (
                                      <>
                                        {attachment.type === 'image' ? (
                                          <ImageIcon className="h-4 w-4" />
                                        ) : (
                                          <FileText className="h-4 w-4" />
                                        )}
                                        <span className="text-xs">{attachment.name}</span>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-body)' }}>
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-800 text-white">
                          <Sparkles className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border border-purple-200 dark:border-purple-700 rounded-2xl px-5 py-4 glass-card">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="sticky bottom-0 z-20 flex-shrink-0 border-t border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-950/95 p-4 backdrop-blur">
          <div className="max-w-4xl mx-auto">
            <div className="relative border border-purple-300 dark:border-purple-600 rounded-3xl overflow-hidden bg-white dark:bg-gray-800 shadow-lg">
              <div className="flex items-end p-2 gap-2">
                <Dialog open={attachDialogOpen} onOpenChange={setAttachDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-10 w-10 rounded-full hover:bg-[#76B947]/10 transition-all flex-shrink-0"
                    >
                      <Plus className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-card border-purple-200 dark:border-purple-500/30">
                    <DialogHeader>
                      <DialogTitle style={{ fontFamily: 'var(--font-heading)' }}>Add to Conversation</DialogTitle>
                      <DialogDescription>
                        {isAnalysisSelected
                          ? 'Analysis model requires a venture context from your own ventures'
                          : 'Attach files or select a startup context'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start hover:bg-[#76B947]/10 hover:border-[#76B947] hover:text-[#76B947] dark:hover:bg-[#76B947]/20 transition-all"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip className="mr-2 h-4 w-4" />
                        Attach File
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*,.pdf,.doc,.docx,.txt"
                      />
                      
                      <div className="border-t border-purple-200 dark:border-purple-500/30 pt-3">
                        <Label className="mb-2 block text-sm">
                          {userType === 'investor' ? 'Select Bookmarked Startup' : 'Select Startup Context'}
                        </Label>
                        {isLoadingVentures ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                          </div>
                        ) : availableVentures.length === 0 ? (
                          <div className="flex items-center space-x-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                            <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                            <p className="text-xs text-yellow-700 dark:text-yellow-300">
                              {userType === 'investor' 
                                ? 'No bookmarked startups yet. Bookmark startups from Startup Discovery to analyze them here.'
                                : 'No ventures created yet. Create a venture first to attach it as context.'}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {availableVentures.map((venture) => (
                              <Button
                                key={venture.id}
                                variant={selectedStartup?.id === venture.id ? 'default' : 'outline'}
                                className={
                                  selectedStartup?.id === venture.id
                                    ? 'w-full justify-start transition-all bg-gradient-to-r from-purple-600 to-purple-800 text-white'
                                    : 'w-full justify-start transition-all hover:bg-[#76B947]/10 hover:border-[#76B947] hover:text-[#76B947] dark:hover:bg-[#76B947]/20'
                                }
                                onClick={() => {
                                  setSelectedStartup(venture);
                                  setAttachDialogOpen(false);
                                }}
                              >
                                <Lightbulb className="mr-2 h-4 w-4" />
                                {venture.name} • {venture.sector}
                                {venture.uruti_score && ` • ${venture.uruti_score}`}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="flex-1 min-h-[48px]">
                  <Input
                    placeholder={
                      isAnalysisSelected
                        ? 'Analysis mode uses fixed prompt: "analyse my venture"'
                        : userType === 'founder'
                          ? 'Ask Uruti AI anything about your startup...'
                          : 'Ask Uruti AI about investment opportunities...'
                    }
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    className="border-0 focus-visible:ring-0 bg-transparent dark:bg-transparent text-base h-12 px-4"
                    style={{ fontFamily: 'var(--font-body)' }}
                  />
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Dialog open={modelSelectOpen} onOpenChange={setModelSelectOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full px-4 h-10 glass-card border-purple-300 dark:border-purple-600 hover:bg-[#76B947]/10 hover:border-[#76B947] transition-all"
                      >
                        <span className="font-medium text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
                            {selectedModel?.name || (isLoadingModels ? 'Loading models...' : 'No model')}
                        </span>
                        <ChevronRight className="h-4 w-4 ml-1 text-muted-foreground rotate-90" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card border-purple-200 dark:border-purple-500/30 w-[calc(100vw-2rem)] sm:w-full max-w-[44rem] max-h-[80vh] overflow-y-auto p-4 sm:p-6">
                      <DialogHeader>
                        <DialogTitle style={{ fontFamily: 'var(--font-heading)' }}>Select AI Model</DialogTitle>
                        <DialogDescription>Choose the best model for your task</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 px-1 sm:px-2">
                          {availableModels.map((model) => (
                          <Button
                            key={model.id}
                              variant={selectedModel?.id === model.id ? 'default' : 'outline'}
                            className={
                                selectedModel?.id === model.id
                                  ? 'w-full justify-start items-start transition-all bg-gradient-to-r from-purple-600 to-purple-800 text-white h-auto min-h-[5.75rem] py-4 px-3 sm:px-4 rounded-xl'
                                : 'w-full justify-start items-start transition-all hover:bg-[#76B947]/10 hover:border-[#76B947] hover:text-[#76B947] dark:hover:bg-[#76B947]/20 h-auto min-h-[5.75rem] py-4 px-3 sm:px-4 rounded-xl'
                            }
                            onClick={() => {
                              setSelectedModel(model);
                              setModelSelectOpen(false);
                            }}
                          >
                            <div className="flex-1 text-left min-w-0">
                              <div className="font-semibold text-sm sm:text-base mb-1 truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                                {model.name}
                              </div>
                              <div
                                className="text-xs opacity-90 whitespace-normal break-words overflow-hidden"
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                }}
                              >
                                {shortenModelDescription(model.description)}
                              </div>
                            </div>
                            {selectedModel?.id === model.id && (
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            )}
                          </Button>
                        ))}
                        {!isLoadingModels && availableModels.length === 0 && (
                          <p className="text-sm text-muted-foreground">No models available from backend.</p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    size="icon"
                    variant="ghost"
                    className={`h-10 w-10 rounded-full ${
                      isRecording 
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 animate-pulse hover:bg-red-200' 
                        : 'hover:bg-[#76B947]/10'
                    } transition-all flex-shrink-0`}
                    onClick={handleRecording}
                  >
                    <Mic className={`h-5 w-5 ${isRecording ? 'text-red-600' : 'text-muted-foreground'}`} />
                  </Button>

                  <Button
                    onClick={() => handleSend()}
                    disabled={isTyping || (!isAnalysisSelected && !inputText.trim() && attachments.length === 0) || (isAnalysisSelected && !selectedStartup)}
                    size="icon"
                    className="h-10 w-10 rounded-full bg-[#76B947] hover:bg-[#5a8f35] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {attachments.length > 0 && (
                <div className="px-4 pb-3 pt-1 border-t border-purple-200/50 dark:border-purple-500/20">
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center space-x-2 glass-card border-purple-200 dark:border-purple-500/30 px-3 py-2 rounded-lg"
                      >
                        {attachment.type === 'image' ? (
                          <ImageIcon className="h-4 w-4 text-purple-600" />
                        ) : attachment.type === 'audio' ? (
                          <Mic className="h-4 w-4 text-purple-600" />
                        ) : (
                          <FileText className="h-4 w-4 text-purple-600" />
                        )}
                        <span className="text-sm text-black dark:text-white">{attachment.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(attachment.id)}
                          className="h-5 w-5 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                        >
                          <X className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground mt-3 text-center" style={{ fontFamily: 'var(--font-body)' }}>
              Powered by Uruti AI • Your conversations are private and secure
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}