import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { File, Mail } from 'lucide-react';
import PaymentReceipt from './PaymentReceipt';
import { toast } from 'sonner';
import { useCompanySettings } from '@/contexts/CompanySettingsContext';
import { pdf } from '@react-pdf/renderer';

interface Customer {
  name: string;
  email?: string;
  phone?: string;
}

interface Booking {
  id: string;
  customers?: Customer | null;
  total_amount?: number;
}

interface Payment {
  id: string;
  payment_id: string;
  amount: number;
  status: string;
  method: string;
  date: string;
  payment_type?: string;
  notes?: string;
  bookings?: Booking | null;
  currency?: string;
  payment_date?: string;
}

interface ReceiptPDFProps {
  payment: Payment;
  fileName?: string;
  buttonText?: string;
  icon?: React.ReactNode;
  className?: string;
  showPaid?: boolean;
}

// A component that provides a button to download a payment receipt as PDF
const ReceiptPDF: React.FC<ReceiptPDFProps> = ({
  payment,
  fileName = `Payment_Receipt_${payment.payment_id}.pdf`,
  buttonText = 'Download Receipt',
  icon = <File className="h-4 w-4 mr-2" />,
  className = '',
  showPaid = true
}) => {
  const { companySettings } = useCompanySettings();
  
  return (
    <PDFDownloadLink
      document={<PaymentReceipt payment={payment} showPaid={showPaid} companySettings={companySettings || undefined} />}
      fileName={fileName}
      className={className}
    >
      <Button
        variant="outline"
        className="flex items-center gap-2"
      >
        {icon}
        {buttonText}
      </Button>
    </PDFDownloadLink>
  );
};

// Fetch company settings for standalone usage
let cachedCompanySettings: any = null;

const fetchCompanySettings = async () => {
  if (cachedCompanySettings) {
    return cachedCompanySettings;
  }
  
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase
      .from("company_settings")
      .select("*")
      .single();
      
    if (error && error.code !== "PGRST116") {
      throw error;
    }
    
    // Cache the result
    cachedCompanySettings = data;
    return data;
  } catch (error) {
    console.error("Error fetching company settings:", error);
    return null;
  }
};

// Generate a PDF buffer from a payment
const generatePDFBuffer = async (payment: Payment, companySettings: any): Promise<Uint8Array> => {
  try {
    // Create a PDF document
    const pdfDoc = pdf(
      <PaymentReceipt 
        payment={payment} 
        showPaid={true} 
        companySettings={companySettings} 
      />
    );
    
    // Get PDF as blob
    const blob = await pdfDoc.toBlob();
    
    // Convert blob to Uint8Array
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (!reader.result) {
          return reject(new Error('Failed to read PDF blob'));
        }
        
        const arrayBuffer = reader.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        resolve(uint8Array);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  } catch (error) {
    console.error('Error generating PDF buffer:', error);
    // Return a small placeholder buffer if generation fails
    const encoder = new TextEncoder();
    return encoder.encode(`Mock PDF for payment ${payment.payment_id}`);
  }
};

// A standalone function to share the receipt via email
export function shareReceiptViaEmail(payment: Payment, recipientEmail?: string) {
  // Get company settings
  return fetchCompanySettings().then(async companySettings => {
    try {
      const recipient = recipientEmail || payment.bookings?.customers?.email;
      
      if (!recipient) {
        toast.error('No recipient email found');
        return;
      }
      
      // Show loading toast
      const loadingToast = toast.loading('Generating PDF and sending email...');
      
      try {
        // Generate PDF buffer
        const pdfBuffer = await generatePDFBuffer(payment, companySettings);
        
        // Import email service dynamically
        const { sendPaymentReceipt, checkEmailServer } = await import('@/services/emailService');
        
        // Check if email server is running
        const isServerRunning = await checkEmailServer();
        if (!isServerRunning) {
          toast.dismiss(loadingToast);
          toast.error('Email server is not running. Please start the email server first.');
          return;
        }
        
        const paymentDetails = {
          paymentId: payment.payment_id,
          amount: `${payment.currency || 'INR'} ${payment.amount.toFixed(2)}`,
          date: new Date(payment.payment_date || payment.date).toLocaleDateString()
        };
        
        // Send email with PDF attachment
        const result = await sendPaymentReceipt(recipient, paymentDetails, pdfBuffer);
        
        // Dismiss loading toast
        toast.dismiss(loadingToast);
        
        if (result.success) {
          toast.success(`Receipt sent to ${recipient}`);
        } else {
          toast.error(`Failed to send receipt: ${result.error}`);
        }
      } catch (error: any) {
        toast.dismiss(loadingToast);
        
        if (error.message && error.message.includes('Email server is not running')) {
          toast.error('Email server is not running. Please start the server by running "npm run dev" in the server directory.');
        } else if (error.message && error.message.includes('Email settings not configured')) {
          toast.error('Email settings not configured. Please configure your SMTP settings in the Settings page.');
        } else {
          toast.error('Failed to send receipt: ' + (error.message || 'Unknown error'));
        }
        console.error('Error processing payment receipt email:', error);
      }
    } catch (error: any) {
      console.error('Error processing payment receipt email:', error);
      toast.error('Failed to send receipt email: ' + (error.message || 'Unknown error'));
    }
  });
}

export default ReceiptPDF; 