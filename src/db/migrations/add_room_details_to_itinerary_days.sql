-- Add room details columns to itinerary_days table
ALTER TABLE public.itinerary_days 
ADD COLUMN room_type text,
ADD COLUMN meal_plan text,
ADD COLUMN room_price numeric(10, 2);

-- Create a new RLS policy for the new columns
CREATE POLICY "Enable read/write access for room details" 
ON public.itinerary_days
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated'); 