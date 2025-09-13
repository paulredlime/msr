import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Share2, Twitter, Facebook, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareReferralModal({ isOpen, onClose, user }) {
  if (!user) return null;

  const referralCode = user.referral_code || user.email?.split('@')[0];
  const referralUrl = `${window.location.origin}?ref=${referralCode}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(referralUrl)}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralUrl);
    toast.success('Referral link copied!');
  };

  const socialShare = (platform) => {
    const text = encodeURIComponent("I'm saving money on groceries with MyShopRun. Join with my link for extra savings!");
    let url = '';
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(referralUrl)}&text=${text}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`;
        break;
      case 'whatsapp':
        url = `https://api.whatsapp.com/send?text=${text}%20${encodeURIComponent(referralUrl)}`;
        break;
      default:
        return;
    }
    window.open(url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Your Referral Link</DialogTitle>
          <DialogDescription>
            Share this link with friends. You'll get points when they sign up and subscribe.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-4">
          <img src={qrCodeUrl} alt="Referral QR Code" className="w-40 h-40 rounded-lg border p-1" />
          <p className="text-sm text-gray-500 mt-2">Scan QR code or use the link below</p>
        </div>
        <div className="flex items-center space-x-2">
          <Input value={referralUrl} readOnly />
          <Button size="icon" onClick={copyToClipboard}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-center space-x-2 pt-4">
          <Button variant="outline" size="icon" onClick={() => socialShare('twitter')}><Twitter className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => socialShare('facebook')}><Facebook className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => socialShare('whatsapp')}><MessageSquare className="h-4 w-4" /></Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}