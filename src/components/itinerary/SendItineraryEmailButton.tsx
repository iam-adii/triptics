import React, { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

interface SendItineraryEmailButtonProps extends ButtonProps {
  itinerary: any;
  days: any[];
  activities: any[];
  buttonText?: string;
  pdfBlob?: Blob | null;
  pricingOptions?: any;
}

const SendItineraryEmailButton: React.FC<SendItineraryEmailButtonProps> = ({
  itinerary,
  days,
  activities,
  buttonText = 'Email',
  pdfBlob,
  pricingOptions,
  ...props
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState(itinerary.customer_email || itinerary.customers?.email || '');
  const [isSending, setIsSending] = useState(false);

  const handleSendEmail = async () => {
    if (!emailAddress) {
      toast.error('Please enter an email address');
      return;
    }

    setIsSending(true);

    try {
      // Create a file from the blob if available
      let pdfFile = null;
      if (pdfBlob) {
        pdfFile = new File([pdfBlob], `${itinerary.name.replace(/\s+/g, '_')}.pdf`, { type: 'application/pdf' });
      }

      // Build the email content without showing accommodation and cab prices
      let emailContent = `<h1>${itinerary.name}</h1>`;
      
      if (itinerary.destination) {
        emailContent += `<p><strong>Destination:</strong> ${itinerary.destination}</p>`;
      }
      
      if (itinerary.start_date && itinerary.end_date) {
        emailContent += `<p><strong>Dates:</strong> ${new Date(itinerary.start_date).toLocaleDateString()} - ${new Date(itinerary.end_date).toLocaleDateString()}</p>`;
      }
      
      if (itinerary.duration) {
        emailContent += `<p><strong>Duration:</strong> ${itinerary.duration} day${itinerary.duration > 1 ? 's' : ''}</p>`;
      }
      
      emailContent += '<hr/><h2>Itinerary Details</h2>';
      
      // Add day by day details
      days.forEach(day => {
        const dayActivities = activities.filter(a => a.itinerary_day_id === day.id);
        
        emailContent += `<div style="margin-bottom: 20px;">`;
        emailContent += `<h3>Day ${day.day_number}${day.date ? ` - ${new Date(day.date).toLocaleDateString()}` : ''}</h3>`;
        
        // Add hotel information without prices
        if (day.hotel) {
          emailContent += `<div style="margin-bottom: 10px; padding: 10px; background-color: #f0f9ff; border-radius: 5px;">`;
          emailContent += `<p style="font-weight: bold; margin-bottom: 5px;">Accommodation: ${day.hotel.name}</p>`;
          emailContent += `<p style="margin: 0; font-size: 14px;">${day.hotel.city}, ${day.hotel.state}, ${day.hotel.country}</p>`;
          
          if (day.hotel.star_category) {
            emailContent += `<p style="margin: 5px 0;">Rating: ${day.hotel.star_category} ${day.hotel.star_category === 1 ? 'Star' : 'Stars'}</p>`;
          }
          
          if (day.room_type || day.meal_plan) {
            emailContent += `<div style="margin-top: 5px; padding-top: 5px; border-top: 1px solid #e0e0e0;">`;
            if (day.room_type) {
              emailContent += `<p style="margin: 0; font-size: 14px;">Room: ${day.room_type}${day.room_quantity && day.room_quantity > 1 ? ` x${day.room_quantity}` : ''}</p>`;
            }
            if (day.meal_plan) {
              emailContent += `<p style="margin: 0; font-size: 14px;">Meal Plan: ${day.meal_plan}</p>`;
            }
            emailContent += `</div>`;
          }
          
          emailContent += `</div>`;
        }
        
        // Add route information without prices
        if (day.route_name || day.cab_type) {
          emailContent += `<div style="margin-bottom: 10px; padding: 10px; background-color: #f0f7ff; border-radius: 5px;">`;
          
          if (day.route_name) {
            emailContent += `<p style="font-weight: bold; margin-bottom: 5px;">Route: ${day.route_name}</p>`;
            if (day.route_description) {
              emailContent += `<p style="margin: 0; font-size: 14px; font-style: italic;">${day.route_description}</p>`;
            }
          }
          
          if (day.cab_type) {
            emailContent += `<p style="margin: 5px 0; font-size: 14px;">Transport: ${day.cab_type}${day.cab_quantity && day.cab_quantity > 1 ? ` x${day.cab_quantity}` : ''}</p>`;
          }
          
          emailContent += `</div>`;
        }
        
        // Add day notes
        if (day.notes) {
          emailContent += `<div style="margin-bottom: 10px; padding: 10px; background-color: #fffbeb; border-radius: 5px;">`;
          emailContent += `<p style="font-weight: bold; margin-bottom: 5px;">Day Notes:</p>`;
          emailContent += `<p style="margin: 0; font-size: 14px; white-space: pre-line;">${day.notes}</p>`;
          emailContent += `</div>`;
        }
        
        // Add activities
        if (dayActivities.length > 0) {
          emailContent += `<div style="margin-top: 10px;">`;
          dayActivities.forEach(activity => {
            emailContent += `<div style="margin-bottom: 10px; padding: 10px; background-color: #f9fafb; border-radius: 5px;">`;
            emailContent += `<p style="font-weight: bold; margin-bottom: 5px;">${activity.title}</p>`;
            
            if (activity.time_start || activity.time_end) {
              emailContent += `<p style="margin: 0; font-size: 14px; color: #4b5563;">`;
              if (activity.time_start) {
                const startTime = new Date(`2000-01-01T${activity.time_start}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                emailContent += `Start: ${startTime}`;
              }
              if (activity.time_start && activity.time_end) {
                emailContent += ' - ';
              }
              if (activity.time_end) {
                const endTime = new Date(`2000-01-01T${activity.time_end}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                emailContent += `End: ${endTime}`;
              }
              emailContent += `</p>`;
            }
            
            if (activity.location) {
              emailContent += `<p style="margin: 5px 0; font-size: 14px; color: #4b5563;">Location: ${activity.location}</p>`;
            }
            
            if (activity.description) {
              emailContent += `<p style="margin: 5px 0; font-size: 14px;">${activity.description}</p>`;
            }
            
            emailContent += `</div>`;
          });
          emailContent += `</div>`;
        } else {
          emailContent += `<p style="font-style: italic; color: #6b7280;">No activities planned for this day</p>`;
        }
        
        emailContent += `</div>`;
      });
      
      // Add pricing section
      if (pricingOptions) {
        emailContent += '<hr/><h2>Pricing</h2>';
        
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
        
        emailContent += '<div style="margin-top: 20px; padding: 15px; background-color: #f0fff4; border-radius: 5px; border: 1px solid #c6f6d5;">';
        
        // Add additional services if any
        if (pricingOptions.additionalServices.length > 0) {
          emailContent += '<div style="margin-bottom: 15px;">';
          emailContent += '<p style="font-weight: bold; margin-bottom: 8px;">Additional Services:</p>';
          
          pricingOptions.additionalServices.forEach((service: any) => {
            if (service.name && service.price > 0) {
              const displayPrice = showPerPerson && adultsCount > 0 ?
                Math.round(service.price / adultsCount) :
                service.price;
                
              emailContent += `<div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>${service.name}</span>
                <span>₹${displayPrice.toFixed(showPerPerson ? 0 : 2)}</span>
              </div>`;
            }
          });
          
          emailContent += '</div>';
        }
        
        // Add tax if applicable
        if (pricingOptions.taxPercentage > 0) {
          const displayTax = showPerPerson && adultsCount > 0 ?
            Math.round(tax / adultsCount) :
            tax;
            
          emailContent += `<div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Tax (${pricingOptions.taxPercentage}%)</span>
            <span>₹${displayTax.toFixed(showPerPerson ? 0 : 2)}</span>
          </div>`;
        }
        
        // Add total
        const displayTotal = showPerPerson && adultsCount > 0 ?
          Math.round(total / adultsCount) :
          total;
          
        const priceLabel = showPerPerson ? 
          `Total Per Person (based on ${adultsCount} ${adultsCount === 1 ? "adult" : "adults"})` : 
          "Total";
          
        emailContent += `<div style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-weight: bold;">
          <span>${priceLabel}</span>
          <span style="color: #047857;">₹${displayTotal.toFixed(showPerPerson ? 0 : 2)}</span>
        </div>`;
        
        emailContent += '</div>';
      }
      
      // Add footer
      emailContent += `<hr/><p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 30px;">
        This itinerary was sent to you via Triptics Itinerary Builder
      </p>`;
      
      // Send the email
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: emailAddress,
          subject: `Itinerary: ${itinerary.name}`,
          html: emailContent,
          pdfAttachment: pdfFile ? {
            name: `${itinerary.name.replace(/\s+/g, '_')}.pdf`,
            content: await pdfFile.arrayBuffer(),
            contentType: 'application/pdf'
          } : null
        }
      });
      
      if (error) throw error;
      
      toast.success('Email sent successfully');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)} {...props}>
        <Mail className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">{buttonText}</span>
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Itinerary via Email</DialogTitle>
            <DialogDescription>
              Enter the email address where you want to send this itinerary
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="customer@example.com"
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmail} 
              disabled={isSending}
            >
              {isSending ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SendItineraryEmailButton; 