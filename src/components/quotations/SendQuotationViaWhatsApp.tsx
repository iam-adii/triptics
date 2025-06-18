import React from 'react';
import { WhatsAppShare } from '@/components/WhatsAppShare';
import { Share } from 'lucide-react';
import { useCompanySettings } from '@/contexts/CompanySettingsContext';

interface SendQuotationViaWhatsAppProps {
  quotation: any;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  buttonText?: string;
}

export function SendQuotationViaWhatsApp({
  quotation,
  className = '',
  size = 'default',
  variant = 'default',
  buttonText = 'Send Quotation'
}: SendQuotationViaWhatsAppProps) {
  if (!quotation) return null;

  // Get company settings
  const { companySettings } = useCompanySettings();
  const companyName = companySettings?.name || 'Triptics';

  // Format date for WhatsApp
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Create quotation message
  const createQuotationMessage = () => {
    // Add greeting with customer name if available
    let customerName = quotation.customers?.name || 'Valued Customer';
    
    let message = `*TOUR QUOTATION*\n`;
    message += `------------------\n\n`;
    
    message += `Dear ${customerName},\n\n`;
    message += `Thank you for your interest in our services. Please find your quotation details below:\n\n`;
    
    message += `*${quotation.title || quotation.quotation_number || 'Tour Package'}*\n`;
    message += `------------------\n\n`;
    
    // Customer details section
    if (quotation.customers?.name) {
      message += `*FOR:* ${quotation.customers.name}\n`;
    }
    
    // Tour details
    if (quotation.destination) {
      message += `*DESTINATION:* ${quotation.destination}\n`;
    }
    
    if (quotation.start_date && quotation.end_date) {
      message += `*DATES:* ${formatDate(quotation.start_date)} to ${formatDate(quotation.end_date)}\n`;
    }
    
    if (quotation.num_adults || quotation.num_children) {
      message += `*GUESTS:* ${quotation.num_adults || 0} Adults`;
      if (quotation.num_children > 0) {
        message += `, ${quotation.num_children} Children`;
      }
      message += '\n';
    }
    
    // Price details section
    message += `\n*PRICE DETAILS*\n`;
    message += `------------------\n`;
    
    if (quotation.base_price !== undefined) {
      message += `Base Price: ${formatCurrency(quotation.base_price)}\n`;
    }
    
    // Add any additional charges
    if (quotation.additional_charges && quotation.additional_charges.length > 0) {
      message += `\n*ADDITIONAL CHARGES:*\n`;
      quotation.additional_charges.forEach((charge: any) => {
        message += `- ${charge.description}: ${formatCurrency(charge.amount)}\n`;
      });
    }
    
    // Add discounts
    if (quotation.discount_amount && quotation.discount_amount > 0) {
      message += `\n*DISCOUNT:* ${formatCurrency(quotation.discount_amount)}\n`;
    }
    
    // Total amount (prominently displayed)
    if (quotation.total_amount !== undefined) {
      message += `\n*TOTAL AMOUNT: ${formatCurrency(quotation.total_amount)}*\n`;
    }
    
    // Notes section if available
    if (quotation.notes) {
      message += `\n*NOTES:*\n${quotation.notes}\n`;
    }
    
    // Inclusions section
    if (quotation.inclusions) {
      message += `\n*INCLUSIONS:*\n`;
      const inclusionItems = quotation.inclusions.split('\n')
        .filter((item: string) => item.trim() !== '')
        .map((item: string) => `+ ${item.trim()}`);
      message += inclusionItems.join('\n');
      message += '\n';
    }
    
    // Exclusions section
    if (quotation.exclusions) {
      message += `\n*EXCLUSIONS:*\n`;
      const exclusionItems = quotation.exclusions.split('\n')
        .filter((item: string) => item.trim() !== '')
        .map((item: string) => `- ${item.trim()}`);
      message += exclusionItems.join('\n');
      message += '\n';
    }
    
    // Call to action
    message += `\n------------------\n`;
    message += `We would be happy to customize this package according to your specific requirements. Please let us know if you would like to proceed or if you have any questions.\n\n`;
    message += `*Best regards,*\n*${companyName}*`;
    
    return message;
  };

  return (
    <WhatsAppShare
      message={createQuotationMessage()}
      phoneNumber={quotation.customer_phone || quotation.customers?.phone}
      customerName={quotation.customers?.name}
      className={className}
      size={size}
      variant={variant}
      buttonText={buttonText}
      buttonIcon={<Share className="h-4 w-4" />}
      title="Send Quotation via WhatsApp"
    />
  );
} 