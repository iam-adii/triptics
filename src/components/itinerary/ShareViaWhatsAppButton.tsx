import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { toast } from 'sonner';
import { Share2 } from 'lucide-react';

interface ShareViaWhatsAppButtonProps extends ButtonProps {
  itinerary: any;
  days: any[];
  activities: any[];
  buttonText?: string;
  pricingOptions?: any;
}

const ShareViaWhatsAppButton: React.FC<ShareViaWhatsAppButtonProps> = ({
  itinerary,
  days,
  activities,
  buttonText = 'Share',
  pricingOptions,
  ...props
}) => {
  // Format date for WhatsApp
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time for WhatsApp
  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleShareViaWhatsApp = () => {
    if (!itinerary) return;
    
    // Create a well-formatted message for WhatsApp
    let message = `*${itinerary.name}*\n`;
    
    // Add destination if available
    if (itinerary.destination) {
      message += `📍 *${itinerary.destination}*\n`;
    }
    
    // Add date range if available
    if (itinerary.start_date && itinerary.end_date) {
      message += `🗓️ ${formatDate(itinerary.start_date)} to ${formatDate(itinerary.end_date)}\n`;
    }
    
    // Add duration if available
    if (itinerary.duration) {
      message += `⏱️ ${itinerary.duration} day${itinerary.duration > 1 ? 's' : ''}\n`;
    }
    
    message += '\n'; // Add spacing

    // Add each day with its activities
    days.forEach(day => {
      const dayActivities = activities.filter(a => a.itinerary_day_id === day.id);
      
      // Add day header with emoji
      message += `*📆 Day ${day.day_number}`;
      if (day.date) {
        message += ` - ${formatDate(day.date)}`;
      }
      message += '*\n\n';
      
      // Add hotel information if available (without prices)
      if (day.hotel) {
        message += `🏨 *Accommodation:* ${day.hotel.name}`;
        if (day.hotel.star_category) {
          message += ` ${Array(day.hotel.star_category).fill('⭐').join('')}`;
        }
        message += `\n📍 ${day.hotel.city}, ${day.hotel.state}, ${day.hotel.country}\n`;
        
        // Add room type and meal plan if available
        if (day.room_type) {
          message += `🛏️ Room: ${day.room_type}`;
          if (day.room_quantity && day.room_quantity > 1) {
            message += ` x${day.room_quantity}`;
          }
          message += '\n';
        }
        
        if (day.meal_plan) {
          message += `🍽️ Meal Plan: ${day.meal_plan}\n`;
        }
        
        message += '\n';
      }
      
      // Add route information if available - Without prices
      if (day.route_name) {
        message += `🚗 *Route:* ${day.route_name}\n`;
        if (day.route_description) {
          message += `${day.route_description}\n`;
        }
        if (day.cab_type) {
          message += `🚕 Transport: ${day.cab_type}`;
          
          // Add cab quantity if more than 1
          if (day.cab_quantity && day.cab_quantity > 1) {
            message += ` x${day.cab_quantity}`;
          }
          
          message += `\n\n`;
        } else {
          message += `\n\n`;
        }
      } else if (day.cab_type) {
        // Fallback to cab type if no route name
        message += `🚕 *Transport Type:* ${day.cab_type}`;
        
        // Add cab quantity if more than 1
        if (day.cab_quantity && day.cab_quantity > 1) {
          message += ` x${day.cab_quantity}`;
        }
        
        message += `\n\n`;
      }
      
      if (dayActivities.length === 0) {
        message += "No activities planned for this day\n\n";
      } else {
        // Add each activity with appropriate emoji and formatting
        dayActivities.forEach(activity => {
          // Choose emoji based on activity type
          const emoji = activity.is_transfer ? '🚗' : '🔷';
          
          // Add activity title with time if available
          if (activity.time_start) {
            message += `${emoji} *${formatTime(activity.time_start)}* - ${activity.title}\n`;
          } else {
            message += `${emoji} *${activity.title}*\n`;
          }
          
          // Add location if available
          if (activity.location) {
            message += `📍 ${activity.location}\n`;
          }
          
          // Add description if available
          if (activity.description) {
            message += `${activity.description}\n`;
          }
          
          message += '\n'; // Add spacing between activities
        });
      }
      
      message += '\n'; // Add extra spacing between days
    });
    
    // Add pricing summary
    if (pricingOptions) {
      message += '*💰 Pricing*\n';
      
      // Calculate pricing details
      let accommodationTotal = 0;
      let transportTotal = 0;
      
      // Calculate accommodation costs
      days.forEach(day => {
        if (day.room_price) {
          accommodationTotal += parseFloat(day.room_price);
        }
      });
      
      // Calculate transport costs
      days.forEach(day => {
        if (day.cab_price) {
          transportTotal += parseFloat(day.cab_price);
        }
      });
      
      const additionalServicesTotal = pricingOptions.additionalServices.reduce(
        (sum: number, service: any) => sum + service.price, 0
      );
      
      const subtotal = accommodationTotal + transportTotal + additionalServicesTotal;
      const agentCharges = pricingOptions.agentCharges;
      const tax = subtotal * (pricingOptions.taxPercentage / 100);
      const total = subtotal + agentCharges + tax;
      const showPerPerson = pricingOptions.showPerPersonPrice === true;
      const adultsCount = itinerary.customers?.adults || 0;
      
      // Add additional services if any
      if (pricingOptions.additionalServices.length > 0) {
        message += '\n*Additional Services:*\n';
        pricingOptions.additionalServices.forEach((service: any) => {
          if (service.name && service.price > 0) {
            const displayPrice = showPerPerson && adultsCount > 0 ?
              Math.round(service.price / adultsCount) :
              service.price;
            message += `- ${service.name}: ₹${displayPrice.toFixed(showPerPerson ? 0 : 2)}\n`;
          }
        });
      }
      
      // Add tax if applicable
      if (pricingOptions.taxPercentage > 0) {
        const displayTax = showPerPerson && adultsCount > 0 ?
          Math.round(tax / adultsCount) :
          tax;
        message += `Tax (${pricingOptions.taxPercentage}%): ₹${displayTax.toFixed(showPerPerson ? 0 : 2)}\n`;
      }
      
      // Add total
      const displayTotal = showPerPerson && adultsCount > 0 ?
        Math.round(total / adultsCount) :
        total;
      
      const priceLabel = showPerPerson ? 
        `Total Per Person (based on ${adultsCount} ${adultsCount === 1 ? "adult" : "adults"})` : 
        "Total";
      
      message += `\n*${priceLabel}: ₹${displayTotal.toFixed(showPerPerson ? 0 : 2)}*\n`;
    }
    
    // Add footer
    message += `\n*Shared via Triptics Itinerary Builder*`;
    
    // Get customer phone number if available
    const phoneNumber = itinerary.customer_phone || itinerary.customers?.phone;
    const encodedMessage = encodeURIComponent(message);
    
    // If we have a phone number, use it; otherwise open WhatsApp without a specific recipient
    if (phoneNumber) {
      // Format phone number to ensure it has country code (assuming +91 for India if not provided)
      let formattedNumber = phoneNumber.trim();
      
      // If the number doesn't start with +, add the country code
      if (!formattedNumber.startsWith('+')) {
        // Remove any leading zeros
        formattedNumber = formattedNumber.replace(/^0+/, '');
        
        // If it doesn't start with a country code (like 91), add it
        if (!formattedNumber.startsWith('91')) {
          formattedNumber = '91' + formattedNumber;
        }
        
        // Add the + prefix
        formattedNumber = '+' + formattedNumber;
      }
      
      // Remove any spaces, dashes, or parentheses
      formattedNumber = formattedNumber.replace(/[\s\-()]/g, '');
      
      window.open(`https://wa.me/${formattedNumber}?text=${encodedMessage}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    }
  };

  return (
    <Button onClick={handleShareViaWhatsApp} {...props}>
      <Share2 className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">{buttonText}</span>
    </Button>
  );
};

export default ShareViaWhatsAppButton; 