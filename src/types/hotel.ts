export interface Hotel {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode?: string;
  star_category: number;
  description?: string;
  amenities?: string[];
  phone?: string;
  email?: string;
  website?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface RoomRate {
  id: string;
  hotel_id: string;
  room_type: string;
  cp_rate: number; // Continental Plan
  map_rate: number; // Modified American Plan
  ap_rate: number; // American Plan
  ep_rate: number; // European Plan
  extra_adult_rate: number;
  extra_child_rate: number;
  max_occupancy: number;
  season_name?: string;
  season_start?: string;
  season_end?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HotelWithRates extends Hotel {
  room_rates?: RoomRate[];
} 