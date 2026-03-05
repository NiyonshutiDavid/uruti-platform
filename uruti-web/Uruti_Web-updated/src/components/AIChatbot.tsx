import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send, Sparkles, X, Lightbulb, TrendingUp, Target, Users, DollarSign, Minimize2, Maximize2, Upload, Mic, StopCircle, ChevronDown, Plus, Settings2 } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
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

const modelOptions = [
  { id: 'production', label: 'Standard', description: 'Answers quickly' },
  { id: 'research', label: 'Research Mode', description: 'Thinks through complex topics' },
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
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showProfileInput, setShowProfileInput] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (open && messages.length === 0) {
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

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
        ? await apiClient.chatFile({ user_query: messageText, founder_profile: founderProfile || undefined, mode, file: selectedFile })
        : await apiClient.chatText({ user_query: messageText, founder_profile: founderProfile || undefined, mode });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: formatAdvisory(response),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setSelectedFile(null);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I couldn't process that request: ${error?.message || 'Unknown error'}`,
        timestamp: new Date()
      }]);
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
        if (event.data.size > 0) chunks.push(event.data);
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

          setMessages(prev => [...prev,
            { id: Date.now().toString(), role: 'user', content: '[Audio message submitted]', timestamp: new Date() },
            { id: (Date.now() + 1).toString(), role: 'assistant', content: formatAdvisory(response), timestamp: new Date() }
          ]);
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

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const currentModel = modelOptions.find(m => m.id === mode) || modelOptions[0];
  const isEmptyState = messages.length <= 1;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={`bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-2xl rounded-2xl
          ${isMinimized ? 'max-w-sm h-16' : 'max-w-3xl h-[90vh]'} p-0 overflow-hidden flex flex-col`}
      >
        {/* Header — minimal top bar */}
        <DialogHeader className="flex-shrink-0 px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <DialogTitle className="text-gray-800 dark:text-gray-100 text-base font-semibold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              AI Advisory
            </DialogTitle>
            <DialogDescription className="sr-only">
              Chat with your AI Advisory Assistant for startup guidance and support
            </DialogDescription>
            {startupContext && (
              <Badge className="bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700 text-xs font-normal ml-1">
                {startupContext.name}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 h-8 w-8 p-0 rounded-full"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 h-8 w-8 p-0 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {!isMinimized && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Empty state greeting */}
            {isEmptyState && (
              <div className="flex-shrink-0 flex flex-col items-center justify-center pt-10 pb-4 px-6 text-center">
                <h2 className="text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  Hello,
                </h2>
                <p className="text-gray-400 dark:text-gray-500 text-sm">What would you like to explore today?</p>
              </div>
            )}

            {/* Messages area (only shown after first exchange) */}
            {!isEmptyState && (
              <div className="flex-1 overflow-y-auto px-4 pt-4 min-h-0">
                <div className="space-y-5 pr-2 pb-2" ref={scrollRef}>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.role === 'assistant' && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Sparkles className="h-3.5 w-3.5 text-white" />
                          </div>
                        )}
                        <div className={`flex flex-col max-w-[75%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                              message.role === 'user'
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-br-sm'
                                : 'bg-transparent text-gray-800 dark:text-gray-200'
                            }`}
                          >
                            <p className="whitespace-pre-wrap" style={{ fontFamily: 'var(--font-body)' }}>
                              {renderFormattedText(message.content)}
                            </p>
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1 px-1" style={{ fontFamily: 'var(--font-body)' }}>
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                        {message.role === 'user' && (
                          <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
                            <AvatarFallback className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold">
                              U
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div className="flex items-center gap-1 px-4 py-3">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Prompt input area — always pinned to bottom */}
            <div className={`flex-shrink-0 px-4 sm:px-6 ${isEmptyState ? 'pb-6' : 'pb-4 pt-2'}`}>
              {/* Founder profile toggle */}
              {showProfileInput && (
                <div className="mb-2">
                  <Input
                    placeholder="Founder profile context (sector, stage, constraints)"
                    value={founderProfile}
                    onChange={(e) => setFounderProfile(e.target.value)}
                    className="border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm rounded-xl h-9 focus:ring-1 focus:ring-purple-400"
                  />
                </div>
              )}

              {/* Main input card — Gemini style */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
                <div className="px-4 py-3">
                  <input
                    type="text"
                    placeholder="Enter a prompt for Uruti AI..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    className="w-full bg-transparent text-gray-800 dark:text-gray-200 text-sm outline-none placeholder-gray-400 dark:placeholder-gray-500"
                    style={{ fontFamily: 'var(--font-body)' }}
                  />
                </div>

                {selectedFile && (
                  <div className="px-4 pb-2">
                    <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full">
                      📎 {selectedFile.name}
                    </span>
                  </div>
                )}

                {/* Bottom toolbar */}
                <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-1">
                    {/* Attach */}
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.docx,.csv"
                        className="hidden"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-pointer transition-colors">
                        <Plus className="h-4 w-4" />
                      </span>
                    </label>

                    {/* Tools / profile context */}
                    <button
                      type="button"
                      onClick={() => setShowProfileInput(v => !v)}
                      className="flex items-center gap-1.5 px-3 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-medium transition-colors"
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                      <span>Context</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Model selector */}
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowModelDropdown(v => !v)}
                        className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium transition-colors"
                      >
                        <span>{currentModel.label}</span>
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>

                      {showModelDropdown && (
                        <div className="fixed inset-x-4 bottom-24 sm:absolute sm:inset-auto sm:bottom-full sm:right-0 sm:mb-2 sm:w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden z-50 max-h-[60vh] overflow-y-auto">
                          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Choose your model</p>
                          </div>
                          {modelOptions.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => { setMode(opt.id as 'production' | 'research'); setShowModelDropdown(false); }}
                              className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                                mode === opt.id ? 'bg-gray-50 dark:bg-gray-800/60' : ''
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 break-words">{opt.label}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 whitespace-normal break-words">{opt.description}</p>
                              </div>
                              {mode === opt.id && (
                                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Mic */}
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                        isRecording
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-500'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {isRecording ? <StopCircle className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>

                    {/* Send */}
                    <button
                      type="button"
                      onClick={() => handleSend()}
                      disabled={!inputText.trim() || isTyping}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 dark:bg-gray-200 hover:bg-gray-700 dark:hover:bg-gray-300 text-white dark:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick action chips */}
              {isEmptyState && (
                <div className="flex flex-wrap gap-2 mt-3 justify-center">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() => handleSend(action.prompt)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium transition-colors"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              )}

              <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-3 text-center" style={{ fontFamily: 'var(--font-body)' }}>
                Powered by Uruti AI • Advisory support, not legal/financial advice
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}