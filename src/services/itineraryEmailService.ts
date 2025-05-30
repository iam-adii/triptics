import { toast } from 'sonner';
import React from 'react';
import ItineraryPDF from '@/components/itinerary/ItineraryPDF';
import { Document, Page, pdf } from '@react-pdf/renderer';
import { EMAIL_ENDPOINTS } from '@/config/email';

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
export async function shareItineraryViaEmail(
  itinerary: any,
  days: any[],
  activities: any[],
  recipientEmail?: string,
  existingPdfBlob?: Blob
) {
  // Get company settings
  const companySettings = await fetchCompanySettings();
  
  try {
    // Get recipient email from itinerary's customer or the provided email
    const recipient = recipientEmail || itinerary.customers?.email;
    
    if (!recipient) {
      toast.error('No recipient email found');
      return;
    }
    
    // Show loading toast
    const loadingToast = toast.loading('Preparing email...');
    
    try {
      // Get email settings
      const settings = await fetchEmailSettings();
      
      if (!settings) {
        toast.dismiss(loadingToast);
        toast.error('Email settings not configured. Please check Settings > Email');
        return;
      }
      
      // Check if email server is running
      const { checkEmailServer, callEmailApi } = await import('@/services/emailService');
      const isServerRunning = await checkEmailServer();
      if (!isServerRunning) {
        toast.dismiss(loadingToast);
        toast.error('Email server is not running. Please start the email server first.');
        return;
      }
      
      // Create itinerary details for the email
      const itineraryDetails = {
        itineraryName: itinerary.name,
        destination: itinerary.destination || 'Your Destination',
        startDate: itinerary.start_date ? new Date(itinerary.start_date).toLocaleDateString() : 'Not specified',
        endDate: itinerary.end_date ? new Date(itinerary.end_date).toLocaleDateString() : 'Not specified',
        customerName: itinerary.customers?.name || 'Valued Customer'
      };
      
      // Use existing PDF blob if provided, otherwise generate a new one
      let pdfBlob = existingPdfBlob;
      
      if (!pdfBlob) {
        // Generate PDF blob - update the loading toast instead of creating a new one
        toast.loading('Generating PDF...', { id: loadingToast });
        pdfBlob = await createPdfBlob(itinerary, days, activities, companySettings);
      }
      
      // If PDF generation failed, show error
      if (!pdfBlob) {
        toast.dismiss(loadingToast);
        toast.error('Failed to generate PDF. Please try again.');
        return;
      }
      
      // Convert blob to byte array for sending
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const pdfBytes = new Uint8Array(arrayBuffer);
      
      // Update toast
      toast.loading(`Sending email to ${recipient}...`, { id: loadingToast });
      
      // Send the email with PDF attachment
      const result = await callEmailApi(EMAIL_ENDPOINTS.itinerary, {
        recipient,
        itineraryDetails,
        pdfBuffer: Array.from(pdfBytes),
        settings
      });
      
      // Dismiss toast and show result
      toast.dismiss(loadingToast);
      
      if (result.success) {
        toast.success(`Itinerary sent to ${recipient}`);
      } else {
        toast.error(`Failed to send itinerary: ${result.error}`);
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      
      if (error.message && error.message.includes('Email server is not running')) {
        toast.error('Email server is not running. Please start the server.');
      } else if (error.message && error.message.includes('Email settings not configured')) {
        toast.error('Email settings not configured. Please check Settings > Email.');
      } else {
        toast.error('Failed to send itinerary: ' + (error.message || 'Unknown error'));
      }
      console.error('Error processing itinerary email:', error);
    }
  } catch (error: any) {
    console.error('Error processing itinerary email:', error);
    toast.error('Failed to send itinerary email: ' + (error.message || 'Unknown error'));
  }
} 