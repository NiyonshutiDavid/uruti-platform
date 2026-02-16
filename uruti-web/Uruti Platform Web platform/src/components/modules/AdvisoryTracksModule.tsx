import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { BookOpen, CheckCircle2, Clock, Download, PlayCircle, Lock, ArrowLeft, FileText, Video, File, Search, Filter, Sparkles } from 'lucide-react';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface Material {
  name: string;
  type: string;
  url: string;
  description: string;
  content: string;
}

interface AdvisoryTrack {
  id: string;
  title: string;
  description: string;
  category: 'financial' | 'legal' | 'market' | 'pitch';
  modules: number;
  duration: string;
  progress: number;
  status: 'not-started' | 'in-progress' | 'completed';
  objectives: string[];
  materials: Material[];
}

const mockTracks: AdvisoryTrack[] = [
  {
    id: '1',
    title: 'Financial Projection Validation',
    description: 'Learn to build realistic financial models that attract investors. Covers revenue projections, cost analysis, and break-even calculations.',
    category: 'financial',
    modules: 8,
    duration: '4 weeks',
    progress: 75,
    status: 'in-progress',
    objectives: [
      'Build 3-year revenue projections',
      'Calculate customer acquisition costs',
      'Develop realistic cash flow models',
      'Understand key financial metrics for investors'
    ],
    materials: [
      { 
        name: 'Financial Model Template', 
        type: 'Excel', 
        url: '#',
        description: 'A comprehensive Excel template designed to help you create detailed financial projections for your startup.',
        content: `# Financial Model Template

## Overview
This template provides a structured approach to building a 3-year financial projection that will impress investors and guide your business decisions.

## Key Components

### 1. Revenue Projections
- Monthly recurring revenue (MRR) tracking
- Customer acquisition modeling
- Pricing strategy analysis
- Revenue growth assumptions

### 2. Cost Structure
- Fixed costs breakdown
- Variable costs per unit
- Operating expenses
- Personnel costs

### 3. Cash Flow Management
- Monthly cash flow statements
- Runway calculations
- Break-even analysis
- Burn rate tracking

## How to Use
1. Start with your pricing model
2. Input customer acquisition assumptions
3. Model your cost structure
4. Review cash flow projections
5. Adjust assumptions based on market validation

## Best Practices
- Be conservative with revenue projections
- Overestimate costs by 20%
- Include sensitivity analysis
- Update monthly with actual data`
      },
      { 
        name: 'Revenue Projection Guide', 
        type: 'PDF', 
        url: '#',
        description: 'Step-by-step guide to creating accurate and investor-ready revenue projections.',
        content: `# Revenue Projection Guide

## Introduction
Creating accurate revenue projections is crucial for securing investment. This guide walks you through a proven methodology.

## Chapter 1: Understanding Your Market
- Total Addressable Market (TAM)
- Serviceable Addressable Market (SAM)
- Serviceable Obtainable Market (SOM)

### Calculating TAM
TAM represents the total market demand for your product or service. Calculate it by:
- Identifying your target market size
- Multiplying by average revenue per customer
- Considering geographic and demographic constraints

## Chapter 2: Customer Acquisition Modeling
- Customer Acquisition Cost (CAC)
- Customer Lifetime Value (LTV)
- LTV:CAC ratio (should be 3:1 or higher)

## Chapter 3: Revenue Streams
- Primary revenue sources
- Secondary revenue opportunities
- Upsell and cross-sell potential

## Chapter 4: Growth Assumptions
- Month-over-month growth rates
- Seasonal variations
- Market penetration rates

## Chapter 5: Validation Methods
- Pilot program results
- Pre-sales and LOIs
- Market research data
- Competitor benchmarks`
      },
      { 
        name: 'Video: Financial Modeling Best Practices', 
        type: 'Video', 
        url: '#',
        description: 'A 45-minute video tutorial covering financial modeling techniques used by successful African startups.',
        content: `# Video: Financial Modeling Best Practices

## Video Overview
Duration: 45 minutes
Instructor: Sarah Mugisha, CFO of EcoTech Rwanda

## Topics Covered

### Part 1: Foundation (0:00 - 15:00)
- Understanding financial statements
- Key metrics investors look for
- Common mistakes to avoid

### Part 2: Building Your Model (15:00 - 30:00)
- Revenue modeling techniques
- Cost structure analysis
- Cash flow projections

### Part 3: Advanced Topics (30:00 - 45:00)
- Scenario planning
- Sensitivity analysis
- Presenting to investors

## Key Takeaways
1. Start simple, add complexity gradually
2. Base assumptions on real data
3. Include best, worst, and most likely scenarios
4. Update regularly with actual results
5. Be prepared to defend every assumption

## Resources Mentioned
- Financial modeling templates
- Industry benchmarks for African startups
- Recommended reading list`
      }
    ]
  },
  {
    id: '2',
    title: 'Legal Structuring for Seed Rounds',
    description: 'Navigate the legal landscape of seed funding in Rwanda. Understand term sheets, equity distribution, and investor agreements.',
    category: 'legal',
    modules: 6,
    duration: '3 weeks',
    progress: 100,
    status: 'completed',
    objectives: [
      'Understand Rwandan startup legal structures',
      'Negotiate term sheets effectively',
      'Protect founder equity',
      'Comply with regulatory requirements'
    ],
    materials: [
      { 
        name: 'Rwanda Startup Legal Guide', 
        type: 'PDF', 
        url: '#',
        description: 'Complete guide to legal requirements for technology startups in Rwanda.',
        content: `# Rwanda Startup Legal Guide

## Table of Contents
1. Business Registration in Rwanda
2. Legal Entity Types
3. Intellectual Property Protection
4. Employment Law
5. Tax Obligations
6. Regulatory Compliance

## Chapter 1: Business Registration
The Rwanda Development Board (RDB) has streamlined the registration process:
- Online registration through RDB portal
- Required documents
- Timeline and costs
- Post-registration requirements

## Chapter 2: Legal Entity Types
### Private Limited Company (Ltd)
Most common structure for startups in Rwanda.

**Advantages:**
- Limited liability protection
- Easier to raise investment
- Professional credibility

**Requirements:**
- Minimum 1 shareholder
- Minimum capital: RWF 0 (no minimum)
- Board of directors required

### Public Limited Company (PLC)
For larger enterprises planning IPO.

## Chapter 3: Intellectual Property
Protecting your innovations:
- Patent registration process
- Trademark protection
- Copyright considerations
- Trade secret management

## Chapter 4: Investment Considerations
- SAFE notes vs. equity
- Shareholder agreements
- Voting rights
- Exit provisions`
      },
      { 
        name: 'Term Sheet Template', 
        type: 'Word', 
        url: '#',
        description: 'Standard term sheet template with annotations explaining each clause.',
        content: `# Term Sheet Template

## Investment Summary
**Company:** [Company Name]
**Amount:** USD [Amount]
**Security:** [Type of Security]
**Valuation:** USD [Pre-money Valuation]

## Key Terms

### 1. Investment Amount
The Investors agree to invest USD [Amount] in [Company Name] (the "Company") on the terms set forth in this Term Sheet.

### 2. Valuation
- Pre-money valuation: USD [Amount]
- Post-money valuation: USD [Amount]
- Investor ownership: [Percentage]%

### 3. Liquidation Preference
[1x] non-participating liquidation preference. In a liquidation event, investors receive the greater of:
- Their original investment plus accrued dividends, OR
- Their pro-rata share of remaining assets

### 4. Anti-Dilution Protection
[Broad-based weighted average] anti-dilution protection in case of down rounds.

### 5. Board Composition
- [Number] seats appointed by Common shareholders
- [Number] seats appointed by Investors
- [Number] independent seats

### 6. Protective Provisions
Investors must approve:
- Sale or merger of the Company
- Amendments to governing documents
- Issuance of senior securities
- Dividends or distributions

### 7. Founder Vesting
Founder shares subject to 4-year vesting with 1-year cliff.

### 8. Information Rights
Investors entitled to:
- Monthly financial statements
- Annual audited financials
- Annual budget and business plan

### 9. Exclusivity
Company agrees not to solicit other investors for [30] days.`
      },
      { 
        name: 'Equity Calculator Tool', 
        type: 'Excel', 
        url: '#',
        description: 'Interactive tool to model equity dilution across multiple funding rounds.',
        content: `# Equity Calculator Tool

## Purpose
This Excel tool helps you model equity ownership through multiple funding rounds and understand dilution impact on founders and early investors.

## Features

### 1. Cap Table Management
- Track all shareholders
- Calculate ownership percentages
- Model dilution scenarios

### 2. Funding Round Modeling
- Pre-money and post-money calculations
- Option pool creation
- Anti-dilution adjustments

### 3. Exit Scenario Analysis
- Waterfall analysis
- Liquidation preference impacts
- Founder proceeds calculation

## How to Use

### Step 1: Initial Setup
Input founder equity split:
- Founder 1: [%]
- Founder 2: [%]
- Employee option pool: [%]

### Step 2: Model Seed Round
- Investment amount: $[amount]
- Pre-money valuation: $[amount]
- Calculate dilution

### Step 3: Future Rounds
Model Series A, B, C scenarios:
- Maintain option pool at 10-15%
- Consider down-round protection
- Analyze founder ownership over time

### Step 4: Exit Analysis
Input exit scenarios:
- Acquisition at $[amount]
- Calculate proceeds by stakeholder
- Factor in liquidation preferences

## Key Metrics Calculated
- Fully diluted ownership %
- Founder proceeds at exit
- Investor returns (multiple and IRR)
- Employee option value`
      }
    ]
  },
  {
    id: '3',
    title: 'Market Validation Strategies',
    description: 'Validate your market opportunity with data-driven approaches. Learn customer discovery, competitive analysis, and market sizing.',
    category: 'market',
    modules: 10,
    duration: '5 weeks',
    progress: 40,
    status: 'in-progress',
    objectives: [
      'Conduct effective customer interviews',
      'Perform competitive landscape analysis',
      'Calculate TAM, SAM, and SOM',
      'Validate product-market fit'
    ],
    materials: [
      { 
        name: 'Customer Interview Script', 
        type: 'PDF', 
        url: '#',
        description: 'Proven customer interview framework with sample questions.',
        content: `# Customer Interview Script

## Interview Objectives
- Understand customer pain points
- Validate problem significance
- Test solution approach
- Gauge willingness to pay

## Pre-Interview Preparation
1. Define your hypothesis
2. Identify target interviewees
3. Set clear learning goals
4. Prepare recording tools

## Interview Structure

### Opening (5 minutes)
"Thank you for taking the time to speak with me today. I'm researching [problem area] and would love to learn about your experience. There are no right or wrong answers—I'm just trying to understand how things work for you."

### Background Questions (10 minutes)
- Tell me about your role and responsibilities
- Walk me through a typical day/week
- What tools/systems do you currently use?

### Problem Discovery (15 minutes)
- Tell me about the last time you encountered [problem]
- How do you currently solve this problem?
- What's frustrating about the current solution?
- How much time/money does this problem cost you?
- Have you tried other solutions? What happened?

### Solution Validation (10 minutes)
- If you had a magic wand, how would you solve this?
- What would make this problem go away?
- Show/describe your solution concept
- What questions or concerns do you have?

### Pricing Discovery (5 minutes)
- How much do you currently pay for [related solution]?
- What would this be worth to you if it saved [X hours/dollars]?
- How is this type of purchase typically made?

### Closing (5 minutes)
- Who else should I talk to?
- Can I follow up with you as we develop this?
- Any final thoughts or suggestions?

## Red Flags to Watch For
⚠️ "That's interesting" (but no follow-up questions)
⚠️ Vague answers about pain level
⚠️ No current spending on related problems
⚠️ "I would definitely buy this" (empty promise)

## Green Lights
✅ Specific stories and examples
✅ Emotional response to problem
✅ Current workarounds being used
✅ Budget already allocated
✅ Introduction to decision-maker`
      },
      { 
        name: 'Market Sizing Workbook', 
        type: 'Excel', 
        url: '#',
        description: 'Template for calculating TAM, SAM, and SOM with examples.',
        content: `# Market Sizing Workbook

## Overview
This workbook helps you calculate and present your market opportunity using industry-standard methodologies.

## Market Size Definitions

### TAM (Total Addressable Market)
The total market demand for your product/service if you achieved 100% market share.

### SAM (Serviceable Addressable Market)
The portion of TAM you can realistically serve based on your business model and geography.

### SOM (Serviceable Obtainable Market)
The portion of SAM you can realistically capture in the short term (3-5 years).

## Calculation Methods

### Method 1: Top-Down
Start with macro market data:
1. Find industry reports on total market size
2. Apply filters for geography, segment, etc.
3. Calculate your addressable portion

**Example:**
- African AgTech market: $10B (TAM)
- Rwanda + East Africa: $500M (SAM)
- Realistic 3-year capture: $15M (SOM)

### Method 2: Bottom-Up
Build from customer economics:
1. Identify target customer segments
2. Count potential customers per segment
3. Multiply by average revenue per customer
4. Apply penetration assumptions

**Example:**
- Small farms in Rwanda: 50,000
- Price per subscription: $200/year
- Total potential: $10M (TAM)
- Reachable with current channels: $3M (SAM)
- Year 3 penetration (15%): $450K (SOM)

### Method 3: Value Theory
Calculate value you can capture:
1. Quantify problem cost to customers
2. Estimate your value capture percentage
3. Multiply by number of customers

## Validation Checklist
✓ Multiple sources confirm size
✓ Bottom-up and top-down align
✓ Growth rate is reasonable
✓ Competitive landscape considered
✓ Regulatory factors included`
      },
      { 
        name: 'Competitive Analysis Template', 
        type: 'PDF', 
        url: '#',
        description: 'Framework for analyzing competitors and positioning your startup.',
        content: `# Competitive Analysis Template

## Why Competitive Analysis Matters
- Identify market opportunities
- Understand competitor strengths/weaknesses
- Define your unique positioning
- Anticipate market threats

## Competitor Categories

### Direct Competitors
Companies solving the same problem with similar solutions.

### Indirect Competitors
Companies solving the same problem differently.

### Potential Competitors
Companies that could enter your market.

## Analysis Framework

### 1. Competitor Profile
For each competitor, document:
- Company name and founding date
- Headquarters and markets served
- Funding raised and investors
- Team size and key executives
- Revenue/growth (if available)

### 2. Product Analysis
- Core features and capabilities
- Pricing model
- Target customer segments
- Technology stack
- User experience strengths/weaknesses

### 3. Go-to-Market Strategy
- Marketing channels
- Sales approach
- Partnership strategy
- Geographic expansion

### 4. Strengths & Weaknesses

**Competitor A: [Name]**
Strengths:
- Established brand recognition
- Large customer base
- Well-funded

Weaknesses:
- Legacy technology
- Poor customer support
- Not mobile-optimized

### 5. Competitive Positioning Matrix

Create a 2x2 matrix plotting:
- X-axis: Price (Low to High)
- Y-axis: Feature Complexity (Simple to Advanced)

Plot yourself and competitors to identify white space.

## Your Unique Value Proposition

Based on competitive analysis:
- What do you do better?
- What customer segment is underserved?
- What's your unfair advantage?
- How will you defend your position?

## Action Items
1. Monitor competitor product updates
2. Track pricing changes
3. Analyze customer reviews
4. Set up Google Alerts
5. Attend industry events
6. Update analysis quarterly`
      }
    ]
  },
  {
    id: '4',
    title: 'Investor Pitch Mastery',
    description: 'Craft and deliver compelling investor pitches. From deck design to storytelling techniques.',
    category: 'pitch',
    modules: 7,
    duration: '3 weeks',
    progress: 0,
    status: 'not-started',
    objectives: [
      'Design investor-ready pitch decks',
      'Master the art of storytelling',
      'Handle Q&A sessions confidently',
      'Adapt pitches for different audiences'
    ],
    materials: [
      { 
        name: 'Pitch Deck Template', 
        type: 'PowerPoint', 
        url: '#',
        description: 'Professional pitch deck template following Y Combinator format.',
        content: `# Pitch Deck Template

## Slide Structure (12-15 slides)

### Slide 1: Title
- Company name and tagline
- Your name and title
- Contact information
- Date

### Slide 2: Problem
- Describe the problem you're solving
- Make it relatable and specific
- Use data to show magnitude
- Tell a brief story

**Example:**
"Small farmers in Rwanda lose 30% of their harvest due to unpredictable weather patterns and lack of timely information."

### Slide 3: Solution
- Your product/service
- How it solves the problem
- Key features and benefits
- Visual demonstration if possible

### Slide 4: Market Opportunity
- TAM, SAM, SOM
- Market trends and growth
- Why now?

### Slide 5: Product Demo
- Screenshots or demo video
- User workflow
- Key differentiators
- Customer testimonials

### Slide 6: Business Model
- How you make money
- Pricing strategy
- Unit economics
- Path to profitability

### Slide 7: Traction
- Revenue growth
- Customer acquisition
- Key metrics
- Milestones achieved

### Slide 8: Marketing & Sales
- Customer acquisition strategy
- Sales process
- Key partnerships
- Growth channels

### Slide 9: Competition
- Competitive landscape
- Your positioning
- Unfair advantages
- Barriers to entry

### Slide 10: Team
- Founder backgrounds
- Key hires
- Advisors
- Why you're uniquely qualified

### Slide 11: Financial Projections
- 3-5 year projections
- Key assumptions
- Path to profitability
- Use of funds

### Slide 12: The Ask
- Amount raising
- Use of funds breakdown
- Milestones you'll achieve
- Expected timeline

## Design Guidelines
- One message per slide
- Minimal text (30-word maximum)
- High-quality images
- Consistent fonts and colors
- Professional but not corporate
- Your brand personality should shine

## Storytelling Tips
1. Start with a hook
2. Make it personal
3. Show, don't tell
4. Build momentum
5. End with a clear call-to-action

## Common Mistakes to Avoid
❌ Too much text
❌ Complex financial tables
❌ Ignoring the problem
❌ Weak team slide
❌ Unrealistic projections
❌ No clear ask`
      },
      { 
        name: 'Storytelling Framework', 
        type: 'PDF', 
        url: '#',
        description: 'Narrative techniques for captivating investor presentations.',
        content: `# Storytelling Framework for Pitches

## Why Storytelling Matters
- Humans remember stories, not facts
- Emotional connection drives decisions
- Stories make complex ideas simple
- Memorable pitches get funded

## The Hero's Journey for Startups

### 1. The Ordinary World
Set the scene of the current state.
"Every day, millions of small farmers wake up uncertain..."

### 2. The Call to Adventure
Introduce the problem.
"But climate change is making weather increasingly unpredictable..."

### 3. Meeting the Mentor
Your expertise or insight.
"Having grown up on a farm, I witnessed this firsthand..."

### 4. The Solution
Your product as the magic weapon.
"That's why we built [Product]—an AI-powered platform that..."

### 5. The Journey
Show traction and validation.
"We launched 6 months ago and already 5,000 farmers..."

### 6. The Victory
Paint the future vision.
"In 5 years, we'll have helped 100,000 farmers increase yields by 40%..."

## Key Storytelling Principles

### 1. Make It Personal
Start with a real person's experience.
"Meet Jane, a coffee farmer in Musanze..."

### 2. Use Sensory Details
Help them see, feel, and experience it.
"Imagine waking up to find your entire crop destroyed by unexpected frost..."

### 3. Create Tension
Present the stakes.
"Without intervention, 60% of smallholder farmers will abandon their farms by 2030."

### 4. Show Transformation
Before and after.
"What used to take Jane 3 days now takes 3 hours."

### 5. Build to Crescendo
Structure for maximum impact.
Start strong → Build evidence → Peak with vision

## Pitch Opening Formulas

### Formula 1: The Question
"What if every farmer could have a personal agronomist?"

### Formula 2: The Statistic
"30% of crops are lost every year due to..."

### Formula 3: The Story
"Last year, I met a farmer who had just lost..."

### Formula 4: The Vision
"We believe every person should have access to..."

## Practice Exercises

### Exercise 1: One-Sentence Story
Distill your pitch to one compelling sentence.

### Exercise 2: Napkin Test
Can someone retell your story after hearing it once?

### Exercise 3: Emotion Check
What emotion do you want investors to feel? Design for it.

### Exercise 4: Villain Clarity
Who/what is the antagonist in your story?

## Advanced Techniques

### The Power of Pauses
Strategic silence creates emphasis.

### Rule of Three
Present information in groups of three.

### Bookending
Start and end with the same image/idea.

### The Surprise
Subvert expectations with an unexpected fact.`
      },
      { 
        name: 'Sample Winning Pitches', 
        type: 'PDF', 
        url: '#',
        description: 'Analysis of successful pitch decks from African startups.',
        content: `# Sample Winning Pitches

## Introduction
This document analyzes three successful pitches from African startups that raised significant seed funding.

## Case Study 1: Twiga Foods (Kenya)

### Company Overview
- B2B marketplace connecting farmers to urban retailers
- Raised $30M Series B
- Founded 2013

### What Made Their Pitch Great

**1. Clear Problem Statement**
"85% of food in Kenya goes through informal markets with 30% waste due to inefficient supply chains."

**2. Massive Market**
$50B food market in East Africa with clear technology gap.

**3. Proof of Concept**
Already serving 2,000 vendors daily with 50% month-over-month growth.

**4. Strong Unit Economics**
15% take rate with clear path to profitability.

**5. Experienced Team**
Founder with 15 years in supply chain + agriculture expertise.

### Key Lessons
- Lead with the problem's magnitude
- Show traction before asking for money
- Make unit economics crystal clear

## Case Study 2: Flutterwave (Nigeria)

### Company Overview
- Payment infrastructure for Africa
- Raised $170M+ total funding
- Founded 2016

### Pitch Highlights

**Opening Hook**
"There are 1 billion people in Africa, but only 350 million can make digital payments."

**The Vision**
"We're building the Stripe for Africa."

**Market Opportunity**
$1.5 trillion payment market growing at 20% annually.

**Differentiation**
Single API integrating 150+ payment methods across 20+ countries.

**Traction Slide**
- 290,000 merchants
- Processing $2B annually
- 200% YoY growth

### Key Lessons
- Anchor to a successful comp (Stripe)
- Show network effects
- Demonstrate regional expertise

## Case Study 3: Zipline (Rwanda)

### Company Overview
- Drone delivery for medical supplies
- Operating in Rwanda and Ghana
- Raised $233M total

### Pitch Strategy

**Emotional Opening**
Story of a mother in rural Rwanda who needed emergency blood delivery.

**Problem Framing**
"2 billion people lack access to essential medical supplies."

**Unique Solution**
First and only drone delivery network at scale.

**Impact Metrics**
- 65% of blood deliveries outside Kigali
- 50,000+ emergency deliveries completed
- Response time: 15 minutes vs. 4 hours

**Moat**
Exclusive partnership with Rwanda government + regulatory advantage.

### Key Lessons
- Lead with impact, not technology
- Government partnerships = unfair advantage
- Mission-driven storytelling

## Common Success Patterns

### All Three Pitches Had:
1. **Personal Connection** - Founders with deep market understanding
2. **Clear Metrics** - Specific, verifiable traction
3. **Massive Market** - Billion-dollar opportunities
4. **Unfair Advantage** - Something competitors can't easily copy
5. **Strong Vision** - Inspiring long-term potential

### All Three Avoided:
1. ❌ Vague market sizes
2. ❌ Technology-first language
3. ❌ Defensive competitive analysis
4. ❌ Weak team slides
5. ❌ Unrealistic projections

## Your Action Items

### After studying these pitches:
1. Identify your emotional hook
2. Quantify your problem clearly
3. Show early traction (even if small)
4. Define your unfair advantage
5. Make your vision inspirational

### Questions to Answer:
- What's your "Stripe for X" comparison?
- What story makes investors feel something?
- What metric proves you're onto something?
- Why can't someone else do this?
- What does success look like in 10 years?`
      }
    ]
  }
];

export function AdvisoryTracksModule() {
  const [tracks, setTracks] = useState<AdvisoryTrack[]>(mockTracks);
  const [selectedTrack, setSelectedTrack] = useState<AdvisoryTrack | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'tracks' | 'overview' | 'material'>('tracks');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [completedMaterials, setCompletedMaterials] = useState<Set<string>>(new Set());

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'not-started': { label: 'Not Started', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
      'in-progress': { label: 'In Progress', className: 'bg-[#76B947]/20 text-[#76B947]' },
      'completed': { label: 'Completed', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' }
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getCategoryIcon = (category: string) => {
    const categoryConfig = {
      financial: { icon: '💰', label: 'Financial' },
      legal: { icon: '⚖️', label: 'Legal' },
      market: { icon: '📊', label: 'Market' },
      pitch: { icon: '🎯', label: 'Pitch' }
    };
    return categoryConfig[category as keyof typeof categoryConfig];
  };

  const getFileIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      'PDF': FileText,
      'Excel': File,
      'Word': FileText,
      'PowerPoint': File,
      'Video': Video
    };
    const Icon = iconMap[type] || File;
    return <Icon className="h-5 w-5" />;
  };

  const filteredTracks = tracks
    .filter(track => {
      // Category filter
      if (activeTab !== 'all' && track.category !== activeTab) return false;
      
      // Status filter
      if (statusFilter !== 'all' && track.status !== statusFilter) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          track.title.toLowerCase().includes(query) ||
          track.description.toLowerCase().includes(query)
        );
      }
      
      return true;
    });

  const completedTracks = tracks.filter(t => t.status === 'completed').length;
  const inProgressTracks = tracks.filter(t => t.status === 'in-progress').length;

  const handleTrackClick = (track: AdvisoryTrack) => {
    setSelectedTrack(track);
    setViewMode('overview');
  };

  const handleContinueReading = (material: Material) => {
    setSelectedMaterial(material);
    setViewMode('material');
  };

  const handleBackToTracks = () => {
    setViewMode('tracks');
    setSelectedTrack(null);
    setSelectedMaterial(null);
  };

  const handleBackToOverview = () => {
    setViewMode('overview');
    setSelectedMaterial(null);
  };

  // Generate unique key for material
  const getMaterialKey = (trackId: string, materialName: string) => {
    return `${trackId}-${materialName}`;
  };

  // Check if material is completed
  const isMaterialCompleted = (trackId: string, materialName: string) => {
    return completedMaterials.has(getMaterialKey(trackId, materialName));
  };

  // Mark material as complete and update track progress
  const handleMarkAsComplete = (trackId: string, materialName: string) => {
    const materialKey = getMaterialKey(trackId, materialName);
    const newCompletedMaterials = new Set(completedMaterials);
    
    if (completedMaterials.has(materialKey)) {
      // Unmark as complete
      newCompletedMaterials.delete(materialKey);
    } else {
      // Mark as complete
      newCompletedMaterials.add(materialKey);
    }
    
    setCompletedMaterials(newCompletedMaterials);
    
    // Update track progress
    setTracks(prevTracks => prevTracks.map(track => {
      if (track.id === trackId) {
        const completedCount = track.materials.filter(m => 
          newCompletedMaterials.has(getMaterialKey(trackId, m.name))
        ).length;
        const newProgress = Math.round((completedCount / track.materials.length) * 100);
        
        let newStatus: 'not-started' | 'in-progress' | 'completed';
        if (newProgress === 0) {
          newStatus = 'not-started';
        } else if (newProgress === 100) {
          newStatus = 'completed';
        } else {
          newStatus = 'in-progress';
        }
        
        return {
          ...track,
          progress: newProgress,
          status: newStatus
        };
      }
      return track;
    }));
    
    // Update selectedTrack if it's the current one
    if (selectedTrack && selectedTrack.id === trackId) {
      const track = tracks.find(t => t.id === trackId);
      if (track) {
        const completedCount = track.materials.filter(m => 
          newCompletedMaterials.has(getMaterialKey(trackId, m.name))
        ).length;
        const newProgress = Math.round((completedCount / track.materials.length) * 100);
        
        let newStatus: 'not-started' | 'in-progress' | 'completed';
        if (newProgress === 0) {
          newStatus = 'not-started';
        } else if (newProgress === 100) {
          newStatus = 'completed';
        } else {
          newStatus = 'in-progress';
        }
        
        setSelectedTrack({
          ...track,
          progress: newProgress,
          status: newStatus
        });
      }
    }
  };

  // Function to format content with proper HTML structure
  const formatContent = (content: string) => {
    const lines = content.split('\n');
    const formatted: JSX.Element[] = [];
    let listItems: string[] = [];
    let listType: 'ul' | 'ol' | null = null;
    let key = 0;

    const flushList = () => {
      if (listItems.length > 0 && listType) {
        const ListComponent = listType;
        formatted.push(
          <ListComponent key={`list-${key++}`} className="space-y-2 my-4 ml-6">
            {listItems.map((item, i) => (
              <li key={i} className="text-base leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
                {item}
              </li>
            ))}
          </ListComponent>
        );
        listItems = [];
        listType = null;
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) {
        flushList();
        formatted.push(<div key={`space-${key++}`} className="h-4" />);
        return;
      }

      // Headers
      if (trimmedLine.startsWith('# ')) {
        flushList();
        formatted.push(
          <h1 key={`h1-${key++}`} className="text-3xl sm:text-4xl font-bold mb-4 mt-8 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            {trimmedLine.substring(2)}
          </h1>
        );
      } else if (trimmedLine.startsWith('## ')) {
        flushList();
        formatted.push(
          <h2 key={`h2-${key++}`} className="text-2xl sm:text-3xl font-semibold mb-3 mt-6 text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
            {trimmedLine.substring(3)}
          </h2>
        );
      } else if (trimmedLine.startsWith('### ')) {
        flushList();
        formatted.push(
          <h3 key={`h3-${key++}`} className="text-xl sm:text-2xl font-semibold mb-2 mt-5 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            {trimmedLine.substring(4)}
          </h3>
        );
      } else if (trimmedLine.startsWith('#### ')) {
        flushList();
        formatted.push(
          <h4 key={`h4-${key++}`} className="text-lg sm:text-xl font-medium mb-2 mt-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            {trimmedLine.substring(5)}
          </h4>
        );
      }
      // Bullet points
      else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        if (listType !== 'ul') {
          flushList();
          listType = 'ul';
        }
        listItems.push(trimmedLine.substring(2));
      }
      // Numbered lists
      else if (/^\d+\.\s/.test(trimmedLine)) {
        if (listType !== 'ol') {
          flushList();
          listType = 'ol';
        }
        listItems.push(trimmedLine.replace(/^\d+\.\s/, ''));
      }
      // Checkmarks
      else if (trimmedLine.startsWith('✓') || trimmedLine.startsWith('✅')) {
        flushList();
        formatted.push(
          <div key={`check-${key++}`} className="flex items-start space-x-2 my-2">
            <CheckCircle2 className="h-5 w-5 text-[#76B947] flex-shrink-0 mt-0.5" />
            <p className="text-base leading-relaxed dark:text-gray-200" style={{ fontFamily: 'var(--font-body)' }}>
              {trimmedLine.replace(/^[✓✅]\s*/, '')}
            </p>
          </div>
        );
      }
      // Warning/Red flags
      else if (trimmedLine.startsWith('⚠️') || trimmedLine.startsWith('❌')) {
        flushList();
        formatted.push(
          <div key={`warning-${key++}`} className="flex items-start space-x-2 my-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <span className="text-lg">{trimmedLine.startsWith('⚠️') ? '⚠️' : '❌'}</span>
            <p className="text-base leading-relaxed text-red-900 dark:text-red-200" style={{ fontFamily: 'var(--font-body)' }}>
              {trimmedLine.replace(/^[⚠️❌]\s*/, '')}
            </p>
          </div>
        );
      }
      // Bold text (simple **text**)
      else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        flushList();
        formatted.push(
          <p key={`bold-${key++}`} className="text-base font-bold my-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            {trimmedLine.replace(/^\*\*|\*\*$/g, '')}
          </p>
        );
      }
      // Regular paragraphs
      else {
        flushList();
        formatted.push(
          <p key={`p-${key++}`} className="text-base leading-relaxed my-3 dark:text-gray-200" style={{ fontFamily: 'var(--font-body)' }}>
            {trimmedLine}
          </p>
        );
      }
    });

    flushList();
    return formatted;
  };

  // Materials Browser View
  if (viewMode === 'material' && selectedMaterial) {
    return (
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-black/5 dark:border-white/10">
          <Button
            variant="outline"
            onClick={handleBackToOverview}
            className="mb-4 hover:bg-[#76B947]/10 hover:border-[#76B947]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Overview
          </Button>
          <div>
            <h1 className="text-3xl sm:text-4xl mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              {selectedMaterial.name}
            </h1>
            <div className="flex items-center space-x-3 mt-2">
              <Badge className="bg-[#76B947]/20 text-[#76B947]">
                {selectedTrack.title}
              </Badge>
              <Badge variant="secondary" className="bg-black/5 dark:bg-white/10">
                {selectedMaterial.type}
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content Area - Full Width */}
        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="p-6 sm:p-8 lg:p-12">
            <div className="max-w-4xl mx-auto">
              {formatContent(selectedMaterial.content)}
            </div>
          </CardContent>
        </Card>

        {/* Navigation and Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {selectedTrack.materials.map((material, index) => (
            <Card
              key={index}
              className={`glass-card border-black/5 dark:border-white/10 cursor-pointer transition-all hover:shadow-lg ${
                selectedMaterial.name === material.name ? 'ring-2 ring-[#76B947]' : ''
              }`}
              onClick={() => setSelectedMaterial(material)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-[#76B947]">
                    {getFileIcon(material.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium dark:text-white truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                      {material.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {material.type}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions Section */}
        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              {/* Mark as Complete */}
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 pb-4 border-b border-black/5 dark:border-white/10">
                <div>
                  <p className="font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    Track your progress
                  </p>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Mark this material as complete to update your learning progress
                  </p>
                </div>
                <Button
                  onClick={() => handleMarkAsComplete(selectedTrack.id, selectedMaterial.name)}
                  className={`w-full sm:w-auto ${
                    isMaterialCompleted(selectedTrack.id, selectedMaterial.name)
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-[#76B947] hover:bg-[#76B947]/90'
                  } text-white`}
                >
                  {isMaterialCompleted(selectedTrack.id, selectedMaterial.name) ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Completed
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Mark as Complete
                    </>
                  )}
                </Button>
              </div>
              
              {/* Download */}
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                <div>
                  <p className="font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    Download this material
                  </p>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Save for offline access and reference
                  </p>
                </div>
                <Button variant="outline" className="w-full sm:w-auto hover:bg-[#76B947]/10 hover:border-[#76B947]">
                  <Download className="mr-2 h-4 w-4" />
                  Download {selectedMaterial.type}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Track Overview View
  if (viewMode === 'overview' && selectedTrack) {
    return (
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-black/5 dark:border-white/10">
          <Button
            variant="outline"
            onClick={handleBackToTracks}
            className="mb-4 hover:bg-[#76B947]/10 hover:border-[#76B947]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tracks
          </Button>
          <div>
            <h1 className="text-3xl sm:text-4xl mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              {selectedTrack.title}
            </h1>
            <div className="flex items-center space-x-3 mt-2">
              <Badge className="bg-[#76B947]/20 text-[#76B947]">
                {selectedTrack.category}
              </Badge>
              <Badge variant="secondary" className="bg-black/5 dark:bg-white/10">
                {selectedTrack.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Track Details */}
        <div className="space-y-6">
          <Card className="glass-card border-black/5 dark:border-white/10">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Learning Objectives</CardTitle>
              <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                What you'll achieve in this track
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedTrack.objectives.map((objective, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-[#76B947] flex-shrink-0 mt-0.5" />
                    <p className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>{objective}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-black/5 dark:border-white/10">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Course Materials</CardTitle>
              <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                AI-generated templates and resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedTrack.materials.map((material, index) => {
                  const isCompleted = isMaterialCompleted(selectedTrack.id, material.name);
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-start justify-between p-3 rounded-lg border border-black/5 dark:border-white/10 hover:bg-[#76B947]/5 transition-colors">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className={`mt-0.5 ${isCompleted ? 'text-green-600' : 'text-[#76B947]'}`}>
                            {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : getFileIcon(material.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                              {material.name}
                              {isCompleted && <span className="ml-2 text-xs text-green-600">(Completed)</span>}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-body)' }}>
                              {material.description}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-black/5 dark:bg-white/10 text-xs ml-2 flex-shrink-0">
                          {material.type}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full hover:bg-[#76B947]/10 hover:text-[#76B947] hover:border-[#76B947]"
                        onClick={() => handleContinueReading(material)}
                      >
                        <BookOpen className="mr-2 h-4 w-4" />
                        {isCompleted ? 'Review Material' : 'Continue Reading'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-black/5 dark:border-white/10 bg-gradient-to-br from-[#76B947]/10 to-black/5 dark:to-white/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-[#76B947]/20 rounded-full flex items-center justify-center mx-auto">
                  <Lock className="h-6 w-6 text-[#76B947]" />
                </div>
                <p className="text-sm dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  Premium Track Access
                </p>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Unlock advanced tracks with personalized AI mentorship
                </p>
                <Button size="sm" className="bg-black dark:bg-[#76B947] text-white hover:bg-black/90 dark:hover:bg-[#76B947]/90">
                  Upgrade Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main Tracks View
  return (
    <div className="space-y-6">
      {/* Header with Search, Filter, and Upgrade */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-black/5 dark:border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              AI Advisory Tracks 📚
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              AI-driven educational tracks to refine your business models
            </p>
          </div>
          <Button className="bg-gradient-to-r from-[#76B947] to-[#5a8f35] text-white hover:from-[#5a8f35] hover:to-[#76B947] shadow-lg lg:self-start">
            <Sparkles className="mr-2 h-4 w-4" />
            Upgrade to Premium
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glass-card border-black/5 dark:border-white/10"
              style={{ fontFamily: 'var(--font-body)' }}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] glass-card border-black/5 dark:border-white/10">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="not-started">Not Started</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Total Tracks</p>
                <p className="text-2xl sm:text-3xl mt-1" style={{ fontFamily: 'var(--font-heading)' }}>{tracks.length}</p>
              </div>
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-[#76B947] mt-2 sm:mt-0" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="pt-4 sm:pt-6">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>In Progress</p>
              <p className="text-2xl sm:text-3xl mt-1 text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                {inProgressTracks}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="pt-4 sm:pt-6">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Completed</p>
              <p className="text-2xl sm:text-3xl mt-1 text-green-600" style={{ fontFamily: 'var(--font-heading)' }}>
                {completedTracks}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="pt-4 sm:pt-6">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Avg Progress</p>
              <p className="text-2xl sm:text-3xl mt-1" style={{ fontFamily: 'var(--font-heading)' }}>
                {Math.round(tracks.reduce((acc, t) => acc + t.progress, 0) / tracks.length)}%
              </p>
              <Progress value={Math.round(tracks.reduce((acc, t) => acc + t.progress, 0) / tracks.length)} className="mt-2 h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="glass-card grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="legal">Legal</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="pitch">Pitch</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Track List - Full Width */}
      <div className="space-y-4">
        {filteredTracks.map((track) => (
          <Card 
            key={track.id} 
            className="glass-card border-black/5 dark:border-white/10 cursor-pointer transition-all hover:shadow-lg hover:ring-2 hover:ring-[#76B947]/50"
            onClick={() => handleTrackClick(track)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xl sm:text-2xl">{getCategoryIcon(track.category).icon}</span>
                    <CardTitle className="text-base sm:text-lg" style={{ fontFamily: 'var(--font-heading)' }}>{track.title}</CardTitle>
                  </div>
                  <CardDescription className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                    {track.description}
                  </CardDescription>
                </div>
                <div className="ml-2">
                  {getStatusBadge(track.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center space-x-2 sm:space-x-4 text-muted-foreground">
                    <span className="flex items-center" style={{ fontFamily: 'var(--font-body)' }}>
                      <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      {track.modules} modules
                    </span>
                    <span className="flex items-center" style={{ fontFamily: 'var(--font-body)' }}>
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      {track.duration}
                    </span>
                  </div>
                  <span className="text-[#76B947] text-xs sm:text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
                    {track.progress}% complete
                  </span>
                </div>
                <Progress value={track.progress} className="h-2" />
                {track.status === 'not-started' ? (
                  <Button className="w-full bg-black dark:bg-[#76B947] text-white hover:bg-black/90 dark:hover:bg-[#76B947]/90 mt-2">
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Start Track
                  </Button>
                ) : track.status === 'completed' ? (
                  <Button className="w-full bg-green-600 text-white hover:bg-green-700 mt-2">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Review Materials
                  </Button>
                ) : (
                  <Button className="w-full bg-[#76B947] text-white hover:bg-[#76B947]/90 mt-2">
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Continue Learning
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}