-- Drop the existing policy
DROP POLICY IF EXISTS "Allow admins to modify email settings" ON email_settings;

-- Create a more permissive policy that allows all authenticated users
CREATE POLICY "Allow all authenticated users to modify email settings" 
  ON email_settings
  FOR ALL 
  TO authenticated
  USING (true); 