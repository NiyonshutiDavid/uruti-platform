import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { FileText, Image as ImageIcon, Download, ExternalLink, Calendar, ArrowLeft } from 'lucide-react';

interface ChatInfoDialogProps {
  onClose: () => void;
  contactName: string;
  contactAvatar?: string;
  contactRole: string;
  contactOnline: boolean;
}

const mockSharedDocuments = [
  { id: '1', name: 'AgriConnect_Pitch_Deck_v3.pdf', type: 'pdf', size: '2.4 MB', date: '2026-02-10' },
  { id: '2', name: 'Financial_Projections_Q1.xlsx', type: 'excel', size: '1.1 MB', date: '2026-02-08' },
  { id: '3', name: 'Market_Research_Report.pdf', type: 'pdf', size: '5.2 MB', date: '2026-02-05' },
];

const mockSharedMedia = [
  { id: '1', type: 'image', url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop', date: '2026-02-11' },
  { id: '2', type: 'image', url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop', date: '2026-02-09' },
  { id: '3', type: 'image', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=300&h=200&fit=crop', date: '2026-02-07' },
];

export function ChatInfoDialog({ onClose, contactName, contactAvatar, contactRole, contactOnline }: ChatInfoDialogProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header with Back Button */}
      <div className="p-4 border-b dark:border-gray-700">
        <Button
          variant="ghost"
          onClick={onClose}
          className="hover:bg-[#76B947]/10 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span style={{ fontFamily: 'var(--font-heading)' }}>Back to Chat</span>
        </Button>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Contact Info */}
          <div className="flex flex-col items-center text-center p-6 glass-panel rounded-xl">
            <div className="relative mb-4">
              <Avatar className="h-24 w-24 border-4 border-[#76B947]">
                <AvatarImage src={contactAvatar} />
                <AvatarFallback className="bg-[#76B947]/20 text-[#76B947] text-2xl">
                  {contactName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              {contactOnline && (
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-gray-800" />
              )}
            </div>
            <h3 className="text-2xl font-semibold dark:text-white mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              {contactName}
            </h3>
            <p className="text-sm text-muted-foreground mb-3" style={{ fontFamily: 'var(--font-body)' }}>
              {contactRole}
            </p>
            <Badge className={`${contactOnline ? 'bg-green-500' : 'bg-gray-400'} text-white`}>
              {contactOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>

          {/* Tabs for Documents and Media */}
          <Tabs defaultValue="documents" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="documents">
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="media">
                <ImageIcon className="h-4 w-4 mr-2" />
                Media
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documents" className="mt-4">
              <div className="space-y-2">
                {mockSharedDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="glass-panel p-4 rounded-lg hover:bg-[#76B947]/5 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-10 h-10 bg-[#76B947]/20 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-[#76B947]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                            {doc.name}
                          </p>
                          <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            {doc.size} • {new Date(doc.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="hover:bg-[#76B947]/10">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:bg-[#76B947]/10">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="media" className="mt-4">
              <div className="grid grid-cols-3 gap-2">
                {mockSharedMedia.map((media) => (
                  <div
                    key={media.id}
                    className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative group"
                  >
                    <img
                      src={media.url}
                      alt="Shared media"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
                      {new Date(media.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="hover:bg-[#76B947]/10 hover:border-[#76B947]">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
            <Button 
              variant="outline" 
              className="hover:bg-[#76B947]/10 hover:border-[#76B947]"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('navigate-to-profile'));
                onClose();
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Profile
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}