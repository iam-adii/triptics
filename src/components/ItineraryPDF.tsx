import React, { useState } from 'react';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { File, Mail } from 'lucide-react';
import BookingItinerary from './BookingItinerary';
import { toast } from 'sonner';
import { useCompanySettings } from '@/contexts/CompanySettingsContext';

interface Customer {
  name: string;
  email?: string;
  phone?: string;
}

interface Tour {
  name: string;
  description?: string;
  days?: number;
  location?: string;
}

interface ItineraryItem {
  day: number;
  title: string;
  description: string;
}

interface Booking {
  id: string;
  booking_number?: string;
  customers?: Customer | null;
  tours?: Tour | null;
  total_amount: number;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string;
  notes?: string;
  itinerary?: ItineraryItem[] | null;
}

interface CompanySettings {
  name: string;
  logo_url?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
}

interface ItineraryPDFProps {
  booking: Booking;
  buttonText?: string;
  fileName?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  showIcon?: boolean;
}

// A function to fetch company settings outside of React component
const fetchCompanySettings = async (): Promise<CompanySettings | null> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching company settings:', error);
    return null;
  }
};

// A standalone function to share the itinerary via email
export function shareItineraryViaEmail(booking: Booking, recipientEmail?: string) {
  // Get company settings
  return fetchCompanySettings().then(async companySettings => {
    try {
      const recipient = recipientEmail || booking.customers?.email;
      
      if (!recipient) {
        toast.error('No recipient email found');
        return;
      }
      
      // Show loading toast
      const loadingToast = toast.loading('Generating PDF and sending email...');
      
      try {
        // Generate the PDF
        const pdfDoc = pdf(<BookingItinerary booking={booking} companySettings={companySettings} />);
        const pdfBlob = await pdfDoc.toBlob();
        
        // Convert blob to array buffer
        const arrayBuffer = await pdfBlob.arrayBuffer();
        
        // Import email service dynamically
        const { sendBookingConfirmation, checkEmailServer } = await import('@/services/emailService');
        
        // Check if email server is running
        const isServerRunning = await checkEmailServer();
        if (!isServerRunning) {
          toast.dismiss(loadingToast);
          toast.error('Email server is not running. Please start the email server first.');
          return;
        }
        
        const bookingDetails = {
          bookingId: booking.booking_number || `BOOK${booking.id.slice(-6).toUpperCase()}`,
          bookingDate: new Date(booking.created_at || new Date()).toLocaleDateString(),
          tourName: booking.tours?.name || 'Tour Package',
          customerName: booking.customers?.name || 'Guest'
        };
        
        // Send email with PDF attachment
        const result = await sendBookingConfirmation(
          recipient, 
          bookingDetails, 
          new Uint8Array(arrayBuffer)
        );
        
        // Dismiss loading toast
        toast.dismiss(loadingToast);
        
        if (result.success) {
          toast.success(`Booking confirmation sent to ${recipient}`);
        } else {
          toast.error(`Failed to send booking confirmation: ${result.error}`);
        }
      } catch (error: any) {
        toast.dismiss(loadingToast);
        
        if (error.message && error.message.includes('Email server is not running')) {
          toast.error('Email server is not running. Please start the server by running "npm run dev" in the server directory.');
        } else if (error.message && error.message.includes('Email settings not configured')) {
          toast.error('Email settings not configured. Please configure your SMTP settings in the Settings page.');
        } else {
          toast.error('Failed to send booking confirmation: ' + (error.message || 'Unknown error'));
        }
        console.error('Error processing booking confirmation email:', error);
      }
    } catch (error: any) {
      console.error('Error processing booking confirmation email:', error);
      toast.error('Failed to send booking confirmation email: ' + (error.message || 'Unknown error'));
    }
  });
}

const ItineraryPDF: React.FC<ItineraryPDFProps> = ({ 
  booking, 
  buttonText = 'Download Itinerary', 
  fileName = 'booking_confirmation.pdf', 
  variant = 'outline',
  showIcon = true
}) => {
  const { companySettings } = useCompanySettings();
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Wrapper for PDFDownloadLink to handle loading state
  const DownloadButton = () => (
    <PDFDownloadLink
      document={<BookingItinerary booking={booking} companySettings={companySettings} />}
      fileName={fileName}
      className="inline-block"
    >
      <Button 
        variant={variant}
        disabled={isGenerating}
        className="flex items-center gap-2"
        onClick={() => setIsGenerating(true)}
        onBlur={() => setIsGenerating(false)}
      >
        {showIcon && <File className="h-4 w-4" />}
        {isGenerating ? 'Generating PDF...' : buttonText}
      </Button>
    </PDFDownloadLink>
  );
  
  return <DownloadButton />;
};

// Button component for sending email
export const SendItineraryEmailButton: React.FC<{
  booking: Booking;
  recipientEmail?: string;
  buttonText?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
}> = ({
  booking,
  recipientEmail,
  buttonText = 'Send via Email',
  variant = 'outline'
}) => {
  const handleClick = () => {
    shareItineraryViaEmail(booking, recipientEmail);
  };

  return (
    <Button
      variant={variant}
      onClick={handleClick}
      className="flex items-center gap-2"
    >
      <Mail className="h-4 w-4" />
      {buttonText}
    </Button>
  );
};

export default ItineraryPDF; 