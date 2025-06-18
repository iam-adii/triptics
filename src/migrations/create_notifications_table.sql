-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lead', 'booking', 'payment', 'reminder', 'marketing', 'system')),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  new_leads BOOLEAN NOT NULL DEFAULT true,
  new_bookings BOOLEAN NOT NULL DEFAULT true,
  payment_receipts BOOLEAN NOT NULL DEFAULT true,
  tour_reminders BOOLEAN NOT NULL DEFAULT true,
  marketing_emails BOOLEAN NOT NULL DEFAULT false,
  push_leads BOOLEAN NOT NULL DEFAULT true,
  push_bookings BOOLEAN NOT NULL DEFAULT true,
  push_payments BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_notification_settings UNIQUE (user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for notifications table
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for notification_settings table
DROP TRIGGER IF EXISTS update_notification_settings_updated_at ON notification_settings;
CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON notification_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own notifications
DROP POLICY IF EXISTS notifications_select_policy ON notifications;
CREATE POLICY notifications_select_policy ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only update their own notifications (e.g., marking as read)
DROP POLICY IF EXISTS notifications_update_policy ON notifications;
CREATE POLICY notifications_update_policy ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Service role can insert notifications for any user
DROP POLICY IF EXISTS notifications_insert_policy ON notifications;
CREATE POLICY notifications_insert_policy ON notifications
  FOR INSERT
  WITH CHECK (true);

-- Create RLS policies for notification_settings table
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own notification settings
DROP POLICY IF EXISTS notification_settings_select_policy ON notification_settings;
CREATE POLICY notification_settings_select_policy ON notification_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only update their own notification settings
DROP POLICY IF EXISTS notification_settings_update_policy ON notification_settings;
CREATE POLICY notification_settings_update_policy ON notification_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Service role can insert notification settings for any user
DROP POLICY IF EXISTS notification_settings_insert_policy ON notification_settings;
CREATE POLICY notification_settings_insert_policy ON notification_settings
  FOR INSERT
  WITH CHECK (true);

-- Add function to automatically clean up old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  -- Delete notifications older than 30 days
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql; 