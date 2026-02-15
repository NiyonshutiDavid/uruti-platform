import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Search, Users, Building2, TrendingUp, Briefcase, UserPlus } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface Contact {
  id: string;
  name: string;
  role: string;
  type: 'investor' | 'founder';
  company?: string;
  avatar?: string;
  online: boolean;
  expertise?: string[];
  location?: string;
}

interface NewMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userType: 'founder' | 'investor';
  onStartConversation: (contact: Contact) => void;
}

// Mock contacts - in real app, this would come from API
const mockContacts: Contact[] = [
  {
    id: 'c1',
    name: 'Jean-Paul Uwimana',
    role: 'VC Investor',
    type: 'investor',
    company: 'Rwanda Ventures',
    online: true,
    expertise: ['FinTech', 'Agriculture', 'Healthcare'],
    location: 'Kigali, Rwanda'
  },
  {
    id: 'c2',
    name: 'Patricia Mukamana',
    role: 'Founder',
    type: 'founder',
    company: 'FinTrack',
    online: false,
    expertise: ['FinTech', 'Mobile Payments'],
    location: 'Kigali, Rwanda'
  },
  {
    id: 'c4',
    name: 'Dr. Samuel Nkusi',
    role: 'Founder',
    type: 'founder',
    company: 'HealthBridge',
    online: false,
    expertise: ['Healthcare', 'Telemedicine'],
    location: 'Kigali, Rwanda'
  },
  {
    id: 'c5',
    name: 'Michael Chen',
    role: 'Angel Investor',
    type: 'investor',
    company: 'East Africa Angels',
    online: false,
    expertise: ['E-commerce', 'Logistics', 'Tech'],
    location: 'Kampala, Uganda'
  },
  {
    id: 'c7',
    name: 'David Kamau',
    role: 'Founder',
    type: 'founder',
    company: 'LogiTech',
    online: true,
    expertise: ['Logistics', 'Supply Chain', 'E-commerce'],
    location: 'Nairobi, Kenya'
  },
  {
    id: 'c8',
    name: 'Linda Mutesi',
    role: 'Impact Investor',
    type: 'investor',
    company: 'Impact Ventures',
    online: false,
    expertise: ['Social Impact', 'Education', 'Agriculture'],
    location: 'Kigali, Rwanda'
  },
  {
    id: 'c10',
    name: 'Grace Nyirahabimana',
    role: 'Founder',
    type: 'founder',
    company: 'EduTech Rwanda',
    online: true,
    expertise: ['Education', 'EdTech', 'AI'],
    location: 'Kigali, Rwanda'
  },
  {
    id: 'c11',
    name: 'Robert Niyonshuti',
    role: 'Venture Capital Partner',
    type: 'investor',
    company: 'Africa Tech Ventures',
    online: true,
    expertise: ['Tech Startups', 'Series A', 'B2B SaaS'],
    location: 'Kigali, Rwanda'
  }
];

export function NewMessageDialog({ open, onOpenChange, userType, onStartConversation }: NewMessageDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'investor' | 'founder'>('all');

  const filteredContacts = mockContacts.filter(contact => {
    // Filter by type
    if (selectedFilter !== 'all' && contact.type !== selectedFilter) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        contact.name.toLowerCase().includes(query) ||
        contact.role.toLowerCase().includes(query) ||
        contact.company?.toLowerCase().includes(query) ||
        contact.expertise?.some(exp => exp.toLowerCase().includes(query))
      );
    }

    return true;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'investor':
        return <TrendingUp className="h-4 w-4" />;
      case 'founder':
        return <Building2 className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'investor':
        return 'bg-[#76B947]/10 text-[#76B947] border-[#76B947]/20';
      case 'founder':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const handleContactClick = (contact: Contact) => {
    onStartConversation(contact);
    onOpenChange(false);
    setSearchQuery('');
    setSelectedFilter('all');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl glass-card border-black/5 dark:border-white/10 max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl dark:text-white flex items-center space-x-2" style={{ fontFamily: 'var(--font-heading)' }}>
            <UserPlus className="h-6 w-6 text-[#76B947]" />
            <span>Start New Conversation</span>
          </DialogTitle>
          <DialogDescription style={{ fontFamily: 'var(--font-body)' }}>
            Message your connections - investors and founders you're connected with
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, role, company, or expertise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 glass-card border-black/10 dark:border-white/10"
            style={{ fontFamily: 'var(--font-body)' }}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('all')}
            className={selectedFilter === 'all' ? 'bg-[#76B947] text-white hover:bg-[#76B947]/90' : ''}
          >
            <Users className="h-4 w-4 mr-1" />
            All
          </Button>
          <Button
            variant={selectedFilter === 'investor' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('investor')}
            className={selectedFilter === 'investor' ? 'bg-[#76B947] text-white hover:bg-[#76B947]/90' : ''}
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Investors
          </Button>
          <Button
            variant={selectedFilter === 'founder' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('founder')}
            className={selectedFilter === 'founder' ? 'bg-[#76B947] text-white hover:bg-[#76B947]/90' : ''}
          >
            <Building2 className="h-4 w-4 mr-1" />
            Founders
          </Button>
        </div>

        {/* Contacts List */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 pr-4">
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleContactClick(contact)}
                    className="w-full p-4 rounded-lg bg-white dark:bg-gray-800/50 hover:bg-[#76B947]/5 dark:hover:bg-[#76B947]/10 border border-black/10 dark:border-white/10 transition-all text-left group"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={contact.avatar} />
                          <AvatarFallback className="bg-[#76B947]/20 text-[#76B947]">
                            {contact.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {contact.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold dark:text-white group-hover:text-[#76B947] transition-colors" style={{ fontFamily: 'var(--font-heading)' }}>
                              {contact.name}
                            </p>
                            <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                              {contact.role}
                            </p>
                          </div>
                          <Badge variant="outline" className={`${getTypeColor(contact.type)} flex items-center space-x-1`}>
                            {getTypeIcon(contact.type)}
                            <span className="capitalize text-xs">{contact.type}</span>
                          </Badge>
                        </div>

                        {contact.company && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center" style={{ fontFamily: 'var(--font-body)' }}>
                            <Building2 className="h-3 w-3 mr-1" />
                            {contact.company}
                          </p>
                        )}

                        {contact.expertise && contact.expertise.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {contact.expertise.slice(0, 3).map((exp, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs bg-black/5 dark:bg-white/5">
                                {exp}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    No connections found matching your search
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}