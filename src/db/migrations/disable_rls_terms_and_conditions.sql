-- Alternative: Disable RLS entirely for terms_and_conditions table
-- This is appropriate since terms and conditions are global settings
-- that should be accessible to all authenticated users

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.terms_and_conditions;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.terms_and_conditions;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.terms_and_conditions;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.terms_and_conditions;
DROP POLICY IF EXISTS "Allow authenticated users to read terms" ON public.terms_and_conditions;
DROP POLICY IF EXISTS "Allow authenticated users to insert terms" ON public.terms_and_conditions;
DROP POLICY IF EXISTS "Allow authenticated users to update terms" ON public.terms_and_conditions;
DROP POLICY IF EXISTS "Allow authenticated users to delete terms" ON public.terms_and_conditions;

-- Disable RLS for this table
ALTER TABLE public.terms_and_conditions DISABLE ROW LEVEL SECURITY;

-- Grant permissions to ensure access
GRANT ALL ON public.terms_and_conditions TO authenticated;
GRANT SELECT ON public.terms_and_conditions TO anon; 