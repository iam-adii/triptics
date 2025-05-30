import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Trash2, 
  Save, 
  PlusCircle, 
  Calendar,
  Download,
  Share2,
  Clock,
  Car,
  Building2,
  Bed,
  Star
} from "lucide-react";
import AutoSuggestInput from "./AutoSuggestInput";
import { format } from "date-fns";
import { BlobProvider } from "@react-pdf/renderer";
import ItineraryPDF from "./ItineraryPDF";
import { useCompanySettings } from "@/contexts/CompanySettingsContext";
import { Hotel } from "@/types/hotel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export interface ItineraryBuilderProps {
  itinerary: any;
  onSuccess?: () => void;
  isStandalone?: boolean;
}

export function ItineraryBuilder({ itinerary, onSuccess, isStandalone }: ItineraryBuilderProps) {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const { companySettings } = useCompanySettings();
  const [isHotelDialogOpen, setIsHotelDialogOpen] = useState(false);
  const [isCabDialogOpen, setIsCabDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  
  // Cab type options
  const cabTypes = [
    { value: "sedan", label: "Sedan" },
    { value: "suv", label: "SUV" },
    { value: "luxury", label: "Luxury Car" },
    { value: "minivan", label: "Minivan" },
    { value: "tempo", label: "Tempo Traveller" },
    { value: "bus", label: "Bus" },
    { value: "train", label: "Train" },
    { value: "flight", label: "Flight" }
  ];
  
  // Fetch itinerary days
  const { 
    data: days = [], 
    isLoading,
  } = useQuery({
    queryKey: ["itineraryDays", itinerary?.id],
    queryFn: async () => {
      if (!itinerary?.id) return [];
      
      const { data, error } = await supabase
        .from("itinerary_days")
        .select("*, hotel:hotel_id(*)")
        .eq("itinerary_id", itinerary.id)
        .order("day_number");
      
      if (error) throw error;
      return data;
    },
    enabled: !!itinerary?.id
  });

  // Fetch activities for all days
  const { 
    data: activities = [], 
    isLoading: loadingActivities 
  } = useQuery({
    queryKey: ["itineraryActivities", itinerary?.id],
    queryFn: async () => {
      if (!itinerary?.id) return [];
      
      const { data, error } = await supabase
        .from("itinerary_activities")
        .select("*, itinerary_day:itinerary_day_id(day_number)")
        .eq("itinerary_day.itinerary_id", itinerary.id)
        .order("sort_order");
      
      if (error) throw error;
      return data;
    },
    enabled: !!itinerary?.id
  });

  // Fetch hotels
  const { 
    data: hotels = [], 
    isLoading: loadingHotels 
  } = useQuery({
    queryKey: ["hotels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotels")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    }
  });

  // Calculate date for a specific day based on itinerary start date
  const calculateDayDate = (dayNumber: number) => {
    if (!itinerary?.start_date) return null;
    
    const startDate = new Date(itinerary.start_date);
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + dayNumber - 1); // Day 1 is start_date
    
    return dayDate;
  };

  // Initialize days based on itinerary duration
  useEffect(() => {
    const initializeDays = async () => {
      if (!itinerary?.id || !itinerary?.duration || isInitialized || days.length > 0) return;
      
      try {
        // First check if any days already exist for this itinerary
        const { data: existingDays, error: checkError } = await supabase
          .from("itinerary_days")
          .select("day_number")
          .eq("itinerary_id", itinerary.id)
          .order("day_number");
          
        if (checkError) throw checkError;
        
        // Create a set of existing day numbers
        const existingDayNumbers = new Set((existingDays || []).map(d => d.day_number));
        
        const daysToCreate = [];
        
        // Create the specified number of days, skipping any that already exist
        for (let i = 1; i <= itinerary.duration; i++) {
          if (existingDayNumbers.has(i)) continue;
          
          const dayDate = calculateDayDate(i);
          
          daysToCreate.push({
            itinerary_id: itinerary.id,
            day_number: i,
            date: dayDate ? dayDate.toISOString().split('T')[0] : null
          });
        }
        
        if (daysToCreate.length > 0) {
          // Insert days one by one to avoid conflicts
          for (const dayData of daysToCreate) {
            const { error: insertError } = await supabase
              .from("itinerary_days")
              .insert(dayData);
              
            if (insertError) {
              console.error("Error inserting day:", insertError);
              // Continue with other days even if one fails
            }
          }
          
          queryClient.invalidateQueries({ queryKey: ["itineraryDays", itinerary.id] });
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing days:", error);
        toast.error("Failed to initialize itinerary days");
      }
    };

    initializeDays();
  }, [itinerary, days, queryClient, isInitialized]);

  // Add day mutation
  const addDayMutation = useMutation({
    mutationFn: async () => {
      // First fetch all existing day numbers to find available numbers
      const { data: existingDays, error: fetchError } = await supabase
        .from("itinerary_days")
        .select("day_number")
        .eq("itinerary_id", itinerary.id)
        .order("day_number");
      
      if (fetchError) throw fetchError;
      
      // Create an array of existing day numbers
      const existingDayNumbers = (existingDays || []).map(d => d.day_number);
      
      // Find the next available day number
      let nextDayNumber = 1;
      
      if (existingDayNumbers.length > 0) {
        // Check for gaps in the sequence
        for (let i = 1; i <= Math.max(...existingDayNumbers) + 1; i++) {
          if (!existingDayNumbers.includes(i)) {
            nextDayNumber = i;
            break;
          }
        }
        
        // If no gaps, use the next number after the maximum
        if (nextDayNumber === 1 && existingDayNumbers.includes(1)) {
          nextDayNumber = Math.max(...existingDayNumbers) + 1;
        }
      }
      
      const dayDate = calculateDayDate(nextDayNumber);
      
      const { error } = await supabase
        .from("itinerary_days")
        .insert({
          itinerary_id: itinerary.id,
          day_number: nextDayNumber,
          date: dayDate ? dayDate.toISOString().split('T')[0] : null
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itineraryDays", itinerary.id] });
      toast.success("Day added successfully");
    },
    onError: (error) => {
      console.error("Error adding day:", error);
      toast.error("Failed to add day");
    }
  });

  // Delete day mutation
  const deleteDayMutation = useMutation({
    mutationFn: async (dayId: string) => {
      const { error } = await supabase
        .from("itinerary_days")
        .delete()
        .eq("id", dayId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itineraryDays", itinerary.id] });
      queryClient.invalidateQueries({ queryKey: ["itineraryActivities", itinerary.id] });
      toast.success("Day deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting day:", error);
      toast.error("Failed to delete day");
    }
  });

  // Update day hotel mutation
  const updateDayHotelMutation = useMutation({
    mutationFn: async ({ dayId, hotelId }: { dayId: string, hotelId: string | null }) => {
      const { error } = await supabase
        .from("itinerary_days")
        .update({ 
          hotel_id: hotelId,
          updated_at: new Date().toISOString()
        })
        .eq("id", dayId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itineraryDays", itinerary.id] });
      toast.success("Hotel updated successfully");
      setIsHotelDialogOpen(false);
    },
    onError: (error) => {
      console.error("Error updating hotel:", error);
      toast.error("Failed to update hotel");
    }
  });

  // Update day cab type mutation
  const updateDayCabTypeMutation = useMutation({
    mutationFn: async ({ dayId, cabType }: { dayId: string, cabType: string | null }) => {
      const { error } = await supabase
        .from("itinerary_days")
        .update({ 
          cab_type: cabType,
          updated_at: new Date().toISOString()
        })
        .eq("id", dayId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itineraryDays", itinerary.id] });
      toast.success("Transport type updated successfully");
      setIsCabDialogOpen(false);
    },
    onError: (error) => {
      console.error("Error updating transport type:", error);
      toast.error("Failed to update transport type");
    }
  });

  // Add activity mutation
  const addActivityMutation = useMutation({
    mutationFn: async ({ dayId, title, description, isTransfer }: { dayId: string, title: string, description?: string, isTransfer?: boolean }) => {
      // Get the highest sort order for this day
      const existingActivities = activities.filter(a => a.itinerary_day_id === dayId);
      const nextSortOrder = existingActivities.length > 0 
        ? Math.max(...existingActivities.map(a => a.sort_order)) + 1 
        : 0;
      
      const { error } = await supabase
        .from("itinerary_activities")
        .insert({
          itinerary_day_id: dayId,
          title,
          description: description || "",
          sort_order: nextSortOrder,
          is_transfer: isTransfer || false
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itineraryActivities", itinerary.id] });
    },
    onError: (error) => {
      console.error("Error adding activity:", error);
      toast.error("Failed to add activity");
    }
  });

  // Update activity mutation
  const updateActivityMutation = useMutation({
    mutationFn: async ({ 
      activityId, 
      title, 
      description, 
      timeStart, 
      timeEnd, 
      location,
      isTransfer
    }: { 
      activityId: string, 
      title?: string, 
      description?: string,
      timeStart?: string,
      timeEnd?: string,
      location?: string,
      isTransfer?: boolean
    }) => {
      const updateData: any = {};
      
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (timeStart !== undefined) updateData.time_start = timeStart;
      if (timeEnd !== undefined) updateData.time_end = timeEnd;
      if (location !== undefined) updateData.location = location;
      if (isTransfer !== undefined) updateData.is_transfer = isTransfer;
      
      const { error } = await supabase
        .from("itinerary_activities")
        .update(updateData)
        .eq("id", activityId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itineraryActivities", itinerary.id] });
    },
    onError: (error) => {
      console.error("Error updating activity:", error);
      toast.error("Failed to update activity");
    }
  });

  // Delete activity mutation
  const deleteActivityMutation = useMutation({
    mutationFn: async (activityId: string) => {
      const { error } = await supabase
        .from("itinerary_activities")
        .delete()
        .eq("id", activityId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itineraryActivities", itinerary.id] });
    },
    onError: (error) => {
      console.error("Error deleting activity:", error);
      toast.error("Failed to delete activity");
    }
  });

  // Share via WhatsApp
  const handleShareViaWhatsApp = () => {
    const baseMessage = `*${itinerary.name}*\n\n`;
    
    const daysMessage = days.map(day => {
      const dayActivities = activities.filter(a => a.itinerary_day_id === day.id);
      const dayDate = day.date ? new Date(day.date).toLocaleDateString() : '';
      
      let message = `*Day ${day.day_number}`;
      if (dayDate) message += ` (${dayDate})`;
      message += '*\n';
      
      // Add hotel information if available
      if (day.hotel) {
        message += `🏨 *Accommodation:* ${day.hotel.name}`;
        if (day.hotel.star_category) {
          message += ` ${Array(day.hotel.star_category).fill('⭐').join('')}`;
        }
        message += `\n📍 ${day.hotel.city}, ${day.hotel.state}\n\n`;
      }
      
      // Add cab type information if available
      if (day.cab_type) {
        const cabTypeObj = cabTypes.find(c => c.value === day.cab_type);
        const cabTypeName = cabTypeObj ? cabTypeObj.label : day.cab_type;
        message += `🚗 *Transport Type:* ${cabTypeName}\n\n`;
      }
      
      if (dayActivities.length === 0) {
        message += "No activities planned for this day\n";
      } else {
        // Add each activity
        dayActivities.forEach(activity => {
          // Choose emoji based on activity type
          const emoji = activity.is_transfer ? '🚗' : '🔷';
          
          // Add activity title with time if available
          if (activity.time_start) {
            message += `${emoji} *${format(new Date(`2000-01-01T${activity.time_start}`), 'h:mm a')}* - ${activity.title}\n`;
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
      
      return message;
    }).join('\n');
    
    const fullMessage = baseMessage + daysMessage + '\n*Shared via Triptics Itinerary Builder*';
    const encodedMessage = encodeURIComponent(fullMessage);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  // Add transfer between destinations
  const addTransferBetweenDays = (fromDayId: string, toDayId: string) => {
    const fromDay = days.find(d => d.id === fromDayId);
    const toDay = days.find(d => d.id === toDayId);
    
    if (!fromDay || !toDay) return;
    
    const title = `Transfer from Day ${fromDay.day_number} to Day ${toDay.day_number}`;
    addActivityMutation.mutate({ 
      dayId: toDayId, 
      title, 
      description: "Transportation between destinations", 
      isTransfer: true 
    });
  };

  // Fetch unique activity titles for suggestions
  const { data: activitySuggestions = [] } = useQuery({
    queryKey: ["activityTitles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("itinerary_activities")
        .select("title, description")
        .order("title");
      
      if (error) throw error;
      
      // Create a map of unique titles with their descriptions
      const suggestions = new Map();
      data.forEach(activity => {
        if (!suggestions.has(activity.title)) {
          suggestions.set(activity.title, activity.description || "");
        }
      });
      
      return Array.from(suggestions.entries()).map(([title, description]) => ({
        title,
        description
      }));
    }
  });

  if (isLoading || loadingActivities || loadingHotels) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="text-center p-4">
        <p>Itinerary data not available</p>
      </div>
    );
  }

  // Check if transfers are included
  const showTransferOptions = itinerary.transfer_included === 'yes' || itinerary.transfer_included === 'partial';

  return (
    <div className="space-y-6">
      {!isStandalone && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-semibold">{itinerary.name}</h2>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
              {itinerary.destination && (
                <>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {itinerary.start_date && itinerary.end_date
                      ? `${new Date(itinerary.start_date).toLocaleDateString()} - ${new Date(itinerary.end_date).toLocaleDateString()}`
                      : "No dates set"}
                  </span>
                  <span className="hidden sm:inline">•</span>
                </>
              )}
              <span>{itinerary.duration ? `${itinerary.duration} days` : ""}</span>
              {showTransferOptions && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1">
                    <Car className="h-4 w-4" />
                    {itinerary.transfer_included === 'partial' ? 'Partial transfers' : 'Transfers included'}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <BlobProvider
              document={<ItineraryPDF 
                itinerary={itinerary} 
                days={days} 
                activities={activities} 
                companySettings={companySettings}
              />}
            >
              {({ blob, url, loading, error }) => (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                  disabled={loading}
                  onClick={() => {
                    if (blob) {
                      // Create a URL for the blob
                      const blobUrl = window.URL.createObjectURL(blob);
                      
                      // Create a link element
                      const link = document.createElement('a');
                      link.href = blobUrl;
                      link.download = `${itinerary.name.replace(/\s+/g, '_')}.pdf`;
                      
                      // Append to the document, click, and remove
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      
                      // Release the blob URL
                      window.URL.revokeObjectURL(blobUrl);
                      
                      toast.success("PDF downloaded successfully");
                    } else if (error) {
                      toast.error("Failed to generate PDF. Please try again.");
                      console.error("PDF generation error:", error);
                    }
                  }}
                >
                  {loading ? 'Generating...' : 'PDF'}
                </Button>
              )}
            </BlobProvider>
            <Button onClick={handleShareViaWhatsApp} className="flex-1 md:flex-initial w-full md:w-auto h-10">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {days.map((day, index) => {
          const dayActivities = activities.filter(activity => 
            activity.itinerary_day_id === day.id
          );

          return (
            <React.Fragment key={day.id}>
              <DayCard
                day={day}
                activities={dayActivities}
                onDeleteDay={() => deleteDayMutation.mutate(day.id)}
                onAddActivity={(title, description) => 
                  addActivityMutation.mutate({ dayId: day.id, title, description })
                }
                onUpdateActivity={(activityId, data) => 
                  updateActivityMutation.mutate({ activityId, ...data })
                }
                onDeleteActivity={(activityId) => 
                  deleteActivityMutation.mutate(activityId)
                }
                onSelectHotel={() => {
                  setSelectedDay(day);
                  setIsHotelDialogOpen(true);
                }}
                onSelectCabType={() => {
                  setSelectedDay(day);
                  setIsCabDialogOpen(true);
                }}
                activityTitles={activitySuggestions}
                showTransferOption={showTransferOptions}
                cabTypes={cabTypes}
              />
              
              {/* Add transfer button between days if transfers are included */}
              {showTransferOptions && index < days.length - 1 && (
                <div className="flex justify-center -my-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-dashed flex items-center gap-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 h-10 px-4"
                    onClick={() => addTransferBetweenDays(day.id, days[index + 1].id)}
                  >
                    <Car className="h-4 w-4" />
                    Add Transfer to Next Day
                  </Button>
                </div>
              )}
            </React.Fragment>
          );
        })}

        <div className="flex justify-center py-4">
          <Button 
            onClick={() => addDayMutation.mutate()} 
            variant="outline"
            className="flex items-center gap-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 h-11 sm:h-10 px-6"
          >
            <PlusCircle className="h-4 w-4" />
            Add Day
          </Button>
        </div>
      </div>

      {/* Hotel Selection Dialog */}
      <Dialog open={isHotelDialogOpen} onOpenChange={setIsHotelDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedDay ? `Select Hotel for Day ${selectedDay.day_number}` : 'Select Hotel'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Select 
              onValueChange={(value) => {
                if (selectedDay) {
                  const hotelId = value === "none" ? null : value;
                  updateDayHotelMutation.mutate({ dayId: selectedDay.id, hotelId });
                }
              }}
              defaultValue={selectedDay?.hotel_id || "none"}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a hotel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Hotel / Remove Hotel</SelectItem>
                {hotels.map((hotel) => (
                  <SelectItem key={hotel.id} value={hotel.id}>
                    {hotel.name} - {hotel.city} ({hotel.star_category}★)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="mt-6">
              <Button 
                onClick={() => setIsHotelDialogOpen(false)} 
                variant="outline" 
                className="mr-2"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transport Type Selection Dialog */}
      <Dialog open={isCabDialogOpen} onOpenChange={setIsCabDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedDay ? `Select Transport Type for Day ${selectedDay.day_number}` : 'Select Transport Type'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Select 
              onValueChange={(value) => {
                if (selectedDay) {
                  const cabType = value === "none" ? null : value;
                  updateDayCabTypeMutation.mutate({ dayId: selectedDay.id, cabType });
                }
              }}
              defaultValue={selectedDay?.cab_type || "none"}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a transport type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Transport / Remove Transport</SelectItem>
                {cabTypes.map((cab) => (
                  <SelectItem key={cab.value} value={cab.value}>
                    {cab.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="mt-6">
              <Button 
                onClick={() => setIsCabDialogOpen(false)} 
                variant="outline" 
                className="mr-2"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface DayCardProps {
  day: any;
  activities: any[];
  onDeleteDay: () => void;
  onAddActivity: (title: string, description?: string) => void;
  onUpdateActivity: (activityId: string, data: any) => void;
  onDeleteActivity: (activityId: string) => void;
  onSelectHotel: () => void;
  onSelectCabType: () => void;
  activityTitles: any[];
  showTransferOption?: boolean;
  cabTypes: { value: string; label: string }[];
}

function DayCard({ 
  day, 
  activities, 
  onDeleteDay, 
  onAddActivity, 
  onUpdateActivity, 
  onDeleteActivity,
  onSelectHotel,
  onSelectCabType,
  activityTitles,
  showTransferOption,
  cabTypes
}: DayCardProps) {
  const [newActivityTitle, setNewActivityTitle] = useState("");
  const [newActivityDescription, setNewActivityDescription] = useState("");
  const [isTransfer, setIsTransfer] = useState(false);
  const newActivityInputRef = useRef<HTMLInputElement>(null);

  const handleAddActivity = () => {
    if (!newActivityTitle.trim()) return;
    
    onAddActivity(newActivityTitle.trim(), newActivityDescription.trim());
    setNewActivityTitle("");
    setNewActivityDescription("");
    setIsTransfer(false);
    
    // Focus back on the input
    setTimeout(() => {
      newActivityInputRef.current?.focus();
    }, 100);
  };

  const handleAddTransfer = () => {
    setNewActivityTitle("Transfer");
    setIsTransfer(true);
    newActivityInputRef.current?.focus();
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: { title: string; description: string }) => {
    setNewActivityTitle(suggestion.title);
    setNewActivityDescription(suggestion.description);
  };

  // Helper to render stars
  const renderStars = (count: number) => {
    return Array(count)
      .fill(0)
      .map((_, i) => (
        <Star key={i} className="h-3 w-3 text-amber-400 fill-amber-400" />
      ));
  };

  // Helper to get cab type label
  const getCabTypeLabel = (value: string) => {
    const cab = cabTypes.find(c => c.value === value);
    return cab ? cab.label : value;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2 sm:pb-4">
        <div>
          <CardTitle>Day {day.day_number}</CardTitle>
          {day.date && (
            <CardDescription>
              {format(new Date(day.date), "EEEE, MMMM d, yyyy")}
            </CardDescription>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 w-9 p-0"
          onClick={onDeleteDay}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete day</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hotel Information Section */}
        <div className="flex justify-between items-center border rounded-md p-3 bg-white">
          <div>
            {day.hotel ? (
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium text-gray-800">{day.hotel.name}</span>
                </div>
                <div className="flex items-center gap-1 mt-1 ml-6 text-xs text-muted-foreground">
                  <span>{day.hotel.city}, {day.hotel.state}</span>
                  <span className="flex items-center ml-2">
                    {renderStars(day.hotel.star_category)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Bed className="h-4 w-4" />
                <span>No accommodation selected</span>
              </div>
            )}
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onSelectHotel}
            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
          >
            {day.hotel ? "Change Hotel" : "Add Hotel"}
          </Button>
        </div>

        {/* Transport Type Section */}
        <div className="flex justify-between items-center border rounded-md p-3 bg-white">
          <div>
            {day.cab_type ? (
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-gray-800">
                  {getCabTypeLabel(day.cab_type)}
                </span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Car className="h-4 w-4" />
                <span>No transport type selected</span>
              </div>
            )}
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onSelectCabType}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            {day.cab_type ? "Change Transport" : "Add Transport"}
          </Button>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No activities added yet. Add your first activity below.
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {activities.map((activity, index) => (
              <ActivityItem 
                key={activity.id}
                activity={activity}
                onUpdate={(data) => onUpdateActivity(activity.id, data)}
                onDelete={() => onDeleteActivity(activity.id)}
                activityTitles={activityTitles}
                showTransferOption={showTransferOption}
              />
            ))}
          </Accordion>
        )}

        <div className="pt-4 border-t">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">Add New Activity</div>
              {showTransferOption && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-1 text-xs h-9"
                  onClick={handleAddTransfer}
                >
                  <Car className="h-3 w-3" /> Add Transfer
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <AutoSuggestInput
                ref={newActivityInputRef}
                value={newActivityTitle}
                onChange={setNewActivityTitle}
                placeholder={isTransfer ? "Transfer details (e.g., 'Transfer to hotel')" : "Activity title (e.g., 'City tour')"}
                suggestions={activityTitles}
                onSuggestionSelect={handleSuggestionSelect}
                className="h-10"
              />
              <Textarea
                value={newActivityDescription}
                onChange={(e) => setNewActivityDescription(e.target.value)}
                placeholder="Description (optional)"
                className="resize-none"
                rows={2}
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleAddActivity} 
          disabled={!newActivityTitle.trim()}
          className="w-full h-11 sm:h-10 bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" /> 
          {isTransfer ? "Add Transfer" : "Add Activity"}
        </Button>
      </CardFooter>
    </Card>
  );
}

interface ActivityItemProps {
  activity: any;
  onUpdate: (data: any) => void;
  onDelete: () => void;
  activityTitles: any[];
  showTransferOption?: boolean;
}

function ActivityItem({ 
  activity, 
  onUpdate, 
  onDelete,
  activityTitles,
  showTransferOption
}: ActivityItemProps) {
  const [title, setTitle] = useState(activity.title);
  const [description, setDescription] = useState(activity.description || "");
  const [timeStart, setTimeStart] = useState(activity.time_start || "");
  const [timeEnd, setTimeEnd] = useState(activity.time_end || "");
  const [location, setLocation] = useState(activity.location || "");
  const [isTransfer, setIsTransfer] = useState(activity.is_transfer || false);
  const [editing, setEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    const changed = 
      title !== activity.title || 
      description !== (activity.description || "") ||
      timeStart !== (activity.time_start || "") ||
      timeEnd !== (activity.time_end || "") ||
      location !== (activity.location || "") ||
      isTransfer !== (activity.is_transfer || false);
    
    setHasChanges(changed);
  }, [title, description, timeStart, timeEnd, location, isTransfer, activity]);

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: { title: string; description: string }) => {
    setTitle(suggestion.title);
    setDescription(suggestion.description);
  };

  // Save changes
  const handleSave = () => {
    if (!title.trim()) return;

    onUpdate({
      title: title.trim(),
      description: description.trim(),
      timeStart: timeStart || null,
      timeEnd: timeEnd || null,
      location: location.trim(),
      isTransfer
    });
    
    setEditing(false);
  };

  // Discard changes
  const handleCancel = () => {
    setTitle(activity.title);
    setDescription(activity.description || "");
    setTimeStart(activity.time_start || "");
    setTimeEnd(activity.time_end || "");
    setLocation(activity.location || "");
    setIsTransfer(activity.is_transfer || false);
    setEditing(false);
  };

  return (
    <AccordionItem value={activity.id} className="border px-3 sm:px-4 rounded-md">
      <AccordionTrigger className="py-3">
        <div className="flex flex-col items-start text-left w-full">
          <div className="font-medium flex items-center gap-2 w-full justify-between">
            <span className="flex items-center gap-2">
              {activity.is_transfer && <Car className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
              <span className="line-clamp-1">{activity.title}</span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 ml-2"
              aria-label="Delete activity"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            {(activity.time_start || activity.time_end) && (
              <Badge variant="outline" className="flex items-center text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {activity.time_start && format(new Date(`2000-01-01T${activity.time_start}`), 'h:mm a')}
                {activity.time_start && activity.time_end && " - "}
                {activity.time_end && format(new Date(`2000-01-01T${activity.time_end}`), 'h:mm a')}
              </Badge>
            )}
            {activity.is_transfer && (
              <Badge variant="secondary" className="flex items-center text-xs">
                Transfer
              </Badge>
            )}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 py-2">
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Title</label>
                <AutoSuggestInput
                  value={title}
                  onChange={setTitle}
                  placeholder="Activity title"
                  suggestions={activityTitles}
                  onSuggestionSelect={handleSuggestionSelect}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Start Time</label>
                  <Input
                    type="time"
                    value={timeStart}
                    onChange={(e) => setTimeStart(e.target.value)}
                    className="touch-manipulation"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">End Time</label>
                  <Input
                    type="time"
                    value={timeEnd}
                    onChange={(e) => setTimeEnd(e.target.value)}
                    className="touch-manipulation"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-1">Location</label>
                <Input
                  placeholder="Location (e.g., Hotel Lobby)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-1">Description</label>
                <Textarea
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {showTransferOption && (
                <div className="flex items-center gap-2 py-1">
                  <input 
                    type="checkbox" 
                    id={`transfer-${activity.id}`} 
                    checked={isTransfer}
                    onChange={(e) => setIsTransfer(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  <label htmlFor={`transfer-${activity.id}`} className="text-sm">
                    This is a transfer activity
                  </label>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between gap-2 pt-2">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={onDelete}
                  className="h-10 sm:h-9"
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCancel}
                    className="h-10 sm:h-9 flex-1 sm:flex-initial"
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSave} 
                    disabled={!title.trim() || !hasChanges}
                    className="h-10 sm:h-9 flex-1 sm:flex-initial"
                  >
                    <Save className="h-4 w-4 mr-2" /> Save
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {activity.location && (
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground">Location:</span>
                  <span>{activity.location}</span>
                </div>
              )}
              
              {activity.description && (
                <div className="text-sm whitespace-pre-line">
                  {activity.description}
                </div>
              )}
              
              <div className="flex justify-end pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setEditing(true)}
                  className="h-10 sm:h-9 w-full sm:w-auto"
                >
                  Edit Details
                </Button>
              </div>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
