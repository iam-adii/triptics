import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { shareItineraryViaEmail } from '@/services/itineraryEmailService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SendItineraryEmailButtonProps {
  itinerary: any;
  days?: any[];
  activities?: any[];
  recipientEmail?: string;
  buttonText?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  pdfBlob?: Blob;
}

const SendItineraryEmailButton: React.FC<SendItineraryEmailButtonProps> = ({
  itinerary,
  days,
  activities,
  recipientEmail,
  buttonText = 'Send via Email',
  variant = 'outline',
  size = 'default',
  className = '',
  pdfBlob
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    
    try {
      // If days and activities are already provided, use them
      let daysData = days;
      let activitiesData = activities;
      
      // Otherwise, fetch them from the database
      if (!daysData || !activitiesData) {
        const loadingToast = toast.loading("Fetching itinerary data...");
        
        try {
          // Fetch days
          const { data: fetchedDays = [], error: daysError } = await supabase
            .from("itinerary_days")
            .select("*, hotel:hotel_id(*)")
            .eq("itinerary_id", itinerary.id)
            .order("day_number");
          
          if (daysError) throw daysError;
          
          // Fetch activities
          const { data: fetchedActivities = [], error: activitiesError } = await supabase
            .from("itinerary_activities")
            .select("*, itinerary_day:itinerary_day_id(day_number)")
            .eq("itinerary_day.itinerary_id", itinerary.id)
            .order("sort_order");
          
          if (activitiesError) throw activitiesError;
          
          daysData = fetchedDays;
          activitiesData = fetchedActivities;
          
          toast.dismiss(loadingToast);
        } catch (error) {
          toast.dismiss(loadingToast);
          throw error;
        }
      }
      
      // Send the email
      await shareItineraryViaEmail(itinerary, daysData, activitiesData, recipientEmail, pdfBlob);
    } catch (error) {
      console.error("Error sending itinerary email:", error);
      toast.error("Failed to send email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={`flex items-center gap-2 ${className}`}
    >
      <Mail className="h-4 w-4" />
      <span className={size === 'icon' ? 'sr-only' : ''}>
        {isLoading ? 'Sending...' : buttonText}
      </span>
    </Button>
  );
};

export default SendItineraryEmailButton; 