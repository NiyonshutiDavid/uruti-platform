import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { 
  Search, 
  BookOpen, 
  Users, 
  TrendingUp, 
  CreditCard, 
  Settings, 
  MessageSquare,
  ChevronRight,
  HelpCircle,
  FileText,
  Video,
  Lightbulb,
  Shield,
  Zap,
  Target,
  PieChart,
  Mail,
  Phone,
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';

interface HelpCenterProps {
  onNavigate: (page: string) => void;
  onBack?: () => void;
}

interface Article {
  id: string;
  title: string;
  description: string;
  category: string;
  content?: {
    introduction: string;
    steps?: Array<{
      title: string;
      description: string;
      tips?: string[];
    }>;
    additionalInfo?: string;
    relatedArticles?: string[];
  };
}

export function HelpCenter({ onNavigate, onBack }: HelpCenterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Scroll to top when category or article changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedCategory, selectedArticle]);

  const categories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Lightbulb,
      description: 'Learn the basics of Uruti platform',
      color: '#76B947'
    },
    {
      id: 'account',
      title: 'Account & Profile',
      icon: Users,
      description: 'Manage your account settings',
      color: '#4A90E2'
    },
    {
      id: 'founders',
      title: 'For Founders',
      icon: Target,
      description: 'Resources for entrepreneurs',
      color: '#F5A623'
    },
    {
      id: 'investors',
      title: 'For Investors',
      icon: TrendingUp,
      description: 'Investment tools and features',
      color: '#BD10E0'
    },
    {
      id: 'ai-advisory',
      title: 'AI Advisory',
      icon: Zap,
      description: 'Get help with AI features',
      color: '#50E3C2'
    },
    {
      id: 'billing',
      title: 'Billing & Payments',
      icon: CreditCard,
      description: 'Payment and subscription info',
      color: '#D0021B'
    }
  ];

  const articles: Article[] = [
    // Getting Started
    {
      id: 'gs-1',
      title: 'How to Create Your Account',
      description: 'Step-by-step guide to signing up and getting started with Uruti',
      category: 'getting-started',
      content: {
        introduction: 'Creating your Uruti account is quick and easy. Follow these steps to get started on your entrepreneurship journey.',
        steps: [
          {
            title: 'Visit the Signup Page',
            description: 'Click on the "Get Started" or "Sign Up" button on the homepage to access the registration page.',
            tips: ['Make sure you have a valid email address ready', 'Choose a strong password with at least 8 characters']
          },
          {
            title: 'Enter Your Basic Information',
            description: 'Fill in your full name, email address, and create a secure password.',
            tips: ['Use your professional email address', 'Your name will be visible to other users on the platform']
          },
          {
            title: 'Select Your Role',
            description: 'Choose whether you\'re signing up as a Founder or an Investor. This will customize your dashboard experience.',
            tips: ['Founders get access to startup tools and AI advisory', 'Investors get access to deal flow and startup discovery']
          },
          {
            title: 'Complete Your Profile',
            description: 'Add additional information about yourself, your startup (for founders), or investment preferences (for investors).',
            tips: ['A complete profile helps you get better matches', 'You can always update your profile later']
          },
          {
            title: 'Verify Your Email',
            description: 'Check your inbox for a verification email and click the link to activate your account.',
            tips: ['Check your spam folder if you don\'t see the email', 'The verification link expires after 24 hours']
          }
        ],
        additionalInfo: 'Once your email is verified, you can immediately start exploring the platform and accessing features available in your plan.',
        relatedArticles: ['gs-2', 'gs-4', 'acc-1']
      }
    },
    {
      id: 'gs-2',
      title: 'Choosing Your Role: Founder vs Investor',
      description: 'Understand the differences and choose the right role for you',
      category: 'getting-started',
      content: {
        introduction: 'Your role determines which features and tools you\'ll have access to on the Uruti platform. Here\'s what you need to know:',
        steps: [
          {
            title: 'Founder Role Overview',
            description: 'As a Founder, you get access to tools designed to help you build, validate, and scale your startup.',
            tips: [
              'Access to AI Advisory tracks for business guidance',
              'Pitch deck builder and pitch coach',
              'Financial modeling tools',
              'Mentor network and connections',
              'Startup progress tracking'
            ]
          },
          {
            title: 'Investor Role Overview',
            description: 'As an Investor, you get access to deal flow, verified startups, and portfolio management tools.',
            tips: [
              'Browse curated startup opportunities',
              'Access to verified startup metrics',
              'Portfolio tracking and analytics',
              'Direct messaging with founders',
              'Investment performance dashboards'
            ]
          },
          {
            title: 'Can I Switch Roles?',
            description: 'Yes! You can switch between roles from your account settings, but you can only have one active role at a time.',
            tips: ['Switching roles will change your dashboard layout', 'Your data is preserved when you switch']
          }
        ],
        additionalInfo: 'Choose the role that best matches your current goals. You can always switch later as your needs change.',
        relatedArticles: ['gs-1', 'acc-1', 'f-1']
      }
    },
    {
      id: 'gs-3',
      title: 'Platform Navigation Guide',
      description: 'Learn how to navigate through the Uruti dashboard',
      category: 'getting-started',
      content: {
        introduction: 'The Uruti platform is designed for intuitive navigation. Here\'s a quick guide to help you find your way around.',
        steps: [
          {
            title: 'The Sidebar Menu',
            description: 'Access all major sections from the left sidebar, including Dashboard, Startups, AI Chat, and more.',
            tips: ['Click the menu icon on mobile to toggle the sidebar', 'Your available options depend on your role']
          },
          {
            title: 'Top Header Navigation',
            description: 'Use the header for quick access to notifications, messages, and your profile.',
            tips: ['Click the bell icon to view notifications', 'Access settings from your profile dropdown']
          },
          {
            title: 'Search Functionality',
            description: 'Use the search bar to quickly find startups, mentors, or specific content.',
            tips: ['Search is context-aware based on your current page', 'Use filters to narrow down results']
          },
          {
            title: 'Dashboard Overview',
            description: 'Your dashboard shows key metrics and quick actions relevant to your role.',
            tips: ['Customize your dashboard widgets in settings', 'Check your dashboard daily for updates']
          }
        ],
        relatedArticles: ['gs-1', 'gs-4']
      }
    },
    {
      id: 'gs-4',
      title: 'Setting Up Your Profile',
      description: 'Complete your profile to maximize platform benefits',
      category: 'getting-started',
      content: {
        introduction: 'A complete profile helps you connect with the right people and opportunities on Uruti.',
        steps: [
          {
            title: 'Navigate to Profile Settings',
            description: 'Click on your avatar in the top right corner and select "Profile" from the dropdown menu.',
          },
          {
            title: 'Add Your Professional Information',
            description: 'Fill in your bio, experience, skills, and areas of interest or expertise.',
            tips: ['Be specific about your background', 'Highlight relevant achievements']
          },
          {
            title: 'Upload a Profile Photo',
            description: 'Add a professional photo to make your profile more trustworthy and approachable.',
            tips: ['Use a clear, professional headshot', 'Accepted formats: JPG, PNG (max 5MB)']
          },
          {
            title: 'Connect Social Profiles',
            description: 'Link your LinkedIn, Twitter, and other professional social media accounts.',
            tips: ['Connected accounts help verify your identity', 'Only public profile information is shown']
          },
          {
            title: 'Set Your Privacy Preferences',
            description: 'Control what information is visible to other users on the platform.',
            tips: ['Review privacy settings regularly', 'You can make your profile private at any time']
          }
        ],
        relatedArticles: ['acc-1', 'acc-2']
      }
    },

    // Account & Profile
    {
      id: 'acc-1',
      title: 'Updating Your Profile Information',
      description: 'How to edit and update your personal and professional details',
      category: 'account',
      content: {
        introduction: 'Keep your profile information up to date to maintain credibility and access to relevant opportunities.',
        steps: [
          {
            title: 'Access Your Profile',
            description: 'Click your avatar in the top right corner and select "Profile".',
          },
          {
            title: 'Edit Information',
            description: 'Click the "Edit Profile" button to make changes to any section.',
            tips: ['Changes are saved automatically', 'Some fields may require verification for security']
          },
          {
            title: 'Update Professional Details',
            description: 'Modify your job title, company, bio, and areas of expertise.',
          },
          {
            title: 'Save Changes',
            description: 'Review your changes and click "Save" to update your profile.',
            tips: ['Your changes are visible immediately', 'You\'ll receive a confirmation notification']
          }
        ],
        relatedArticles: ['acc-2', 'acc-3']
      }
    },
    {
      id: 'acc-2',
      title: 'Managing Privacy Settings',
      description: 'Control who can see your information and activities',
      category: 'account',
      content: {
        introduction: 'Uruti gives you full control over your privacy. Customize what information you share and with whom.',
        steps: [
          {
            title: 'Go to Settings',
            description: 'Navigate to Settings from the sidebar menu and select "Privacy".',
          },
          {
            title: 'Profile Visibility',
            description: 'Choose whether your profile is visible to everyone, only connections, or private.',
            tips: ['Private profiles can still receive direct messages', 'Consider your networking goals when setting visibility']
          },
          {
            title: 'Activity Sharing',
            description: 'Control whether others can see your platform activity and updates.',
          },
          {
            title: 'Data Sharing',
            description: 'Manage what data is shared with third-party integrations.',
            tips: ['Review connected apps regularly', 'Revoke access for unused integrations']
          }
        ],
        relatedArticles: ['acc-1', 'acc-4']
      }
    },
    {
      id: 'acc-3',
      title: 'Changing Your Password',
      description: 'Steps to reset or update your account password',
      category: 'account',
      content: {
        introduction: 'Regularly updating your password helps keep your account secure.',
        steps: [
          {
            title: 'Navigate to Security Settings',
            description: 'Go to Settings > Security from the sidebar menu.',
          },
          {
            title: 'Click Change Password',
            description: 'Enter your current password for verification.',
          },
          {
            title: 'Enter New Password',
            description: 'Create a strong new password and confirm it.',
            tips: [
              'Use at least 8 characters',
              'Include uppercase, lowercase, numbers, and symbols',
              'Don\'t reuse passwords from other accounts'
            ]
          },
          {
            title: 'Save and Log Out',
            description: 'Your password is updated immediately. You\'ll be logged out on other devices.',
            tips: ['Store your password securely', 'Consider using a password manager']
          }
        ],
        relatedArticles: ['acc-1', 'acc-2']
      }
    },
    {
      id: 'acc-4',
      title: 'Notification Preferences',
      description: 'Customize how and when you receive updates',
      category: 'account',
      content: {
        introduction: 'Control which notifications you receive and how you receive them.',
        steps: [
          {
            title: 'Access Notification Settings',
            description: 'Go to Settings > Notifications from the sidebar.',
          },
          {
            title: 'Email Notifications',
            description: 'Choose which events trigger email notifications.',
            tips: ['Disable marketing emails if preferred', 'Important security notifications cannot be disabled']
          },
          {
            title: 'In-App Notifications',
            description: 'Control which activities show notifications in the platform.',
          },
          {
            title: 'Push Notifications',
            description: 'Enable browser push notifications for real-time updates.',
            tips: ['Push notifications work even when the app is closed', 'Grant browser permissions when prompted']
          }
        ],
        relatedArticles: ['acc-1', 'acc-2']
      }
    },

    // For Founders
    {
      id: 'f-1',
      title: 'Creating Your Startup Profile',
      description: 'Build a compelling profile to attract investors',
      category: 'founders',
      content: {
        introduction: 'Your startup profile is your digital pitch. Make it compelling to attract the right investors and partners.',
        steps: [
          {
            title: 'Navigate to Startup Hub',
            description: 'Click "Startups" in the sidebar and then "Create New Startup".',
          },
          {
            title: 'Basic Information',
            description: 'Enter your startup name, tagline, and elevator pitch.',
            tips: ['Make your tagline memorable and clear', 'Keep your elevator pitch under 200 characters']
          },
          {
            title: 'Problem & Solution',
            description: 'Clearly articulate the problem you\'re solving and your unique solution.',
            tips: ['Use specific examples', 'Quantify the problem size when possible']
          },
          {
            title: 'Market & Traction',
            description: 'Describe your target market and current traction or achievements.',
            tips: ['Include key metrics and milestones', 'Be honest about your stage']
          },
          {
            title: 'Team & Funding',
            description: 'Showcase your team and funding requirements.',
            tips: ['Highlight relevant team experience', 'Be specific about funding needs and use of funds']
          },
          {
            title: 'Add Media',
            description: 'Upload your logo, pitch deck, and demo videos.',
            tips: ['High-quality visuals make a strong impression', 'Keep pitch deck under 15 slides']
          }
        ],
        relatedArticles: ['f-3', 'f-4', 'f-6']
      }
    },
    {
      id: 'f-2',
      title: 'Using the AI Advisory System',
      description: 'Get personalized guidance from our AI advisory tracks',
      category: 'founders',
      content: {
        introduction: 'The Uruti AI Advisory provides personalized, step-by-step guidance tailored to your startup\'s stage and needs.',
        steps: [
          {
            title: 'Access AI Advisory',
            description: 'Click "AI Advisory" from the sidebar menu to view available tracks.',
          },
          {
            title: 'Choose Your Track',
            description: 'Select a learning track based on your current focus area (e.g., Market Research, Product Development).',
            tips: ['Start with your most urgent need', 'You can pursue multiple tracks simultaneously']
          },
          {
            title: 'Complete Modules',
            description: 'Work through each module, completing exercises and assessments.',
            tips: ['Take notes as you go', 'Apply learnings immediately to your startup']
          },
          {
            title: 'Get AI Recommendations',
            description: 'Receive personalized advice based on your responses and progress.',
            tips: ['Be honest in your responses', 'Review recommendations regularly']
          },
          {
            title: 'Track Your Progress',
            description: 'Monitor completion and revisit modules as needed.',
          }
        ],
        relatedArticles: ['ai-1', 'ai-3', 'f-1']
      }
    },
    {
      id: 'f-3',
      title: 'Preparing Your Pitch Deck',
      description: 'Best practices for creating an investor-ready pitch',
      category: 'founders',
      content: {
        introduction: 'A great pitch deck tells your startup\'s story clearly and compellingly. Follow these guidelines to create an effective presentation.',
        steps: [
          {
            title: 'Structure Your Deck',
            description: 'Include these key slides: Problem, Solution, Market, Product, Traction, Business Model, Competition, Team, Financials, Ask.',
            tips: ['Keep it to 10-15 slides', 'Each slide should make one clear point']
          },
          {
            title: 'Design for Clarity',
            description: 'Use clean, professional design with consistent branding.',
            tips: ['Limit text on each slide', 'Use visuals to support your message', 'Maintain consistent fonts and colors']
          },
          {
            title: 'Tell Your Story',
            description: 'Create a narrative flow that builds excitement and credibility.',
            tips: ['Start with a compelling problem', 'Show why now is the right time']
          },
          {
            title: 'Include Key Metrics',
            description: 'Support claims with data and specific numbers.',
            tips: ['Show traction and growth', 'Be prepared to explain all metrics']
          },
          {
            title: 'Practice Your Delivery',
            description: 'Use the Pitch Coach feature to rehearse and get feedback.',
            tips: ['Time yourself (aim for 15-20 minutes)', 'Prepare for common questions']
          }
        ],
        relatedArticles: ['f-1', 'f-4', 'f-5']
      }
    },
    {
      id: 'f-4',
      title: 'Financial Modeling Tools',
      description: 'Learn to use our financial projection tools',
      category: 'founders',
      content: {
        introduction: 'Solid financial projections demonstrate that you understand your business economics and growth potential.',
        steps: [
          {
            title: 'Access Financial Tools',
            description: 'Navigate to Startup Hub and select your startup, then click "Financials".',
          },
          {
            title: 'Revenue Model',
            description: 'Define your revenue streams and pricing strategy.',
            tips: ['Be realistic with assumptions', 'Show multiple scenarios (conservative, expected, optimistic)']
          },
          {
            title: 'Cost Structure',
            description: 'Map out your fixed and variable costs.',
            tips: ['Include all operational expenses', 'Account for hiring plans']
          },
          {
            title: 'Cash Flow Projections',
            description: 'Project monthly cash flow for 3-5 years.',
            tips: ['Show when you\'ll need funding', 'Identify potential cash crunches early']
          },
          {
            title: 'Key Metrics',
            description: 'Track CAC, LTV, burn rate, runway, and other vital metrics.',
            tips: ['Update regularly as your business evolves', 'Use for investor presentations']
          }
        ],
        relatedArticles: ['f-1', 'f-3', 'f-6']
      }
    },
    {
      id: 'f-5',
      title: 'Connecting with Mentors',
      description: 'How to find and engage with mentors in your industry',
      category: 'founders',
      content: {
        introduction: 'Mentors provide invaluable guidance based on real experience. Here\'s how to make the most of Uruti\'s mentor network.',
        steps: [
          {
            title: 'Browse Mentor Profiles',
            description: 'Click "Mentors" in the sidebar to explore available mentors.',
            tips: ['Filter by industry, expertise, and location', 'Read full profiles and past mentee reviews']
          },
          {
            title: 'Send Connection Request',
            description: 'Click "Connect" and write a personalized message explaining why you\'d like their guidance.',
            tips: ['Be specific about what you need help with', 'Show you\'ve researched their background']
          },
          {
            title: 'Schedule Your First Session',
            description: 'Once accepted, book a session through the mentor\'s calendar.',
            tips: ['Prepare questions in advance', 'Share relevant materials beforehand']
          },
          {
            title: 'Make the Most of Sessions',
            description: 'Come prepared, take notes, and follow up on action items.',
            tips: ['Respect their time', 'Update them on your progress']
          },
          {
            title: 'Build the Relationship',
            description: 'Regular check-ins help mentors provide ongoing guidance.',
            tips: ['Share wins and challenges', 'Be open to feedback']
          }
        ],
        relatedArticles: ['f-1', 'f-2', 'f-6']
      }
    },
    {
      id: 'f-6',
      title: 'Tracking Your Startup Progress',
      description: 'Monitor milestones and KPIs on your dashboard',
      category: 'founders',
      content: {
        introduction: 'Regular tracking helps you stay on course and identify issues early.',
        steps: [
          {
            title: 'Set Up Your Dashboard',
            description: 'Customize your founder dashboard with the metrics that matter most to you.',
          },
          {
            title: 'Define Milestones',
            description: 'Set clear, achievable milestones with target dates.',
            tips: ['Make milestones specific and measurable', 'Align with your funding goals']
          },
          {
            title: 'Track Key Metrics',
            description: 'Monitor growth metrics, financial health, and operational KPIs.',
            tips: ['Update metrics weekly', 'Set up alerts for critical thresholds']
          },
          {
            title: 'Review Progress Regularly',
            description: 'Use weekly and monthly reviews to assess progress.',
            tips: ['Celebrate wins', 'Adjust strategy based on data']
          },
          {
            title: 'Share Updates',
            description: 'Keep investors and stakeholders informed of progress.',
            tips: ['Send monthly updates', 'Be transparent about challenges']
          }
        ],
        relatedArticles: ['f-1', 'f-4', 'ai-3']
      }
    },

    // For Investors
    {
      id: 'i-1',
      title: 'Browsing Investment Opportunities',
      description: 'How to discover and filter startups on the platform',
      category: 'investors',
      content: {
        introduction: 'Uruti curates investment opportunities to help you find startups that match your investment thesis.',
        steps: [
          {
            title: 'Access Startup Discovery',
            description: 'Click "Startup Discovery" in the sidebar to browse opportunities.',
          },
          {
            title: 'Apply Filters',
            description: 'Filter by industry, stage, funding round, location, and more.',
            tips: ['Save your favorite filter combinations', 'Get alerts for new matches']
          },
          {
            title: 'Review Startup Profiles',
            description: 'Click on any startup to view their detailed profile and metrics.',
            tips: ['Check verification badges', 'Review financial projections carefully']
          },
          {
            title: 'Save Interesting Opportunities',
            description: 'Add startups to your watchlist for ongoing monitoring.',
          },
          {
            title: 'Initiate Contact',
            description: 'Message founders directly or request a pitch meeting.',
            tips: ['Be clear about your investment criteria', 'Respect founders\' time']
          }
        ],
        relatedArticles: ['i-2', 'i-4', 'i-5']
      }
    },
    {
      id: 'i-2',
      title: 'Understanding Startup Metrics',
      description: 'Key metrics to evaluate investment opportunities',
      category: 'investors',
      content: {
        introduction: 'Learn to analyze the metrics that matter for early-stage investment decisions.',
        steps: [
          {
            title: 'Growth Metrics',
            description: 'Evaluate MRR/ARR growth, user acquisition, and retention rates.',
            tips: ['Look for consistent month-over-month growth', 'Understand cohort analysis']
          },
          {
            title: 'Unit Economics',
            description: 'Analyze CAC, LTV, gross margins, and contribution margins.',
            tips: ['LTV should be at least 3x CAC', 'Payback period under 12 months is ideal']
          },
          {
            title: 'Market Opportunity',
            description: 'Assess TAM, SAM, and SOM to understand growth potential.',
            tips: ['Look for large, growing markets', 'Understand competitive dynamics']
          },
          {
            title: 'Financial Health',
            description: 'Review burn rate, runway, and path to profitability.',
            tips: ['At least 12 months runway is preferred', 'Clear plan to next milestone']
          },
          {
            title: 'Team Quality',
            description: 'Evaluate founder backgrounds, skills mix, and commitment.',
            tips: ['Look for complementary skills', 'Check previous startup experience']
          }
        ],
        relatedArticles: ['i-1', 'i-4', 'i-6']
      }
    },
    {
      id: 'i-3',
      title: 'Managing Your Portfolio',
      description: 'Track and manage your investment portfolio',
      category: 'investors',
      content: {
        introduction: 'Stay on top of your investments with Uruti\'s portfolio management tools.',
        steps: [
          {
            title: 'View Portfolio Dashboard',
            description: 'Access your portfolio overview from the investor dashboard.',
          },
          {
            title: 'Track Performance',
            description: 'Monitor key metrics for each portfolio company.',
            tips: ['Set up custom alerts', 'Review monthly founder updates']
          },
          {
            title: 'Add Manual Investments',
            description: 'Include investments made outside the platform for complete tracking.',
          },
          {
            title: 'Generate Reports',
            description: 'Create reports for your LPs or personal records.',
            tips: ['Export data to Excel/PDF', 'Customize report templates']
          },
          {
            title: 'Stay Engaged',
            description: 'Use the platform to communicate with portfolio founders.',
          }
        ],
        relatedArticles: ['i-1', 'i-6']
      }
    },
    {
      id: 'i-4',
      title: 'Due Diligence Resources',
      description: 'Tools and resources for thorough startup evaluation',
      category: 'investors',
      content: {
        introduction: 'Conduct comprehensive due diligence using Uruti\'s built-in tools and resources.',
        steps: [
          {
            title: 'Access Due Diligence Checklist',
            description: 'Use our comprehensive checklist to ensure thorough evaluation.',
            tips: ['Customize based on your investment stage', 'Track completion status']
          },
          {
            title: 'Review Verified Documents',
            description: 'Access startup documents, financials, and legal information.',
            tips: ['Check verification status', 'Request additional documents as needed']
          },
          {
            title: 'Analyze Financials',
            description: 'Use built-in tools to model and stress-test projections.',
          },
          {
            title: 'Conduct Reference Checks',
            description: 'View founder backgrounds and previous investor feedback.',
          },
          {
            title: 'Market Research',
            description: 'Access market reports and competitive analysis tools.',
            tips: ['Verify market size claims', 'Understand competitive landscape']
          }
        ],
        relatedArticles: ['i-1', 'i-2', 'i-5']
      }
    },
    {
      id: 'i-5',
      title: 'Connecting with Founders',
      description: 'How to initiate conversations and meetings',
      category: 'investors',
      content: {
        introduction: 'Build relationships with founders through thoughtful, professional engagement.',
        steps: [
          {
            title: 'Send a Message',
            description: 'Use the messaging feature to introduce yourself and express interest.',
            tips: ['Be specific about what interests you', 'Ask insightful questions']
          },
          {
            title: 'Request a Meeting',
            description: 'Use the calendar integration to schedule pitch meetings.',
            tips: ['Suggest multiple time options', 'Share what you\'d like to discuss']
          },
          {
            title: 'Prepare for the Meeting',
            description: 'Review the startup profile, financials, and prepare questions.',
            tips: ['Read the full pitch deck', 'Research the market']
          },
          {
            title: 'Conduct the Meeting',
            description: 'Have a structured conversation covering key areas.',
            tips: ['Take notes', 'Be respectful of time']
          },
          {
            title: 'Follow Up',
            description: 'Send follow-up messages with next steps or feedback.',
            tips: ['Be prompt with responses', 'Be clear about your interest level']
          }
        ],
        relatedArticles: ['i-1', 'i-4', 'i-6']
      }
    },
    {
      id: 'i-6',
      title: 'Investment Analytics Dashboard',
      description: 'Understanding your investment performance metrics',
      category: 'investors',
      content: {
        introduction: 'Use analytics to track portfolio performance and make data-driven decisions.',
        steps: [
          {
            title: 'Navigate to Analytics',
            description: 'Access the analytics dashboard from your investor portal.',
          },
          {
            title: 'Portfolio Overview',
            description: 'View aggregate metrics across all investments.',
            tips: ['Track IRR and multiple on invested capital', 'Monitor portfolio diversification']
          },
          {
            title: 'Individual Investment Analysis',
            description: 'Drill down into specific company performance.',
            tips: ['Compare to initial projections', 'Track milestone achievement']
          },
          {
            title: 'Sector Analysis',
            description: 'Understand performance by industry or stage.',
          },
          {
            title: 'Custom Reports',
            description: 'Create custom views and export data for analysis.',
            tips: ['Schedule automated reports', 'Share with co-investors or LPs']
          }
        ],
        relatedArticles: ['i-3', 'i-2']
      }
    },

    // AI Advisory
    {
      id: 'ai-1',
      title: 'Introduction to Uruti AI',
      description: 'Overview of our AI-powered advisory system',
      category: 'ai-advisory',
      content: {
        introduction: 'Uruti AI is your personal startup advisor, available 24/7 to provide guidance tailored to your specific situation.',
        steps: [
          {
            title: 'What is Uruti AI?',
            description: 'An advanced AI system trained on startup best practices, investor insights, and entrepreneurship knowledge.',
            tips: ['Available across the entire platform', 'Learns from your interactions']
          },
          {
            title: 'How It Works',
            description: 'The AI analyzes your startup data, progress, and questions to provide personalized recommendations.',
          },
          {
            title: 'Key Features',
            description: 'Advisory tracks, instant chat support, document analysis, and strategic recommendations.',
          },
          {
            title: 'Getting Started',
            description: 'Simply ask questions or follow structured learning tracks.',
            tips: ['Be specific in your questions', 'Provide context for better answers']
          }
        ],
        relatedArticles: ['ai-2', 'ai-3', 'f-2']
      }
    },
    {
      id: 'ai-2',
      title: 'Using the AI Chat Assistant',
      description: 'Get instant answers and guidance from Uruti AI',
      category: 'ai-advisory',
      content: {
        introduction: 'The AI Chat Assistant is your instant advisor for any startup-related questions.',
        steps: [
          {
            title: 'Access AI Chat',
            description: 'Click "AI Chat" in the sidebar or use the floating chat icon.',
          },
          {
            title: 'Ask Questions',
            description: 'Type your questions in natural language.',
            tips: ['Be specific', 'Provide relevant context', 'Ask follow-up questions']
          },
          {
            title: 'Upload Documents',
            description: 'Share pitch decks, financials, or other documents for analysis.',
            tips: ['Supported formats: PDF, DOCX, XLSX', 'AI will analyze and provide feedback']
          },
          {
            title: 'Get Recommendations',
            description: 'Receive personalized advice based on your startup\'s data and stage.',
          },
          {
            title: 'Save Important Conversations',
            description: 'Bookmark helpful responses for future reference.',
          }
        ],
        relatedArticles: ['ai-1', 'ai-3', 'f-2']
      }
    },
    {
      id: 'ai-3',
      title: 'AI Advisory Tracks Explained',
      description: 'Navigate through structured learning paths',
      category: 'ai-advisory',
      content: {
        introduction: 'Advisory tracks provide structured, step-by-step guidance through key startup challenges.',
        steps: [
          {
            title: 'Browse Available Tracks',
            description: 'View all tracks from the AI Advisory section, organized by topic and difficulty.',
          },
          {
            title: 'Enroll in a Track',
            description: 'Click "Start Track" to begin your learning journey.',
            tips: ['Tracks are self-paced', 'You can pause and resume anytime']
          },
          {
            title: 'Complete Modules',
            description: 'Work through lessons, exercises, and assessments.',
            tips: ['Apply learnings to your startup', 'Complete exercises thoroughly']
          },
          {
            title: 'Earn Certifications',
            description: 'Receive certificates upon track completion.',
            tips: ['Share on your profile', 'Show investors your commitment to learning']
          },
          {
            title: 'Track Your Progress',
            description: 'Monitor completion and revisit any module.',
          }
        ],
        relatedArticles: ['ai-1', 'ai-2', 'f-2']
      }
    },
    {
      id: 'ai-4',
      title: 'Personalized Recommendations',
      description: 'How AI tailors advice to your specific needs',
      category: 'ai-advisory',
      content: {
        introduction: 'Uruti AI learns from your startup data and interactions to provide increasingly personalized guidance.',
        steps: [
          {
            title: 'Initial Assessment',
            description: 'The AI analyzes your startup profile, stage, industry, and goals.',
          },
          {
            title: 'Ongoing Learning',
            description: 'As you use the platform, the AI learns your preferences and challenges.',
          },
          {
            title: 'Proactive Suggestions',
            description: 'Receive timely recommendations based on your progress and industry trends.',
            tips: ['Check your dashboard for AI suggestions', 'Act on time-sensitive recommendations']
          },
          {
            title: 'Custom Action Plans',
            description: 'Get step-by-step action plans tailored to your specific situation.',
          }
        ],
        relatedArticles: ['ai-1', 'ai-2', 'ai-3']
      }
    },

    // Billing & Payments
    {
      id: 'b-1',
      title: 'Understanding Pricing Plans',
      description: 'Overview of available subscription tiers',
      category: 'billing',
      content: {
        introduction: 'Uruti offers flexible pricing plans to match your needs and budget.',
        steps: [
          {
            title: 'Free Tier',
            description: 'Basic features including limited AI chat, startup profile, and investor browsing.',
            tips: ['No credit card required', 'Great for getting started']
          },
          {
            title: 'Founder Pro ($29/month)',
            description: 'Full access to AI Advisory tracks, pitch coach, financial tools, and mentor network.',
            tips: ['Most popular for founders', 'Includes priority support']
          },
          {
            title: 'Investor Plus ($99/month)',
            description: 'Advanced deal flow, portfolio analytics, and unlimited founder connections.',
            tips: ['Ideal for active angel investors', 'Includes due diligence tools']
          },
          {
            title: 'Enterprise (Custom)',
            description: 'Custom solutions for VCs, accelerators, and large organizations.',
            tips: ['Contact sales for pricing', 'Includes API access and dedicated support']
          }
        ],
        relatedArticles: ['b-2', 'b-4']
      }
    },
    {
      id: 'b-2',
      title: 'Updating Payment Methods',
      description: 'How to add or change your payment information',
      category: 'billing',
      content: {
        introduction: 'Keep your payment information up to date to ensure uninterrupted service.',
        steps: [
          {
            title: 'Go to Billing Settings',
            description: 'Navigate to Settings > Billing from the sidebar.',
          },
          {
            title: 'Click Payment Methods',
            description: 'View your current payment methods.',
          },
          {
            title: 'Add New Method',
            description: 'Click "Add Payment Method" and enter your card details.',
            tips: ['We accept Visa, Mastercard, and Amex', 'Your information is encrypted and secure']
          },
          {
            title: 'Set as Default',
            description: 'Choose which payment method to use for subscriptions.',
          },
          {
            title: 'Remove Old Methods',
            description: 'Delete payment methods you no longer use.',
          }
        ],
        relatedArticles: ['b-1', 'b-3']
      }
    },
    {
      id: 'b-3',
      title: 'Billing History and Invoices',
      description: 'Access your payment history and download invoices',
      category: 'billing',
      content: {
        introduction: 'Track your payments and access invoices for expense reporting.',
        steps: [
          {
            title: 'Access Billing History',
            description: 'Go to Settings > Billing > Billing History.',
          },
          {
            title: 'View Transactions',
            description: 'See all past payments with dates and amounts.',
          },
          {
            title: 'Download Invoices',
            description: 'Click the download icon next to any transaction.',
            tips: ['Invoices are in PDF format', 'Include your tax ID in billing settings']
          },
          {
            title: 'Update Billing Info',
            description: 'Change company name or address for future invoices.',
          }
        ],
        relatedArticles: ['b-1', 'b-2']
      }
    },
    {
      id: 'b-4',
      title: 'Upgrading or Downgrading Plans',
      description: 'Change your subscription level anytime',
      category: 'billing',
      content: {
        introduction: 'Upgrade or downgrade your plan based on your changing needs.',
        steps: [
          {
            title: 'Review Current Plan',
            description: 'Go to Settings > Billing to see your current subscription.',
          },
          {
            title: 'Compare Plans',
            description: 'Click "Change Plan" to view available options.',
            tips: ['See feature comparisons', 'Understand what changes']
          },
          {
            title: 'Select New Plan',
            description: 'Choose your new plan level.',
          },
          {
            title: 'Confirm Changes',
            description: 'Review pricing and effective date.',
            tips: ['Upgrades take effect immediately', 'Downgrades apply at next billing cycle', 'Pro-rated credits for upgrades']
          }
        ],
        relatedArticles: ['b-1', 'b-2']
      }
    }
  ];

  const faqs = [
    {
      question: 'Is Uruti only for Rwandan startups?',
      answer: 'While Uruti focuses on empowering Rwandan entrepreneurs, the platform is open to startups across East Africa and investors globally.'
    },
    {
      question: 'How much does Uruti cost?',
      answer: 'Uruti offers a free tier with basic features. Premium plans start at $29/month for founders and $99/month for investors with advanced features.'
    },
    {
      question: 'Can I switch between Founder and Investor roles?',
      answer: 'Yes, you can switch roles from your account settings. However, you can only have one active role at a time.'
    },
    {
      question: 'How does the AI Advisory work?',
      answer: 'Our AI Advisory uses advanced machine learning to provide personalized guidance based on your startup stage, industry, and goals. It offers structured learning tracks and real-time assistance.'
    },
    {
      question: 'Is my data secure on Uruti?',
      answer: 'Yes, we use enterprise-grade encryption and security measures to protect your data. We comply with international data protection standards.'
    },
    {
      question: 'How do I contact support?',
      answer: 'You can reach our support team through the live chat widget, email us at uruti.info@gmail.com, or call +250 790 636 128 during business hours.'
    }
  ];

  const filteredArticles = articles.filter(article => {
    const matchesSearch = searchQuery === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === null || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // If viewing an article
  if (selectedArticle && selectedArticle.content) {
    const category = categories.find(c => c.id === selectedArticle.category);
    const relatedArticlesList = selectedArticle.content.relatedArticles
      ? articles.filter(a => selectedArticle.content.relatedArticles?.includes(a.id))
      : [];

    return (
      <div className="min-h-screen bg-background dark:bg-gray-950">
        <LandingHeader onNavigate={onNavigate} />
        
        <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => setSelectedArticle(null)}
              className="mb-6 text-muted-foreground hover:text-[#76B947]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Help Center
            </Button>

            {/* Article Header */}
            <div className="mb-8">
              {category && (
                <div className="flex items-center space-x-2 mb-4">
                  <div 
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: `${category.color}20`,
                      color: category.color
                    }}
                  >
                    {category.title}
                  </div>
                </div>
              )}
              <h1 className="text-4xl font-bold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                {selectedArticle.title}
              </h1>
              <p className="text-lg text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                {selectedArticle.description}
              </p>
            </div>

            {/* Article Content */}
            <Card className="glass-card border-black/5 dark:border-white/10 mb-8">
              <CardContent className="p-8">
                {/* Introduction */}
                <div className="mb-8">
                  <p className="text-lg text-foreground dark:text-gray-200 leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
                    {selectedArticle.content.introduction}
                  </p>
                </div>

                {/* Steps */}
                {selectedArticle.content.steps && (
                  <div className="space-y-6 mb-8">
                    {selectedArticle.content.steps.map((step, index) => (
                      <div key={index} className="relative pl-10">
                        <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-[#76B947]/20 flex items-center justify-center">
                          <span className="text-[#76B947] font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                            {step.title}
                          </h3>
                          <p className="text-muted-foreground mb-3" style={{ fontFamily: 'var(--font-body)' }}>
                            {step.description}
                          </p>
                          {step.tips && step.tips.length > 0 && (
                            <div className="bg-[#76B947]/5 rounded-lg p-4 border-l-4 border-[#76B947]">
                              <div className="flex items-start space-x-2 mb-2">
                                <Lightbulb className="h-5 w-5 text-[#76B947] flex-shrink-0 mt-0.5" />
                                <span className="font-semibold text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                                  Tips:
                                </span>
                              </div>
                              <ul className="space-y-1 ml-7">
                                {step.tips.map((tip, tipIndex) => (
                                  <li key={tipIndex} className="text-sm text-muted-foreground flex items-start" style={{ fontFamily: 'var(--font-body)' }}>
                                    <CheckCircle2 className="h-4 w-4 text-[#76B947] mr-2 flex-shrink-0 mt-0.5" />
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Additional Info */}
                {selectedArticle.content.additionalInfo && (
                  <div className="bg-blue-500/5 rounded-lg p-6 border border-blue-500/20">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-500 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                          Additional Information
                        </h4>
                        <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                          {selectedArticle.content.additionalInfo}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Articles */}
            {relatedArticlesList.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  Related Articles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relatedArticlesList.map((relatedArticle) => (
                    <Card
                      key={relatedArticle.id}
                      className="glass-card border-black/5 dark:border-white/10 hover:bg-[#76B947]/5 transition-colors cursor-pointer"
                      onClick={() => setSelectedArticle(relatedArticle)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <FileText className="h-5 w-5 text-[#76B947] mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <h4 className="font-semibold mb-1 dark:text-white text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
                                {relatedArticle.title}
                              </h4>
                              <p className="text-xs text-muted-foreground line-clamp-2" style={{ fontFamily: 'var(--font-body)' }}>
                                {relatedArticle.description}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Was this helpful? */}
            <Card className="glass-card border-black/5 dark:border-white/10 mt-8">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  Was this article helpful?
                </h3>
                <div className="flex justify-center space-x-4">
                  <Button
                    className="bg-[#76B947] text-white hover:bg-[#5a8f35]"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Yes, this helped
                  </Button>
                  <Button
                    variant="outline"
                    className="border-black/10 dark:border-white/10"
                    style={{ fontFamily: 'var(--font-body)' }}
                    onClick={() => onNavigate('/contact')}
                  >
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <LandingFooter onNavigate={onNavigate} />
      </div>
    );
  }

  // Main Help Center View
  return (
    <div className="min-h-screen bg-background dark:bg-gray-950">
      <LandingHeader onNavigate={onNavigate} />
      
      {/* Hero Section */}
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#76B947]/10 via-background to-background">
        <div className="max-w-5xl mx-auto text-center">
          {onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              className="mb-4 text-muted-foreground hover:text-[#76B947]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Chat
            </Button>
          )}
          <h1 className="text-5xl lg:text-6xl font-bold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            How can we <span className="text-[#76B947]">help you?</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-8" style={{ fontFamily: 'var(--font-body)' }}>
            Search our knowledge base or browse categories below
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for articles, guides, and FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-base glass-card border-black/10 dark:border-white/10 dark:text-white"
              style={{ fontFamily: 'var(--font-body)' }}
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 dark:text-white text-center" style={{ fontFamily: 'var(--font-heading)' }}>
            Browse by Category
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Card
                  key={category.id}
                  className={`glass-card border-black/5 dark:border-white/10 cursor-pointer transition-all hover:scale-105 ${
                    selectedCategory === category.id ? 'ring-2 ring-[#76B947]' : ''
                  }`}
                  onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <Icon className="h-6 w-6" style={{ color: category.color }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                          {category.title}
                        </h3>
                        <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                          {category.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Articles */}
          {selectedCategory && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  {categories.find(c => c.id === selectedCategory)?.title} Articles
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedCategory(null)}
                  className="text-[#76B947]"
                >
                  View All
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {filteredArticles.length > 0 ? (
              filteredArticles.map((article) => (
                <Card
                  key={article.id}
                  className="glass-card border-black/5 dark:border-white/10 hover:bg-[#76B947]/5 transition-colors cursor-pointer"
                  onClick={() => setSelectedArticle(article)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <FileText className="h-5 w-5 text-[#76B947] mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                            {article.title}
                          </h3>
                          <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            {article.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  No articles found matching your search.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Frequently Asked <span className="text-[#76B947]">Questions</span>
            </h2>
            <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Quick answers to common questions about Uruti
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="glass-card border-black/5 dark:border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <HelpCircle className="h-5 w-5 text-[#76B947] mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                        {faq.question}
                      </h3>
                      <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="glass-card border-black/5 dark:border-white/10 bg-gradient-to-br from-[#76B947]/10 to-transparent">
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-[#76B947] mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Still need help?
              </h3>
              <p className="text-muted-foreground mb-6" style={{ fontFamily: 'var(--font-body)' }}>
                Our support team is ready to assist you with any questions
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => onNavigate('/contact')}
                  className="bg-[#76B947] text-white hover:bg-[#5a8f35]"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  <Mail className="mr-2 h-5 w-5" />
                  Contact Support
                </Button>
                <Button
                  variant="outline"
                  className="border-[#76B947] text-[#76B947] hover:bg-[#76B947]/10"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Live Chat
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/10">
                <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                  <a href="mailto:uruti.info@gmail.com" className="flex items-center hover:text-[#76B947]">
                    <Mail className="h-4 w-4 mr-2" />
                    uruti.info@gmail.com
                  </a>
                  <a href="tel:+250790636128" className="flex items-center hover:text-[#76B947]">
                    <Phone className="h-4 w-4 mr-2" />
                    +250 790 636 128
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <LandingFooter onNavigate={onNavigate} />
    </div>
  );
}
