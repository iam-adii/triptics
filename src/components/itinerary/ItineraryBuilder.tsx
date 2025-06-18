/**
 * SQL Schema for cab_quantity and room_quantity:
 * 
 * -- Add cab_quantity column to itinerary_days table
 * ALTER TABLE itinerary_days 
 * ADD COLUMN cab_quantity INTEGER DEFAULT 1;
 * 
 * -- Add room_quantity column to itinerary_days table
 * ALTER TABLE itinerary_days 
 * ADD COLUMN room_quantity INTEGER DEFAULT 1;
 * 
 * -- Add cab_unit_price column to itinerary_days table
 * ALTER TABLE itinerary_days 
 * ADD COLUMN cab_unit_price DECIMAL(10,2);
 * 
 * -- Add room_unit_price column to itinerary_days table
 * ALTER TABLE itinerary_days 
 * ADD COLUMN room_unit_price DECIMAL(10,2);
 * 
 * -- Update existing records to have default values
 * UPDATE itinerary_days 
 * SET cab_quantity = 1, room_quantity = 1 
 * WHERE cab_quantity IS NULL OR room_quantity IS NULL;
 * 
 * -- Update existing records to set unit prices based on total prices
 * UPDATE itinerary_days 
 * SET cab_unit_price = cab_price / cab_quantity 
 * WHERE cab_price IS NOT NULL AND cab_quantity IS NOT NULL AND cab_quantity > 0;
 * 
 * UPDATE itinerary_days 
 * SET room_unit_price = room_price / room_quantity 
 * WHERE room_price IS NOT NULL AND room_quantity IS NOT NULL AND room_quantity > 0;
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { Switch } from "@/components/ui/switch";

export interface ItineraryBuilderProps {
  itinerary: any;
  onSuccess?: () => void;
  isStandalone?: boolean;
  pricingOptions?: {
    taxPercentage: number;
    agentCharges: number;
    additionalServices: {
      id: string;
      name: string;
      price: number;
    }[];
    showPerPersonPrice?: boolean;
  };
  onPricingOptionsChange?: (options: any) => void;
}

// Add new interface for transfer routes and cab types
interface TransferRoute {
  id: string;
  name: string;
  description: string;
  cab_types: TransferCabType[];
}

interface TransferCabType {
  id: string;
  name: string;
  price: number;
  season_name?: string;
  season_start?: string;
  season_end?: string;
}

// Add new interface for pricing options
interface PricingOptions {
  taxPercentage: number;
  agentCharges: number;
  additionalServices: AdditionalService[];
  showPerPersonPrice: boolean; // Add flag for per person pricing
}

interface AdditionalService {
  id: string;
  name: string;
  price: number;
}

export function ItineraryBuilder({ 
  itinerary, 
  onSuccess, 
  isStandalone,
  pricingOptions: initialPricingOptions,
  onPricingOptionsChange
}: ItineraryBuilderProps) {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const { companySettings } = useCompanySettings();
  const [isHotelDialogOpen, setIsHotelDialogOpen] = useState(false);
  const [isCabDialogOpen, setIsCabDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [roomType, setRoomType] = useState<string>("no_room_type");
  const [mealPlan, setMealPlan] = useState<string>("no_meal_plan");
  const [roomPrice, setRoomPrice] = useState<string>("");
  const [hotelRooms, setHotelRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [hotelRoomRates, setHotelRoomRates] = useState<any[]>([]);
  const [selectedRoomRateId, setSelectedRoomRateId] = useState<string | null>(null);
  
  // Add pricing options state with default values
  const [pricingOptions, setPricingOptions] = useState<PricingOptions>(
    initialPricingOptions ? {
      ...initialPricingOptions,
      showPerPersonPrice: initialPricingOptions.showPerPersonPrice ?? false
    } : {
      taxPercentage: 0,
      agentCharges: 0,
      additionalServices: [],
      showPerPersonPrice: false
    }
  );
  const [isPricingDialogOpen, setIsPricingDialogOpen] = useState(false);
  
  // Add state for transfer routes and selected route
  const [transferRoutes, setTransferRoutes] = useState<TransferRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [loadingTransferRoutes, setLoadingTransferRoutes] = useState(false);
  
  // Add new state variables for quantities
  const [roomQuantity, setRoomQuantity] = useState<number>(1);
  const [cabQuantity, setCabQuantity] = useState<number>(1);
  
  // Add a state to track the selected cab type and its price
  const [selectedCabTypePrice, setSelectedCabTypePrice] = useState<number | null>(null);
  // Add state for tracking the selected cab type ID
  const [selectedCabTypeId, setSelectedCabTypeId] = useState<string | null>(null);
  
  // Debug logging for selectedDay
  useEffect(() => {
    if (selectedDay) {
      console.log("Selected Day:", selectedDay);
      console.log("Hotel ID:", selectedDay.hotel_id);
      console.log("Room Type:", selectedDay.room_type);
      console.log("Meal Plan:", selectedDay.meal_plan);
      console.log("Room Price:", selectedDay.room_price);
      console.log("Room Quantity:", selectedDay.room_quantity);
      console.log("Cab Quantity:", selectedDay.cab_quantity);
      
      // Initialize room details state
      setRoomType(selectedDay.room_type || "no_room_type");
      setMealPlan(selectedDay.meal_plan || "no_meal_plan");
      setRoomPrice(selectedDay.room_price?.toString() || "");
      setRoomQuantity(selectedDay.room_quantity || 1);
      setCabQuantity(selectedDay.cab_quantity || 1);
      
      // Fetch hotel rooms if hotel is selected
      if (selectedDay.hotel_id) {
        fetchHotelRooms(selectedDay.hotel_id);
      } else {
        // Clear room rates if no hotel selected
        setHotelRoomRates([]);
        setSelectedRoomRateId(null);
      }
    }
  }, [selectedDay]);
  
  // Cab type options
  const cabTypes = [
    { value: "WagonR/Hatchback", label: "WagonR/Hatchback" },
    { value: "Innova/Xylo", label: "Innova/Xylo" },
    { value: "Innova Crysta", label: "Innova Crysta" },
    { value: "Sumo/Bolero", label: "Sumo/Bolero" },
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
        .select("*, hotel:hotel_id(*), route_name, route_description, cab_type, cab_price")
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

  // Fetch transfer routes
  useEffect(() => {
    const fetchTransferRoutes = async () => {
      setLoadingTransferRoutes(true);
      try {
        // Fetch routes from Supabase
        const { data: routes, error: routesError } = await supabase
          .from("transfer_routes")
          .select("*")
          .order("name");
        
        if (routesError) throw routesError;
        
        // Fetch cab types for each route
        const routesWithCabTypes = await Promise.all(
          (routes || []).map(async (route) => {
            const { data: cabTypes, error: cabTypesError } = await supabase
              .from("transfer_cab_types")
              .select("*")
              .eq("route_id", route.id)
              .order("name");
            
            if (cabTypesError) throw cabTypesError;
            
            return {
              ...route,
              cab_types: cabTypes || [],
            };
          })
        );
        
        setTransferRoutes(routesWithCabTypes);
      } catch (error) {
        console.error("Error fetching transfer routes:", error);
        toast.error("Failed to load transfer routes");
      } finally {
        setLoadingTransferRoutes(false);
      }
    };

    fetchTransferRoutes();
  }, []);

  // Get filtered cab types based on the day's date
  const getFilteredCabTypesForDate = (cabTypes: TransferCabType[], dayDate: Date | null) => {
    if (!dayDate) return cabTypes;
    
    // Format date as YYYY-MM-DD for comparison
    const formattedDayDate = dayDate.toISOString().split('T')[0];
    
    // Filter cab types based on season dates
    return cabTypes.filter(cabType => {
      // If no season dates, always include
      if (!cabType.season_name || (!cabType.season_start && !cabType.season_end)) return true;
      
      // If only start date, check if day date is after start
      if (cabType.season_start && !cabType.season_end) {
        return formattedDayDate >= cabType.season_start;
      }
      
      // If only end date, check if day date is before end
      if (!cabType.season_start && cabType.season_end) {
        return formattedDayDate <= cabType.season_end;
      }
      
      // If both dates, check if day date is between start and end
      return formattedDayDate >= cabType.season_start! && formattedDayDate <= cabType.season_end!;
    });
  };

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

  // Update day hotel details mutation
  const updateDayHotelDetailsMutation = useMutation({
    mutationFn: async ({ 
      dayId, 
      roomType, 
      mealPlan, 
      roomPrice,
      roomQuantity,
      roomUnitPrice
    }: { 
      dayId: string, 
      roomType: string | null, 
      mealPlan: string | null,
      roomPrice: number | null,
      roomQuantity: number,
      roomUnitPrice?: number
    }) => {
      // Convert special values to null
      const finalRoomType = roomType === "no_room_type" ? null : roomType;
      const finalMealPlan = mealPlan === "no_meal_plan" ? null : mealPlan;
      
      // Store the unit price and calculate total room price based on quantity
      const totalRoomPrice = roomPrice && roomQuantity ? roomPrice * roomQuantity : roomPrice;
      
      const { error } = await supabase
        .from("itinerary_days")
        .update({ 
          room_type: finalRoomType,
          meal_plan: finalMealPlan,
          room_price: totalRoomPrice,
          room_unit_price: roomUnitPrice || roomPrice,
          room_quantity: roomQuantity,
          updated_at: new Date().toISOString()
        })
        .eq("id", dayId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itineraryDays", itinerary.id] });
      toast.success("Room details updated successfully");
    },
    onError: (error) => {
      console.error("Error updating room details:", error);
      toast.error("Failed to update room details");
    }
  });

  // Update day cab type mutation
  const updateDayCabTypeMutation = useMutation({
    mutationFn: async ({ dayId, cabType, routeName, cabPrice, routeDescription, cabQuantity, cabUnitPrice }: { 
      dayId: string, 
      cabType: string | null, 
      routeName?: string, 
      cabPrice?: number,
      routeDescription?: string,
      cabQuantity?: number,
      cabUnitPrice?: number
    }) => {
      // Store the unit price and calculate total cab price based on quantity
      const totalCabPrice = cabUnitPrice && cabQuantity ? cabUnitPrice * cabQuantity : cabPrice;
      
      const { error } = await supabase
        .from("itinerary_days")
        .update({ 
          cab_type: cabType,
          route_name: routeName,
          cab_price: totalCabPrice,
          cab_unit_price: cabUnitPrice || cabPrice,
          route_description: routeDescription,
          cab_quantity: cabQuantity || 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", dayId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itineraryDays", itinerary.id] });
      toast.success("Transport type updated successfully");
      setIsCabDialogOpen(false);
      setSelectedRouteId(null);
    },
    onError: (error) => {
      console.error("Error updating transport type:", error);
      toast.error("Failed to update transport type");
    }
  });

  // Add a new mutation for directly removing transport without opening the dialog
  const removeTransportMutation = useMutation({
    mutationFn: async (dayId: string) => {
      const { error } = await supabase
        .from("itinerary_days")
        .update({ 
          cab_type: null,
          route_name: null,
          cab_price: null,
          cab_unit_price: null,
          route_description: null,
          cab_quantity: 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", dayId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itineraryDays", itinerary.id] });
      toast.success("Transport removed successfully");
    },
    onError: (error) => {
      console.error("Error removing transport:", error);
      toast.error("Failed to remove transport");
    }
  });

  // Add a new mutation for directly removing hotel without opening the dialog
  const removeHotelMutation = useMutation({
    mutationFn: async (dayId: string) => {
      const { error } = await supabase
        .from("itinerary_days")
        .update({ 
          hotel_id: null,
          room_type: null,
          meal_plan: null,
          room_price: null,
          room_unit_price: null,
          room_quantity: 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", dayId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itineraryDays", itinerary.id] });
      toast.success("Accommodation removed successfully");
    },
    onError: (error) => {
      console.error("Error removing accommodation:", error);
      toast.error("Failed to remove accommodation");
    }
  });

  // Add update day notes mutation
  const updateDayNotesMutation = useMutation({
    mutationFn: async ({ dayId, notes }: { dayId: string, notes: string | null }) => {
      const { error } = await supabase
        .from("itinerary_days")
        .update({ 
          notes,
          updated_at: new Date().toISOString()
        })
        .eq("id", dayId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itineraryDays", itinerary.id] });
      toast.success("Day notes updated successfully");
    },
    onError: (error) => {
      console.error("Error updating day notes:", error);
      toast.error("Failed to update day notes");
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
    // Create a local copy of the pricing options to ensure we're using the latest state
    const currentPricingOptions = {...pricingOptions};
    const showPerPerson = currentPricingOptions.showPerPersonPrice === true;
    const adultsCount = itinerary.customers?.adults || 0;
    
    console.log("WhatsApp sharing - using per person prices:", showPerPerson);
    console.log("WhatsApp sharing - adults count:", adultsCount);
    
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
        message += `🚗 *Transport Type:* ${cabTypeName}`;
        
        // Add cab quantity if more than 1
        if (day.cab_quantity && day.cab_quantity > 1) {
          message += ` x${day.cab_quantity}`;
        }
        
        // Don't include price information in WhatsApp message
        message += `\n\n`;
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
    
    // Add pricing information
    let pricingMessage = '\n*💰 Pricing Summary*\n';
    
    // Add additional services if any
    if (pricingOptions.additionalServices.length > 0) {
      pricingMessage += '\n*Additional Services:*\n';
      pricingOptions.additionalServices.forEach(service => {
        if (service.name && service.price > 0) {
          const displayPrice = showPerPerson && adultsCount > 0 ?
            Math.round(service.price / adultsCount) :
            service.price;
          pricingMessage += `- ${service.name}: ₹${displayPrice.toFixed(showPerPerson ? 0 : 2)}\n`;
        }
      });
      
      const additionalServicesTotal = pricingOptions.additionalServices.reduce(
        (sum, service) => sum + service.price, 0
      );
      
      const displayAdditionalServicesTotal = showPerPerson && adultsCount > 0 ?
        Math.round(additionalServicesTotal / adultsCount) :
        additionalServicesTotal;
      
      pricingMessage += `Additional Services Total: ₹${displayAdditionalServicesTotal.toFixed(showPerPerson ? 0 : 2)}\n\n`;
    }
    
    // Calculate subtotal (hidden from customers but needed for total)
    let accommodationTotal = 0;
    let transportTotal = 0;
    
    days.forEach(day => {
      if (day.room_price) accommodationTotal += parseFloat(day.room_price);
      if (day.cab_price) transportTotal += parseFloat(day.cab_price);
    });
    
    const additionalServicesTotal = pricingOptions.additionalServices.reduce(
      (sum, service) => sum + service.price, 0
    );
    
    const subtotal = accommodationTotal + transportTotal + additionalServicesTotal;
    
    const displaySubtotal = showPerPerson && adultsCount > 0 ?
      Math.round(subtotal / adultsCount) :
      subtotal;
    
    pricingMessage += `Subtotal: ₹${displaySubtotal.toFixed(showPerPerson ? 0 : 2)}\n`;
    
    // Add tax if applicable
    if (pricingOptions.taxPercentage > 0) {
      const tax = subtotal * (pricingOptions.taxPercentage / 100);
      const displayTax = showPerPerson && adultsCount > 0 ?
        Math.round(tax / adultsCount) :
        tax;
      pricingMessage += `Tax (${pricingOptions.taxPercentage}%): ₹${displayTax.toFixed(showPerPerson ? 0 : 2)}\n`;
    }
    
    // Calculate total
    const agentCharges = pricingOptions.agentCharges;
    const tax = subtotal * (pricingOptions.taxPercentage / 100);
    const total = subtotal + agentCharges + tax;
    
    const displayTotal = showPerPerson && adultsCount > 0 ?
      Math.round(total / adultsCount) :
      total;
    
    const priceLabel = showPerPerson ? 
      `Total Per Person (based on ${adultsCount} {adultsCount === 1 ? "adult" : "adults"})` : 
      "Total";
    
    pricingMessage += `\n*${priceLabel}: ₹${displayTotal.toFixed(showPerPerson ? 0 : 2)}*\n`;
    
    const fullMessage = baseMessage + daysMessage + pricingMessage + '\n*Shared via Triptics Itinerary Builder*';
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

  // Fetch hotel rooms when hotel is selected
  const fetchHotelRooms = async (hotelId: string) => {
    if (!hotelId) {
      setHotelRooms([]);
      setHotelRoomRates([]);
      return;
    }
    
    try {
      // Get the day's date
      const dayDate = selectedDay?.date ? new Date(selectedDay.date) : null;
      
      // Fetch hotel with room rates
      const { data, error } = await supabase
        .from("hotel_room_rates")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("room_type");
      
      if (error) throw error;
      
      // Filter room rates by season if we have a date
      let filteredRates = [...(data || [])];
      
      if (dayDate) {
        // Format date as YYYY-MM-DD for comparison
        const formattedDayDate = dayDate.toISOString().split('T')[0];
        
        // Filter rates based on season dates
        filteredRates = filteredRates.filter(rate => {
          // If no season dates, always include
          if (!rate.season_start && !rate.season_end) return true;
          
          // If only start date, check if day date is after start
          if (rate.season_start && !rate.season_end) {
            return formattedDayDate >= rate.season_start;
          }
          
          // If only end date, check if day date is before end
          if (!rate.season_start && rate.season_end) {
            return formattedDayDate <= rate.season_end;
          }
          
          // If both dates, check if day date is between start and end
          return formattedDayDate >= rate.season_start && formattedDayDate <= rate.season_end;
        });
        
        console.log("Day date:", formattedDayDate);
        console.log("Filtered rates for date:", filteredRates);
      }
      
      console.log("Hotel room rates:", filteredRates);
      setHotelRoomRates(filteredRates);
      
      // Reset room selection
      setSelectedRoomRateId(null);
      setRoomType("no_room_type");
      setMealPlan("no_meal_plan");
      setRoomPrice("");
    } catch (error) {
      console.error("Error fetching hotel room rates:", error);
      toast.error("Failed to load room options");
      setHotelRoomRates([]);
    }
  };

  // Effect to match room when hotel rooms are fetched
  useEffect(() => {
    if (selectedDay && hotelRoomRates.length > 0 && selectedDay.room_type && selectedDay.meal_plan) {
      // Try to find a matching room rate
      const matchingRate = hotelRoomRates.find(
        rate => rate.room_type === selectedDay.room_type
      );
      
      if (matchingRate) {
        console.log("Found matching room rate:", matchingRate);
        setSelectedRoomRateId(matchingRate.id);
        
        // Set the meal plan and price based on the stored meal plan
        if (selectedDay.meal_plan === "CP") {
          setRoomPrice(matchingRate.cp_rate.toString());
        } else if (selectedDay.meal_plan === "MAP") {
          setRoomPrice(matchingRate.map_rate.toString());
        } else if (selectedDay.meal_plan === "AP") {
          setRoomPrice(matchingRate.ap_rate.toString());
        } else if (selectedDay.meal_plan === "EP") {
          setRoomPrice(matchingRate.ep_rate.toString());
        }
      }
    }
  }, [hotelRoomRates, selectedDay]);

  // Calculate total pricing
  const pricingSummary = useMemo(() => {
    let accommodationTotal = 0;
    let transportTotal = 0;
    let additionalServicesTotal = 0;
    
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
    
    // Calculate additional services
    additionalServicesTotal = pricingOptions.additionalServices.reduce(
      (sum, service) => sum + service.price, 
      0
    );
    
    // Calculate subtotal
    const subtotal = accommodationTotal + transportTotal + additionalServicesTotal;
    
    // Calculate agent charges
    const agentCharges = pricingOptions.agentCharges;
    
    // Calculate tax
    const tax = subtotal * (pricingOptions.taxPercentage / 100);
    
    // Calculate total
    const total = subtotal + agentCharges + tax;
    
    return {
      accommodationTotal,
      transportTotal,
      additionalServicesTotal,
      subtotal,
      agentCharges,
      tax,
      total,
      taxPercentage: pricingOptions.taxPercentage
    };
  }, [days, pricingOptions]);

  // Update parent component when pricing options change
  useEffect(() => {
    if (onPricingOptionsChange) {
      console.log("Updating parent with pricing options:", pricingOptions);
      onPricingOptionsChange(pricingOptions);
    }
  }, [pricingOptions, onPricingOptionsChange]);
  
  // Add a specific effect for showPerPersonPrice changes to ensure it's properly updated
  useEffect(() => {
    console.log("showPerPersonPrice changed to:", pricingOptions.showPerPersonPrice);
  }, [pricingOptions.showPerPersonPrice]);

  // Add a new additional service
  const handleAddAdditionalService = () => {
    const newService = {
      id: `service-${Date.now()}`,
      name: "",
      price: 0
    };
    
    setPricingOptions(prev => ({
      ...prev,
      additionalServices: [...prev.additionalServices, newService]
    }));
  };
  
  // Update an additional service
  const handleUpdateAdditionalService = (id: string, field: 'name' | 'price', value: string | number) => {
    setPricingOptions(prev => ({
      ...prev,
      additionalServices: prev.additionalServices.map(service => 
        service.id === id ? { ...service, [field]: value } : service
      )
    }));
  };
  
  // Remove an additional service
  const handleRemoveAdditionalService = (id: string) => {
    setPricingOptions(prev => ({
      ...prev,
      additionalServices: prev.additionalServices.filter(service => service.id !== id)
    }));
  };

  // Effect to update the cab price when cab quantity changes
  useEffect(() => {
    if (selectedDay && selectedRouteId && selectedCabTypeId) {
      const selectedRoute = transferRoutes.find(r => r.id === selectedRouteId);
      const selectedCab = selectedRoute?.cab_types.find(c => c.id === selectedCabTypeId);
      
      if (selectedRoute && selectedCab) {
        // Update the displayed price
        setSelectedCabTypePrice(selectedCab.price);
      }
    }
  }, [cabQuantity, selectedRouteId, selectedCabTypeId, transferRoutes, selectedDay]);

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
                pricingOptions={pricingOptions}
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
                  // Find the day with all its details
                  const dayWithDetails = days.find(d => d.id === day.id);
                  setSelectedDay(dayWithDetails);
                  setIsHotelDialogOpen(true);
                }}
                onSelectCabType={() => {
                  // Find the day with all its details
                  const dayWithDetails = days.find(d => d.id === day.id);
                  setSelectedDay(dayWithDetails);
                  setIsCabDialogOpen(true);
                }}
                onUpdateNotes={(notes) => {
                  updateDayNotesMutation.mutate({ dayId: day.id, notes });
                }}
                onRemoveTransport={() => {
                  removeTransportMutation.mutate(day.id);
                }}
                onRemoveHotel={() => {
                  removeHotelMutation.mutate(day.id);
                }}
                activityTitles={activitySuggestions}
                showTransferOption={showTransferOptions}
                cabTypes={cabTypes}
              />
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

      {/* Pricing Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between pb-2 sm:pb-4">
          <div>
            <CardTitle>Pricing Summary</CardTitle>
            <CardDescription>
              Total costs for this itinerary
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            onClick={() => setIsPricingDialogOpen(true)}
          >
            Edit Pricing Options
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Calculate totals */}
            {(() => {
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
              
              // Calculate additional services
              const additionalServicesTotal = pricingOptions.additionalServices.reduce(
                (sum, service) => sum + service.price, 
                0
              );
              
              // Calculate subtotal
              const subtotal = accommodationTotal + transportTotal + additionalServicesTotal;
              
              // Calculate agent charges
              const agentCharges = pricingOptions.agentCharges;
              
              // Calculate tax
              const tax = subtotal * (pricingOptions.taxPercentage / 100);
              
              // Calculate total
              const total = subtotal + agentCharges + tax;
              
              return (
                <>
                  {/* Admin-only section - not visible to customers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-md p-3">
                      <h3 className="text-sm font-medium mb-2">Accommodation</h3>
                      <div className="text-2xl font-bold text-emerald-600">₹{accommodationTotal.toFixed(2)}</div>
                    </div>
                    
                    <div className="border rounded-md p-3">
                      <h3 className="text-sm font-medium mb-2">Transportation</h3>
                      <div className="text-2xl font-bold text-emerald-600">₹{transportTotal.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  {/* Customer-visible section */}
                  <div className="border rounded-md p-3 mt-4">
                    {/* Create local variables to ensure we're using the latest state */}
                    {(() => {
                      // This is just for debugging, the return null prevents rendering anything
                      console.log("Preview tab - pricingOptions:", pricingOptions);
                      console.log("Preview tab - showPerPersonPrice:", pricingOptions.showPerPersonPrice);
                      console.log("Preview tab - customer adults:", itinerary.customers?.adults);
                      return null;
                    })()}
                    
                    {/* Use these variables for consistent pricing display */}
                    {(() => {
                      const showPerPerson = pricingOptions.showPerPersonPrice === true;
                      const adultsCount = itinerary.customers?.adults || 0;
                      
                      return (
                        <>
                          <h3 className="text-sm font-medium mb-2">Customer Pricing</h3>
                          <div className="text-xs text-gray-500 mb-3">
                            {showPerPerson ? 
                              "Showing per person prices" : 
                              "Showing total prices"}
                          </div>
                        
                          {pricingOptions.additionalServices.length > 0 && (
                            <div className="space-y-1 mb-3">
                              <div className="text-sm font-medium">Additional Services</div>
                              {pricingOptions.additionalServices.map(service => (
                                <div key={service.id} className="flex justify-between text-sm">
                                  <span>{service.name || "Unnamed Service"}</span>
                                  <span>₹{showPerPerson && adultsCount > 0 ? 
                                    Math.round(service.price / adultsCount).toFixed(0) : 
                                    service.price.toFixed(2)}</span>
                                </div>
                              ))}
                              <div className="pt-1 mt-1 border-t flex justify-between font-medium">
                                <span>Total Additional Services</span>
                                <span>₹{showPerPerson && adultsCount > 0 ? 
                                  Math.round(additionalServicesTotal / adultsCount).toFixed(0) : 
                                  additionalServicesTotal.toFixed(2)}</span>
                              </div>
                            </div>
                          )}
                        
                          <div className="space-y-1">
                            {/* Hide subtotal from customer view */}
                            {isStandalone && (
                              <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>₹{showPerPerson && adultsCount > 0 ? 
                                  Math.round(subtotal / adultsCount).toFixed(0) : 
                                  subtotal.toFixed(2)}</span>
                              </div>
                            )}
                            
                            {pricingOptions.taxPercentage > 0 && (
                              <div className="flex justify-between">
                                <span>Tax ({pricingOptions.taxPercentage}%)</span>
                                <span>₹{showPerPerson && adultsCount > 0 ? 
                                  Math.round(tax / adultsCount).toFixed(0) : 
                                  tax.toFixed(2)}</span>
                              </div>
                            )}
                            
                            <div className="pt-2 mt-1 border-t flex justify-between font-bold text-lg">
                              <span>
                                {showPerPerson ? "Total Per Person" : "Total"}
                                {showPerPerson && adultsCount > 0 && (
                                  <span className="text-xs font-normal ml-1">
                                    (based on {adultsCount} {adultsCount === 1 ? "adult" : "adults"})
                                  </span>
                                )}
                              </span>
                              <span className="text-emerald-600">
                                ₹{showPerPerson && adultsCount > 0 ? 
                                  Math.round(total / adultsCount).toFixed(0) : 
                                  total.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Hotel Selection Dialog */}
      <Dialog open={isHotelDialogOpen} onOpenChange={setIsHotelDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedDay ? `Select Hotel for Day ${selectedDay.day_number}` : 'Select Hotel'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Hotel</label>
              <Select 
                onValueChange={(value) => {
                  if (selectedDay) {
                    const hotelId = value === "none" ? null : value;
                    
                    // Reset room details if hotel is removed
                    if (value === "none") {
                      setRoomType("no_room_type");
                      setMealPlan("no_meal_plan");
                      setRoomPrice("");
                      setHotelRooms([]);
                      setSelectedRoomId(null);
                      
                      // Update the database
                      updateDayHotelMutation.mutate({ 
                        dayId: selectedDay.id, 
                        hotelId: null 
                      });
                      
                      // Also clear room details in the database
                      updateDayHotelDetailsMutation.mutate({
                        dayId: selectedDay.id,
                        roomType: null,
                        mealPlan: null,
                        roomPrice: null,
                        roomQuantity: 1
                      });
                    } else {
                      // Just update the hotel
                      updateDayHotelMutation.mutate({ 
                        dayId: selectedDay.id, 
                        hotelId 
                      });
                      
                      // Fetch available rooms for this hotel
                      fetchHotelRooms(hotelId);
                    }
                  }
                }}
                value={selectedDay?.hotel_id || "none"}
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
            </div>
            
            {selectedDay?.hotel_id && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Available Room Options</label>
                  {hotelRoomRates.length > 0 ? (
                    <Select 
                      onValueChange={(value) => {
                        if (value === "none") {
                          setSelectedRoomRateId(null);
                          setRoomType("no_room_type");
                          setMealPlan("no_meal_plan");
                          setRoomPrice("");
                        } else {
                          const selectedRate = hotelRoomRates.find(rate => rate.id === value);
                          if (selectedRate) {
                            setSelectedRoomRateId(value);
                            setRoomType(selectedRate.room_type);
                            
                            // Determine meal plan based on rates
                            let mealPlanValue = "no_meal_plan";
                            let priceValue = 0;
                            
                            // Check which rate is selected (CP, MAP, AP, EP)
                            if (selectedRate.cp_rate > 0) {
                              mealPlanValue = "CP";
                              priceValue = selectedRate.cp_rate;
                            } else if (selectedRate.map_rate > 0) {
                              mealPlanValue = "MAP";
                              priceValue = selectedRate.map_rate;
                            } else if (selectedRate.ap_rate > 0) {
                              mealPlanValue = "AP";
                              priceValue = selectedRate.ap_rate;
                            } else if (selectedRate.ep_rate > 0) {
                              mealPlanValue = "EP";
                              priceValue = selectedRate.ep_rate;
                            }
                            
                            setMealPlan(mealPlanValue);
                            setRoomPrice(priceValue.toString());
                          }
                        }
                      }}
                      value={selectedRoomRateId || "none"}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a room option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Room Selected</SelectItem>
                        {hotelRoomRates.map((rate) => (
                          <SelectItem key={rate.id} value={rate.id}>
                            {rate.room_type} 
                            {rate.season_name && <span className="text-xs text-muted-foreground ml-1">({rate.season_name})</span>}
                            <span className="text-xs"> - Max: {rate.max_occupancy} guests</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm text-muted-foreground p-2 border rounded-md">
                      {selectedDay?.hotel_id ? 
                        "No room options available for this hotel or date. Please add rooms in the Hotels section." :
                        "Select a hotel to see available rooms."
                      }
                    </div>
                  )}
                </div>
                
                {selectedRoomRateId && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Meal Plan</label>
                    <Select 
                      onValueChange={(value) => {
                        setMealPlan(value);
                        
                        // Update price based on selected meal plan
                        if (selectedRoomRateId) {
                          const selectedRate = hotelRoomRates.find(rate => rate.id === selectedRoomRateId);
                          if (selectedRate) {
                            let price = 0;
                            
                            switch (value) {
                              case "CP":
                                price = selectedRate.cp_rate;
                                break;
                              case "MAP":
                                price = selectedRate.map_rate;
                                break;
                              case "AP":
                                price = selectedRate.ap_rate;
                                break;
                              case "EP":
                                price = selectedRate.ep_rate;
                                break;
                              default:
                                price = 0;
                            }
                            
                            setRoomPrice(price.toString());
                          }
                        }
                      }}
                      value={mealPlan}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select meal plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_meal_plan">No Meal Plan</SelectItem>
                        <SelectItem value="CP">CP (Room Only) - ₹{
                          hotelRoomRates.find(rate => rate.id === selectedRoomRateId)?.cp_rate.toFixed(2)
                        }</SelectItem>
                        <SelectItem value="MAP">MAP (Breakfast + Dinner) - ₹{
                          hotelRoomRates.find(rate => rate.id === selectedRoomRateId)?.map_rate.toFixed(2)
                        }</SelectItem>
                        <SelectItem value="AP">AP (All Meals) - ₹{
                          hotelRoomRates.find(rate => rate.id === selectedRoomRateId)?.ap_rate.toFixed(2)
                        }</SelectItem>
                        <SelectItem value="EP">EP (Breakfast Only) - ₹{
                          hotelRoomRates.find(rate => rate.id === selectedRoomRateId)?.ep_rate.toFixed(2)
                        }</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Room Quantity */}
                <div className="space-y-2 mt-4">
                  <label className="text-sm font-medium">Number of Rooms</label>
                  <div className="flex items-center">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => setRoomQuantity(Math.max(1, roomQuantity - 1))}
                      disabled={roomQuantity <= 1}
                    >
                      -
                    </Button>
                    <span className="mx-2 w-8 text-center">{roomQuantity}</span>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => setRoomQuantity(roomQuantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
                
                {/* Room Details */}
                <div className="mt-4 space-y-2">
                  <h3 className="text-sm font-medium">Selected Room Details</h3>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Room Type</div>
                        <div className="text-sm font-medium">{roomType === "no_room_type" ? "Not selected" : roomType}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Meal Plan</div>
                        <div className="text-sm font-medium">{mealPlan === "no_meal_plan" ? "Not selected" : mealPlan}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Price</div>
                        <div className="text-sm font-medium">
                          {roomPrice ? `₹${parseFloat(roomPrice).toFixed(2)}` : "Not set"}
                          {roomPrice && roomQuantity > 1 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Total: ₹{(parseFloat(roomPrice) * roomQuantity).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {selectedRoomRateId && hotelRoomRates.find(rate => rate.id === selectedRoomRateId)?.season_name && (
                      <div className="mt-2 pt-2 border-t">
                        <div className="text-xs text-muted-foreground">Season</div>
                        <div className="text-sm">
                          {hotelRoomRates.find(rate => rate.id === selectedRoomRateId)?.season_name}
                          {(hotelRoomRates.find(rate => rate.id === selectedRoomRateId)?.season_start || 
                            hotelRoomRates.find(rate => rate.id === selectedRoomRateId)?.season_end) && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({hotelRoomRates.find(rate => rate.id === selectedRoomRateId)?.season_start || "Any"} to {hotelRoomRates.find(rate => rate.id === selectedRoomRateId)?.season_end || "Any"})
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            
            <div className="mt-6 flex justify-between">
              <Button 
                onClick={() => setIsHotelDialogOpen(false)} 
                variant="outline" 
              >
                Cancel
              </Button>
              
              {selectedDay?.hotel_id && (
                <Button 
                  onClick={() => {
                    // Save all room details at once
                    if (selectedDay) {
                      const unitPrice = roomPrice ? parseFloat(roomPrice) : null;
                      updateDayHotelDetailsMutation.mutate({
                        dayId: selectedDay.id,
                        roomType: roomType === "no_room_type" ? null : roomType,
                        mealPlan: mealPlan === "no_meal_plan" ? null : mealPlan,
                        roomPrice: unitPrice, // Pass the unit price
                        roomUnitPrice: unitPrice, // Store the original unit price
                        roomQuantity: roomQuantity
                      });
                      
                      setIsHotelDialogOpen(false);
                      toast.success("Room details saved successfully");
                    }
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  Save Room Details
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transport Type Selection Dialog */}
      <Dialog open={isCabDialogOpen} onOpenChange={(open) => {
        setIsCabDialogOpen(open);
        if (!open) setSelectedRouteId(null);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedDay ? `Select Transport for Day ${selectedDay.day_number}` : 'Select Transport'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {loadingTransferRoutes ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
              </div>
            ) : (
              <>
                {/* Step 1: Select Route */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Route</label>
                  <Select 
                    onValueChange={(value) => {
                      setSelectedRouteId(value === "none" ? null : value);
                    }}
                    value={selectedRouteId || "none"}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a transfer route" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Route / Remove Transport</SelectItem>
                      {transferRoutes.map((route) => (
                        <SelectItem key={route.id} value={route.id}>
                          {route.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Show route description if available */}
                  {selectedRouteId && (
                    <div className="text-sm text-muted-foreground mt-1 ml-1">
                      {transferRoutes.find(r => r.id === selectedRouteId)?.description}
                    </div>
                  )}
                </div>

                {/* Step 2: Select Cab Type (only if route is selected) */}
                {selectedRouteId && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Cab Type (Optional)</label>
                    <Select 
                      onValueChange={(value) => {
                        if (selectedDay && selectedRouteId) {
                          const selectedRoute = transferRoutes.find(r => r.id === selectedRouteId);
                          const selectedCab = selectedRoute?.cab_types.find(c => c.id === value);
                          
                          if (selectedRoute && selectedCab) {
                            // Store the selected cab type ID and price for display
                            setSelectedCabTypeId(value);
                            setSelectedCabTypePrice(selectedCab.price);
                            
                            // Debug logging
                            console.log("Selected route:", selectedRoute);
                            console.log("Route description being saved:", selectedRoute.description);
                            console.log("Cab quantity being saved:", cabQuantity);
                            console.log("Unit price being saved:", selectedCab.price);
                            
                            updateDayCabTypeMutation.mutate({ 
                              dayId: selectedDay.id, 
                              cabType: selectedCab.name,
                              routeName: selectedRoute.name,
                              cabUnitPrice: selectedCab.price, // Pass the unit price
                              routeDescription: selectedRoute.description,
                              cabQuantity: cabQuantity
                            });
                          }
                        }
                      }}
                      value={selectedCabTypeId || ""}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a cab type (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          const selectedRoute = transferRoutes.find(r => r.id === selectedRouteId);
                          if (!selectedRoute) return null;
                          
                          // Get the day's date
                          const dayDate = selectedDay?.date ? new Date(selectedDay.date) : null;
                          
                          // Filter cab types based on date
                          const filteredCabTypes = getFilteredCabTypesForDate(selectedRoute.cab_types, dayDate);
                          
                          if (filteredCabTypes.length === 0) {
                            return (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                No cab types available for this date.
                              </div>
                            );
                          }
                          
                          return filteredCabTypes.map((cab) => (
                            <SelectItem key={cab.id} value={cab.id}>
                              {cab.name} - ₹{cab.price.toFixed(2)}
                              {cab.season_name && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  ({cab.season_name})
                                </span>
                              )}
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                    
                    {/* Show info about selected date */}
                    {selectedDay?.date && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Showing cab options for: {new Date(selectedDay.date).toLocaleDateString()}
                      </div>
                    )}
                    
                    {/* Show selected cab type season info if available */}
                    {selectedCabTypeId && selectedRouteId && (() => {
                      const selectedRoute = transferRoutes.find(r => r.id === selectedRouteId);
                      const selectedCab = selectedRoute?.cab_types.find(c => c.id === selectedCabTypeId);
                      
                      if (selectedCab?.season_name) {
                        return (
                          <div className="mt-2 pt-2 border-t">
                            <div className="text-xs text-muted-foreground">Season</div>
                            <div className="text-sm">
                              {selectedCab.season_name}
                              {(selectedCab.season_start || selectedCab.season_end) && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({selectedCab.season_start || "Any"} to {selectedCab.season_end || "Any"})
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      }
                      
                      return null;
                    })()}
                  </div>
                )}

                {/* Add cab quantity UI after the cab type selection with updated logic */}
                {selectedRouteId && (
                  <div className="space-y-2 mt-4">
                    <label className="text-sm font-medium">Number of Vehicles</label>
                    <div className="flex items-center">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          const newQuantity = Math.max(1, cabQuantity - 1);
                          setCabQuantity(newQuantity);
                          
                          // Update the cab price if a cab type is selected
                          if (selectedDay && selectedRouteId && selectedCabTypeId) {
                            const selectedRoute = transferRoutes.find(r => r.id === selectedRouteId);
                            const selectedCab = selectedRoute?.cab_types.find(c => c.id === selectedCabTypeId);
                            
                            if (selectedRoute && selectedCab) {
                              updateDayCabTypeMutation.mutate({ 
                                dayId: selectedDay.id, 
                                cabType: selectedCab.name,
                                routeName: selectedRoute.name,
                                cabUnitPrice: selectedCab.price,
                                routeDescription: selectedRoute.description,
                                cabQuantity: newQuantity
                              });
                            }
                          }
                        }}
                        disabled={cabQuantity <= 1}
                      >
                        -
                      </Button>
                      <span className="mx-2 w-8 text-center">{cabQuantity}</span>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          const newQuantity = cabQuantity + 1;
                          setCabQuantity(newQuantity);
                          
                          // Update the cab price if a cab type is selected
                          if (selectedDay && selectedRouteId && selectedCabTypeId) {
                            const selectedRoute = transferRoutes.find(r => r.id === selectedRouteId);
                            const selectedCab = selectedRoute?.cab_types.find(c => c.id === selectedCabTypeId);
                            
                            if (selectedRoute && selectedCab) {
                              updateDayCabTypeMutation.mutate({ 
                                dayId: selectedDay.id, 
                                cabType: selectedCab.name,
                                routeName: selectedRoute.name,
                                cabUnitPrice: selectedCab.price,
                                routeDescription: selectedRoute.description,
                                cabQuantity: newQuantity
                              });
                            }
                          }
                        }}
                      >
                        +
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Select the number of vehicles needed for this transfer
                    </div>
                    
                    {/* Show price calculation if a cab type with price is selected */}
                    {selectedCabTypePrice !== null && (
                      <div className="mt-2 pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Total Transport Cost:</span>
                          <span className="text-sm font-bold text-emerald-600">
                            ₹{(selectedCabTypePrice * cabQuantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            
            <div className="mt-6 flex justify-between">
              <Button 
                onClick={() => {
                  setIsCabDialogOpen(false);
                  setSelectedRouteId(null);
                }} 
                variant="outline" 
              >
                Cancel
              </Button>
              
              <div className="space-x-2">
                {selectedRouteId === "none" && (
                  <Button
                    onClick={() => {
                      if (selectedDay) {
                        updateDayCabTypeMutation.mutate({ 
                          dayId: selectedDay.id, 
                          cabType: null,
                          routeName: undefined,
                          cabPrice: undefined,
                          routeDescription: undefined,
                          cabQuantity: 1
                        });
                      }
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    Remove Transport
                  </Button>
                )}
                
                {selectedRouteId && selectedRouteId !== "none" && (
                  <Button
                    onClick={() => {
                      if (selectedDay) {
                        const selectedRoute = transferRoutes.find(r => r.id === selectedRouteId);
                        
                        if (selectedRoute) {
                          updateDayCabTypeMutation.mutate({ 
                            dayId: selectedDay.id, 
                            cabType: null, // No cab type selected
                            routeName: selectedRoute.name,
                            cabPrice: null, // No price
                            routeDescription: selectedRoute.description,
                            cabQuantity: cabQuantity
                          });
                        }
                      }
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    Save Route
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pricing Options Dialog */}
      <Dialog open={isPricingDialogOpen} onOpenChange={setIsPricingDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Pricing Options</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tax Percentage (%)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={pricingOptions.taxPercentage}
                onChange={(e) => setPricingOptions(prev => ({
                  ...prev,
                  taxPercentage: parseFloat(e.target.value) || 0
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Agent Charges (₹)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={pricingOptions.agentCharges}
                onChange={(e) => setPricingOptions(prev => ({
                  ...prev,
                  agentCharges: parseFloat(e.target.value) || 0
                }))}
              />
            </div>

            <div className="flex items-center justify-between space-x-2 py-2 border-t pt-4">
              <label htmlFor="show-per-person-price" className="text-sm font-medium">
                Show Per Person Price
                <p className="text-xs text-muted-foreground mt-1">
                  Display prices per person instead of total in customer-facing views
                </p>
              </label>
              <Switch
                id="show-per-person-price"
                checked={pricingOptions.showPerPersonPrice}
                onCheckedChange={(checked) => 
                  setPricingOptions(prev => ({
                    ...prev,
                    showPerPersonPrice: checked
                  }))
                }
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Additional Services</label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddAdditionalService}
                  className="h-8"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Service
                </Button>
              </div>
              
              {pricingOptions.additionalServices.map((service, index) => (
                <div key={service.id} className="grid grid-cols-[1fr,auto,auto] gap-2 items-center">
                  <Input
                    placeholder="Service name"
                    value={service.name}
                    onChange={(e) => handleUpdateAdditionalService(service.id, 'name', e.target.value)}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price"
                    className="w-24"
                    value={service.price}
                    onChange={(e) => handleUpdateAdditionalService(
                      service.id, 
                      'price', 
                      parseFloat(e.target.value) || 0
                    )}
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRemoveAdditionalService(service.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {pricingOptions.additionalServices.length === 0 && (
                <div className="text-sm text-muted-foreground p-2 border rounded-md">
                  No additional services added yet.
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={() => setIsPricingDialogOpen(false)} 
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                Save Options
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface DayCardProps {
  day: {
    id: string;
    day_number: number;
    date?: string;
    hotel?: any;
    cab_type?: string;
    route_name?: string;
    route_description?: string;
    cab_price?: number;
    notes?: string;
    room_type?: string;
    meal_plan?: string;
    room_price?: number;
    [key: string]: any;
  };
  activities: any[];
  onDeleteDay: () => void;
  onAddActivity: (title: string, description?: string) => void;
  onUpdateActivity: (activityId: string, data: any) => void;
  onDeleteActivity: (activityId: string) => void;
  onSelectHotel: () => void;
  onSelectCabType: () => void;
  onUpdateNotes: (notes: string) => void;
  onRemoveTransport: () => void;
  onRemoveHotel: () => void;
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
  onUpdateNotes,
  onRemoveTransport,
  onRemoveHotel,
  activityTitles,
  showTransferOption,
  cabTypes
}: DayCardProps) {
  const [newActivityTitle, setNewActivityTitle] = useState("");
  const [newActivityDescription, setNewActivityDescription] = useState("");
  const [isTransfer, setIsTransfer] = useState(false);
  const [notes, setNotes] = useState(day.notes || "");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const newActivityInputRef = useRef<HTMLInputElement>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Enhanced debug logging
  useEffect(() => {
    console.log("Day object:", day);
    console.log("Route name:", day.route_name);
    console.log("Route description:", day.route_description);
    console.log("Cab type:", day.cab_type);
    console.log("Cab price:", day.cab_price);
    console.log("Cab quantity:", day.cab_quantity);
    console.log("Room quantity:", day.room_quantity);
    console.log("Notes:", day.notes);
  }, [day]);

  // Update notes state when day.notes changes
  useEffect(() => {
    setNotes(day.notes || "");
  }, [day.notes]);

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

  const handleSaveNotes = () => {
    onUpdateNotes(notes);
    setIsEditingNotes(false);
  };

  const handleCancelEditNotes = () => {
    setNotes(day.notes || "");
    setIsEditingNotes(false);
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
        {/* Transport Type Section - Enhanced design with route description */}
        <div className="border rounded-md overflow-hidden">
          <div className="bg-blue-50 px-3 py-2 border-b flex justify-between items-center">
            <div className="font-medium text-blue-800 flex items-center gap-2">
              <Car className="h-4 w-4 text-blue-600" />
              <span>Transport Route</span>
            </div>
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={onSelectCabType}
                className="text-blue-600 hover:bg-blue-100 h-8"
              >
                {day.route_name ? "Change" : "Add"}
              </Button>
              {day.route_name && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={onRemoveTransport}
                  className="text-red-500 hover:bg-red-50 h-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="p-3 bg-white">
            {day.route_name ? (
              <div className="flex flex-col">
                <div className="font-medium text-gray-800">{day.route_name}</div>
                {day.route_description ? (
                  <div className="text-sm text-muted-foreground mt-1">
                    {day.route_description}
                  </div>
                ) : (
                  <div className="text-sm text-orange-500 mt-1">
                    No route description available
                  </div>
                )}
                {day.cab_type ? (
                  <div className="mt-2 text-xs flex items-center">
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      {day.cab_type}
                      {day.cab_quantity > 1 && (
                        <span className="ml-1">
                          x{day.cab_quantity}
                        </span>
                      )}
                      {day.cab_price && (
                        <span className="ml-1 font-medium">
                          {day.cab_quantity > 1 ? 
                            `₹${day.cab_unit_price ? day.cab_unit_price.toFixed(2) : (day.cab_price / day.cab_quantity).toFixed(2)} each (Total: ₹${day.cab_price.toFixed(2)})` : 
                            `₹${day.cab_price.toFixed(2)}`}
                        </span>
                      )}
                    </span>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-muted-foreground">
                    No cab type selected
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No transport route selected
              </div>
            )}
          </div>
        </div>

        {/* Hotel Information Section - Enhanced design */}
        <div className="border rounded-md overflow-hidden">
          <div className="bg-emerald-50 px-3 py-2 border-b flex justify-between items-center">
            <div className="font-medium text-emerald-800 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-600" />
              <span>Accommodation</span>
            </div>
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={onSelectHotel}
                className="text-emerald-600 hover:bg-emerald-100 h-8"
              >
                {day.hotel ? "Change" : "Add"}
              </Button>
              {day.hotel && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={onRemoveHotel}
                  className="text-red-500 hover:bg-red-50 h-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="p-3 bg-white">
            {day.hotel ? (
              <div className="flex flex-col">
                <div className="font-medium text-gray-800">{day.hotel.name}</div>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <span>{day.hotel.city}, {day.hotel.state}</span>
                  <span className="flex items-center ml-2">
                    {renderStars(day.hotel.star_category)}
                  </span>
                </div>
                {(day.room_type || day.meal_plan || day.room_price) && (
                  <div className="mt-2 border-t pt-2">
                    {day.room_type && (
                      <div className="text-xs text-gray-700">
                        <span className="font-medium">Room:</span> {day.room_type}
                        {day.room_quantity > 1 && (
                          <span className="ml-1">
                            x{day.room_quantity}
                          </span>
                        )}
                      </div>
                    )}
                    {day.meal_plan && (
                      <div className="text-xs text-gray-700">
                        <span className="font-medium">Meal Plan:</span> {day.meal_plan}
                      </div>
                    )}
                    {day.room_price && (
                      <div className="text-xs font-medium text-emerald-600">
                        {day.room_quantity > 1 ? 
                          <>Price: ₹{day.room_unit_price ? day.room_unit_price.toFixed(2) : (day.room_price / day.room_quantity).toFixed(2)} per room<br/>Total: ₹{day.room_price.toFixed(2)}</> : 
                          <>Price: ₹{day.room_price.toFixed(2)}</>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No accommodation selected
              </div>
            )}
          </div>
        </div>
        
        {/* Notes Section */}
        <div className="border rounded-md overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 border-b flex justify-between items-center">
            <div className="font-medium text-gray-800 flex items-center gap-2">
              <span>Day Notes</span>
            </div>
            {!isEditingNotes && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => {
                  setIsEditingNotes(true);
                  setTimeout(() => notesTextareaRef.current?.focus(), 100);
                }}
                className="text-blue-600 hover:bg-blue-100 h-8"
              >
                {day.notes ? "Edit" : "Add"}
              </Button>
            )}
          </div>
          <div className="p-3 bg-white">
            {isEditingNotes ? (
              <div className="space-y-3">
                <Textarea
                  ref={notesTextareaRef}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes for this day..."
                  className="resize-none min-h-[100px]"
                  rows={4}
                />
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCancelEditNotes}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSaveNotes}
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    Save Notes
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {day.notes ? (
                  <div className="text-sm whitespace-pre-line">{day.notes}</div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    No notes added yet. Click "Add" to add notes for this day.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
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
