-- Create email_settings table for SMTP configuration
CREATE TABLE IF NOT EXISTS email_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_user TEXT NOT NULL,
  smtp_password TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add row-level security policies
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow authenticated users to read email settings
CREATE POLICY "Allow authenticated users to read email settings" 
  ON email_settings
  FOR SELECT 
  TO authenticated
  USING (true);

-- Create a policy to allow admins to modify email settings
CREATE POLICY "Allow admins to modify email settings" 
  ON email_settings
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  ); 