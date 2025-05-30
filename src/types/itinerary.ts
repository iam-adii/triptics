export interface Itinerary {
  id: string;
  name: string;
  destination?: string;
  client_id?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  duration?: number;
  budget?: number;
  notes?: string;
  transfer_included?: 'yes' | 'no' | 'partial';
  created_at?: string;
  updated_at?: string;
  customers?: Customer | null;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface ItineraryDay {
  id: string;
  itinerary_id: string;
  day_number: number;
  date?: string;
  hotel_id?: string;
  cab_type?: string;
  hotel?: Hotel;
  created_at?: string;
  updated_at?: string;
}

export interface Hotel {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  star_category: number;
  phone?: string;
}

export interface ItineraryActivity {
  id: string;
  itinerary_day_id: string;
  title: string;
  description?: string;
  time_start?: string;
  time_end?: string;
  location?: string;
  is_transfer?: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  itinerary_day?: {
    day_number: number;
  };
} 