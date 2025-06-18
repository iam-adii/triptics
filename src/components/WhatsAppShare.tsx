import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Send } from 'lucide-react';

// WhatsApp icon SVG component
const WhatsAppIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

interface WhatsAppShareProps {
  message: string;
  phoneNumber?: string;
  customerName?: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  title?: string;
}

export function WhatsAppShare({
  message,
  phoneNumber,
  customerName,
  className = '',
  size = 'default',
  variant = 'default',
  buttonText = 'Share via WhatsApp',
  buttonIcon = <WhatsAppIcon />,
  title = 'Share via WhatsApp'
}: WhatsAppShareProps) {
  const [open, setOpen] = useState(false);
  const [recipientType, setRecipientType] = useState(phoneNumber ? 'client' : 'custom');
  const [customPhone, setCustomPhone] = useState('');

  // Format phone number for WhatsApp
  const formatPhoneForWhatsApp = (phone: string): string => {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Ensure it has country code (default to India +91 if not present)
    if (!cleaned.startsWith('91') && !cleaned.startsWith('+91')) {
      // Remove any leading zeros
      cleaned = cleaned.replace(/^0+/, '');
      
      // Add country code
      cleaned = '91' + cleaned;
    } else if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1); // Remove the + sign
    }
    
    return cleaned;
  };

  const handleShare = () => {
    // Determine which phone number to use
    let phoneToUse = '';
    
    if (recipientType === 'client') {
      if (!phoneNumber) {
        toast.error('No phone number available');
        return;
      }
      phoneToUse = phoneNumber;
    } else if (recipientType === 'custom') {
      if (!customPhone.trim()) {
        toast.error('Please enter a phone number');
        return;
      }
      phoneToUse = customPhone;
    } else {
      // No specific recipient, will open WhatsApp without a number
    }
    
    const encodedMessage = encodeURIComponent(message);
    
    if (phoneToUse) {
      // Format phone number for WhatsApp API
      const formattedNumber = formatPhoneForWhatsApp(phoneToUse);
      
      window.open(`https://wa.me/${formattedNumber}?text=${encodedMessage}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    }
    
    setOpen(false);
    toast.success('WhatsApp opened with your message');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={className}
        >
          {buttonIcon}
          <span className="ml-2">{buttonText}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="recipient-type">Send to</Label>
            <Select
              value={recipientType}
              onValueChange={setRecipientType}
            >
              <SelectTrigger id="recipient-type" className="bg-background">
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                {phoneNumber && (
                  <SelectItem value="client">
                    Client {customerName ? `(${customerName})` : ''}
                  </SelectItem>
                )}
                <SelectItem value="custom">Custom Number</SelectItem>
                <SelectItem value="open">Without Number</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {recipientType === 'client' && phoneNumber && (
            <div className="text-sm text-muted-foreground">
              Phone: {phoneNumber || 'No phone number available'}
            </div>
          )}
          
          {recipientType === 'custom' && (
            <div className="grid gap-2">
              <Label htmlFor="phone-number">Phone Number</Label>
              <Input
                id="phone-number"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="bg-background"
              />
            </div>
          )}
          
          <Button 
            onClick={handleShare} 
            className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white w-full"
          >
            <WhatsAppIcon />
            <span className="ml-2">Share Now</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 