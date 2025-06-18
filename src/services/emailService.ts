import { toast } from 'sonner';
import { EMAIL_ENDPOINTS } from '../config/email';

/**
 * Email Settings interface
 */
export interface EmailSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  sender_name: string;
  sender_email: string;
}

/**
 * Fetch email settings from the database
 * @returns Promise with email settings or null
 */
export async function fetchEmailSettings(): Promise<EmailSettings | null> {
  try {
    const { supabase } = await import('../integrations/supabase/client');
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
}

/**
 * Fetch company name from settings
 * @returns Promise with company name or default value
 */
export async function fetchCompanyName(): Promise<string> {
  try {
    const { supabase } = await import('../integrations/supabase/client');
    const { data, error } = await supabase
      .from('company_settings')
      .select('name')
      .single();
    
    if (error) {
      console.error('Error fetching company name:', error);
      return 'Triptics';
    }
    
    return data.name || 'Triptics';
  } catch (error) {
    console.error('Exception fetching company name:', error);
    return 'Triptics';
  }
}

/**
 * Save email settings to the database
 * @param settings - Email settings to save
 * @returns Promise with success status and optional error message
 */
export async function saveEmailSettings(settings: EmailSettings): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await import('../integrations/supabase/client');
    
    // First check if settings already exist
    const { data, error } = await supabase
      .from('email_settings')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Error checking existing email settings:', error);
      return { success: false, error: error.message };
    }
    
    // If settings exist, update them, otherwise insert new
    if (data && data.length > 0) {
      const { error: updateError } = await supabase
        .from('email_settings')
        .update({
          smtp_host: settings.smtp_host,
          smtp_port: settings.smtp_port,
          smtp_user: settings.smtp_user,
          smtp_password: settings.smtp_password,
          sender_name: settings.sender_name,
          sender_email: settings.sender_email,
          updated_at: new Date().toISOString()
        })
        .eq('id', data[0].id);
      
      if (updateError) {
        console.error('Error updating email settings:', updateError);
        return { success: false, error: updateError.message };
      }
    } else {
      const { error: insertError } = await supabase
        .from('email_settings')
        .insert({
          smtp_host: settings.smtp_host,
          smtp_port: settings.smtp_port,
          smtp_user: settings.smtp_user,
          smtp_password: settings.smtp_password,
          sender_name: settings.sender_name,
          sender_email: settings.sender_email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Error inserting email settings:', insertError);
        return { success: false, error: insertError.message };
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Exception saving email settings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Test email settings by sending a test email
 * @param settings - Email settings to test
 * @returns Promise with success status and optional error message
 */
export async function testEmailSettings(settings: EmailSettings): Promise<{ success: boolean; error?: string }> {
  try {
    // First save the settings
    const saveResult = await saveEmailSettings(settings);
    
    if (!saveResult.success) {
      return saveResult;
    }

    // First test SMTP connectivity
    try {
      const response = await fetch(EMAIL_ENDPOINTS.test_smtp, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response from test-smtp:', textResponse);
        return { 
          success: false, 
          error: 'SMTP server returned non-JSON response. Please check server logs.'
        };
      }

      const smtpTest = await response.json();
      
      if (!response.ok || !smtpTest.success) {
        return { 
          success: false, 
          error: smtpTest.error || 'Failed to connect to SMTP server'
        };
      }
    } catch (error) {
      console.error('Error testing SMTP connection:', error);
      return { 
        success: false, 
        error: error instanceof Error ? 
          `SMTP connection error: ${error.message}` : 
          'Failed to connect to SMTP server'
      };
    }
    
    // Get company name for the email signature
    const companyName = await fetchCompanyName();
    
    // If SMTP connection is successful, send a test email
    const payload = {
      name: settings.sender_name,
      email: settings.sender_email,
      message: 'This is a test email to verify your email settings are working correctly.',
      type: 'test',
      settings,
      companyName  // Add company name to payload
    };
    
    try {
      const response = await fetch(EMAIL_ENDPOINTS.test_smtp + '&send=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response from send test email:', textResponse);
        return { 
          success: false, 
          error: 'Email server returned non-JSON response. Please check server logs.'
        };
      }

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        return { 
          success: false, 
          error: result.error || 'Failed to send test email'
        };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error sending test email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? 
          `Send error: ${error.message}` : 
          'Failed to send test email'
      };
    }
  } catch (error) {
    console.error('Error in testEmailSettings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if email server is available
 */
export async function checkEmailServer(): Promise<boolean> {
  try {
    const response = await fetch(EMAIL_ENDPOINTS.check, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Error checking email server:', error);
    return false;
  }
}

/**
 * Generic function to call the email API
 * @param endpoint - API endpoint
 * @param payload - Email payload
 * @returns Promise with response
 */
export async function callEmailApi(endpoint: string, payload: any): Promise<{ success: boolean; error?: string }> {
  try {
    // Get email settings to include with the request
    const settings = await fetchEmailSettings();
    
    // Get company name
    const companyName = await fetchCompanyName();
    
    // Include email settings and company name in the payload
    const updatedPayload = {
      ...payload,
      companyName,
      settings: settings || undefined
    };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedPayload),
    });

    // First check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // If not JSON, try to get the text and return as error
      const textResponse = await response.text();
      console.error('Non-JSON response from API:', textResponse);
      return { 
        success: false, 
        error: 'API returned non-JSON response. Please check server logs.'
      };
    }

    // If it is JSON, parse it
    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to send email' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error calling email API:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send transfer details via email
 * @param recipientEmail - Recipient email address
 * @param transferDetails - Transfer details object
 * @param pdfBuffer - PDF buffer as Uint8Array
 * @returns Promise with response
 */
export async function sendTransferDetails(
  recipientEmail: string,
  transferDetails: {
    transferId: string;
    customerName: string;
    vehicleType: string;
    vehicleNumber: string;
    pickupLocation: string;
    dropLocation: string;
    dateTime: string;
    driverName: string;
    driverContact: string;
  },
  pdfBuffer: Uint8Array
): Promise<{ success: boolean; error?: string }> {
  try {
    // Convert Uint8Array to regular array for JSON serialization
    const pdfArray = Array.from(pdfBuffer);

    const payload = {
      name: transferDetails.customerName,
      email: recipientEmail,
      message: `Transfer details for ${transferDetails.customerName}`,
      type: 'transfer',
      transferDetails,
      pdfAttachment: {
        content: pdfArray,
        filename: `transfer_${transferDetails.transferId}.pdf`,
      },
    };

    return await callEmailApi(EMAIL_ENDPOINTS.transfer, payload);
  } catch (error) {
    console.error('Error sending transfer details:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send payment receipt via email
 * @param recipientEmail - Recipient email address
 * @param paymentDetails - Payment details object
 * @param pdfBuffer - PDF buffer as Uint8Array
 * @returns Promise with response
 */
export async function sendPaymentReceipt(
  recipientEmail: string,
  paymentDetails: {
    paymentId: string;
    amount: string;
    date: string;
  },
  pdfBuffer: Uint8Array
): Promise<{ success: boolean; error?: string }> {
  try {
    // Convert Uint8Array to regular array for JSON serialization
    const pdfArray = Array.from(pdfBuffer);

    const payload = {
      name: 'Customer', // Required field for PHP mailer
      email: recipientEmail,
      message: `Payment receipt for ${paymentDetails.paymentId}`,
      type: 'payment',
      paymentDetails,
      pdfBuffer: pdfArray,
    };

    return await callEmailApi(EMAIL_ENDPOINTS.payment, payload);
  } catch (error) {
    console.error('Error sending payment receipt:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Update the send-email.php file to handle the transfer details
 * This function is used to update the PHP file with the necessary code to handle transfer emails
 */
export async function updateEmailHandlerForTransfers(): Promise<void> {
  // This is a placeholder function that would typically be used during setup
  // In a real implementation, this might update the PHP file or configure the email server
  toast.info('Email handler configured for transfers');
} 