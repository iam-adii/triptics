import { supabase } from "@/lib/supabase";
import { Hotel, RoomRate, HotelWithRates } from "@/types/hotel";

// Fetch all hotels
export const fetchHotels = async (): Promise<Hotel[]> => {
  const { data, error } = await supabase
    .from("hotels")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching hotels:", error);
    throw new Error(error.message);
  }

  return data || [];
};

// Fetch a single hotel with its room rates
export const fetchHotelWithRates = async (id: string): Promise<HotelWithRates | null> => {
  const { data, error } = await supabase
    .from("hotels")
    .select(`
      *,
      room_rates:hotel_room_rates(*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching hotel:", error);
    throw new Error(error.message);
  }

  return data;
};

// Create a new hotel
export const createHotel = async (hotel: Omit<Hotel, "id" | "created_at" | "updated_at">): Promise<Hotel> => {
  const { data, error } = await supabase
    .from("hotels")
    .insert(hotel)
    .select()
    .single();

  if (error) {
    console.error("Error creating hotel:", error);
    throw new Error(error.message);
  }

  return data;
};

// Update an existing hotel
export const updateHotel = async (id: string, hotel: Partial<Hotel>): Promise<Hotel> => {
  const { data, error } = await supabase
    .from("hotels")
    .update(hotel)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating hotel:", error);
    throw new Error(error.message);
  }

  return data;
};

// Delete a hotel
export const deleteHotel = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("hotels")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting hotel:", error);
    throw new Error(error.message);
  }
};

// Create a new room rate
export const createRoomRate = async (roomRate: Omit<RoomRate, "id" | "created_at" | "updated_at">): Promise<RoomRate> => {
  const { data, error } = await supabase
    .from("hotel_room_rates")
    .insert(roomRate)
    .select()
    .single();

  if (error) {
    console.error("Error creating room rate:", error);
    throw new Error(error.message);
  }

  return data;
};

// Update an existing room rate
export const updateRoomRate = async (id: string, roomRate: Partial<RoomRate>): Promise<RoomRate> => {
  const { data, error } = await supabase
    .from("hotel_room_rates")
    .update(roomRate)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating room rate:", error);
    throw new Error(error.message);
  }

  return data;
};

// Delete a room rate
export const deleteRoomRate = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("hotel_room_rates")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting room rate:", error);
    throw new Error(error.message);
  }
}; 