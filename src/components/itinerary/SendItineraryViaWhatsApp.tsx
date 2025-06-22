import React, { useState, useEffect } from 'react';
import { WhatsAppShare } from '@/components/WhatsAppShare';
import { Share } from 'lucide-react';
import { useCompanySettings } from '@/contexts/CompanySettingsContext';
import { supabase } from '@/integrations/supabase/client';

interface SendItineraryViaWhatsAppProps {
  itinerary: any;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  buttonText?: string;
}

// Add interface for Terms & Conditions
interface TermsAndConditions {
  inclusions: string[];
  exclusions: string[];
  terms: string[];
}

export function SendItineraryViaWhatsApp({
  itinerary,
  className = '',
  size = 'default',
  variant = 'default',
  buttonText = 'Send Itinerary'
}: SendItineraryViaWhatsAppProps) {
  if (!itinerary) return null;

  // Get company settings
  const { companySettings } = useCompanySettings();
  const companyName = companySettings?.name || 'Triptics';

  // Add state for terms and conditions
  const [termsAndConditions, setTermsAndConditions] = useState<TermsAndConditions>({
    inclusions: [],
    exclusions: [],
    terms: []
  });

  // Fetch terms and conditions from database
  useEffect(() => {
    const fetchTermsAndConditions = async () => {
      try {
        const { data, error } = await supabase
          .from('terms_and_conditions')
          .select('*')
          .single();

        if (error) {
          console.log('No terms and conditions found');
          return;
        }

        if (data) {
          setTermsAndConditions({
            inclusions: data.inclusions || [],
            exclusions: data.exclusions || [],
            terms: data.terms || []
          });
        }
      } catch (error) {
        console.error('Error fetching terms and conditions:', error);
      }
    };

    fetchTermsAndConditions();
  }, []);

  // Format date for WhatsApp
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Create itinerary message
  const createItineraryMessage = () => {
    // Add greeting with customer name if available
    const customerName = itinerary.customers?.name || 'Valued Customer';
    
    let message = `*TRAVEL ITINERARY*\n`;
    message += `------------------\n\n`;
    
    message += `Dear ${customerName},\n\n`;
    message += `We are pleased to share your travel itinerary details as follows:\n\n`;
    
    message += `*${itinerary.name || 'Custom Itinerary'}*\n`;
    message += `------------------\n\n`;
    
    if (itinerary.destination) {
      message += `*DESTINATION:* ${itinerary.destination}\n`;
    }
    
    if (itinerary.start_date && itinerary.end_date) {
      message += `*TRAVEL DATES:* ${formatDate(itinerary.start_date)} to ${formatDate(itinerary.end_date)}\n`;
    }
    
    if (itinerary.duration) {
      message += `*DURATION:* ${itinerary.duration} day${itinerary.duration > 1 ? 's' : ''}\n`;
    }
    
    if (itinerary.budget) {
      message += `*BUDGET ESTIMATE:* ₹${itinerary.budget.toLocaleString()}\n`;
    }
    
    // Add overview section if itinerary has days
    if (itinerary.days && itinerary.days.length > 0) {
      message += `\n*ITINERARY OVERVIEW*\n`;
      message += `------------------\n`;
      
      itinerary.days.forEach((day: any, index: number) => {
        message += `*Day ${index + 1}:* ${day.title || 'Scheduled Activities'}\n`;
      });
    }
    
    // Add notes section if available
    if (itinerary.notes) {
      message += `\n*IMPORTANT NOTES:*\n`;
      message += `${itinerary.notes}\n`;
    }
    
    // Add inclusions from database if available
    if (termsAndConditions.inclusions.length > 0) {
      message += `\n*INCLUSIONS:*\n`;
      termsAndConditions.inclusions.forEach(inclusion => {
        if (inclusion.trim()) {
          message += `+ ${inclusion.trim()}\n`;
        }
      });
      message += '\n';
    }
    
    // Add exclusions from database if available
    if (termsAndConditions.exclusions.length > 0) {
      message += `*EXCLUSIONS:*\n`;
      termsAndConditions.exclusions.forEach(exclusion => {
        if (exclusion.trim()) {
          message += `- ${exclusion.trim()}\n`;
        }
      });
      message += '\n';
    }
    
    // Add terms and conditions from database if available
    if (termsAndConditions.terms.length > 0) {
      message += `*TERMS & CONDITIONS:*\n`;
      termsAndConditions.terms.forEach((term, index) => {
        if (term.trim()) {
          message += `${index + 1}. ${term.trim()}\n`;
        }
      });
      message += '\n';
    }
    
    // Call to action
    message += `------------------\n`;
    message += `We would be happy to adjust this itinerary according to your preferences. Please let us know if you would like any modifications or have questions about the proposed plan.\n\n`;
    message += `*Best regards,*\n*${companyName}*`;
    
    return message;
  };

  return (
    <WhatsAppShare
      message={createItineraryMessage()}
      phoneNumber={itinerary.customer_phone || itinerary.customers?.phone}
      customerName={itinerary.customers?.name}
      className={className}
      size={size}
      variant={variant}
      buttonText={buttonText}
      buttonIcon={<Share className="h-4 w-4" />}
      title="Send Itinerary via WhatsApp"
    />
  );
} 