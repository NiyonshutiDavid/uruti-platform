import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from './api-client';

export interface AdvisoryMaterial {
  id: number;
  title: string;
  description: string;
  category: 'business-model' | 'market-validation' | 'fundraising' | 'product-development' | 'legal-compliance' | 'team-building';
  content: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  resources?: string[];
  created_at: string;
  created_by: 'system' | 'admin';
}

interface AdvisoryContextType {
  materials: AdvisoryMaterial[];
  loading: boolean;
  addMaterial: (material: Omit<AdvisoryMaterial, 'id' | 'created_at'>) => Promise<void>;
  removeMaterial: (id: number) => Promise<void>;
  updateMaterial: (id: number, updates: Partial<AdvisoryMaterial>) => Promise<void>;
  getMaterialsByCategory: (category: string) => AdvisoryMaterial[];
  refreshMaterials: () => Promise<void>;
}

// Default materials that come with the system
const defaultMaterials: AdvisoryMaterial[] = [
  {
    id: 1,
    title: 'Building Your Business Model Canvas',
    description: 'Learn how to create a comprehensive business model canvas for your startup.',
    category: 'business-model',
    content: `# Building Your Business Model Canvas

## Introduction
The Business Model Canvas is a strategic management template for developing new business models or documenting existing ones. It's a visual chart with elements describing a firm's value proposition, infrastructure, customers, and finances.

## Key Components

### 1. Customer Segments
Identify who your customers are. Different groups of people or organizations your startup aims to reach and serve.

**Questions to ask:**
- Who are our most important customers?
- What are their needs and wants?
- How do they prefer to interact with us?

### 2. Value Proposition
What unique value do you deliver to customers? This is the reason why customers choose you over competitors.

**Focus on:**
- Problem solving
- Performance improvement
- Customization
- Cost reduction
- Risk reduction

### 3. Channels
How do you reach your customers and deliver your value proposition?

**Consider:**
- Direct sales
- Online platforms
- Retail distribution
- Partner channels

### 4. Customer Relationships
What type of relationship does each customer segment expect?

**Types:**
- Personal assistance
- Self-service
- Automated services
- Communities

### 5. Revenue Streams
How does your business earn money?

**Revenue models:**
- Product sales
- Subscription fees
- Licensing
- Advertising
- Freemium

### 6. Key Resources
What assets are required to deliver your value proposition?

**Categories:**
- Physical (equipment, buildings)
- Intellectual (patents, data)
- Human (talent, expertise)
- Financial (capital, credit lines)

### 7. Key Activities
What are the most important activities in executing your business model?

**Examples:**
- Product development
- Marketing and sales
- Customer support
- Platform management

### 8. Key Partnerships
Who are your key partners and suppliers?

**Partnership types:**
- Strategic alliances
- Joint ventures
- Supplier relationships
- Co-opetition

### 9. Cost Structure
What are the major costs in operating your business?

**Consider:**
- Fixed costs
- Variable costs
- Economies of scale
- Economies of scope

## Action Steps

1. **Download a canvas template** or use an online tool
2. **Start with customer segments** - who are you serving?
3. **Define your value proposition** - what problem are you solving?
4. **Work through each section** systematically
5. **Validate assumptions** with real customer feedback
6. **Iterate and refine** based on learnings

## Resources
- Strategyzer.com - Official BMC tools
- "Business Model Generation" by Alexander Osterwalder
- Online canvas templates and examples

## Next Steps
After completing your canvas:
1. Test your assumptions
2. Gather customer feedback
3. Iterate on weak points
4. Prepare for pitch presentations`,
    duration: '45 min',
    difficulty: 'beginner',
    resources: [
      'Business Model Canvas Template (PDF)',
      'Video: BMC Explained in 10 Minutes',
      'Case Study: Successful Startups'
    ],
    created_at: new Date().toISOString(),
    created_by: 'system'
  },
  {
    id: 2,
    title: 'Market Research & Validation Strategies',
    description: 'Discover effective methods to validate your market and understand customer needs.',
    category: 'market-validation',
    content: `# Market Research & Validation Strategies

## Why Market Validation Matters

Market validation is the process of testing your business idea with real potential customers before fully launching. It helps you:
- Reduce risk and wasted resources
- Understand real customer needs
- Refine your value proposition
- Build investor confidence

## Research Methods

### 1. Customer Interviews
**Goal:** Understand pain points and needs

**Best Practices:**
- Conduct 20-50 interviews minimum
- Ask open-ended questions
- Listen more than you talk
- Focus on problems, not solutions
- Record (with permission) for analysis

**Sample Questions:**
- "Tell me about the last time you experienced [problem]"
- "How do you currently solve this problem?"
- "What's the biggest challenge with existing solutions?"
- "If you had a magic wand, what would the perfect solution look like?"

### 2. Surveys
**Goal:** Gather quantitative data at scale

**Tips:**
- Keep it short (5-10 minutes max)
- Use clear, unbiased language
- Mix question types (multiple choice, scales, open-ended)
- Offer incentives for completion
- Aim for 200+ responses for statistical significance

**Tools:**
- Google Forms (Free)
- Typeform (User-friendly)
- SurveyMonkey (Advanced features)

### 3. Landing Page Tests
**Goal:** Measure interest and capture leads

**Setup:**
1. Create a simple landing page explaining your solution
2. Include compelling value proposition
3. Add email signup form
4. Drive traffic through ads or social media
5. Track conversion rates

**Success Metrics:**
- 5-10% conversion = Good interest
- 10-20% = Strong interest
- 20%+ = Excellent interest

### 4. Minimum Viable Product (MVP)
**Goal:** Test core functionality with real users

**MVP Approaches:**
- **Concierge MVP:** Manually deliver the service
- **Wizard of Oz:** Fake automation with manual backend
- **Landing Page:** Test concept before building
- **Prototype:** Basic working version

### 5. Competitor Analysis
**Goal:** Understand the competitive landscape

**Research:**
- Identify direct and indirect competitors
- Analyze their strengths and weaknesses
- Study their customer reviews
- Understand their pricing models
- Find gaps in the market

## Validation Framework

### Step 1: Problem Validation
✓ Does this problem exist?
✓ How painful is it?
✓ How often does it occur?
✓ Are people actively seeking solutions?

### Step 2: Solution Validation
✓ Does our solution solve the problem?
✓ Is it better than alternatives?
✓ Would customers switch to our solution?
✓ What's the adoption friction?

### Step 3: Market Size Validation
✓ How many people have this problem?
✓ What's the Total Addressable Market (TAM)?
✓ What's the Serviceable Available Market (SAM)?
✓ What's the Serviceable Obtainable Market (SOM)?

### Step 4: Willingness to Pay
✓ Would customers pay for this?
✓ How much would they pay?
✓ What pricing model works best?
✓ What's the perceived value?

## Red Flags to Watch For

🚩 People say "That's interesting" but don't take action
🚩 Friends/family are your only positive feedback
🚩 No one is willing to pay
🚩 Market is too small or too saturated
🚩 Customer acquisition cost > Lifetime value

## Green Lights

✅ Customers show strong emotional response
✅ People ask "When can I buy this?"
✅ Early adopters emerge naturally
✅ Word-of-mouth referrals happen
✅ Clear differentiation from competitors

## Action Plan

1. **Week 1-2:** Conduct 20 customer interviews
2. **Week 3:** Analyze feedback and refine concept
3. **Week 4:** Create landing page and run ads
4. **Week 5-6:** Build and test MVP with 10-20 users
5. **Week 7-8:** Iterate based on feedback
6. **Week 9-10:** Validate pricing and business model

## Resources
- "The Mom Test" by Rob Fitzpatrick
- "Running Lean" by Ash Maurya
- YCombinator's Startup School videos
- Customer validation templates and scripts

Remember: The goal is to fail fast and learn quickly. Better to invalidate a bad idea early than waste years building something nobody wants!`,
    duration: '60 min',
    difficulty: 'intermediate',
    resources: [
      'Customer Interview Script Template',
      'Survey Design Checklist',
      'MVP Planning Worksheet'
    ],
    created_at: new Date().toISOString(),
    created_by: 'system'
  },
  {
    id: 3,
    title: 'Fundraising Fundamentals',
    description: 'Master the art of raising capital for your startup from angels to VCs.',
    category: 'fundraising',
    content: `# Fundraising Fundamentals

## Understanding the Fundraising Landscape

### Investment Stages

**1. Pre-Seed ($10K - $500K)**
- Founders, friends, family
- Angel investors
- Accelerators
- Purpose: Validate idea, build MVP

**2. Seed ($500K - $2M)**
- Angel investors
- Seed VCs
- Crowdfunding
- Purpose: Product-market fit, early traction

**3. Series A ($2M - $15M)**
- Venture Capital firms
- Purpose: Scale proven model

**4. Series B+ ($15M+)**
- Later-stage VCs
- Private equity
- Purpose: Aggressive growth

## Preparing for Fundraising

### 1. Build a Compelling Pitch Deck

**Essential Slides:**
1. **Problem:** What pain point are you solving?
2. **Solution:** Your unique approach
3. **Market Opportunity:** TAM, SAM, SOM
4. **Product:** Demo or screenshots
5. **Traction:** Metrics, growth, customers
6. **Business Model:** How you make money
7. **Competition:** Competitive advantage
8. **Team:** Why you'll win
9. **Financials:** Projections, unit economics
10. **Ask:** How much, use of funds

### 2. Perfect Your Pitch

**Structure (10-15 minutes):**
- Hook (30 seconds): Grab attention
- Problem (2 min): Make it relatable
- Solution (3 min): Show your innovation
- Market (2 min): Demonstrate opportunity
- Traction (3 min): Prove progress
- Team (2 min): Build confidence
- Ask (2 min): Clear request

**Practice Tips:**
- Rehearse 50+ times
- Record yourself
- Get feedback from mentors
- Anticipate questions
- Keep backup slides

### 3. Key Metrics Investors Care About

**For SaaS:**
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- CAC/LTV Ratio (should be 1:3 or better)
- Churn Rate (< 5% monthly is good)
- Net Revenue Retention

**For Marketplaces:**
- Gross Merchandise Volume (GMV)
- Take Rate
- Number of active buyers/sellers
- Repeat purchase rate
- Supply/demand balance

**For Consumer:**
- Daily/Monthly Active Users
- Engagement metrics
- Viral coefficient
- Retention curves
- Path to monetization

## The Fundraising Process

### Phase 1: Preparation (4-6 weeks)
- Create pitch deck
- Build financial model
- Prepare data room
- Research investors
- Get warm introductions

### Phase 2: Outreach (2-3 weeks)
- Send pitch deck to 50-100 investors
- Secure 20-30 initial meetings
- Follow up consistently
- Track all interactions in CRM

### Phase 3: Meetings (4-8 weeks)
- First meeting: 30 min intro
- Partner meeting: 1 hour deep dive
- Due diligence: 2-4 weeks
- Multiple rounds with different partners

### Phase 4: Term Sheet (1-2 weeks)
- Review offers
- Negotiate terms
- Consult with lawyer
- Don't accept first offer immediately

### Phase 5: Closing (4-6 weeks)
- Legal due diligence
- Final documentation
- Board approval
- Wire transfer

**Total Timeline: 3-6 months**

## Term Sheet Essentials

### Key Terms to Understand

**Valuation:**
- Pre-money vs Post-money
- Dilution calculation
- Option pool size

**Investment Type:**
- Equity
- Convertible note
- SAFE (Simple Agreement for Future Equity)

**Investor Rights:**
- Board seats
- Voting rights
- Information rights
- Pro-rata rights

**Liquidation Preference:**
- 1x non-participating (standard)
- Participating (avoid if possible)
- Multiple preference (red flag)

**Anti-dilution:**
- Weighted average (founder-friendly)
- Full ratchet (investor-friendly, avoid)

## Red Flags to Avoid

🚩 Investors who ghost after meetings
🚩 Asking for exclusivity too early
🚩 Unclear about investment process
🚩 Bad reputation in founder community
🚩 Excessive control terms
🚩 Unreasonable timelines

## Green Flags

✅ Quick decision-making process
✅ Supportive, value-add partners
✅ Strong portfolio and track record
✅ Collaborative negotiation style
✅ Enthusiasm about your vision
✅ Willing to lead the round

## Alternative Funding Options

**1. Bootstrapping**
- Pros: Full control, no dilution
- Cons: Slower growth, personal risk

**2. Revenue-Based Financing**
- Pros: No equity given up, flexible repayment
- Cons: Takes percentage of revenue

**3. Grants & Competitions**
- Pros: Non-dilutive capital
- Cons: Time-intensive, competitive

**4. Crowdfunding**
- Pros: Validates market, builds community
- Cons: Public failure risk, time-intensive

**5. Strategic Investors**
- Pros: Industry expertise, partnerships
- Cons: Potential conflicts of interest

## Investor Outreach Email Template

Subject: [Mutual Connection] Introduction - [Your Startup]

Hi [Investor Name],

[Mutual connection] suggested I reach out. We're building [one-liner description] and recently achieved [impressive traction metric].

Key highlights:
- [Metric 1]
- [Metric 2]
- [Notable customer/partnership]

We're raising [amount] to [specific use of funds] and would love to get your thoughts.

Would you be open to a brief call?

Best,
[Your Name]

## Post-Funding Best Practices

1. **Communicate regularly** with investors
2. **Use funds wisely** according to plan
3. **Hit milestones** you committed to
4. **Build relationships** with other portfolio founders
5. **Leverage investor network** for hiring, partnerships
6. **Start preparing** for next round early

## Resources
- "Venture Deals" by Brad Feld
- "The Secrets of Sand Hill Road" by Scott Kupor
- Carta for cap table management
- DocSend for pitch deck analytics
- AngelList for investor connections

Remember: Fundraising is a means to an end, not the end goal. Stay focused on building a great product and delighting customers!`,
    duration: '75 min',
    difficulty: 'advanced',
    resources: [
      'Pitch Deck Template',
      'Financial Model Template',
      'Term Sheet Explainer'
    ],
    created_at: new Date().toISOString(),
    created_by: 'system'
  }
];

const AdvisoryContext = createContext<AdvisoryContextType | undefined>(undefined);

export function AdvisoryProvider({ children }: { children: ReactNode }) {
  const [materials, setMaterials] = useState<AdvisoryMaterial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load materials from localStorage or use defaults
  useEffect(() => {
    const storedMaterials = localStorage.getItem('uruti_advisory_materials');
    if (storedMaterials) {
      setMaterials(JSON.parse(storedMaterials));
      setLoading(false);
    } else {
      setMaterials(defaultMaterials);
      localStorage.setItem('uruti_advisory_materials', JSON.stringify(defaultMaterials));
      setLoading(false);
    }
  }, []);

  // Save to localStorage whenever materials change
  useEffect(() => {
    if (materials.length > 0) {
      localStorage.setItem('uruti_advisory_materials', JSON.stringify(materials));
    }
  }, [materials]);

  const addMaterial = async (material: Omit<AdvisoryMaterial, 'id' | 'created_at'>) => {
    const newMaterial: AdvisoryMaterial = {
      ...material,
      id: Date.now(),
      created_at: new Date().toISOString(),
    };
    setMaterials(prev => [...prev, newMaterial]);
    await apiClient.post('/advisory-materials', newMaterial);
  };

  const removeMaterial = async (id: number) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
    await apiClient.delete(`/advisory-materials/${id}`);
  };

  const updateMaterial = async (id: number, updates: Partial<AdvisoryMaterial>) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    await apiClient.put(`/advisory-materials/${id}`, updates);
  };

  const getMaterialsByCategory = (category: string) => {
    return materials.filter(m => m.category === category);
  };

  const refreshMaterials = async () => {
    setLoading(true);
    const response = await apiClient.get('/advisory-materials');
    setMaterials(response.data);
    setLoading(false);
  };

  return (
    <AdvisoryContext.Provider value={{
      materials,
      loading,
      addMaterial,
      removeMaterial,
      updateMaterial,
      getMaterialsByCategory,
      refreshMaterials
    }}>
      {children}
    </AdvisoryContext.Provider>
  );
}

export function useAdvisory() {
  const context = useContext(AdvisoryContext);
  if (context === undefined) {
    throw new Error('useAdvisory must be used within an AdvisoryProvider');
  }
  return context;
}