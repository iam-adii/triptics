import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel,
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight, Plus, X, Loader2, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format, parseISO, addDays } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { FormDialog } from "@/components/ui/form-dialog";

// Define types for calendar events
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  color?: string;
}

// Define types for tour bookings
interface TourBooking {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  customer_name?: string;
  tour_name?: string;
  tour_location?: string;
  total_amount?: number;
}

// Define detailed booking type
interface DetailedBooking {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  total_amount: number;
  notes?: string;
  created_at: string;
  customers?: { id: string; name: string; email: string } | null;
  tours?: { id: string; name: string; location: string } | null;
  payments?: {
    id: string;
    amount: number;
    status: string;
    date: string;
    method: string;
  }[];
}

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Schema for the event form
const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  start_date: z.date(),
  end_date: z.date(),
  color: z.string().default("#10b981"), // Default to emerald-500 color
});

type EventFormValues = z.infer<typeof eventSchema>;

// Helper to generate dates for the calendar
const generateCalendarDates = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const startOffset = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysInMonth = lastDay.getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  const calendarCells: Array<{ date: Date | null; isCurrentMonth: boolean }> = [];
  
  // Previous month days
  for (let i = 0; i < startOffset; i++) {
    calendarCells.push({
      date: new Date(year, month - 1, daysInPrevMonth - (startOffset - i - 1)),
      isCurrentMonth: false
    });
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push({
      date: new Date(year, month, i),
      isCurrentMonth: true
    });
  }
  
  // Next month days to fill out the grid (6 rows × 7 days = 42 cells)
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false
    });
  }
  
  return calendarCells;
};

export default function Calendar() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [calendarCells, setCalendarCells] = useState<Array<{ date: Date | null; isCurrentMonth: boolean }>>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tourBookings, setTourBookings] = useState<TourBooking[]>([]);
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);
  const [isViewEventDialogOpen, setIsViewEventDialogOpen] = useState(false);
  const [isViewTourDialogOpen, setIsViewTourDialogOpen] = useState(false);
  const [isDetailedBookingOpen, setIsDetailedBookingOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedTourBooking, setSelectedTourBooking] = useState<TourBooking | null>(null);
  const [detailedBooking, setDetailedBooking] = useState<DetailedBooking | null>(null);
  const [isLoadingBookingDetails, setIsLoadingBookingDetails] = useState(false);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [isLoading, setIsLoading] = useState(true);
  const [loadStatus, setLoadStatus] = useState<"loading" | "loaded" | "error">("loading");

  // Form for adding/editing events
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      start_date: today,
      end_date: addDays(today, 1),
      color: "#10b981", // Emerald-500 color
    },
  });

  // Update calendar when month/year changes
  useEffect(() => {
    setCalendarCells(generateCalendarDates(currentYear, currentMonth));
  }, [currentYear, currentMonth]);

  // Fetch events from Supabase
  const fetchEvents = async () => {
    setIsLoading(true);
    setLoadStatus("loading");
    try {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .order('start_date', { ascending: true });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      console.log("Calendar events fetched:", data?.length || 0);
      
      if (data && data.length > 0) {
        // Log sample data for debugging
        console.log("Sample event data:", data[0]);
        
        // Process events with simple date normalization
        const processedEvents = data.map(event => {
          // Normalize date formats - keep it simple
          let startDate = typeof event.start_date === 'string' ? event.start_date : '';
          let endDate = typeof event.end_date === 'string' ? event.end_date : '';
          
          // Ensure dates have time component
          if (startDate && !startDate.includes('T')) {
            startDate = `${startDate}T00:00:00`;
          }
          
          if (endDate && !endDate.includes('T')) {
            endDate = `${endDate}T23:59:59`;
          }
          
          return {
            ...event,
            start_date: startDate,
            end_date: endDate
          };
        });
        
        // Show sample processed event
        if (processedEvents.length > 0) {
          console.log("Sample processed event:", {
            id: processedEvents[0].id,
            title: processedEvents[0].title,
            start: processedEvents[0].start_date,
            end: processedEvents[0].end_date
          });
        }
        
        // Set events and update state
        setEvents(processedEvents as CalendarEvent[]);
        setLoadStatus("loaded");
        
        // Log success
        console.log(`✅ Successfully loaded ${processedEvents.length} events`);
      } else {
        console.log("No calendar events found in database");
        setEvents([]);
        setLoadStatus("loaded");
      }
    } catch (error: any) {
      console.error("Failed to load events:", error);
      toast.error("Failed to load events: " + error.message);
      setLoadStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch tour bookings from Supabase
  const fetchTourBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          start_date,
          end_date,
          status,
          total_amount,
          customers (name),
          tours (name, location)
        `)
        .order('start_date', { ascending: true });

      if (error) {
        console.error("Error fetching tour bookings:", error);
        throw error;
      }
      
      console.log("Tour bookings fetched:", data?.length || 0);
      
      if (data && data.length > 0) {
        // Process bookings
        const processedBookings = data.map(booking => {
          // Normalize date formats
          let startDate = typeof booking.start_date === 'string' ? booking.start_date : '';
          let endDate = typeof booking.end_date === 'string' ? booking.end_date : '';
          
          // Ensure dates have time component
          if (startDate && !startDate.includes('T')) {
            startDate = `${startDate}T00:00:00`;
          }
          
          if (endDate && !endDate.includes('T')) {
            endDate = `${endDate}T23:59:59`;
          }

          // Safely access nested properties
          const customerName = booking.customers && booking.customers[0] ? booking.customers[0].name : null;
          const tourName = booking.tours && booking.tours[0] ? booking.tours[0].name : null;
          const tourLocation = booking.tours && booking.tours[0] ? booking.tours[0].location : null;
          
          return {
            id: booking.id,
            start_date: startDate,
            end_date: endDate,
            status: booking.status,
            customer_name: customerName,
            tour_name: tourName,
            tour_location: tourLocation,
            total_amount: booking.total_amount,
          };
        });
        
        // Show sample processed booking
        if (processedBookings.length > 0) {
          console.log("Sample processed booking:", processedBookings[0]);
        }
        
        setTourBookings(processedBookings);
      } else {
        console.log("No tour bookings found in database");
        setTourBookings([]);
      }
    } catch (error: any) {
      console.error("Failed to load tour bookings:", error);
      toast.error("Failed to load tour bookings: " + error.message);
    }
  };

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
    fetchTourBookings();
    
    // Add listener to debug event state
    const interval = setInterval(() => {
      if (events.length > 0) {
        console.log("Currently loaded events:", events.length);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 0) {
        setCurrentYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 11) {
        setCurrentYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const openAddEventDialog = (date?: Date) => {
    if (date) {
      form.setValue("start_date", date);
      form.setValue("end_date", addDays(date, 1));
    } else {
      form.setValue("start_date", today);
      form.setValue("end_date", addDays(today, 1));
    }
    form.setValue("title", "");
    form.setValue("description", "");
    form.setValue("color", "#10b981"); // Reset to emerald color
    setSelectedEvent(null);
    setIsAddEventDialogOpen(true);
  };

  const openEditEventDialog = (event: CalendarEvent) => {
    setSelectedEvent(event);
    form.reset({
      title: event.title,
      description: event.description || "",
      start_date: parseISO(event.start_date),
      end_date: parseISO(event.end_date),
      color: event.color || "#10b981",
    });
    setIsAddEventDialogOpen(true);
  };

  const openViewEventDialog = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsViewEventDialogOpen(true);
  };

  const openViewTourDialog = (tourBooking: TourBooking) => {
    setSelectedTourBooking(tourBooking);
    setIsViewTourDialogOpen(true);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", selectedEvent.id);
        
      if (error) throw error;
      
      toast.success("Event deleted successfully");
      fetchEvents();
      setIsAddEventDialogOpen(false);
    } catch (error: any) {
      toast.error("Failed to delete event: " + error.message);
    }
  };

  const onSubmit = async (values: EventFormValues) => {
    try {
      const eventData = {
        title: values.title,
        description: values.description,
        start_date: format(values.start_date, "yyyy-MM-dd'T'HH:mm:ssX"),
        end_date: format(values.end_date, "yyyy-MM-dd'T'HH:mm:ssX"),
        color: values.color,
      };

      if (selectedEvent) {
        // Update existing event
        const { error } = await supabase
          .from("calendar_events")
          .update(eventData)
          .eq("id", selectedEvent.id);

        if (error) throw error;
        toast.success("Event updated successfully");
      } else {
        // Create new event
        const { error } = await supabase
          .from("calendar_events")
          .insert(eventData);

        if (error) throw error;
        toast.success("Event created successfully");
      }

      fetchEvents();
      setIsAddEventDialogOpen(false);
    } catch (error: any) {
      toast.error("Failed to save event: " + error.message);
    }
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    try {
      // If no events, return early
      if (events.length === 0) {
        return [];
      }

      // Format the cell date as YYYY-MM-DD
      const cellDateStr = format(date, "yyyy-MM-dd");

      // Log for debugging particular dates
      if (date.getDate() === 1) {
        console.log(`Checking events for ${cellDateStr}, total events: ${events.length}`);
      }

      // Filter events that include this date
      const matchingEvents = events.filter(event => {
        try {
          // Get start and end dates without time component
          let startDate: string, endDate: string;
          
          if (typeof event.start_date === 'string') {
            // Extract just the date part (before T or full string if no T)
            startDate = event.start_date.split('T')[0];
          } else {
            // Fallback if somehow not a string
            return false;
          }
          
          if (typeof event.end_date === 'string') {
            // Extract just the date part
            endDate = event.end_date.split('T')[0];
          } else {
            // Fallback if somehow not a string
            return false;
          }

          // Check if cell date is within range (inclusive)
          const isInRange = startDate <= cellDateStr && cellDateStr <= endDate;
          
          if (isInRange && date.getDate() === 1) {
            console.log(`Event in range: ${event.title} (${startDate} to ${endDate})`);
          }
          
          return isInRange;
        } catch (error) {
          console.error("Error filtering event:", error, event);
          return false;
        }
      });

      // For debugging the first day of the month
      if (date.getDate() === 1 && matchingEvents.length > 0) {
        console.log(`Found ${matchingEvents.length} events for date ${cellDateStr}`);
      }

      return matchingEvents;
    } catch (error) {
      console.error("Error in getEventsForDate:", error);
      return [];
    }
  };

  // Get tour bookings for a specific date
  const getTourBookingsForDate = (date: Date) => {
    try {
      // If no bookings, return early
      if (tourBookings.length === 0) {
        return [];
      }

      // Format the cell date as YYYY-MM-DD
      const cellDateStr = format(date, "yyyy-MM-dd");

      // Filter bookings that include this date
      const matchingBookings = tourBookings.filter(booking => {
        try {
          // Get start and end dates without time component
          let startDate: string, endDate: string;
          
          if (typeof booking.start_date === 'string') {
            // Extract just the date part (before T or full string if no T)
            startDate = booking.start_date.split('T')[0];
          } else {
            // Fallback if somehow not a string
            return false;
          }
          
          if (typeof booking.end_date === 'string') {
            // Extract just the date part
            endDate = booking.end_date.split('T')[0];
          } else {
            // Fallback if somehow not a string
            return false;
          }

          // For tour bookings, we primarily care about start date 
          // (first day of tour is most important for calendar display)
          return startDate === cellDateStr;
        } catch (error) {
          console.error("Error filtering booking:", error, booking);
          return false;
        }
      });

      return matchingBookings;
    } catch (error) {
      console.error("Error in getTourBookingsForDate:", error);
      return [];
    }
  };

  // Get today's events
  const getTodayEvents = () => {
    try {
      if (events.length === 0) {
        return [];
      }
      
      // Format today's date as YYYY-MM-DD
      const todayStr = format(today, "yyyy-MM-dd");
      console.log("Checking today's events for:", todayStr);
      
      // Filter events that include today's date
      return events.filter(event => {
        try {
          // Get start and end dates without time component
          const startDate = event.start_date.split('T')[0];
          const endDate = event.end_date.split('T')[0];
          
          // Check if today is within event range (inclusive)
          return startDate <= todayStr && todayStr <= endDate;
        } catch (error) {
          console.error("Error filtering today's event:", error, event);
          return false;
        }
      });
    } catch (error) {
      console.error("Error in getTodayEvents:", error);
      return [];
    }
  };

  // Get upcoming events (next 7 days)
  const getUpcomingEvents = () => {
    try {
      if (events.length === 0) {
        return [];
      }
      
      // Format date range
      const startDateStr = format(today, "yyyy-MM-dd");
      const endDateStr = format(addDays(today, 7), "yyyy-MM-dd");
      console.log(`Checking upcoming events from ${startDateStr} to ${endDateStr}`);
      
      // Filter events that start within the next 7 days
      return events
        .filter(event => {
          try {
            // Get just the date part without time
            const eventStartDate = event.start_date.split('T')[0];
            
            // Check if event starts within the date range
            return eventStartDate >= startDateStr && eventStartDate <= endDateStr;
          } catch (error) {
            console.error("Error filtering upcoming event:", error, event);
            return false;
          }
        })
        .sort((a, b) => {
          // Sort by start date
          const aDate = a.start_date.split('T')[0];
          const bDate = b.start_date.split('T')[0];
          return aDate.localeCompare(bDate);
        });
    } catch (error) {
      console.error("Error in getUpcomingEvents:", error);
      return [];
    }
  };

  const todayEvents = getTodayEvents();
  const upcomingEvents = getUpcomingEvents();

  // Fetch detailed booking information
  const fetchDetailedBooking = async (bookingId: string) => {
    setIsLoadingBookingDetails(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          start_date,
          end_date,
          status,
          total_amount,
          notes,
          created_at,
          customers (id, name, email),
          tours (id, name, location),
          payments (
            id,
            amount,
            status,
            date,
            method
          )
        `)
        .eq("id", bookingId)
        .single();

      if (error) {
        console.error("Error fetching booking details:", error);
        throw error;
      }
      
      if (data) {
        console.log("Fetched detailed booking:", data);
        // Cast the data to ensure correct type handling
        setDetailedBooking(data as unknown as DetailedBooking);
        setIsDetailedBookingOpen(true);
      } else {
        toast.error("Booking not found");
      }
    } catch (error: any) {
      console.error("Failed to load booking details:", error);
      toast.error("Failed to load booking details: " + error.message);
    } finally {
      setIsLoadingBookingDetails(false);
    }
  };

  // Calculate payment status for a booking
  const calculatePaymentStatus = (booking: DetailedBooking) => {
    // Default values
    let totalPaid = 0;
    let remainingAmount = booking.total_amount;
    let percentPaid = 0;
    let status = "Unpaid";
    let color = "bg-red-100 text-red-800";
    
    // Calculate if we have payments
    if (booking.payments && booking.payments.length > 0) {
      // Sum up completed payments
      totalPaid = booking.payments
        .filter(p => p.status === "Completed")
        .reduce((sum, payment) => sum + payment.amount, 0);
      
      remainingAmount = booking.total_amount - totalPaid;
      percentPaid = Math.round((totalPaid / booking.total_amount) * 100);
      
      // Determine status
      if (percentPaid >= 100) {
        status = "Paid";
        color = "bg-green-100 text-green-800";
      } else if (percentPaid > 0) {
        status = "Partially Paid";
        color = "bg-yellow-100 text-yellow-800";
      }
    }
    
    return {
      totalPaid,
      remainingAmount,
      percentPaid,
      status,
      color
    };
  };

  // Format booking ID
  const formatBookingId = (id: string) => {
    return `BOOK${id.slice(-6).toUpperCase()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            Manage tour schedules and important events
          </p>
        </div>
        <Button 
          className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600" 
          onClick={() => openAddEventDialog()}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Event
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h2 className="text-xl font-semibold">Tour Schedule</h2>
            <div className="flex flex-wrap gap-2 items-center">
              <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="font-medium px-4 min-w-[120px] text-center">{months[currentMonth]} {currentYear}</div>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Select defaultValue={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="View" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center p-12 border rounded-lg bg-secondary/20">
              <Loader2 className="h-8 w-8 text-emerald-500 animate-spin mr-2" />
              <span>Loading calendar events...</span>
            </div>
          ) : loadStatus === "error" ? (
            <div className="flex justify-center items-center p-12 border rounded-lg bg-red-500/10 text-red-500">
              <span>Error loading calendar events. Please try refreshing the page.</span>
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col justify-center items-center p-12 border rounded-lg bg-secondary/20">
              <span className="mb-4">No calendar events found in the database.</span>
              <Button 
                variant="outline" 
                onClick={fetchEvents}
                className="mt-2"
              >
                Refresh Calendar
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden bg-secondary/20 border-border/30">
              <div className="grid grid-cols-7">
                {daysOfWeek.map((day) => (
                  <div
                    key={day}
                    className="p-2 text-center font-medium text-muted-foreground border-b border-r border-border/30"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7" style={{ gridTemplateRows: "repeat(6, minmax(100px, 1fr))" }}>
                {calendarCells.map((cell, idx) => {
                  if (!cell.date) return null;
                  
                  const cellDate = cell.date;
                  const dateEvents = getEventsForDate(cellDate);
                  const dateTourBookings = getTourBookingsForDate(cellDate);
                  const isToday = 
                    today.getDate() === cellDate.getDate() && 
                    today.getMonth() === cellDate.getMonth() && 
                    today.getFullYear() === cellDate.getFullYear();
                  
                  return (
                    <div
                      key={idx}
                      className={`border-b border-r border-border/30 p-2 overflow-hidden ${
                        !cell.isCurrentMonth ? "bg-secondary/50" : ""
                      } ${isToday ? "bg-emerald-500/5 border-emerald-500/20" : ""}`}
                      onClick={() => openAddEventDialog(cellDate)}
                    >
                      <div className={`text-right font-medium ${
                        isToday ? "text-emerald-500" : 
                        !cell.isCurrentMonth ? "text-muted-foreground" : ""
                      }`}>
                        {cellDate.getDate()}
                      </div>
                      
                      {/* Tour Bookings Section */}
                      {dateTourBookings.length > 0 && (
                        <div className="mt-1 space-y-1 overflow-y-auto">
                          {dateTourBookings.map((booking) => (
                            <div
                              key={`tour-${booking.id}`}
                              className="p-1 text-xs rounded text-foreground cursor-pointer hover:opacity-80 transition-opacity truncate"
                              style={{ 
                                backgroundColor: `#6366f130`, 
                                borderLeft: `2px solid #6366f1` 
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                openViewTourDialog(booking);
                              }}
                              title={`Tour: ${booking.tour_name || 'Unknown'} - Customer: ${booking.customer_name || 'Unknown'}`}
                            >
                              🚌 {booking.tour_name || 'Tour'} Start
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Calendar Events Section */}
                      <div className="mt-1 space-y-1 overflow-y-auto max-h-[70px]">
                        {events.length > 0 && dateEvents.length > 0 ? (
                          dateEvents.map((event) => (
                            <div
                              key={event.id}
                              className="p-1 text-xs rounded text-foreground cursor-pointer hover:opacity-80 transition-opacity truncate"
                              style={{ 
                                backgroundColor: `${event.color || '#10b981'}30`, 
                                borderLeft: `2px solid ${event.color || '#10b981'}` 
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                openViewEventDialog(event);
                              }}
                              title={event.title}
                            >
                              {event.title}
                            </div>
                          ))
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar with today's and upcoming events */}
        <div className="space-y-6">
          <div className="border rounded-lg p-4 bg-secondary/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-emerald-600">Today's Events</h2>
              <Button variant="ghost" size="sm" onClick={fetchEvents} className="h-8 px-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path></svg>
                Refresh
              </Button>
            </div>
            {todayEvents.length === 0 ? (
              <div className="text-muted-foreground text-sm p-3 border rounded-md bg-secondary/20">
                No events scheduled for today
              </div>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {todayEvents.map(event => (
                  <div 
                    key={event.id}
                    className="p-3 border rounded-md cursor-pointer hover:bg-secondary/30 transition-colors"
                    onClick={() => openEditEventDialog(event)}
                  >
                    <div className="font-medium" style={{ color: event.color }}>{event.title}</div>
                    {event.description && (
                      <div className="text-sm text-muted-foreground line-clamp-2">{event.description}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border rounded-lg p-4 bg-secondary/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-emerald-600">Upcoming Events</h2>
              <Button variant="ghost" size="sm" onClick={fetchEvents} className="h-8 px-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path></svg>
                Refresh
              </Button>
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="text-muted-foreground text-sm p-3 border rounded-md bg-secondary/20">
                No upcoming events in the next 7 days
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {upcomingEvents.map(event => (
                  <div 
                    key={event.id}
                    className="p-3 border rounded-md cursor-pointer hover:bg-secondary/30 transition-colors"
                    onClick={() => openEditEventDialog(event)}
                  >
                    <div className="font-medium" style={{ color: event.color }}>{event.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(parseISO(event.start_date), "MMM d, yyyy")}
                    </div>
                    {event.description && (
                      <div className="text-sm text-muted-foreground line-clamp-2 mt-1">{event.description}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog for adding/editing events */}
      <Dialog open={isAddEventDialogOpen} onOpenChange={setIsAddEventDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedEvent ? "Edit Event" : "Add Event"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Event title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Event description" 
                        className="resize-none h-20" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            disabled={(date) => date < new Date("1900-01-01")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            disabled={(date) => date < form.getValues().start_date}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <div className="flex items-center gap-2">
                      <Input type="color" {...field} className="w-12 h-10 p-1" />
                      <Input 
                        type="text" 
                        {...field} 
                        className="flex-1"
                        placeholder="#10b981"
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 sm:gap-0">
                {selectedEvent && (
                  <Button 
                    type="button" 
                    variant="destructive"
                    onClick={handleDeleteEvent}
                  >
                    Delete Event
                  </Button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setIsAddEventDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600">
                    {selectedEvent ? "Update Event" : "Create Event"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog for viewing event details */}
      <Dialog open={isViewEventDialogOpen} onOpenChange={setIsViewEventDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <div 
                className="w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: selectedEvent?.color || '#10b981' }}
              ></div>
              <span className="flex-1 truncate">{selectedEvent?.title}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Date information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Starts</div>
                <div>
                  {selectedEvent?.start_date 
                    ? format(parseISO(selectedEvent.start_date), "PPP") 
                    : "N/A"}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Ends</div>
                <div>
                  {selectedEvent?.end_date 
                    ? format(parseISO(selectedEvent.end_date), "PPP") 
                    : "N/A"}
                </div>
              </div>
            </div>
            
            {/* Description */}
            {selectedEvent?.description && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Description</div>
                <div className="p-3 bg-secondary/20 rounded-md text-sm whitespace-pre-line">
                  {selectedEvent.description}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <div className="flex w-full justify-between items-center">
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => {
                  setIsViewEventDialogOpen(false);
                  if (selectedEvent) {
                    setSelectedEvent(selectedEvent);
                    // Small delay to ensure view dialog closes first
                    setTimeout(() => {
                      handleDeleteEvent();
                    }, 100);
                  }
                }}
              >
                Delete Event
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsViewEventDialogOpen(false)}
                >
                  Close
                </Button>
                <Button 
                  className="bg-emerald-500 hover:bg-emerald-600"
                  size="sm"
                  onClick={() => {
                    setIsViewEventDialogOpen(false);
                    if (selectedEvent) {
                      // Small delay to ensure view dialog closes first
                      setTimeout(() => {
                        openEditEventDialog(selectedEvent);
                      }, 100);
                    }
                  }}
                >
                  Edit Event
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for viewing tour booking details */}
      <Dialog open={isViewTourDialogOpen} onOpenChange={setIsViewTourDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <div className="w-4 h-4 rounded-full mr-2 bg-indigo-500"></div>
              <span className="flex-1 truncate">
                {selectedTourBooking?.tour_name || 'Tour Booking'}
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Customer information */}
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Customer</div>
              <div className="flex items-center p-3 bg-secondary/20 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span className="text-sm">{selectedTourBooking?.customer_name || 'Unknown'}</span>
              </div>
            </div>
            
            {/* Date information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Starts</div>
                <div className="p-2 bg-secondary/20 rounded-md text-sm">
                  {selectedTourBooking?.start_date 
                    ? format(parseISO(selectedTourBooking.start_date), "PPP") 
                    : "N/A"}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Ends</div>
                <div className="p-2 bg-secondary/20 rounded-md text-sm">
                  {selectedTourBooking?.end_date 
                    ? format(parseISO(selectedTourBooking.end_date), "PPP") 
                    : "N/A"}
                </div>
              </div>
            </div>
            
            {/* Booking details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Location</div>
                <div className="p-2 bg-secondary/20 rounded-md text-sm">
                  {selectedTourBooking?.tour_location || 'Not specified'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                <div className="p-2 bg-secondary/20 rounded-md text-sm">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    selectedTourBooking?.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 
                    selectedTourBooking?.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                    selectedTourBooking?.status === 'Completed' ? 'bg-blue-100 text-blue-800' : 
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedTourBooking?.status || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Amount */}
            {selectedTourBooking?.total_amount && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Total Amount</div>
                <div className="p-2 bg-secondary/20 rounded-md text-sm font-medium">
                  ₹{selectedTourBooking.total_amount.toLocaleString()}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <div className="flex w-full justify-between items-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  if (selectedTourBooking) {
                    // Close current dialog and fetch detailed booking information
                    setIsViewTourDialogOpen(false);
                    fetchDetailedBooking(selectedTourBooking.id);
                  }
                }}
              >
                View Full Details
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => setIsViewTourDialogOpen(false)}
                className="bg-indigo-500 hover:bg-indigo-600"
              >
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detailed Booking View Dialog */}
      <FormDialog
        title="Booking Details"
        description="View complete booking information"
        isOpen={isDetailedBookingOpen}
        onClose={() => setIsDetailedBookingOpen(false)}
      >
        {isLoadingBookingDetails ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mr-2" />
            <span>Loading booking details...</span>
          </div>
        ) : detailedBooking ? (
          <div className="space-y-6">
            {/* Top section with basic booking info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left side - booking and customer info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Booking ID</div>
                  <div className="text-lg font-semibold">{formatBookingId(detailedBooking.id)}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Customer</div>
                  <div className="font-medium">{detailedBooking.customers?.name || "Unknown Customer"}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Tour</div>
                  <div className="font-medium">{detailedBooking.tours?.name || "Unknown Tour"}</div>
                </div>
              </div>
              
              {/* Right side - dates and status */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Booking Date</div>
                  <div className="font-medium">{detailedBooking.created_at ? format(new Date(detailedBooking.created_at), "MMM d, yyyy") : "-"}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Total Amount</div>
                  <div className="text-lg font-semibold">₹{detailedBooking.total_amount?.toLocaleString()}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Booking Status</div>
                  <div className="font-medium">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      detailedBooking.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 
                      detailedBooking.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                      detailedBooking.status === 'Completed' ? 'bg-blue-100 text-blue-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {detailedBooking.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payment status section */}
            <div className="rounded-md border bg-card p-4 shadow-sm">
              {(() => {
                // Calculate payment status once
                const paymentStatus = calculatePaymentStatus(detailedBooking);
                
                return (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">Payment Status</h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          paymentStatus.color
                        }`}
                      >
                        {paymentStatus.status}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Payment progress bar */}
                      {paymentStatus.status !== "Unpaid" && (
                        <div>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span>Payment Progress</span>
                            <span className="font-medium">{paymentStatus.percentPaid}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`${paymentStatus.status === "Paid" ? "bg-emerald-500" : "bg-yellow-500"} h-2.5 rounded-full`}
                              style={{ width: `${paymentStatus.percentPaid}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      {/* Payment summary */}
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="p-2 bg-muted/50 rounded">
                          <div className="text-xs text-muted-foreground mb-1">Total</div>
                          <div className="font-medium">₹{detailedBooking.total_amount.toLocaleString()}</div>
                        </div>
                        
                        <div className="p-2 bg-muted/50 rounded">
                          <div className="text-xs text-muted-foreground mb-1">Paid</div>
                          <div className={`font-medium ${paymentStatus.totalPaid > 0 ? "text-emerald-500" : ""}`}>
                            ₹{paymentStatus.totalPaid.toLocaleString()}
                          </div>
                        </div>
                        
                        <div className="p-2 bg-muted/50 rounded">
                          <div className="text-xs text-muted-foreground mb-1">Remaining</div>
                          <div className={`font-medium ${paymentStatus.remainingAmount > 0 ? "text-red-500" : "text-emerald-500"}`}>
                            ₹{paymentStatus.remainingAmount.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Payment history section */}
                      {detailedBooking.payments && detailedBooking.payments.length > 0 && (
                        <div className="mt-3">
                          <div className="text-sm font-medium mb-2">Payment History</div>
                          <div className="rounded-md border overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/50">
                                <tr>
                                  <th className="px-3 py-2 text-left">Date</th>
                                  <th className="px-3 py-2 text-right">Amount</th>
                                  <th className="px-3 py-2 text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {detailedBooking.payments.map(payment => (
                                  <tr key={payment.id}>
                                    <td className="px-3 py-2">{format(new Date(payment.date), "MMM d, yyyy")}</td>
                                    <td className="px-3 py-2 text-right">₹{payment.amount.toLocaleString()}</td>
                                    <td className="px-3 py-2 text-right">
                                      <span className={`inline-flex text-xs px-2 py-1 rounded-full ${
                                        payment.status === "Completed" ? "bg-emerald-500/20 text-emerald-500" :
                                        payment.status === "Pending" ? "bg-yellow-500/20 text-yellow-500" :
                                        "bg-red-500/20 text-red-500"
                                      }`}>
                                        {payment.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
            
            {/* Notes section if available */}
            {detailedBooking.notes && (
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground mb-1">Notes</div>
                <div className="text-sm whitespace-pre-line">{detailedBooking.notes}</div>
              </div>
            )}
            
            {/* Trip information section */}
            <div className="rounded-md border p-4">
              <h3 className="font-semibold mb-3">Trip Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Start Date</div>
                  <div className="text-sm font-medium">{format(parseISO(detailedBooking.start_date), "PPPP")}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">End Date</div>
                  <div className="text-sm font-medium">{format(parseISO(detailedBooking.end_date), "PPPP")}</div>
                </div>
                {detailedBooking.tours?.location && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Destination</div>
                    <div className="text-sm font-medium">{detailedBooking.tours.location}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Trip Duration</div>
                  <div className="text-sm font-medium">
                    {Math.ceil((new Date(detailedBooking.end_date).getTime() - new Date(detailedBooking.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                  </div>
                </div>
              </div>
            </div>
            
            {/* Button group - right aligned */}
            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDetailedBookingOpen(false);
                }}
              >
                Close
              </Button>
              <Button
                className="bg-indigo-500 hover:bg-indigo-600"
                onClick={() => {
                  // Navigate to the bookings page to edit this booking
                  window.open(`/bookings?edit=${detailedBooking.id}`, '_blank');
                }}
              >
                Go to Booking Page
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <p>No booking details available.</p>
          </div>
        )}
      </FormDialog>
    </div>
  );
}
