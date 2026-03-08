import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../lib/auth-context';

interface TourStep {
  target: string; // CSS selector or identifier
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  highlight?: boolean;
}

const FOUNDER_TOUR_STEPS: TourStep[] = [
  {
    target: 'sidebar-dashboard',
    title: 'Welcome to Uruti Digital Ecosystem! 🎉',
    description: 'Let\'s take a quick tour to help you get started with the platform and discover all the features available to accelerate your startup journey.',
    position: 'right',
    highlight: true
  },
  {
    target: 'sidebar-dashboard',
    title: 'Dashboard',
    description: 'Your central hub for tracking your startup\'s progress, investment readiness score, and key metrics at a glance.',
    position: 'right',
    highlight: true
  },
  {
    target: 'sidebar-startup-hub',
    title: 'Startup Hub',
    description: 'Manage your ventures, track milestones, and update your startup information. This is where you build your entrepreneurial portfolio.',
    position: 'right',
    highlight: true
  },
  {
    target: 'sidebar-pitch-coach',
    title: 'Pitch Coach',
    description: 'Record and analyze your pitch with AI-powered feedback. Get real-time insights to perfect your presentation for investors.',
    position: 'right',
    highlight: true
  },
  {
    target: 'sidebar-advisory-tracks',
    title: 'Advisory Tracks',
    description: 'Access curated learning paths designed to guide you through every stage of your startup journey, from ideation to scale.',
    position: 'right',
    highlight: true
  },
  {
    target: 'sidebar-ai-chat',
    title: 'AI Chat Assistant',
    description: 'Get instant guidance from your AI advisor. Ask questions about business strategy, funding, and startup best practices anytime.',
    position: 'right',
    highlight: true
  },
  {
    target: 'sidebar-connections',
    title: 'Build Connections',
    description: 'Network with investors and other founders. Schedule meetings, send messages, and grow your professional network.',
    position: 'right',
    highlight: true
  },
  {
    target: 'header-notifications',
    title: 'Stay Updated',
    description: 'Check notifications for important updates, messages, and milestone achievements. Never miss an opportunity!',
    position: 'bottom',
    highlight: true
  },
  {
    target: 'header-profile',
    title: 'Your Profile',
    description: 'Manage your account settings, update your profile, and access availability preferences here.',
    position: 'bottom',
    highlight: true
  }
];

const INVESTOR_TOUR_STEPS: TourStep[] = [
  {
    target: 'sidebar-dashboard',
    title: 'Welcome to Uruti Digital Ecosystem! 🎉',
    description: 'Let\'s take a quick tour to help you discover promising startups and manage your investment pipeline efficiently.',
    position: 'right',
    highlight: true
  },
  {
    target: 'sidebar-dashboard',
    title: 'Investor Dashboard',
    description: 'Your command center for tracking opportunities, portfolio performance, and key investment metrics at a glance.',
    position: 'right',
    highlight: true
  },
  {
    target: 'sidebar-profile',
    title: 'Your Investor Profile',
    description: 'Set up your investment thesis, preferred sectors, ticket size, and portfolio details. This helps us match you with relevant startups.',
    position: 'right',
    highlight: true
  },
  {
    target: 'sidebar-startup-discovery',
    title: 'Startup Discovery',
    description: 'Browse verified startups with Uruti Readiness Scores. Filter by sector, stage, funding ask, and more to find your perfect match.',
    position: 'right',
    highlight: true
  },
  {
    target: 'sidebar-deal-flow',
    title: 'Deal Flow Management',
    description: 'Track your entire investment pipeline from initial screening to term sheets. Move deals through stages and collaborate with co-investors.',
    position: 'right',
    highlight: true
  },
  {
    target: 'sidebar-connections',
    title: 'Network Directory',
    description: 'Connect with founders, fellow investors, and mentors. Schedule calls and build relationships within the ecosystem.',
    position: 'right',
    highlight: true
  },
  {
    target: 'sidebar-messages',
    title: 'Direct Messaging',
    description: 'Communicate with founders and other investors. Discuss opportunities, share insights, and coordinate meetings.',
    position: 'right',
    highlight: true
  },
  {
    target: 'sidebar-ai-chat',
    title: 'AI Investment Advisor',
    description: 'Get AI-powered market insights, startup analysis, and investment strategy recommendations tailored to your preferences.',
    position: 'right',
    highlight: true
  },
  {
    target: 'header-notifications',
    title: 'Stay Updated',
    description: 'Receive alerts about new funding rounds, pitch deck updates, founder messages, and deals moving through your pipeline.',
    position: 'bottom',
    highlight: true
  },
  {
    target: 'header-profile',
    title: 'Investor Settings',
    description: 'Manage your profile, investment preferences, notification settings, and view your investment portfolio.',
    position: 'bottom',
    highlight: true
  }
];

export function OnboardingTour() {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 264, height: 56 });
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('right');

  const tourSteps = user?.role === 'investor' ? INVESTOR_TOUR_STEPS : FOUNDER_TOUR_STEPS;

  // Check if user has completed the tour
  useEffect(() => {
    if (!user?.id) return;

    // Use email as fallback if id is not stable
    const tourKey = `uruti_tour_completed_${user.email}_${user.id}`;
    const tourCompleted = localStorage.getItem(tourKey);
    
    if (!tourCompleted) {
      // Small delay before showing tour to let the UI settle
      setTimeout(() => {
        setIsActive(true);
      }, 1000);
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    const handleStartTour = () => {
      setCurrentStep(0);
      setIsActive(true);
    };

    window.addEventListener('start-onboarding-tour', handleStartTour);
    return () => window.removeEventListener('start-onboarding-tour', handleStartTour);
  }, []);

  // Update position when step changes
  useEffect(() => {
    if (!isActive) return;

    const updatePosition = () => {
      const step = tourSteps[currentStep];
      let element: HTMLElement | null = null;

      // Try to find the element by data attribute or ID
      if (step.target.startsWith('sidebar-')) {
        const moduleName = step.target.replace('sidebar-', '');
        element = document.querySelector(`[data-module="${moduleName}"]`) as HTMLElement;
      } else if (step.target.startsWith('header-')) {
        const headerElement = step.target.replace('header-', '');
        element = document.querySelector(`[data-header="${headerElement}"]`) as HTMLElement;
      }

      if (element) {
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        // Store both position and dimensions
        setPosition({
          top: rect.top + scrollTop,
          left: rect.left + scrollLeft,
          width: rect.width,
          height: rect.height
        });
        setTooltipPosition(step.position);

        // Scroll element into view with better positioning
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });

        // Add a small delay to recalculate position after scroll
        setTimeout(() => {
          const updatedRect = element!.getBoundingClientRect();
          const updatedScrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const updatedScrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

          setPosition({
            top: updatedRect.top + updatedScrollTop,
            left: updatedRect.left + updatedScrollLeft,
            width: updatedRect.width,
            height: updatedRect.height
          });
        }, 500);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    
    return () => window.removeEventListener('resize', updatePosition);
  }, [currentStep, isActive, tourSteps]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    if (user?.id && user?.email) {
      // Use email as fallback if id is not stable
      const tourKey = `uruti_tour_completed_${user.email}_${user.id}`;
      localStorage.setItem(tourKey, 'true');
    }
    setIsActive(false);
  };

  const skipTour = () => {
    completeTour();
  };

  if (!isActive || !user) return null;

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  // Calculate tooltip position based on target position
  const getTooltipStyle = () => {
    const margin = 20; // Minimum margin from screen edges
    const tooltipMaxWidth = 400;
    
    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      zIndex: 100001,
      maxWidth: `${tooltipMaxWidth}px`,
    };

    let style: React.CSSProperties = { ...baseStyle };

    switch (tooltipPosition) {
      case 'right':
        style.left = `${position.left + position.width + 20}px`;
        style.top = `${position.top}px`;
        
        // Check if tooltip goes beyond right edge
        const rightEdge = position.left + position.width + 20 + tooltipMaxWidth;
        if (rightEdge > window.innerWidth - margin) {
          // Reposition to left side
          style.left = 'auto';
          style.right = `${window.innerWidth - position.left + 20}px`;
        }
        
        // Check vertical bounds
        if (position.top < margin) {
          style.top = `${margin}px`;
        } else if (position.top > window.innerHeight - 300) {
          style.top = `${window.innerHeight - 320}px`;
        }
        break;
        
      case 'left':
        style.right = `${window.innerWidth - position.left + 20}px`;
        style.top = `${position.top}px`;
        
        // Check vertical bounds
        if (position.top < margin) {
          style.top = `${margin}px`;
        } else if (position.top > window.innerHeight - 300) {
          style.top = `${window.innerHeight - 320}px`;
        }
        break;
        
      case 'bottom':
        style.left = `${position.left}px`;
        style.top = `${position.top + position.height + 20}px`;
        
        // Check horizontal bounds
        if (position.left < margin) {
          style.left = `${margin}px`;
        } else if (position.left + tooltipMaxWidth > window.innerWidth - margin) {
          style.left = `${window.innerWidth - tooltipMaxWidth - margin}px`;
        }
        
        // Check if tooltip goes beyond bottom edge
        const bottomEdge = position.top + position.height + 20 + 300;
        if (bottomEdge > window.innerHeight - margin) {
          // Reposition to top
          style.top = `${position.top - 320}px`;
        }
        break;
        
      case 'top':
        style.left = `${position.left}px`;
        style.bottom = `${window.innerHeight - position.top + 20}px`;
        
        // Check horizontal bounds
        if (position.left < margin) {
          style.left = `${margin}px`;
        } else if (position.left + tooltipMaxWidth > window.innerWidth - margin) {
          style.left = `${window.innerWidth - tooltipMaxWidth - margin}px`;
        }
        break;
        
      default:
        style = baseStyle;
    }

    return style;
  };

  return (
    <>
      {/* Dark overlay with cut-out for highlighted element */}
      {step.highlight && (
        <div 
          className="fixed inset-0 z-[100000]"
          style={{ pointerEvents: 'none' }}
        >
          {/* Use box-shadow to create spotlight effect - keeps highlighted area transparent */}
          <div
            className="fixed pointer-events-none"
            style={{
              top: `${position.top - 8}px`,
              left: `${position.left - 8}px`,
              width: `${position.width + 16}px`,
              height: `${position.height + 16}px`,
              boxShadow: `
                0 0 0 9999px rgba(0, 0, 0, 0.4),
                0 0 0 4px rgba(118, 185, 71, 0.9),
                0 0 20px 4px rgba(118, 185, 71, 0.5)
              `,
              borderRadius: '12px',
              transition: 'all 0.3s ease-in-out',
            }}
          />
        </div>
      )}
      
      {/* Fallback dark overlay if no highlight */}
      {!step.highlight && (
        <div 
          className="fixed inset-0 bg-black/40 z-[100000]"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Tooltip */}
      <div
        style={getTooltipStyle()}
        className="animate-in fade-in slide-in-from-left-2 duration-300 z-[100003]"
      >
        <div className="bg-black/95 backdrop-blur-xl border-2 border-[#76B947] rounded-xl shadow-2xl overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-white/10">
            <div 
              className="h-full bg-gradient-to-r from-[#76B947] to-[#5a8f37] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-['Inter_Tight'] text-xl font-bold text-white mb-2">
                  {step.title}
                </h3>
                <p className="font-['Century_Gothic'] text-sm text-gray-300 leading-relaxed">
                  {step.description}
                </p>
              </div>
              <button
                onClick={skipTour}
                className="ml-4 p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-1">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === currentStep
                        ? 'w-8 bg-[#76B947]'
                        : index < currentStep
                        ? 'w-1.5 bg-[#76B947]/50'
                        : 'w-1.5 bg-white/20'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {currentStep === 0 ? (
                  <Button
                    onClick={skipTour}
                    variant="ghost"
                    className="text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    Skip Tour
                  </Button>
                ) : (
                  <Button
                    onClick={handlePrevious}
                    variant="ghost"
                    className="text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                )}
                
                <Button
                  onClick={handleNext}
                  className="bg-[#76B947] hover:bg-[#5a8f37] text-black font-semibold"
                >
                  {currentStep === tourSteps.length - 1 ? (
                    "Get Started!"
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Step counter */}
            <div className="mt-4 text-center">
              <span className="text-xs text-gray-500 font-['Century_Gothic']">
                Step {currentStep + 1} of {tourSteps.length}
              </span>
            </div>
          </div>
        </div>

        {/* Arrow pointer */}
        <div 
          className={`absolute w-0 h-0 border-8 ${
            tooltipPosition === 'right' 
              ? '-left-4 top-8 border-transparent border-r-[#76B947]' 
              : tooltipPosition === 'left'
              ? '-right-4 top-8 border-transparent border-l-[#76B947]'
              : tooltipPosition === 'bottom'
              ? 'left-8 -top-4 border-transparent border-b-[#76B947]'
              : 'left-8 -bottom-4 border-transparent border-t-[#76B947]'
          }`}
        />
      </div>
    </>
  );
}