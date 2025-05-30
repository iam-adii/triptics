// Import nodemailer only when in Node.js environment
let nodemailer: any;
try {
  // This will only work in a Node.js environment
  if (typeof window === 'undefined') {
    nodemailer = require('nodemailer');
  }
} catch (error) {
  console.warn('Nodemailer not available in browser environment');
}

import { supabase } from '@/integrations/supabase/client';
import { EMAIL_API_URL, EMAIL_ENDPOINTS, DEFAULT_EMAIL_SETTINGS } from '@/config/email';

export interface EmailSettings {
  id?: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  sender_name: string;
  sender_email: string;
  created_at?: string;
  updated_at?: string;
}

// Get SMTP settings from the database
export const fetchEmailSettings = async (): Promise<EmailSettings | null> => {
  try {
    console.log('Fetching email settings from the database...');
    
    const { data, error } = await supabase
      .from('email_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching email settings:', error);
      return null;
    }

    console.log('Email settings fetched:', data);
    return data ? data as EmailSettings : null;
  } catch (error) {
    console.error('Exception fetching email settings:', error);
    return null;
  }
};

// Save email settings to the database
export const saveEmailSettings = async (settings: EmailSettings): Promise<{ success: boolean, error?: string }> => {
  try {
    console.log('Saving email settings:', settings);
    
    // Check if email settings already exist by querying for any records
    const { data: existingSettings, error: queryError } = await supabase
      .from('email_settings')
      .select('id')
      .limit(1);
    
    if (queryError) {
      console.error('Error checking existing settings:', queryError);
      throw queryError;
    }

    const now = new Date().toISOString();
    const hasExistingSettings = existingSettings && existingSettings.length > 0;
    
    console.log('Existing settings found:', hasExistingSettings);
    
    let result;
    if (hasExistingSettings) {
      // Update existing settings
      result = await supabase
        .from('email_settings')
        .update({
          smtp_host: settings.smtp_host,
          smtp_port: settings.smtp_port,
          smtp_user: settings.smtp_user,
          smtp_password: settings.smtp_password,
          sender_name: settings.sender_name,
          sender_email: settings.sender_email,
          updated_at: now
        })
        .eq('id', existingSettings[0].id);
    } else {
      // Insert new settings
      result = await supabase
        .from('email_settings')
        .insert({
          smtp_host: settings.smtp_host,
          smtp_port: settings.smtp_port,
          smtp_user: settings.smtp_user,
          smtp_password: settings.smtp_password,
          sender_name: settings.sender_name,
          sender_email: settings.sender_email,
          created_at: now,
          updated_at: now
        });
    }
    
    if (result.error) {
      console.error('Error saving settings to database:', result.error);
      throw result.error;
    }

    console.log('Email settings saved successfully');
    
    // Dispatch an event that settings were updated
    dispatchSettingsUpdatedEvent();

    return { success: true };
  } catch (error: any) {
    console.error('Error saving email settings:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to save email settings'
    };
  }
};

// Define a simple Attachment interface to match nodemailer needs
interface Attachment {
  filename?: string;
  content?: Buffer | string;
  contentType?: string;
  path?: string;
}

// Helper function to check if email server is running
export const checkEmailServer = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${EMAIL_API_URL}/status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      mode: 'cors',
      credentials: 'omit',
      // Add a timeout to prevent long waiting times
      signal: AbortSignal.timeout(3000) // 3 second timeout
    });
    
    if (response.ok) {
      console.log('Email server is running');
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Email server is not running:', error);
    return false;
  }
};

// Helper function to make API requests to the email server
export const callEmailApi = async (endpoint: string, data: any) => {
  try {
    const fullUrl = `${EMAIL_API_URL}${endpoint}`;
    console.log(`Calling email API endpoint: ${fullUrl}`);
    console.log('Request data structure:', Object.keys(data));
    
    // Check if server is running first
    const isServerRunning = await checkEmailServer();
    if (!isServerRunning) {
      throw new Error('Email server is not running. Please start the email server by running "npm run dev" in the server directory.');
    }
    
    console.log(`Making fetch request to: ${fullUrl}`);
    
    // Validate that we have the required data
    if (!data.settings) {
      console.error('Missing settings in API request');
      throw new Error('Email settings are required but not provided');
    }
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
      // Add these options to help with CORS issues
      mode: 'cors',
      credentials: 'omit',
    });

    console.log(`Response status: ${response.status}`);
    console.log(`Response status text: ${response.statusText}`);
    
    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        console.error('Error response data:', errorData);
      } catch (e) {
        console.error('Could not parse error response as JSON', e);
        // Try to get text response
        try {
          const textResponse = await response.text();
          console.error('Raw response text:', textResponse);
        } catch (textError) {
          console.error('Could not get response text either', textError);
        }
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Success response:', result);
    return result;
  } catch (error: any) {
    console.error(`Error calling email API ${endpoint}:`, error);
    throw error;
  }
};

// Send a basic email
export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html?: string,
  attachments?: Attachment[]
) => {
  try {
    const settings = await fetchEmailSettings();
    
    if (!settings || !settings.smtp_host || !settings.smtp_user || !settings.smtp_password) {
      throw new Error('Email settings not configured. Please set up your SMTP server in Settings > Email.');
    }
    
    // Call the API to send the email
    const result = await callEmailApi(EMAIL_ENDPOINTS.send, {
      to,
      subject,
      text,
      html,
      attachments,
      settings
    });
    
    return { 
      success: true,
      messageId: result.messageId
    };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send email'
    };
  }
};

// Send booking confirmation email with itinerary PDF
export const sendBookingConfirmation = async (
  to: string, 
  bookingDetails: any,
  pdfBuffer: Uint8Array
) => {
  try {
    const settings = await fetchEmailSettings();
    
    if (!settings) {
      throw new Error('Email settings not configured');
    }
    
    // Call the API to send the booking confirmation email
    const result = await callEmailApi(EMAIL_ENDPOINTS.bookingConfirmation, {
      to,
      bookingDetails,
      pdfBuffer: Array.from(pdfBuffer), // Convert Uint8Array to array for JSON transmission
      settings
    });
    
    return { 
      success: true,
      messageId: result.messageId
    };
  } catch (error: any) {
    console.error('Error sending booking confirmation:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send booking confirmation'
    };
  }
};

// Send payment receipt email with invoice PDF
export const sendPaymentReceipt = async (
  to: string,
  paymentDetails: any,
  pdfBuffer: Uint8Array
) => {
  try {
    const settings = await fetchEmailSettings();
    
    if (!settings) {
      throw new Error('Email settings not configured');
    }
    
    // Call the API to send the payment receipt email
    const result = await callEmailApi(EMAIL_ENDPOINTS.paymentReceipt, {
      to,
      paymentDetails,
      pdfBuffer: Array.from(pdfBuffer), // Convert Uint8Array to array for JSON transmission
      settings
    });
    
    return { 
      success: true,
      messageId: result.messageId
    };
  } catch (error: any) {
    console.error('Error sending payment receipt:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send payment receipt'
    };
  }
};

// Send transfer details email with PDF
export const sendTransferDetails = async (
  to: string,
  transferDetails: any,
  pdfBuffer: Uint8Array
) => {
  try {
    const settings = await fetchEmailSettings();
    
    if (!settings) {
      throw new Error('Email settings not configured');
    }
    
    console.log('Email settings:', settings);
    console.log('Transfer details:', transferDetails);
    console.log('PDF buffer length:', pdfBuffer.length);
    
    // Check if the email settings are complete
    if (!settings.smtp_host || !settings.smtp_port || !settings.smtp_user || 
        !settings.smtp_password || !settings.sender_email || !settings.sender_name) {
      throw new Error('Email settings are incomplete. Please check your SMTP configuration.');
    }
    
    // Call the API to send the transfer details email
    const result = await callEmailApi(EMAIL_ENDPOINTS.transferDetails, {
      to,
      transferDetails,
      pdfBuffer: Array.from(pdfBuffer), // Convert Uint8Array to array for JSON transmission
      settings
    });
    
    return { 
      success: true,
      messageId: result.messageId
    };
  } catch (error: any) {
    console.error('Error sending transfer details:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send transfer details'
    };
  }
};

// Test email settings by sending a test email
export const testEmailSettings = async (settings: EmailSettings): Promise<{ success: boolean, error?: string, messageId?: string }> => {
  try {
    console.log('Testing email settings:', settings);
    
    // Validate settings before sending to the API
    if (!settings.smtp_host || !settings.smtp_port || !settings.smtp_user || 
        !settings.smtp_password || !settings.sender_email || !settings.sender_name) {
      return { 
        success: false, 
        error: 'Please fill in all email settings fields'
      };
    }
    
    // Call the API to test email settings
    const result = await callEmailApi(EMAIL_ENDPOINTS.test, { settings });
    
    return { 
      success: true,
      messageId: result.messageId 
    };
  } catch (error: any) {
    console.error('Error testing email settings:', error);
    // Create a more descriptive error message
    let errorMessage = error.message || 'Failed to test email settings';
    
    // Check for common SMTP/network errors
    if (errorMessage.includes('ECONNREFUSED')) {
      errorMessage = 'Connection refused. Please check if the email server is running and the SMTP host/port are correct.';
    } else if (errorMessage.includes('Authentication failed')) {
      errorMessage = 'Authentication failed. Please check your SMTP username and password.';
    } else if (errorMessage.includes('certificate has expired')) {
      errorMessage = 'SSL certificate issue. Try using a different port or disable SSL.';
    }
    
    return { 
      success: false, 
      error: errorMessage
    };
  }
};

// Dispatch a custom event to notify that email settings have been updated
function dispatchSettingsUpdatedEvent() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('email-settings-updated'));
  }
}

// Function to send itinerary email
export const sendItineraryEmail = async (
  recipientEmail: string,
  itineraryDetails: {
    itineraryName: string;
    destination: string;
    startDate: string;
    endDate: string;
    customerName: string;
  },
  pdfAttachment: Uint8Array
): Promise<{ success: boolean; error?: string }> => {
  try {
    const settings = await fetchEmailSettings();
    
    if (!settings) {
      throw new Error('Email settings not configured');
    }
    
    // Create HTML email content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">${itineraryDetails.itineraryName}</h1>
        <p>Dear ${itineraryDetails.customerName},</p>
        <p>We are pleased to share your travel itinerary with you.</p>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Destination:</strong> ${itineraryDetails.destination}</p>
          <p><strong>Travel Dates:</strong> ${itineraryDetails.startDate} to ${itineraryDetails.endDate}</p>
        </div>
        
        <p>We have prepared a detailed itinerary for your upcoming trip.</p>
        
        <p>If you have any questions or need any changes, please don't hesitate to contact us.</p>
        
        <p>We look forward to making your trip memorable!</p>
        
        <p>Best regards,<br>Your Travel Team</p>
      </div>
    `;

    return await sendEmail(
      recipientEmail,
      `Your Travel Itinerary: ${itineraryDetails.itineraryName}`,
      `Your travel itinerary for ${itineraryDetails.destination} from ${itineraryDetails.startDate} to ${itineraryDetails.endDate}.`,
      emailHtml
    );
  } catch (error: any) {
    console.error('Error sending itinerary email:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}; 