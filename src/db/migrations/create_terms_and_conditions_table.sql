-- Create terms_and_conditions table
CREATE TABLE IF NOT EXISTS public.terms_and_conditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inclusions TEXT[] DEFAULT ARRAY[]::TEXT[],
  exclusions TEXT[] DEFAULT ARRAY[]::TEXT[],
  terms TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_terms_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for terms_and_conditions table
DROP TRIGGER IF EXISTS update_terms_and_conditions_updated_at ON public.terms_and_conditions;
CREATE TRIGGER update_terms_and_conditions_updated_at 
  BEFORE UPDATE ON public.terms_and_conditions 
  FOR EACH ROW EXECUTE FUNCTION update_terms_updated_at_column();

-- Create RLS policies for the terms_and_conditions table
ALTER TABLE public.terms_and_conditions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read terms and conditions
CREATE POLICY "Enable read access for authenticated users" ON public.terms_and_conditions
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert terms and conditions
CREATE POLICY "Enable insert access for authenticated users" ON public.terms_and_conditions
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update terms and conditions
CREATE POLICY "Enable update access for authenticated users" ON public.terms_and_conditions
FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete terms and conditions
CREATE POLICY "Enable delete access for authenticated users" ON public.terms_and_conditions
FOR DELETE USING (auth.role() = 'authenticated');

-- Insert default terms and conditions record if none exists
INSERT INTO public.terms_and_conditions (inclusions, exclusions, terms)
SELECT 
  ARRAY[
    'Accommodation as per itinerary',
    'Daily breakfast',
    'All transfers and sightseeing by private vehicle',
    'English speaking driver',
    'Toll taxes and parking charges'
  ]::TEXT[],
  ARRAY[
    'Airfare/train fare',
    'Personal expenses',
    'Travel insurance',
    'Tips and gratuities',
    'Any meals not mentioned in inclusions'
  ]::TEXT[],
  ARRAY[
    'Cancellation policy: Free cancellation up to 48 hours before the tour. 50% charge for cancellations within 48 hours.',
    'Please arrive 15 minutes before the scheduled departure time.',
    'Tour itinerary may be subject to change due to weather conditions or unforeseen circumstances.',
    'Please carry a valid ID proof during the tour.',
    'Payment terms: 25% advance payment required to confirm booking, balance payment due before tour commencement.'
  ]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM public.terms_and_conditions LIMIT 1); 