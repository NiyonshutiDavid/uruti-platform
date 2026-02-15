import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send,
  MessageSquare,
  Calendar,
  Sparkles
} from 'lucide-react';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';

interface LandingContactProps {
  onNavigate: (page: string) => void;
}

export function LandingContact({ onNavigate }: LandingContactProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    userType: 'founder',
    subject: '',
    message: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log('Form submitted:', formData);
    setIsSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        userType: 'founder',
        subject: '',
        message: ''
      });
    }, 3000);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Us',
      detail: 'info@uruti.rw',
      link: 'mailto:info@uruti.rw',
      description: 'Get in touch for general inquiries'
    },
    {
      icon: Phone,
      title: 'Call Us',
      detail: '+250 788 000 000',
      link: 'tel:+250788000000',
      description: 'Mon-Fri from 9am to 6pm EAT'
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      detail: 'KG 11 Ave, Kigali',
      link: 'https://maps.google.com',
      description: 'Come visit our office'
    }
  ];

  const supportOptions = [
    {
      icon: MessageSquare,
      title: 'Live Chat Support',
      description: 'Chat with our team in real-time',
      action: 'Start Chat',
      onClick: () => onNavigate('login')
    },
    {
      icon: Calendar,
      title: 'Schedule a Demo',
      description: 'Book a personalized walkthrough',
      action: 'Book Demo',
      onClick: () => onNavigate('login')
    },
    {
      icon: Sparkles,
      title: 'Partnership Inquiry',
      description: 'Explore collaboration opportunities',
      action: 'Learn More',
      onClick: () => onNavigate('about')
    }
  ];

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950">
      <LandingHeader onNavigate={onNavigate} />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Get in <span className="text-[#76B947]">Touch</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto" style={{ fontFamily: 'var(--font-body)' }}>
            Have questions about Uruti? Want to partner with us? Our team is here to help you succeed.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {contactMethods.map((method, index) => (
              <a
                key={index}
                href={method.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Card className="glass-card border-black/5 dark:border-white/10 hover:border-[#76B947]/30 transition-all group h-full">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-[#76B947]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <method.icon className="h-7 w-7 text-[#76B947]" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                      {method.title}
                    </h3>
                    <p className="text-[#76B947] font-semibold mb-2" style={{ fontFamily: 'var(--font-body)' }}>
                      {method.detail}
                    </p>
                    <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                      {method.description}
                    </p>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="glass-card border-black/5 dark:border-white/10">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    Send us a message
                  </h2>
                  <p className="text-muted-foreground mb-6" style={{ fontFamily: 'var(--font-body)' }}>
                    Fill out the form below and we'll get back to you within 24 hours
                  </p>

                  {isSubmitted ? (
                    <div className="py-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#76B947]/10 flex items-center justify-center">
                        <Send className="h-8 w-8 text-[#76B947]" />
                      </div>
                      <h3 className="text-xl font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                        Message Sent!
                      </h3>
                      <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        Thank you for reaching out. We'll be in touch soon.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" style={{ fontFamily: 'var(--font-body)' }}>
                            Full Name *
                          </Label>
                          <Input
                            id="name"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            required
                            className="glass-card border-black/10 dark:border-white/10"
                            style={{ fontFamily: 'var(--font-body)' }}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" style={{ fontFamily: 'var(--font-body)' }}>
                            Email Address *
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            required
                            className="glass-card border-black/10 dark:border-white/10"
                            style={{ fontFamily: 'var(--font-body)' }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="userType" style={{ fontFamily: 'var(--font-body)' }}>
                          I am a... *
                        </Label>
                        <select
                          id="userType"
                          value={formData.userType}
                          onChange={(e) => handleChange('userType', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg glass-card border border-black/10 dark:border-white/10 bg-transparent dark:text-white"
                          style={{ fontFamily: 'var(--font-body)' }}
                          required
                        >
                          <option value="founder">Founder / Entrepreneur</option>
                          <option value="investor">Investor</option>
                          <option value="mentor">Mentor / Advisor</option>
                          <option value="partner">Potential Partner</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject" style={{ fontFamily: 'var(--font-body)' }}>
                          Subject *
                        </Label>
                        <Input
                          id="subject"
                          placeholder="What's this about?"
                          value={formData.subject}
                          onChange={(e) => handleChange('subject', e.target.value)}
                          required
                          className="glass-card border-black/10 dark:border-white/10"
                          style={{ fontFamily: 'var(--font-body)' }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" style={{ fontFamily: 'var(--font-body)' }}>
                          Message *
                        </Label>
                        <Textarea
                          id="message"
                          placeholder="Tell us more about your inquiry..."
                          value={formData.message}
                          onChange={(e) => handleChange('message', e.target.value)}
                          required
                          rows={6}
                          className="glass-card border-black/10 dark:border-white/10 resize-none"
                          style={{ fontFamily: 'var(--font-body)' }}
                        />
                      </div>

                      <Button 
                        type="submit"
                        size="lg"
                        className="w-full bg-[#76B947] text-white hover:bg-[#76B947]/90"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        <Send className="mr-2 h-5 w-5" />
                        Send Message
                      </Button>

                      <p className="text-xs text-muted-foreground text-center" style={{ fontFamily: 'var(--font-body)' }}>
                        By submitting this form, you agree to our Privacy Policy
                      </p>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Support Options Sidebar */}
            <div className="space-y-6">
              <Card className="glass-card border-black/5 dark:border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    Quick Support
                  </h3>
                  <div className="space-y-4">
                    {supportOptions.map((option, index) => (
                      <div key={index} className="p-4 rounded-lg bg-[#76B947]/5 hover:bg-[#76B947]/10 transition-colors group">
                        <div className="flex items-start space-x-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-[#76B947]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <option.icon className="h-5 w-5 text-[#76B947]" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                              {option.title}
                            </h4>
                            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                              {option.description}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-[#76B947] text-[#76B947] hover:bg-[#76B947]/10"
                          onClick={option.onClick}
                          style={{ fontFamily: 'var(--font-body)' }}
                        >
                          {option.action}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-black/5 dark:border-white/10 bg-gradient-to-br from-[#76B947]/10 to-purple-500/10">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    Looking for Support?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4" style={{ fontFamily: 'var(--font-body)' }}>
                    Check out our Help Center for instant answers to common questions
                  </p>
                  <Button
                    variant="outline"
                    className="w-full border-[#76B947] text-[#76B947] hover:bg-[#76B947]/10"
                    onClick={() => onNavigate('home')}
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    Visit Help Center
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section (Placeholder) */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[#76B947]/5">
        <div className="container mx-auto">
          <Card className="glass-card border-black/5 dark:border-white/10 overflow-hidden">
            <div className="h-96 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-16 w-16 text-[#76B947] mx-auto mb-4" />
                <p className="text-lg font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  Uruti Office Location
                </p>
                <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  KG 11 Ave, Kigali Innovation City, Rwanda
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Still have questions?
          </h2>
          <p className="text-lg text-muted-foreground mb-8" style={{ fontFamily: 'var(--font-body)' }}>
            Can't find the answer you're looking for? Our team is always happy to help.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg"
              className="bg-[#76B947] text-white hover:bg-[#76B947]/90"
              onClick={() => onNavigate('home')}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Browse FAQs
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-[#76B947] text-[#76B947] hover:bg-[#76B947]/10"
              onClick={() => onNavigate('login')}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Chat with Support
            </Button>
          </div>
        </div>
      </section>

      <LandingFooter onNavigate={onNavigate} />
    </div>
  );
}
