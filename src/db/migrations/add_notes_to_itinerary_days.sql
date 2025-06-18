-- Add notes column to itinerary_days table
ALTER TABLE public.itinerary_days 
ADD COLUMN notes text;

-- Create a new RLS policy for the notes column
CREATE POLICY "Enable read/write access for authenticated users" 
ON public.itinerary_days
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated'); 