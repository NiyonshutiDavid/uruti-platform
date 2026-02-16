import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
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
  PieChart
} from 'lucide-react';

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

interface AIChatModuleProps {
  userType?: 'founder' | 'investor';
  startupContext?: { name: string; description: string };
  analysisContext?: any; // Full venture object for AI analysis
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

const aiModels = [
  { 
    id: 'ranker', 
    name: 'Uruti Ranker', 
    description: 'Best for giving Uruti score',
    color: 'from-amber-500 to-orange-600'
  },
  { 
    id: 'advisory', 
    name: 'Uruti Advisory', 
    description: 'Best for advisory and refining ideas',
    color: 'from-blue-500 to-indigo-600'
  },
  { 
    id: 'investor', 
    name: 'Uruti Investor', 
    description: 'Best for investor analyzing',
    color: 'from-purple-500 to-pink-600'
  },
];

// Mock startups for founders (all ventures)
const mockFounderStartups = [
  { id: '1', name: 'AgriConnect Rwanda', sector: 'AgriTech', urutiScore: 87, bookmarked: false },
  { id: '2', name: 'EduLearn Platform', sector: 'EdTech', urutiScore: 92, bookmarked: false },
  { id: '3', name: 'HealthHub', sector: 'HealthTech', urutiScore: 78, bookmarked: false },
  { id: '4', name: 'FinFlow', sector: 'FinTech', urutiScore: 85, bookmarked: false },
];

// Mock bookmarked startups for investors (only bookmarked ventures)
const mockInvestorStartups = [
  { id: '1', name: 'AgriConnect Rwanda', sector: 'AgriTech', urutiScore: 78, bookmarked: true },
  { id: '2', name: 'HealthBridge Africa', sector: 'HealthTech', urutiScore: 85, bookmarked: true },
  { id: '3', name: 'EduLearn Platform', sector: 'EdTech', urutiScore: 72, bookmarked: true },
];

export function AIChatModule({ userType = 'founder', startupContext, analysisContext }: AIChatModuleProps) {
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([
    {
      id: '1',
      title: userType === 'founder' ? 'Market Analysis Discussion' : 'AgriConnect Investment Review',
      lastMessage: userType === 'founder' ? 'The Rwanda market shows strong potential...' : 'Strong market fit with competitive advantages...',
      timestamp: new Date(Date.now() - 3600000),
      unread: false,
    },
    {
      id: '2',
      title: userType === 'founder' ? 'AgriConnect Refinement' : 'Portfolio Diversification',
      lastMessage: userType === 'founder' ? 'Let\'s focus on your value proposition...' : 'Adding AgTech aligns with your thesis...',
      timestamp: new Date(Date.now() - 86400000),
      unread: true,
      startup: { name: 'AgriConnect Rwanda', sector: 'AgTech' }
    },
    {
      id: '3',
      title: userType === 'founder' ? 'Revenue Model Strategy' : 'Valuation Analysis',
      lastMessage: userType === 'founder' ? 'For your SaaS model, consider tiered pricing...' : 'Comparable startups in the region are valued at...',
      timestamp: new Date(Date.now() - 172800000),
      unread: false,
    },
  ]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedStartup, setSelectedStartup] = useState<typeof mockFounderStartups[0] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(aiModels[1]); // Default to Advisory
  const [modelSelectOpen, setModelSelectOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quickActions = userType === 'founder' ? founderQuickActions : investorQuickActions;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle startup context from external navigation (e.g., "Refine with AI" button)
  useEffect(() => {
    if (startupContext && messages.length === 0) {
      // Set up the startup context automatically
      const contextStartup = {
        id: 'context',
        name: startupContext.name,
        sector: 'Context',
        urutiScore: 0
      };
      setSelectedStartup(contextStartup);
      
      // Start a new chat with context
      setCurrentChatId(null);
      
      // Add initial greeting
      const greeting = `Hi! I'm your AI Advisory Assistant. I see you want to refine **${startupContext.name}**. Let me help you with that!`;
      
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: greeting,
          timestamp: new Date()
        }
      ]);
      
      // Automatically send the refinement request
      setTimeout(() => {
        const userMessage: Message = {
          id: '2',
          role: 'user',
          content: `Help me refine this startup idea:\n\n**${startupContext.name}**\n${startupContext.description}`,
          timestamp: new Date(),
          startup: { name: startupContext.name, sector: 'Context' }
        };
        
        setMessages(prev => [...prev, userMessage]);
        setIsTyping(true);
        
        // Generate AI response
        setTimeout(() => {
          const aiResponse = `Great! Let's refine **${startupContext.name}**. Based on your description, here are key areas to focus on:\n\n**1. Value Proposition Clarity**\n• Clearly articulate the unique problem you solve\n• Emphasize your differentiation from competitors in the Rwandan market\n\n**2. Target Market Definition**\n• Define your ideal customer profile more specifically\n• Quantify your addressable market size in Rwanda and East Africa\n\n**3. Business Model Development**\n• Clarify how you'll generate revenue\n• Outline your pricing strategy for the local market\n\n**4. Traction & Milestones**\n• Set measurable KPIs for the next 6 months\n• Identify quick wins to prove concept\n\n**5. Local Context Integration**\n• Address Rwanda-specific challenges and opportunities\n• Leverage local partnerships and infrastructure\n\n**💡 Pro Tip:** After refining, submit for Uruti Score analysis to get publicly ranked and attract investor attention!\n\n**🎯 Next Steps:**\n• Which specific area would you like to dive deeper into?\n• Do you have any specific questions about your value proposition?\n• Would you like help with market sizing or competitor analysis?\n\nLet me know what you'd like to focus on first!`;
          
          const assistantMessage: Message = {
            id: '3',
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
          setIsTyping(false);
        }, 1500);
      }, 500);
    }
  }, [startupContext]);

  // Handle AI analysis context for investors (from "Analyze with AI" button)
  useEffect(() => {
    if (analysisContext && userType === 'investor') {
      // Set up the venture context
      const contextStartup = {
        id: analysisContext.id || 'analysis',
        name: analysisContext.name,
        sector: analysisContext.sector,
        urutiScore: analysisContext.urutiScore
      };
      setSelectedStartup(contextStartup);
      
      // Start a new chat with analysis
      setCurrentChatId(null);
      setMessages([]);
      
      // Add initial greeting
      const greeting = `Hi! I'm analyzing **${analysisContext.name}** for you. Let me provide a comprehensive investment analysis.`;
      
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: greeting,
          timestamp: new Date()
        }
      ]);
      
      // Automatically send the analysis request
      setTimeout(() => {
        const userMessage: Message = {
          id: '2',
          role: 'user',
          content: `Analyze the investment potential of ${analysisContext.name}`,
          timestamp: new Date(),
          startup: { name: analysisContext.name, sector: analysisContext.sector }
        };
        
        setMessages(prev => [...prev, userMessage]);
        setIsTyping(true);
        
        // Generate comprehensive AI analysis
        setTimeout(() => {
          const getScoreRating = (score: number) => {
            if (score >= 85) return { label: 'Excellent', color: '🟢', desc: 'Strong investment opportunity' };
            if (score >= 75) return { label: 'Very Good', color: '🔵', desc: 'High-potential investment' };
            if (score >= 65) return { label: 'Good', color: '🟡', desc: 'Solid investment prospect' };
            return { label: 'Developing', color: '🟠', desc: 'Emerging opportunity' };
          };
          
          const scoreRating = getScoreRating(analysisContext.urutiScore);
          
          const aiResponse = `**🎯 Investment Analysis: ${analysisContext.name}**

**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**

**📊 URUTI SCORE: ${analysisContext.urutiScore}/100** ${scoreRating.color}
*Rating: ${scoreRating.label}* - ${scoreRating.desc}

**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**

**💼 Executive Summary**

${analysisContext.name} is a ${analysisContext.stage} stage ${analysisContext.sector} startup operating in ${analysisContext.location}. ${analysisContext.tagline}

**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**

**✨ Key Strengths**

• **Strong Product-Market Fit**: ${analysisContext.highlights[0]}
• **Impressive Traction**: ${analysisContext.highlights[1]}
• **Funding Success**: ${analysisContext.highlights[2]}
• **Recognition**: ${analysisContext.highlights[3] || 'Growing market presence'}

**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**

**📈 Traction Metrics**

• **Active Users**: ${analysisContext.activeUsers.toLocaleString()}+ users
• **Monthly Growth**: ${analysisContext.monthlyGrowth}% MoM
• **Funding Raised**: ${analysisContext.fundingRaised} to date
• **Team Size**: ${analysisContext.teamSize} strong

**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**

**🎯 Problem & Solution Analysis**

**Problem Being Solved:**
${analysisContext.problem}

**Solution Approach:**
${analysisContext.solution}

**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**

**🏆 Competitive Advantage**

${analysisContext.competitiveEdge}

**Key Differentiators:**
• Rwanda-market expertise and local partnerships
• Technology built for local infrastructure
• Strong execution track record (${analysisContext.monthlyGrowth}% MoM growth)
• Experienced founding team with domain knowledge

**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**

**💰 Market Opportunity**

**Target Market:**
${analysisContext.targetMarket}

**Market Size Estimate:**
• Rwanda ${analysisContext.sector} Market: $50M+ addressable
• East Africa Regional Market: $250M+ potential
• Growth Rate: 15-20% CAGR over next 5 years

**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**

**👥 Team Assessment**

${analysisContext.teamBackground}

**Team Strengths:**
• Industry experience and domain expertise
• Technical capability demonstrated through product
• Execution proven by ${analysisContext.monthlyGrowth}% monthly growth
• Network in Rwanda's entrepreneurship ecosystem

**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**

**📊 Investment Highlights**

• **Stage**: ${analysisContext.stage} - Appropriate for early-stage investors
• **Valuation**: Fair for current traction and market position
• **Unit Economics**: Strong indicators based on growth metrics
• **Path to Profitability**: ${analysisContext.stage === 'Seed' || analysisContext.stage === 'Growth' ? 'Clear within 18-24 months' : 'Being established through MVP validation'}
• **Exit Potential**: Strategic acquisition target for regional tech players

**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**

**⚠️ Risk Factors**

1. **Market Risk** (Medium): Rwanda market size requires regional expansion for scale
2. **Competition Risk** (Low-Medium): Local focus provides moat, but international players could enter
3. **Execution Risk** (Low): Strong track record mitigates this risk
4. **Regulatory Risk** (Low): Operating in supported ${analysisContext.sector} sector in Rwanda

**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**

**🎯 Investment Recommendation**

**Recommended Action**: ${analysisContext.urutiScore >= 75 ? '✅ **STRONG BUY** - High-confidence investment opportunity' : '⚡ **CONSIDER** - Solid opportunity with growth potential'}

**Suggested Next Steps:**
1. Schedule deep-dive due diligence session with founders
2. Review detailed financials and unit economics
3. Conduct customer/user interviews
4. Assess technical infrastructure and IP
5. Review cap table and existing investor syndicate

**Investment Thesis:**
${analysisContext.name} represents a ${analysisContext.urutiScore >= 75 ? 'strong' : 'promising'} investment opportunity in Rwanda's growing ${analysisContext.sector} sector. The combination of proven traction (${analysisContext.monthlyGrowth}% MoM growth), experienced team, and clear competitive advantages positions this startup well for success. The Uruti Score of ${analysisContext.urutiScore}/100 reflects ${scoreRating.label.toLowerCase()} fundamentals across key investment criteria.

**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**

**💡 Questions for Further Discussion:**

1. What are the specific use of funds for the ${analysisContext.fundingPlans.includes('Seeking') ? analysisContext.fundingPlans.split('Seeking')[1].split('for')[0] : 'current round'}?
2. What is the customer acquisition cost (CAC) and lifetime value (LTV)?
3. What are the plans for regional expansion beyond Rwanda?
4. Who are the key competitors and what is the competitive moat?
5. What are the key milestones for the next 12 months?

**Would you like me to dive deeper into any specific area of this analysis?**`;
          
          const assistantMessage: Message = {
            id: '3',
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
          setIsTyping(false);
        }, 2000);
      }, 500);
    }
  }, [analysisContext, userType]);

  useEffect(() => {
    if (messages.length === 0 && !currentChatId) {
      // Initial greeting for new chat
      const founderGreeting = `Hi! I'm your AI Advisory Assistant powered by Uruti's intelligence engine. I'm here to help you with:\n\n• Refining your startup ideas\n• Market analysis and validation\n• Go-to-market strategies\n• Pitch preparation\n• Investment readiness\n\nWhat would you like to explore today?`;

      const investorGreeting = `Hi! I'm your AI Investment Assistant powered by Uruti's intelligence engine. I'm here to help you with:\n\n• Analyzing startup investment potential\n• Due diligence insights\n• Market opportunity assessment\n• Risk evaluation\n• Portfolio fit analysis\n\nWhich startup would you like to discuss today?`;
      
      setMessages([{
        id: '1',
        role: 'assistant',
        content: userType === 'founder' ? founderGreeting : investorGreeting,
        timestamp: new Date()
      }]);
    }
  }, [currentChatId, userType]);

  const handleSend = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText && attachments.length === 0) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText || 'Shared attachments',
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
      startup: selectedStartup || undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setAttachments([]);
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(messageText, selectedStartup, userType);
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

  const generateAIResponse = (userMessage: string, startup?: typeof mockFounderStartups[0] | null, type?: string) => {
    const lower = userMessage.toLowerCase();
    
    if (type === 'investor') {
      if (lower.includes('investment') || lower.includes('potential')) {
        return startup 
          ? `**Investment Analysis: ${startup.name}**\n\n**🎯 Uruti Score: ${startup.urutiScore}/100**\n\n**Key Strengths:**\n• Strong product-market fit in Rwanda's growing ${startup.sector} sector\n• Experienced founding team with domain expertise\n• Clear path to profitability within 18-24 months\n• Strategic partnerships with key market players\n\n**Investment Highlights:**\n• Addressable market: $50M+ in East Africa\n• Current traction: 15% MoM growth\n• Unit economics: Strong LTV/CAC ratio of 4.2x\n\n**Recommended Action:** High-potential investment opportunity. Suggest deeper due diligence on technical infrastructure and competitive moat.\n\nWould you like me to dive deeper into any specific area?`
          : `I'd be happy to analyze a startup's investment potential. Please select a startup from the context menu or share the startup details, and I'll provide:\n\n1. Market opportunity assessment\n2. Team evaluation\n3. Traction analysis\n4. Risk factors\n5. Valuation perspective\n\nWhich startup interests you?`;
      }
      
      return `As your investment advisor, I can help you with:\n\n💼 **Due Diligence**\n• Market analysis and sizing\n• Competitive landscape review\n• Financial model assessment\n\n📊 **Portfolio Strategy**\n• Sector diversification analysis\n• Stage allocation optimization\n• Risk-return balance\n\n🎯 **Deal Evaluation**\n• Valuation benchmarking\n• Term sheet review\n• Exit potential analysis\n\nWhat would you like to explore?`;
    }
    
    // Founder responses
    if (lower.includes('refine') || lower.includes('improve')) {
      return startup 
        ? `Great! Let's refine **${startup.name}** in the ${startup.sector} sector. Here are key areas to focus on:\n\n**1. Value Proposition**\n• Clearly articulate the unique problem you solve\n• Emphasize your differentiation from competitors\n\n**2. Target Market**\n• Define your ideal customer profile more specifically\n• Quantify your addressable market size\n\n**3. Business Model**\n• Clarify how you'll generate revenue\n• Outline your pricing strategy\n\n**4. Traction & Milestones**\n• Set measurable KPIs for the next 6 months\n• Identify quick wins to prove concept\n\n**💡 Pro Tip:** Submit for Uruti Score to get ranked publicly and attract investor attention!\n\nWhich area would you like to dive deeper into?`
        : `I'd be happy to help refine your startup idea! To give you the best advice, could you tell me:\n\n1. What problem are you solving?\n2. Who are your target customers?\n3. What's your unique solution?\n\nShare these details and I'll provide specific refinement strategies.`;
    }
    
    // Default response
    return `I'm here to help you succeed! I can assist with:\n\n✨ **Strategy & Planning**\n• Refining your startup idea\n• Market analysis and sizing\n• Go-to-market strategies\n\n💡 **Business Development**\n• Revenue model design\n• Customer acquisition\n• Pricing strategies\n\n📊 **Investment Readiness**\n• Pitch deck feedback\n• Financial projections\n• Investor relations\n\n🎯 **Execution**\n• Milestone planning\n• KPI tracking\n• Team building\n\nWhat specific challenge are you facing right now?`;
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

  const handleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Start recording
      setTimeout(() => {
        setIsRecording(false);
        const audioAttachment: Attachment = {
          id: Date.now().toString(),
          name: 'Voice Recording',
          type: 'audio',
        };
        setAttachments(prev => [...prev, audioAttachment]);
      }, 3000);
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

  const loadChatHistory = (chatId: string) => {
    setCurrentChatId(chatId);
    const chat = chatHistories.find(c => c.id === chatId);
    if (chat?.startup) {
      setSelectedStartup(mockFounderStartups.find(s => s.name === chat.startup?.name) || null);
    }
    // In a real app, load messages from database
    setMessages([{
      id: '1',
      role: 'assistant',
      content: `Continuing our conversation about ${chat?.title}...`,
      timestamp: new Date()
    }]);
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

  return (
    <div className="flex h-full w-full overflow-hidden bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20 relative">
      {/* Chat History Sidebar - Fixed Position */}
      <aside 
        className={`border-r border-purple-200/50 dark:border-purple-500/20 flex flex-col transition-all duration-300 flex-shrink-0 h-full bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm ${
          sidebarCollapsed ? 'w-0 opacity-0' : 'w-80 opacity-100'
        }`}
      >
        <div className="p-4 border-b border-purple-200/50 dark:border-purple-500/20">
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
            {/* Collapse Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(true)}
              className="h-8 w-8 hover:bg-[#76B947] hover:text-white transition-all"
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
              className="pl-10 dark:bg-gray-800 dark:border-gray-700 border-purple-200"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {filteredHistories.map((chat) => (
              <Card
                key={chat.id}
                className={`glass-card cursor-pointer transition-all hover:scale-[1.02] hover:bg-[#76B947]/10 dark:hover:bg-[#76B947]/20 border-purple-200/50 dark:border-purple-500/20 ${
                  currentChatId === chat.id ? 'bg-purple-100/50 dark:bg-purple-900/30 border-purple-400 dark:border-purple-500' : ''
                }`}
                onClick={() => loadChatHistory(chat.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <h3 className="text-sm font-medium text-black dark:text-white truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                        {chat.title}
                      </h3>
                    </div>
                    {chat.unread && (
                      <div className="w-2 h-2 bg-purple-600 rounded-full flex-shrink-0" />
                    )}
                  </div>
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
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Expand Button - Shows when sidebar is collapsed */}
        {sidebarCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(false)}
            className="absolute left-4 top-4 z-50 glass-button bg-white/80 dark:bg-gray-800/80 hover:bg-[#76B947] hover:text-white transition-all duration-300"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}

        {/* Chat Header */}
        <div className="glass-panel border-b border-purple-200/50 dark:border-purple-500/20 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-black dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  AI {userType === 'founder' ? 'Advisory' : 'Investment'} Assistant
                </h1>
                <p className="text-sm text-muted-foreground">Always here to help you succeed</p>
              </div>
            </div>
            {selectedStartup && (
              <Badge className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-4 py-2 max-w-[250px] truncate">
                <Lightbulb className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  {selectedStartup.name} • {selectedStartup.sector}
                  {selectedStartup.urutiScore > 0 && ` • Score: ${selectedStartup.urutiScore}`}
                </span>
              </Badge>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="p-6 border-b border-purple-200/50 dark:border-purple-500/20">
            <p className="text-sm text-muted-foreground mb-3" style={{ fontFamily: 'var(--font-body)' }}>
              Quick actions to get started:
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
                    className="glass-button hover:scale-105 transition-transform border-purple-200 dark:border-purple-500/30"
                  >
                    <Icon className={`mr-2 h-4 w-4 ${action.color}`} />
                    {action.label}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden p-6">
          <ScrollArea className="h-full">
            <div className="space-y-4 max-w-4xl mx-auto" ref={scrollRef}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-3 max-w-[75%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className={message.role === 'user' ? 'bg-[#76B947]/20 text-[#76B947]' : 'bg-gradient-to-br from-purple-600 to-purple-800 text-white'}>
                        {message.role === 'user' ? 'U' : <Sparkles className="h-5 w-5" />}
                      </AvatarFallback>
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
                            : 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border border-purple-200 dark:border-purple-700'
                        }`}
                      >
                        <p className={`text-sm whitespace-pre-wrap ${message.role === 'user' ? 'text-black dark:text-white' : ''}`} style={{ fontFamily: 'var(--font-body)' }}>
                          {message.content}
                        </p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.attachments.map((attachment) => (
                              <div
                                key={attachment.id}
                                className="flex items-center space-x-2 p-2 rounded-lg bg-white/20 dark:bg-black/20"
                              >
                                {attachment.type === 'image' ? (
                                  <ImageIcon className="h-4 w-4" />
                                ) : attachment.type === 'audio' ? (
                                  <Mic className="h-4 w-4" />
                                ) : (
                                  <FileText className="h-4 w-4" />
                                )}
                                <span className="text-xs">{attachment.name}</span>
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
          </ScrollArea>
        </div>

        {/* Input Area */}
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="relative border border-purple-300 dark:border-purple-600 rounded-3xl overflow-hidden bg-white dark:bg-gray-800 shadow-lg">
              {/* Input Container */}
              <div className="flex items-end p-2 gap-2">
                {/* Left: Attach Button */}
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
                      <DialogDescription>Attach files or select a startup context</DialogDescription>
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
                        {userType === 'investor' && mockInvestorStartups.length === 0 && (
                          <p className="text-xs text-muted-foreground mb-2">
                            No bookmarked startups yet. Bookmark startups from Startup Discovery to analyze them here.
                          </p>
                        )}
                        <div className="space-y-2">
                          {(userType === 'investor' ? mockInvestorStartups : mockFounderStartups).map((startup) => (
                            <Button
                              key={startup.id}
                              variant={selectedStartup?.id === startup.id ? 'default' : 'outline'}
                              className={
                                selectedStartup?.id === startup.id
                                  ? 'w-full justify-start transition-all bg-gradient-to-r from-purple-600 to-purple-800 text-white'
                                  : 'w-full justify-start transition-all hover:bg-[#76B947]/10 hover:border-[#76B947] hover:text-[#76B947] dark:hover:bg-[#76B947]/20'
                              }
                              onClick={() => {
                                setSelectedStartup(startup);
                                setAttachDialogOpen(false);
                              }}
                            >
                              <Lightbulb className="mr-2 h-4 w-4" />
                              {startup.name} • {startup.sector}
                              {startup.urutiScore && ` • ${startup.urutiScore}`}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Center: Input Field */}
                <div className="flex-1 min-h-[48px]">
                  <Input
                    placeholder={userType === 'founder' ? "Ask Uruti AI anything about your startup..." : "Ask Uruti AI about investment opportunities..."}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    className="border-0 focus-visible:ring-0 bg-transparent dark:bg-transparent text-base h-12 px-4"
                    style={{ fontFamily: 'var(--font-body)' }}
                  />
                </div>

                {/* Right: Model Selector & Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Model Selector Dropdown */}
                  <Dialog open={modelSelectOpen} onOpenChange={setModelSelectOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full px-4 h-10 glass-card border-purple-300 dark:border-purple-600 hover:bg-[#76B947]/10 hover:border-[#76B947] transition-all"
                      >
                        <span className="font-medium text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
                          {selectedModel.name}
                        </span>
                        <ChevronRight className="h-4 w-4 ml-1 text-muted-foreground rotate-90" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card border-purple-200 dark:border-purple-500/30">
                      <DialogHeader>
                        <DialogTitle style={{ fontFamily: 'var(--font-heading)' }}>Select AI Model</DialogTitle>
                        <DialogDescription>Choose the best model for your task</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        {aiModels.map((model) => (
                          <Button
                            key={model.id}
                            variant={selectedModel.id === model.id ? 'default' : 'outline'}
                            className={
                              selectedModel.id === model.id
                                ? `w-full justify-start transition-all bg-gradient-to-r ${model.color} text-white h-auto py-4`
                                : 'w-full justify-start transition-all hover:bg-[#76B947]/10 hover:border-[#76B947] hover:text-[#76B947] dark:hover:bg-[#76B947]/20 h-auto py-4'
                            }
                            onClick={() => {
                              setSelectedModel(model);
                              setModelSelectOpen(false);
                            }}
                          >
                            <div className="flex-1 text-left">
                              <div className="font-semibold text-base mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                                {model.name}
                              </div>
                              <div className="text-xs opacity-90">
                                {model.description}
                              </div>
                            </div>
                            {selectedModel.id === model.id && (
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            )}
                          </Button>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Recording Button */}
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

                  {/* Send Button */}
                  <Button
                    onClick={() => handleSend()}
                    disabled={(!inputText.trim() && attachments.length === 0) || isTyping}
                    size="icon"
                    className="h-10 w-10 rounded-full bg-[#76B947] hover:bg-[#5a8f35] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Attachments Preview - Inside the card */}
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