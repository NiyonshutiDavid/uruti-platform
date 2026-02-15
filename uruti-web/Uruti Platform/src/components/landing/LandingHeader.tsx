import { useState } from 'react';
import { Button } from '../ui/button';
import { Menu, X } from 'lucide-react';
import { UrutiLogo, UrutiLogoText } from '../UrutiLogo';

interface LandingHeaderProps {
  onNavigate: (page: string) => void;
}

export function LandingHeader({ onNavigate }: LandingHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Home', value: 'home' },
    { label: 'About', value: 'about' },
    { label: 'How It Works', value: 'how-it-works' },
    { label: 'Contact', value: 'contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-black/5 dark:border-white/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <button 
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2 group"
          >
            <UrutiLogo className="w-auto h-10 sm:h-12 group-hover:scale-110 transition-transform" />
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Button
                key={item.value}
                variant="ghost"
                className="text-base hover:bg-[#76B947]/10 dark:text-white"
                onClick={() => onNavigate(item.value)}
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {item.label}
              </Button>
            ))}
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Button
              variant="outline"
              className="border-[#76B947] text-[#76B947] hover:bg-[#76B947]/10"
              onClick={() => onNavigate('login')}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Sign In
            </Button>
            <Button
              className="bg-[#76B947] text-white hover:bg-[#76B947]/90"
              onClick={() => onNavigate('login')}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-[#76B947]/10"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-[#76B947]" />
            ) : (
              <Menu className="h-6 w-6 text-[#76B947]" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-black/5 dark:border-white/10">
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Button
                  key={item.value}
                  variant="ghost"
                  className="justify-start text-base hover:bg-[#76B947]/10 dark:text-white"
                  onClick={() => {
                    onNavigate(item.value);
                    setIsMobileMenuOpen(false);
                  }}
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {item.label}
                </Button>
              ))}
              <div className="pt-4 space-y-2">
                <Button
                  variant="outline"
                  className="w-full border-[#76B947] text-[#76B947] hover:bg-[#76B947]/10"
                  onClick={() => {
                    onNavigate('login');
                    setIsMobileMenuOpen(false);
                  }}
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Sign In
                </Button>
                <Button
                  className="w-full bg-[#76B947] text-white hover:bg-[#76B947]/90"
                  onClick={() => {
                    onNavigate('login');
                    setIsMobileMenuOpen(false);
                  }}
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Get Started
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}