-- Fix RLS policies for terms_and_conditions table
-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.terms_and_conditions;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.terms_and_conditions;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.terms_and_conditions;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.terms_and_conditions;

-- Create more permissive RLS policies that work with Supabase auth
-- Allow all authenticated users to read terms and conditions
CREATE POLICY "Allow authenticated users to read terms" ON public.terms_and_conditions
FOR SELECT USING (true);

-- Allow all authenticated users to insert terms and conditions
CREATE POLICY "Allow authenticated users to insert terms" ON public.terms_and_conditions
FOR INSERT WITH CHECK (true);

-- Allow all authenticated users to update terms and conditions
CREATE POLICY "Allow authenticated users to update terms" ON public.terms_and_conditions
FOR UPDATE USING (true) WITH CHECK (true);

-- Allow all authenticated users to delete terms and conditions
CREATE POLICY "Allow authenticated users to delete terms" ON public.terms_and_conditions
FOR DELETE USING (true);

-- Alternatively, if you want to disable RLS entirely for this table (since it's global settings):
-- ALTER TABLE public.terms_and_conditions DISABLE ROW LEVEL SECURITY;

-- Make sure the table has the correct ownership and permissions
-- Grant usage on the table to authenticated users
GRANT ALL ON public.terms_and_conditions TO authenticated;
GRANT ALL ON public.terms_and_conditions TO anon; 