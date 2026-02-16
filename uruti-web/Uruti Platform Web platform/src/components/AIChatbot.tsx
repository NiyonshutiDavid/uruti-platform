import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Send, Sparkles, X, Lightbulb, TrendingUp, Target, Users, DollarSign, Minimize2, Maximize2 } from 'lucide-react';

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
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const handleSend = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(messageText, startupContext);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (userMessage: string, context?: { name: string; description: string }) => {
    const lower = userMessage.toLowerCase();
    
    if (lower.includes('refine') || lower.includes('improve')) {
      return context 
        ? `Great! Let's refine **${context.name}**. Here are key areas to focus on:\n\n**1. Value Proposition**\n• Clearly articulate the unique problem you solve\n• Emphasize your differentiation from competitors\n\n**2. Target Market**\n• Define your ideal customer profile more specifically\n• Quantify your addressable market size\n\n**3. Business Model**\n• Clarify how you'll generate revenue\n• Outline your pricing strategy\n\n**4. Traction & Milestones**\n• Set measurable KPIs for the next 6 months\n• Identify quick wins to prove concept\n\nWhich area would you like to dive deeper into?`
        : `I'd be happy to help refine your startup idea! To give you the best advice, could you tell me:\n\n1. What problem are you solving?\n2. Who are your target customers?\n3. What's your unique solution?\n\nShare these details and I'll provide specific refinement strategies.`;
    }
    
    if (lower.includes('market') || lower.includes('competition')) {
      return `**Market Analysis for ${context?.name || 'Your Startup'}**\n\n**Rwanda Market Context:**\n• Growing tech ecosystem with government support\n• Young, mobile-first population (70% under 30)\n• Increasing internet penetration (65%+)\n\n**Key Considerations:**\n\n**1. Market Size**\n• Total Addressable Market (TAM)\n• Serviceable Available Market (SAM)\n• Serviceable Obtainable Market (SOM)\n\n**2. Competition**\n• Direct competitors analysis\n• Indirect alternatives\n• Your competitive advantages\n\n**3. Market Trends**\n• Digital transformation acceleration\n• Mobile money adoption\n• Growing middle class\n\nWould you like me to help you size your specific market opportunity?`;
    }
    
    if (lower.includes('go-to-market') || lower.includes('gtm') || lower.includes('launch')) {
      return `**Go-to-Market Strategy Framework**\n\n**Phase 1: Early Traction (Months 1-3)**\n• Identify 10-20 ideal early adopters\n• Conduct problem interviews\n• Develop MVP with core features\n• Launch beta with selected users\n\n**Phase 2: Market Validation (Months 4-6)**\n• Refine product based on feedback\n• Build case studies with early wins\n• Develop referral program\n• Test pricing models\n\n**Phase 3: Growth (Months 7-12)**\n• Scale proven channels\n• Build partnerships\n• Hire key team members\n• Secure seed funding\n\n**Distribution Channels for Rwanda:**\n• Mobile-first approach\n• Community partnerships\n• Social media (especially WhatsApp)\n• Local tech events and meetups\n\nWhich phase are you currently in?`;
    }
    
    if (lower.includes('target') || lower.includes('customer') || lower.includes('audience')) {
      return `**Defining Your Target Customer**\n\n**Customer Persona Framework:**\n\n**Demographics:**\n• Age range, gender, location\n• Income level, education\n• Occupation and industry\n\n**Psychographics:**\n• Pain points and challenges\n• Goals and aspirations\n• Buying behavior\n• Technology adoption\n\n**Rwanda-Specific Insights:**\n• Urban vs rural considerations\n• Language preferences (Kinyarwanda, English, French)\n• Mobile money usage patterns\n• Community influence on decisions\n\n**Customer Segmentation:**\n1. **Early Adopters** - Tech-savvy, willing to try new solutions\n2. **Pragmatists** - Need proven value before buying\n3. **Conservatives** - Require social proof and recommendations\n\nStart with Early Adopters to gain traction! Who do you think would be most excited about ${context?.name || 'your solution'}?`;
    }
    
    if (lower.includes('revenue') || lower.includes('pricing') || lower.includes('monetization')) {
      return `**Revenue Model Options for ${context?.name || 'Your Startup'}**\n\n**Common Models in African Tech:**\n\n**1. Subscription (SaaS)**\n• Monthly/annual recurring revenue\n• Tiered pricing (Basic, Pro, Enterprise)\n• Best for: B2B software, platforms\n\n**2. Transaction Fees**\n• % of each transaction processed\n• Best for: Marketplaces, fintech, payments\n\n**3. Freemium**\n• Free basic tier + paid premium features\n• Best for: High-volume user acquisition\n\n**4. Usage-Based**\n• Pay per use, API calls, or credits\n• Best for: Infrastructure, data services\n\n**5. Commission Model**\n• % from connecting buyers/sellers\n• Best for: Marketplaces, service platforms\n\n**Rwanda Pricing Considerations:**\n• Mobile money integration is essential\n• Consider local purchasing power\n• Flexible payment terms (weekly, bi-weekly)\n• Micro-transactions work well\n\nWhat type of business model fits your startup best?`;
    }
    
    if (lower.includes('pitch') || lower.includes('investor')) {
      return `**Pitch Preparation Guide**\n\n**Perfect Pitch Structure (3 minutes):**\n\n**1. The Hook (30 sec)**\n• Compelling problem statement\n• Emotional connection\n\n**2. The Solution (45 sec)**\n• Your unique approach\n• How it works\n• Key differentiators\n\n**3. Market Opportunity (30 sec)**\n• Market size (TAM/SAM/SOM)\n• Why now?\n\n**4. Traction (30 sec)**\n• Key metrics and growth\n• Customer testimonials\n\n**5. Business Model (15 sec)**\n• How you make money\n• Unit economics\n\n**6. Team (15 sec)**\n• Why you're the right team\n• Key expertise\n\n**7. The Ask (15 sec)**\n• Funding amount\n• Use of funds\n• Key milestones\n\n**Tips:**\n• Practice until it's conversational\n• Use storytelling, not jargon\n• Show passion and confidence\n• Anticipate tough questions\n\nWould you like to practice your pitch with me?`;
    }
    
    // Default response
    return `I'm here to help you succeed! I can assist with:\n\n✨ **Strategy & Planning**\n• Refining your startup idea\n• Market analysis and sizing\n• Go-to-market strategies\n\n💡 **Business Development**\n• Revenue model design\n• Customer acquisition\n• Pricing strategies\n\n📊 **Investment Readiness**\n• Pitch deck feedback\n• Financial projections\n• Investor relations\n\n🎯 **Execution**\n• Milestone planning\n• KPI tracking\n• Team building\n\nWhat specific challenge are you facing right now?`;
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
                              {message.content}
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
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Ask me anything about your startup..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1 border-purple-300 focus:border-purple-500 dark:bg-gray-800 dark:border-purple-700"
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!inputText.trim() || isTyping}
                  className="bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:from-purple-700 hover:to-purple-900"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center" style={{ fontFamily: 'var(--font-body)' }}>
                Powered by Uruti AI • Your conversations are private and secure
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}