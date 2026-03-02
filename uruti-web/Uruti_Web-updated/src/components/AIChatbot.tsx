import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Send, Sparkles, X, Lightbulb, TrendingUp, Target, Users, DollarSign, Minimize2, Maximize2, Upload, Mic, StopCircle } from 'lucide-react';
import { apiClient } from '../lib/api-client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatbotProps {
  open: boolean;
  onClose: () => void;
  startupContext?: {
    name: string;
    description: string;
  };
}

const quickActions = [
  { icon: Lightbulb, label: 'Refine Idea', prompt: 'Help me refine my startup idea' },
  { icon: TrendingUp, label: 'Market Analysis', prompt: 'Analyze the market for my startup' },
  { icon: Target, label: 'Go-to-Market', prompt: 'Help me create a go-to-market strategy' },
  { icon: Users, label: 'Target Audience', prompt: 'Who should be my target customers?' },
  { icon: DollarSign, label: 'Revenue Model', prompt: 'What revenue model would work best?' },
];

export function AIChatbot({ open, onClose, startupContext }: AIChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [founderProfile, setFounderProfile] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'production' | 'research'>('production');
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    if (!open) return;
    const cachedProfile = localStorage.getItem('uruti_founder_profile') || '';
    if (cachedProfile && !founderProfile) {
      setFounderProfile(cachedProfile);
    }

    apiClient.getFounderProfile()
      .then((response) => {
        if (response?.founder_profile) {
          setFounderProfile(response.founder_profile);
          localStorage.setItem('uruti_founder_profile', response.founder_profile);
        }
      })
      .catch(() => {
        // no-op; local profile fallback still works
      });
  }, [open]);

  useEffect(() => {
    if (open && messages.length === 0) {
      // Initial greeting
      const greeting = startupContext
        ? `Hi! I'm your AI Advisory Assistant. I see you want to discuss **${startupContext.name}**. How can I help you refine and grow this idea today?`
        : `Hi! I'm your AI Advisory Assistant powered by Uruti's intelligence engine. I'm here to help you with:\n\n• Refining your startup ideas\n• Market analysis and validation\n• Go-to-market strategies\n• Pitch preparation\n• Investment readiness\n\nWhat would you like to explore?`;
      
      setMessages([{
        id: '1',
        role: 'assistant',
        content: greeting,
        timestamp: new Date()
      }]);
    }
  }, [open, startupContext]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatAdvisory = (payload: any) => {
    const advisory = payload?.advisory || {};
    const diagnosis = advisory?.diagnosis || 'No diagnosis available.';
    const recs = (advisory?.strategic_recommendations || []).map((item: string) => `• ${item}`).join('\n');
    const risks = (advisory?.risks || []).map((item: string) => `• ${item}`).join('\n');
    const plan = (advisory?.['30_day_plan'] || []).map((item: string) => `• ${item}`).join('\n');
    const funding = advisory?.funding_advice || 'No funding guidance returned.';
    const disclaimer = advisory?.disclaimer || 'Advisory support, not legal/financial advice.';

    return `Diagnosis:\n${diagnosis}\n\nStrategic Recommendations:\n${recs || '• N/A'}\n\nKey Risks:\n${risks || '• N/A'}\n\n30-Day Plan:\n${plan || '• N/A'}\n\nFunding Considerations:\n${funding}\n\n${disclaimer}`;
  };

  const handleSend = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      if (founderProfile?.trim()) {
        localStorage.setItem('uruti_founder_profile', founderProfile.trim());
        await apiClient.setFounderProfile(founderProfile.trim());
      }

      const response = selectedFile
        ? await apiClient.chatFile({
            user_query: messageText,
            founder_profile: founderProfile || undefined,
            mode,
            file: selectedFile,
          })
        : await apiClient.chatText({
            user_query: messageText,
            founder_profile: founderProfile || undefined,
            mode,
          });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: formatAdvisory(response),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setSelectedFile(null);
    } catch (error: any) {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I couldn't process that request: ${error?.message || 'Unknown error'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const audioFile = new File([blob], `founder-audio-${Date.now()}.webm`, { type: 'audio/webm' });
        setIsTyping(true);

        try {
          const response = await apiClient.chatAudio({
            file: audioFile,
            user_query: inputText.trim() || '',
            founder_profile: founderProfile || undefined,
            mode,
          });

          const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: '[Audio message submitted]',
            timestamp: new Date()
          };
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: formatAdvisory(response),
            timestamp: new Date()
          };
          setMessages(prev => [...prev, userMessage, assistantMessage]);
        } catch (error: any) {
          setMessages(prev => [...prev, {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: `Audio processing failed: ${error?.message || 'Unknown error'}`,
            timestamp: new Date()
          }]);
        } finally {
          setIsTyping(false);
          stream.getTracks().forEach(track => track.stop());
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Microphone access failed. Please check browser permissions.',
        timestamp: new Date()
      }]);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`glass-card border-2 border-purple-500/30 ${isMinimized ? 'max-w-md h-20' : 'max-w-4xl max-h-[85vh]'} p-0 overflow-hidden`}>
        <DialogHeader className="p-6 pb-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-600 to-purple-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-xl" style={{ fontFamily: 'var(--font-heading)' }}>
                  AI Advisory Assistant
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Chat with your AI Advisory Assistant for startup guidance and support
                </DialogDescription>
                {startupContext && (
                  <Badge className="bg-white/20 text-white mt-1">
                    Discussing: {startupContext.name}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-white/20"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {!isMinimized && (
          <>
            {/* Quick Actions */}
            {messages.length <= 1 && (
              <div className="px-6 pt-4 pb-2">
                <p className="text-sm text-muted-foreground mb-3" style={{ fontFamily: 'var(--font-body)' }}>
                  Quick actions:
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Button
                        key={action.label}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSend(action.prompt)}
                        className="hover:bg-purple-50 hover:border-purple-300 dark:hover:bg-purple-900/20"
                      >
                        <Icon className="mr-2 h-3 w-3" />
                        {action.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 p-6 overflow-hidden">
              <ScrollArea className="h-[400px]">
                <div className="space-y-4" ref={scrollRef}>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className={message.role === 'user' ? 'bg-[#76B947]/20 text-[#76B947]' : 'bg-purple-100 text-purple-600'}>
                            {message.role === 'user' ? 'U' : <Sparkles className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`rounded-2xl px-4 py-3 ${
                              message.role === 'user'
                                ? 'bg-[#76B947] text-white'
                                : 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border border-purple-200 dark:border-purple-700'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap" style={{ fontFamily: 'var(--font-body)' }}>
                              {renderFormattedText(message.content)}
                            </p>
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
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-purple-100 text-purple-600">
                          <Sparkles className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border border-purple-200 dark:border-purple-700 rounded-2xl px-4 py-3">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Input */}
            <div className="p-6 pt-4 border-t border-purple-500/20 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                <Input
                  placeholder="Founder profile context (sector, stage, constraints)"
                  value={founderProfile}
                  onChange={(e) => setFounderProfile(e.target.value)}
                  className="border-purple-300 focus:border-purple-500 dark:bg-gray-800 dark:border-purple-700"
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={mode === 'production' ? 'default' : 'outline'}
                    onClick={() => setMode('production')}
                    className="flex-1"
                  >
                    Production
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={mode === 'research' ? 'default' : 'outline'}
                    onClick={() => setMode('research')}
                    className="flex-1"
                  >
                    Research
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.docx,.csv"
                    className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <span className="inline-flex">
                    <Button type="button" variant="outline" size="icon" className="border-purple-300">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </span>
                </label>
                <Input
                  placeholder="Ask me anything about your startup..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1 border-purple-300 focus:border-purple-500 dark:bg-gray-800 dark:border-purple-700"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="border-purple-300"
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? <StopCircle className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={() => handleSend()}
                  disabled={!inputText.trim() || isTyping}
                  className="bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:from-purple-700 hover:to-purple-900"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {selectedFile && (
                <p className="text-xs text-muted-foreground mt-2" style={{ fontFamily: 'var(--font-body)' }}>
                  Upload selected: {selectedFile.name}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2 text-center" style={{ fontFamily: 'var(--font-body)' }}>
                Powered by Uruti AI • Advisory support, not legal/financial advice
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}