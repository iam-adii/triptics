import { toast } from 'sonner';
import React from 'react';
import ItineraryPDF from '@/components/itinerary/ItineraryPDF';
import { Document, Page, pdf } from '@react-pdf/renderer';
import { EMAIL_ENDPOINTS } from '../config/email';
import { checkEmailServer, callEmailApi } from './emailService';
import { supabase } from '@/integrations/supabase/client';

interface PricingOptions {
  taxPercentage: number;
  agentCharges: number;
  additionalServices: {
    id: string;
    name: string;
    price: number;
  }[];
}

// Function to fetch company settings
const fetchCompanySettings = async () => {
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

// Function to fetch email settings
const fetchEmailSettings = async () => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase
      .from('email_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching email settings:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception fetching email settings:', error);
    return null;
  }
};

// Creates a PDF blob
const createPdfBlob = async (itinerary: any, days: any[], activities: any[], companySettings: any) => {
  try {
    // Create a simple PDF document using React.createElement to avoid JSX issues
    const pdfDocument = React.createElement(
      Document,
      {},
      React.createElement(
        Page,
        { size: "A4" },
        React.createElement(ItineraryPDF, {
          itinerary: itinerary,
          days: days,
          activities: activities,
          companySettings: companySettings
        })
      )
    );
    
    // Generate the PDF blob using the pdf() function - same as in download
    return await pdf(pdfDocument).toBlob();
  } catch (error) {
    console.error('Error generating PDF:', error);
    return null;
  }
};

// Standalone function to share the itinerary via email
export const shareItineraryViaEmail = async (
  itinerary: any,
  days: any[],
  activities: any[],
  recipientEmail?: string,
  pdfBlob?: Blob,
  pricingOptions?: PricingOptions
) => {
  try {
    // Determine the recipient email
    let email = recipientEmail;
    
    // If no email provided, use the customer's email from the itinerary
    if (!email) {
      email = itinerary.customer_email || itinerary.customers?.email;
    }
    
    // If still no email, prompt the user to enter one
    if (!email) {
      email = prompt("Please enter the recipient's email address:");
      if (!email) {
        toast.error("Email address is required to send the itinerary");
        return;
      }
    }
    
    // Show loading toast
    const loadingToast = toast.loading("Sending email...");
    
    try {
      // Generate PDF if not provided
      let pdfFile = pdfBlob;
      
      if (!pdfFile) {
        // Fetch company settings
        const { data: companySettings } = await supabase
          .from('company_settings')
          .select('*')
          .single();
        
        // Generate PDF using React.createElement for Document and Page structure
        const pdfDoc = React.createElement(
          Document,
          {},
          React.createElement(
            Page,
            { size: "A4", style: { padding: 30, fontFamily: 'Helvetica' } },
            React.createElement(ItineraryPDF, {
              itinerary: itinerary,
              days: days,
              activities: activities,
              companySettings: companySettings,
              pricingOptions: pricingOptions
            })
          )
        );
        
        pdfFile = await pdf(pdfDoc).toBlob();
      }
      
      // Create a FormData object to send the PDF
      const formData = new FormData();
      formData.append('itineraryId', itinerary.id);
      formData.append('recipientEmail', email);
      formData.append('pdf', pdfFile, `${itinerary.name.replace(/\s+/g, '_')}.pdf`);
      
      // Send the email using your API endpoint
      const response = await fetch('/api/send-itinerary-email', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to send email');
      }
      
      toast.dismiss(loadingToast);
      toast.success(`Itinerary sent to ${email}`);
    } catch (error) {
      toast.dismiss(loadingToast);
      throw error;
    }
  } catch (error) {
    console.error('Error sending itinerary email:', error);
    toast.error('Failed to send email. Please try again.');
  }
}; 