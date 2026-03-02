import { Button } from '../ui/button';
import { Facebook, Twitter, Linkedin, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { UrutiLogo } from '../UrutiLogo';
import { SUPPORT_EMAIL } from '../../lib/contact-info';

interface LandingFooterProps {
  onNavigate: (page: string) => void;
}

export function LandingFooter({ onNavigate }: LandingFooterProps) {
  return (
    <footer className="glass-card border-t border-black/5 dark:border-white/10 mt-20 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12 max-w-[1920px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <UrutiLogo className="w-auto h-10" />
            </div>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Empowering Rwandan entrepreneurs with AI-driven tools to bridge the gap from ideation to investment funding.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="w-9 h-9 rounded-lg bg-[#76B947]/10 hover:bg-[#76B947]/20 flex items-center justify-center transition-colors">
                <Facebook className="h-4 w-4 text-[#76B947]" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-[#76B947]/10 hover:bg-[#76B947]/20 flex items-center justify-center transition-colors">
                <Twitter className="h-4 w-4 text-[#76B947]" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-[#76B947]/10 hover:bg-[#76B947]/20 flex items-center justify-center transition-colors">
                <Linkedin className="h-4 w-4 text-[#76B947]" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-[#76B947]/10 hover:bg-[#76B947]/20 flex items-center justify-center transition-colors">
                <Instagram className="h-4 w-4 text-[#76B947]" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Quick Links
            </h3>
            <ul className="space-y-2">
              {['Home', 'About', 'How It Works', 'Contact'].map((item) => (
                <li key={item}>
                  <button
                    onClick={() => onNavigate(item.toLowerCase().replace(/\s+/g, '-'))}
                    className="text-sm text-muted-foreground hover:text-[#76B947] transition-colors"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {item}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => onNavigate('/help-center')}
                  className="text-sm text-muted-foreground hover:text-[#76B947] transition-colors"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Help Center
                </button>
              </li>
            </ul>
          </div>

          {/* For Founders */}
          <div>
            <h3 className="font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              For Founders
            </h3>
            <ul className="space-y-2">
              {['Startup Hub', 'AI Advisory', 'Pitch Coach', 'Mentor Network'].map((item) => (
                <li key={item}>
                  <button
                    onClick={() => onNavigate('/login')}
                    className="text-sm text-muted-foreground hover:text-[#76B947] transition-colors"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* For Investors */}
          <div>
            <h3 className="font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              For Investors
            </h3>
            <ul className="space-y-2">
              {['Deal Flow', 'Verified Startups', 'Portfolio Tracking', 'Investment Analytics'].map((item) => (
                <li key={item}>
                  <button
                    onClick={() => onNavigate('/login')}
                    className="text-sm text-muted-foreground hover:text-[#76B947] transition-colors"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-[#76B947] mt-1 flex-shrink-0" />
                <span className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  KN 78 St, Kigali, Rwanda
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-[#76B947] flex-shrink-0" />
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm text-muted-foreground hover:text-[#76B947]" style={{ fontFamily: 'var(--font-body)' }}>
                  {SUPPORT_EMAIL}
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-[#76B947] flex-shrink-0" />
                <a href="tel:+250790636128" className="text-sm text-muted-foreground hover:text-[#76B947]" style={{ fontFamily: 'var(--font-body)' }}>
                  +250 790 636 128
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-black/5 dark:border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-sm text-muted-foreground text-center sm:text-left" style={{ fontFamily: 'var(--font-body)' }}>
              © {new Date().getFullYear()} Uruti Digital Ecosystem. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <button 
                onClick={() => onNavigate('/privacy-policy')}
                className="text-sm text-muted-foreground hover:text-[#76B947]" 
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => onNavigate('/terms-of-service')}
                className="text-sm text-muted-foreground hover:text-[#76B947]" 
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}