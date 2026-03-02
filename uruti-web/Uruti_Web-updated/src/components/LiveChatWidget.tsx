import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  MessageSquare,
  X,
  Send,
  Minimize2,
  Maximize2,
  Trash2
} from 'lucide-react';
import { useSupport } from '../lib/support-context';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';

interface LiveChatWidgetProps {
  onNavigate?: (page: string) => void;
}

const CHAT_STORAGE_KEY = 'uruti_live_chat_state';

export function LiveChatWidget({ onNavigate }: LiveChatWidgetProps) {
  const { sendMessage, getVisitorMessages } = useSupport();
  
  // Load persisted state from localStorage
  const loadPersistedState = () => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading chat state:', error);
    }
    return null;
  };

  const persistedState = loadPersistedState();

  const [isChatOpen, setIsChatOpen] = useState(persistedState?.isChatOpen || false);
  const [isChatMinimized, setIsChatMinimized] = useState(persistedState?.isChatMinimized || false);
  const [chatStarted, setChatStarted] = useState(persistedState?.chatStarted || false);
  const [visitorEmail, setVisitorEmail] = useState(persistedState?.visitorEmail || '');
  const [visitorName, setVisitorName] = useState(persistedState?.visitorName || '');
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{
    id: number;
    sender: 'visitor' | 'admin';
    text: string;
    timestamp: string;
    supportMessageId?: number;
    hasButton?: boolean;
    buttonText?: string;
    buttonAction?: () => void;
  }>>(() => {
    // Restore messages and recreate button actions if needed
    if (persistedState?.chatMessages) {
      return persistedState.chatMessages.map((msg: any) => {
        if (msg.hasButton && msg.buttonText === 'Visit Help Center' && onNavigate) {
          return {
            ...msg,
            buttonAction: () => onNavigate('/help-center')
          };
        }
        return msg;
      });
    }
    return [];
  });
  const chatEndRef = useRef<HTMLDivElement>(null);
  const notifiedResponseIds = useRef<Set<number>>(new Set());

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    const stateToSave = {
      isChatOpen,
      isChatMinimized,
      chatStarted,
      visitorEmail,
      visitorName,
      chatMessages: chatMessages.map(msg => ({
        ...msg,
        // Don't persist button actions as functions can't be serialized
        buttonAction: undefined
      }))
    };
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(stateToSave));
  }, [isChatOpen, isChatMinimized, chatStarted, visitorEmail, visitorName, chatMessages]);

  // Poll backend for support conversation updates
  useEffect(() => {
    if (!chatStarted || !visitorEmail.trim()) return;

    const syncConversation = async () => {
      try {
        const supportMessages = await getVisitorMessages(visitorEmail);

        setChatMessages((prev) => {
          const next = [...prev];

          for (const msg of supportMessages.reverse()) {
            const hasVisitorBubble = next.some(
              (m) => m.sender === 'visitor' && m.supportMessageId === msg.id
            );
            if (!hasVisitorBubble) {
              next.push({
                id: Date.now() + msg.id,
                sender: 'visitor',
                text: msg.message,
                timestamp: msg.created_at,
                supportMessageId: msg.id,
              });
            }

            if (msg.response) {
              const hasAdminBubble = next.some(
                (m) =>
                  m.sender === 'admin' &&
                  m.supportMessageId === msg.id &&
                  m.text === msg.response
              );
              if (!hasAdminBubble) {
                if (!notifiedResponseIds.current.has(msg.id)) {
                  toast.info('New reply from Uruti Support');
                  notifiedResponseIds.current.add(msg.id);
                }
                next.push({
                  id: Date.now() + msg.id + 100000,
                  sender: 'admin',
                  text: msg.response,
                  timestamp: msg.responded_at || new Date().toISOString(),
                  supportMessageId: msg.id,
                });
              }
            }
          }

          return next;
        });
      } catch (error) {
        console.error('Error syncing support conversation:', error);
      }
    };

    syncConversation();
    const interval = setInterval(syncConversation, 5000);
    return () => clearInterval(interval);
  }, [chatStarted, visitorEmail, getVisitorMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleStartChat = () => {
    if (visitorName.trim() && visitorEmail.trim()) {
      setChatStarted(true);
      setChatMessages([{
        id: Date.now(),
        sender: 'admin',
        text: `Hello ${visitorName}! Welcome to Uruti support. How can we help you today?`,
        timestamp: new Date().toISOString()
      }]);
      
      // Add help center recommendation after 3 seconds
      if (onNavigate) {
        setTimeout(() => {
          setChatMessages(prev => [...prev, {
            id: Date.now() + 1,
            sender: 'admin',
            text: 'While you wait for a response, feel free to check out our Help Center for instant answers to common questions.',
            timestamp: new Date().toISOString(),
            hasButton: true,
            buttonText: 'Visit Help Center',
            buttonAction: () => onNavigate('/help-center')
          }]);
        }, 3000);
      }
    }
  };

  const handleSendMessage = async () => {
    if (currentMessage.trim() && chatStarted) {
      const sent = await sendMessage(visitorName, visitorEmail, currentMessage);

      setChatMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'visitor',
        text: sent.message,
        timestamp: sent.created_at,
        supportMessageId: sent.id,
      }]);

      setCurrentMessage('');
    }
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setIsChatMinimized(false);
  };

  const handleEndChat = () => {
    if (confirm('Are you sure you want to end this chat? Your conversation history will be cleared.')) {
      // Clear all chat state
      setIsChatOpen(false);
      setIsChatMinimized(false);
      setChatStarted(false);
      setVisitorEmail('');
      setVisitorName('');
      setChatMessages([]);
      notifiedResponseIds.current.clear();
      
      // Clear localStorage
      localStorage.removeItem(CHAT_STORAGE_KEY);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isChatOpen && (
        <Button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-[#76B947] text-white hover:bg-[#5a8f35] shadow-2xl transition-all duration-300 hover:scale-110"
          aria-label="Open live chat"
        >
          <MessageSquare className="h-7 w-7" />
        </Button>
      )}

      {/* Chat Widget */}
      {isChatOpen && (
        <div className={`fixed right-6 bottom-6 z-50 transition-all duration-300 ${
          isChatMinimized ? 'w-80' : 'w-96'
        }`}>
          <Card className="glass-card border-black/5 dark:border-white/10 shadow-2xl">
            <CardContent className="p-0">
              {/* Chat Header */}
              <div className="bg-[#76B947] text-white p-4 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                      Uruti Support
                    </h3>
                    <p className="text-xs opacity-90" style={{ fontFamily: 'var(--font-body)' }}>
                      We typically reply in minutes
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsChatMinimized(!isChatMinimized)}
                    className="text-white hover:bg-white/20"
                    title={isChatMinimized ? "Maximize" : "Minimize"}
                  >
                    {isChatMinimized ? (
                      <Maximize2 className="h-4 w-4" />
                    ) : (
                      <Minimize2 className="h-4 w-4" />
                    )}
                  </Button>
                  {chatStarted && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEndChat}
                      className="text-white hover:bg-white/20"
                      title="End chat and clear conversation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCloseChat}
                    className="text-white hover:bg-white/20"
                    title="Close chat"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {!isChatMinimized && (
                <>
                  {!chatStarted ? (
                    /* Chat Intro */
                    <div className="p-6 space-y-4">
                      <div className="text-center mb-6">
                        <h4 className="text-lg font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                          Welcome to Uruti Support
                        </h4>
                        <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                          Please introduce yourself to get started
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="chat-name" style={{ fontFamily: 'var(--font-body)' }}>
                          Your Name
                        </Label>
                        <Input
                          id="chat-name"
                          placeholder="John Doe"
                          value={visitorName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVisitorName(e.target.value)}
                          className="glass-card border-black/10 dark:border-white/10"
                          style={{ fontFamily: 'var(--font-body)' }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="chat-email" style={{ fontFamily: 'var(--font-body)' }}>
                          Email Address
                        </Label>
                        <Input
                          id="chat-email"
                          type="email"
                          placeholder="john@example.com"
                          value={visitorEmail}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVisitorEmail(e.target.value)}
                          className="glass-card border-black/10 dark:border-white/10"
                          style={{ fontFamily: 'var(--font-body)' }}
                        />
                      </div>

                      <Button
                        onClick={handleStartChat}
                        disabled={!visitorName.trim() || !visitorEmail.trim()}
                        className="w-full bg-[#76B947] text-white hover:bg-[#76B947]/90"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        Start Chat
                      </Button>
                    </div>
                  ) : (
                    /* Chat Messages */
                    <>
                      <ScrollArea className="h-96 p-4">
                        <div className="space-y-4">
                          {chatMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.sender === 'visitor' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg p-3 ${
                                  msg.sender === 'visitor'
                                    ? 'bg-[#76B947] text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 dark:text-white'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap" style={{ fontFamily: 'var(--font-body)' }}>
                                  {msg.text}
                                </p>
                                <p className="text-xs opacity-70 mt-1" style={{ fontFamily: 'var(--font-body)' }}>
                                  {new Date(msg.timestamp).toLocaleTimeString()}
                                </p>
                                {msg.hasButton && (
                                  <Button
                                    onClick={msg.buttonAction}
                                    className={`mt-3 w-full ${
                                      msg.sender === 'visitor'
                                        ? 'bg-white text-[#76B947] hover:bg-gray-100'
                                        : 'bg-[#76B947] text-white hover:bg-[#5a8f35]'
                                    }`}
                                    style={{ fontFamily: 'var(--font-body)' }}
                                  >
                                    {msg.buttonText}
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                          <div ref={chatEndRef} />
                        </div>
                      </ScrollArea>

                      {/* Message Input */}
                      <div className="p-4 border-t border-black/5 dark:border-white/10">
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Type your message..."
                            value={currentMessage}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentMessage(e.target.value)}
                            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSendMessage()}
                            className="glass-card border-black/10 dark:border-white/10"
                            style={{ fontFamily: 'var(--font-body)' }}
                          />
                          <Button
                            onClick={handleSendMessage}
                            disabled={!currentMessage.trim()}
                            className="bg-[#76B947] text-white hover:bg-[#76B947]/90"
                          >
                            <Send className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
