import { useState, useEffect, useRef } from 'react';
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
  X,
  User,
  CheckCircle,
  Minimize2,
  Maximize2,
  Calendar,
  Handshake,
  Map,
  Eye
} from 'lucide-react';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';
import { LiveChatWidget } from '../LiveChatWidget';
import { useSupport } from '../../lib/support-context';
import { ScrollArea } from '../ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { toast } from 'sonner';

interface LandingContactProps {
  onNavigate: (page: string) => void;
}

export function LandingContact({ onNavigate }: LandingContactProps) {
  const { sendMessage, getVisitorMessages } = useSupport();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorName, setVisitorName] = useState('');
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
  }>>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const notifiedResponseIds = useRef<Set<number>>(new Set());

  // Contact form state
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    role: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [show360View, setShow360View] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Poll backend for support conversation updates so visitor receives admin replies
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
                  toast.info(' New reply from Uruti Support');
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

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create mailto link with form data
      const subject = encodeURIComponent(`Contact Form: ${formData.subject}`);
      const body = encodeURIComponent(
        `Name: ${formData.fullname}\n` +
        `Email: ${formData.email}\n` +
        `Role: ${formData.role}\n` +
        `Subject: ${formData.subject}\n\n` +
        `Message:\n${formData.message}`
      );
      
      // Open default email client
      window.location.href = `mailto:uruti.info@gmail.com?subject=${subject}&body=${body}`;
      
      // Show custom success modal
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    // Reset form
    setFormData({
      fullname: '',
      email: '',
      role: '',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950">
      <LandingHeader onNavigate={onNavigate} />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl lg:text-6xl font-bold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Get in <span className="text-[#76B947]">Touch</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-body)' }}>
              Have questions about Uruti? Want to partner with us? Our team is here to help you succeed.
            </p>
          </div>

          {/* Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {/* Email Us */}
            <div className="glass-card border-black/5 dark:border-white/10 rounded-xl p-8 text-center hover:bg-[#76B947]/5 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#76B947]/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-[#76B947]" />
              </div>
              <h3 className="font-semibold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Email Us
              </h3>
              <a 
                href="mailto:uruti.info@gmail.com"
                className="text-sm text-[#76B947] mb-1 hover:underline block" 
                style={{ fontFamily: 'var(--font-body)' }}
              >
                uruti.info@gmail.com
              </a>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                Get in touch for general inquiries
              </p>
            </div>

            {/* Call Us */}
            <div className="glass-card border-black/5 dark:border-white/10 rounded-xl p-8 text-center hover:bg-[#76B947]/5 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#76B947]/10 flex items-center justify-center mx-auto mb-4">
                <Phone className="h-6 w-6 text-[#76B947]" />
              </div>
              <h3 className="font-semibold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Call Us
              </h3>
              <a 
                href="tel:+250790636128"
                className="text-sm text-[#76B947] mb-1 hover:underline block" 
                style={{ fontFamily: 'var(--font-body)' }}
              >
                +250 790 636 128
              </a>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                Mon-Fri from 9am to 5pm EAT
              </p>
            </div>

            {/* Visit Us */}
            <div className="glass-card border-black/5 dark:border-white/10 rounded-xl p-8 text-center hover:bg-[#76B947]/5 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#76B947]/10 flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-6 w-6 text-[#76B947]" />
              </div>
              <h3 className="font-semibold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Visit Us
              </h3>
              <p className="text-sm text-[#76B947] mb-1" style={{ fontFamily: 'var(--font-body)' }}>
                KN 78 St, Kigali
              </p>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                Norrsken House Kigali
              </p>
            </div>
          </div>

          {/* Main Content - Form and Quick Support */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contact Form - Takes 2 columns */}
            <div className="lg:col-span-2">
              <div className="glass-card border-black/5 dark:border-white/10 rounded-xl p-8">
                <h3 className="text-2xl font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  Send us a message
                </h3>
                <p className="text-sm text-muted-foreground mb-8" style={{ fontFamily: 'var(--font-body)' }}>
                  Fill out the form below and we'll get back to you within 24 hours
                </p>
                
                <form className="space-y-6" onSubmit={handleSubmitForm}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullname" className="text-sm dark:text-white" style={{ fontFamily: 'var(--font-body)' }}>
                        Full Name *
                      </Label>
                      <Input
                        id="fullname"
                        placeholder="John Doe"
                        value={formData.fullname}
                        onChange={(e) => handleFormChange('fullname', e.target.value)}
                        className="glass-card border-black/10 dark:border-white/10 dark:text-white placeholder:text-gray-500 focus:border-[#76B947]"
                        style={{ fontFamily: 'var(--font-body)' }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm dark:text-white" style={{ fontFamily: 'var(--font-body)' }}>
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                        className="glass-card border-black/10 dark:border-white/10 dark:text-white placeholder:text-gray-500 focus:border-[#76B947]"
                        style={{ fontFamily: 'var(--font-body)' }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm dark:text-white" style={{ fontFamily: 'var(--font-body)' }}>
                      I am a... *
                    </Label>
                    <Select value={formData.role} onValueChange={(value: string) => handleFormChange('role', value)}>
                      <SelectTrigger className="glass-card border-black/10 dark:border-white/10 dark:text-white focus:border-[#76B947]">
                        <SelectValue placeholder="Founder / Entrepreneur" />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-black/10 dark:border-white/10 dark:text-white">
                        <SelectItem value="founder">Founder / Entrepreneur</SelectItem>
                        <SelectItem value="investor">Investor</SelectItem>
                        <SelectItem value="mentor">Mentor</SelectItem>
                        <SelectItem value="partner">Potential Partner</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm dark:text-white" style={{ fontFamily: 'var(--font-body)' }}>
                      Subject *
                    </Label>
                    <Input
                      id="subject"
                      placeholder="What's this about?"
                      value={formData.subject}
                      onChange={(e) => handleFormChange('subject', e.target.value)}
                      className="glass-card border-black/10 dark:border-white/10 dark:text-white placeholder:text-gray-500 focus:border-[#76B947]"
                      style={{ fontFamily: 'var(--font-body)' }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm dark:text-white" style={{ fontFamily: 'var(--font-body)' }}>
                      Message *
                    </Label>
                    <Textarea
                      id="message"
                      rows={5}
                      placeholder="Tell us more about your inquiry..."
                      value={formData.message}
                      onChange={(e) => handleFormChange('message', e.target.value)}
                      className="glass-card border-black/10 dark:border-white/10 dark:text-white placeholder:text-gray-500 resize-none focus:border-[#76B947]"
                      style={{ fontFamily: 'var(--font-body)' }}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#76B947] text-white hover:bg-[#5a8f35] h-12 text-base"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    <Send className="mr-2 h-5 w-5" />
                    Send Message
                  </Button>
                  
                  <p className="text-xs text-center text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    By submitting this form, you agree to our Privacy Policy
                  </p>
                </form>
              </div>
            </div>

            {/* Quick Support - Takes 1 column */}
            <div className="space-y-6">
              {/* Quick Support Options */}
              <div className="glass-card border-black/5 dark:border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-6 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  Quick Support
                </h3>
                
                <div className="space-y-4">
                  {/* Live Chat Support */}
                  <div className="glass-panel rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#76B947]/10 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="h-4 w-4 text-[#76B947]" />
                      </div>
                      <div>
                        <h4 className="font-semibold dark:text-white mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                          Live Chat Support
                        </h4>
                        <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                          Chat with our team in real-time
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setIsChatOpen(true)}
                      variant="outline" 
                      className="w-full border-[#76B947] text-[#76B947] hover:bg-[#76B947]/10"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      Start Chat
                    </Button>
                  </div>

                  {/* Schedule a Demo */}
                  <div className="glass-panel rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#76B947]/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-4 w-4 text-[#76B947]" />
                      </div>
                      <div>
                        <h4 className="font-semibold dark:text-white mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                          Schedule a Demo
                        </h4>
                        <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                          Book a personalized walkthrough
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full border-[#76B947] text-[#76B947] hover:bg-[#76B947]/10"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      Book Demo
                    </Button>
                  </div>

                  {/* Partnership Inquiry */}
                  <div className="glass-panel rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#76B947]/10 flex items-center justify-center flex-shrink-0">
                        <Handshake className="h-4 w-4 text-[#76B947]" />
                      </div>
                      <div>
                        <h4 className="font-semibold dark:text-white mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                          Partnership Inquiry
                        </h4>
                        <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                          Explore collaboration opportunities
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full border-[#76B947] text-[#76B947] hover:bg-[#76B947]/10"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>

              {/* Looking for Support */}
              <div className="glass-card border-black/5 dark:border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  Looking for Support?
                </h3>
                <p className="text-sm text-muted-foreground mb-4" style={{ fontFamily: 'var(--font-body)' }}>
                  Check out our Help Center for instant answers to common questions
                </p>
                <Button 
                  onClick={() => onNavigate('/help-center')}
                  variant="outline" 
                  className="w-full border-black/10 dark:border-white/10 hover:bg-[#76B947]/10"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Visit Help Center
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="text-center flex-1">
              <h2 className="text-3xl font-bold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Find Us on the <span className="text-[#76B947]">Map</span>
              </h2>
              <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                Visit us at Norrsken House Kigali, KN 78 St
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="glass-card border-black/5 dark:border-white/10 rounded-xl overflow-hidden">
              {!show360View ? (
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7975.010097222076!2d30.05702314267635!3d-1.9511712190312187!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dca5a86d814c61%3A0x7d3b83e12b1c11a9!2sNorrsken%20House%20Kigali!5e0!3m2!1sen!2srw!4v1771858812928!5m2!1sen!2srw" 
                  width="100%" 
                  height="450" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full"
                />
              ) : (
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!4v1771859068724!6m8!1m7!1sec-gwKLfQnIclwqPMNdEYw!2m2!1d-1.951269825625399!2d30.06023463826967!3f295.61776734291783!4f-0.15314041100700138!5f0.7820865974627469" 
                  width="100%" 
                  height="450" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full"
                />
              )}
            </div>

            {/* Toggle Button */}
            <div className="absolute top-4 right-4">
              <Button
                onClick={() => setShow360View(!show360View)}
                className="bg-[#76B947] text-white hover:bg-[#5a8f35] shadow-lg"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {show360View ? (
                  <>
                    <Map className="mr-2 h-5 w-5" />
                    Map View
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-5 w-5" />
                    360° View
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter onNavigate={onNavigate} />

      {/* Collapsible Live Chat Widget - Right Side */}
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
                  >
                    {isChatMinimized ? (
                      <Maximize2 className="h-4 w-4" />
                    ) : (
                      <Minimize2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsChatOpen(false)}
                    className="text-white hover:bg-white/20"
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
                          onChange={(e) => setVisitorName(e.target.value)}
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
                          onChange={(e) => setVisitorEmail(e.target.value)}
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
                            onChange={(e) => setCurrentMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="glass-card border-black/5 dark:border-white/10 shadow-2xl w-full max-w-md">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#76B947]/10 flex items-center justify-center mb-4">
                  <CheckCircle className="h-10 w-10 text-[#76B947]" />
                </div>
                <h3 className="text-2xl font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  Message Sent Successfully!
                </h3>
                <p className="text-sm text-muted-foreground mb-6" style={{ fontFamily: 'var(--font-body)' }}>
                  Your email client has been opened with your message. We'll get back to you within 24 hours.
                </p>
                <Button
                  onClick={handleCloseSuccessModal}
                  className="w-full bg-[#76B947] text-white hover:bg-[#5a8f35] h-12 text-base"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  OK
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <LiveChatWidget onNavigate={onNavigate} />
    </div>
  );
}