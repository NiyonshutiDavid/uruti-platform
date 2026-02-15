import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Mail, 
  Link as LinkIcon,
  Copy,
  Check
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner@2.0.3';

interface ShareProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileName: string;
  profileUrl: string;
}

export function ShareProfileDialog({ open, onOpenChange, profileName, profileUrl }: ShareProfileDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToSocial = (platform: string) => {
    const message = `Check out ${profileName}'s profile on Uruti Digital Ecosystem`;
    let url = '';

    switch (platform) {
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(profileUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent(`Profile: ${profileName}`)}&body=${encodeURIComponent(`${message}\n\n${profileUrl}`)}`;
        break;
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-heading)' }}>Share Profile</DialogTitle>
          <DialogDescription>Share {profileName}'s profile with your network</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Copy Link */}
          <div>
            <label className="text-sm font-medium mb-2 block">Profile Link</label>
            <div className="flex gap-2">
              <Input value={profileUrl} readOnly className="flex-1" />
              <Button 
                variant="outline" 
                onClick={handleCopyLink}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-[#76B947]" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div>
            <label className="text-sm font-medium mb-3 block">Share via</label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => shareToSocial('linkedin')}
                className="hover:bg-[#0077b5]/10 hover:border-[#0077b5] hover:text-[#0077b5]"
              >
                <Linkedin className="h-4 w-4 mr-2" />
                LinkedIn
              </Button>
              <Button
                variant="outline"
                onClick={() => shareToSocial('twitter')}
                className="hover:bg-[#1DA1F2]/10 hover:border-[#1DA1F2] hover:text-[#1DA1F2]"
              >
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </Button>
              <Button
                variant="outline"
                onClick={() => shareToSocial('facebook')}
                className="hover:bg-[#1877f2]/10 hover:border-[#1877f2] hover:text-[#1877f2]"
              >
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </Button>
              <Button
                variant="outline"
                onClick={() => shareToSocial('email')}
                className="hover:bg-[#76B947]/10 hover:border-[#76B947] hover:text-[#76B947]"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
            </div>
          </div>

          {/* QR Code placeholder (optional future feature) */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Share this link with potential investors, partners, or collaborators
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
