-- Add route_description column to itinerary_days table
ALTER TABLE public.itinerary_days ADD COLUMN IF NOT EXISTS route_description TEXT;
