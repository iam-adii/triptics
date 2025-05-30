import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Define base booking type
export interface Booking {
  id: string;
  booking_number?: string;
  start_date: string;
  end_date: string;
  status: string;
  total_amount: number;
  customer_id?: string; 
  tour_id?: string;
  notes?: string;
  created_at: string;
  customers?: { 
    id: string;
    name: string;
    email: string;
  } | null;
  tours?: { 
    id: string;
    name: string;
    location: string;
  } | null;
  payments?: {
    id: string;
    amount: number;
    status: string;
    date: string;
    method: string;
  }[];
}

// Type for Supabase response
type SupabaseBooking = any;

// Fetch all bookings with related data
export const fetchBookings = async (): Promise<Booking[]> => {
  try {
    console.log("Fetching bookings from service...");
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        booking_number,
        start_date,
        end_date,
        status,
        total_amount,
        customer_id,
        tour_id,
        notes,
        created_at,
        customers (id, name, email),
        tours (id, name, location),
        payments (
          id,
          amount,
          status,
          method,
          date
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
      throw error;
    }

    console.log(`Fetched ${data?.length || 0} bookings successfully`);
    // Type assertion to handle the Supabase response format
    return (data || []) as Booking[];
  } catch (error) {
    console.error("Unexpected error in fetchBookings:", error);
    throw error;
  }
};

// Get a single booking by ID
export const fetchBookingById = async (id: string): Promise<Booking | null> => {
  if (!id) return null;
  
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      booking_number,
      start_date,
      end_date,
      status,
      total_amount,
      customer_id,
      tour_id,
      notes,
      created_at,
      customers (id, name, email),
      tours (id, name, location),
      payments (
        id,
        amount,
        status,
        method,
        date
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching booking:", error);
    throw error;
  }

  // Type assertion to handle the Supabase response format
  return data as Booking;
};

// Create a new booking
export const createBooking = async (booking: Partial<Booking>): Promise<Booking> => {
  const { data, error } = await supabase
    .from("bookings")
    .insert(booking)
    .select()
    .single();

  if (error) {
    console.error("Error creating booking:", error);
    throw error;
  }

  return data as Booking;
};

// Update an existing booking
export const updateBooking = async (id: string, booking: Partial<Booking>): Promise<Booking> => {
  const { data, error } = await supabase
    .from("bookings")
    .update(booking)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating booking:", error);
    throw error;
  }

  return data as Booking;
};

// Delete a booking
export const deleteBooking = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting booking:", error);
    throw error;
  }
};

// Update booking status
export const updateBookingStatus = async (id: string, status: string): Promise<void> => {
  const { error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("Error updating booking status:", error);
    throw error;
  }
}; 