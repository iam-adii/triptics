import React from 'react';
import { WhatsAppShare } from '@/components/WhatsAppShare';
import { Share } from 'lucide-react';
import { useCompanySettings } from '@/contexts/CompanySettingsContext';

interface SendTransferViaWhatsAppProps {
  transfer: any;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  buttonText?: string;
}

export function SendTransferViaWhatsApp({
  transfer,
  className = '',
  size = 'default',
  variant = 'default',
  buttonText = 'Send Transfer Details'
}: SendTransferViaWhatsAppProps) {
  if (!transfer) return null;

  // Get company settings
  const { companySettings } = useCompanySettings();
  const companyName = companySettings?.name || 'Triptics';

  // Format date for WhatsApp
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Format time for WhatsApp
  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Create transfer message
  const createTransferMessage = () => {
    // Add greeting with customer name if available
    const customerName = transfer.customer?.name || transfer.passenger_name || 'Valued Customer';
    
    let message = `*TRANSFER CONFIRMATION*\n`;
    message += `------------------\n\n`;
    
    message += `Dear ${customerName},\n\n`;
    message += `Your transportation has been arranged as follows:\n\n`;
    
    // Transfer reference number
    if (transfer.reference_id || transfer.id) {
      message += `*REFERENCE:* ${transfer.reference_id || transfer.id}\n`;
    }
    
    // Date and time
    if (transfer.date || transfer.pickup_datetime) {
      const datetime = transfer.date || transfer.pickup_datetime;
      message += `*DATE:* ${formatDate(datetime)}\n`;
      message += `*TIME:* ${formatTime(datetime)}\n`;
    }
    
    // Vehicle details
    if (transfer.vehicle_type) {
      message += `*VEHICLE:* ${transfer.vehicle_type}\n`;
    }
    
    if (transfer.vehicle_number) {
      message += `*VEHICLE NUMBER:* ${transfer.vehicle_number}\n`;
    }
    
    // Route details
    message += `\n*JOURNEY DETAILS*\n`;
    message += `------------------\n`;
    
    if (transfer.pickup_location) {
      message += `*PICKUP:* ${transfer.pickup_location}\n`;
    }
    
    if (transfer.dropoff_location) {
      message += `*DROP-OFF:* ${transfer.dropoff_location}\n`;
    }
    
    // Distance and duration if available
    if (transfer.distance) {
      message += `*DISTANCE:* ${transfer.distance}\n`;
    }
    
    if (transfer.duration) {
      message += `*ESTIMATED TRAVEL TIME:* ${transfer.duration}\n`;
    }
    
    // Driver details
    if (transfer.driver_name || transfer.driver_contact) {
      message += `\n*DRIVER DETAILS*\n`;
      message += `------------------\n`;
      
      if (transfer.driver_name) {
        message += `*NAME:* ${transfer.driver_name}\n`;
      }
      
      if (transfer.driver_contact) {
        message += `*CONTACT:* ${transfer.driver_contact}\n`;
      }
    }
    
    // Passenger details
    if (transfer.passenger_count > 0 || transfer.luggage_count > 0) {
      message += `\n*PASSENGER DETAILS*\n`;
      message += `------------------\n`;
      
      if (transfer.passenger_count) {
        message += `*PASSENGERS:* ${transfer.passenger_count}\n`;
      }
      
      if (transfer.luggage_count) {
        message += `*LUGGAGE:* ${transfer.luggage_count} item(s)\n`;
      }
    }
    
    // Notes or special instructions
    if (transfer.notes || transfer.special_instructions) {
      message += `\n*SPECIAL INSTRUCTIONS:*\n`;
      message += `${transfer.notes || transfer.special_instructions}\n`;
    }
    
    // Additional information
    message += `\n*IMPORTANT INFORMATION:*\n`;
    message += `- Please be ready 10 minutes before the scheduled pickup time.\n`;
    message += `- The driver will wait for up to 15 minutes at the pickup location.\n`;
    message += `- For any changes or cancellations, please contact us at least 2 hours before the scheduled time.\n`;
    
    // Call to action
    message += `\n------------------\n`;
    message += `If you need to make any changes to your transfer details or have any questions, please don't hesitate to contact us.\n\n`;
    message += `*Best regards,*\n*${companyName}*`;
    
    return message;
  };

  return (
    <WhatsAppShare
      message={createTransferMessage()}
      phoneNumber={transfer.customer_phone || transfer.customer?.phone}
      customerName={transfer.customer?.name || transfer.passenger_name}
      className={className}
      size={size}
      variant={variant}
      buttonText={buttonText}
      buttonIcon={<Share className="h-4 w-4" />}
      title="Send Transfer Details via WhatsApp"
    />
  );
} 