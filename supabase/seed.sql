-- Seed data for roles
INSERT INTO public.roles (name, description)
VALUES 
  ('admin', 'Full access to all system features'),
  ('sales', 'Access to sales-related features'),
  ('operations', 'Access to operational features')
ON CONFLICT (name) DO NOTHING;

-- Seed data for permissions
INSERT INTO public.permissions (page_key, description)
VALUES
  ('dashboard', 'Access to the dashboard page'),
  ('itineraries', 'Access to the itineraries page'),
  ('itineraryBuilder', 'Access to the itinerary builder page'),
  ('transfers', 'Access to the transfers page'),
  ('payments', 'Access to the payments page'),
  ('bookings', 'Access to the bookings page'),
  ('hotels', 'Access to the hotels page'),
  ('calendar', 'Access to the calendar page'),
  ('customers', 'Access to the customers page'),
  ('leads', 'Access to the leads page'),
  ('email', 'Access to the email page'),
  ('reports', 'Access to the reports page'),
  ('settings', 'Access to the settings page')
ON CONFLICT (page_key) DO NOTHING;

-- Assign all permissions to admin role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'admin'),
  id
FROM public.permissions
WHERE NOT EXISTS (
  SELECT 1 FROM public.role_permissions 
  WHERE role_id = (SELECT id FROM public.roles WHERE name = 'admin')
  AND permission_id = public.permissions.id
);

-- Assign sales role permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'sales'),
  id
FROM public.permissions
WHERE page_key IN ('dashboard', 'leads', 'customers', 'itineraries', 'itineraryBuilder', 'calendar', 'email')
AND NOT EXISTS (
  SELECT 1 FROM public.role_permissions 
  WHERE role_id = (SELECT id FROM public.roles WHERE name = 'sales')
  AND permission_id = public.permissions.id
);

-- Assign operations role permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'operations'),
  id
FROM public.permissions
WHERE page_key IN ('dashboard', 'transfers', 'bookings', 'hotels', 'calendar', 'itineraries')
AND NOT EXISTS (
  SELECT 1 FROM public.role_permissions 
  WHERE role_id = (SELECT id FROM public.roles WHERE name = 'operations')
  AND permission_id = public.permissions.id
);

-- Create admin user if not exists
DO $$
DECLARE
  admin_exists BOOLEAN;
BEGIN
  -- Check if admin user exists
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE email = 'admin@admin.com'
  ) INTO admin_exists;

  -- If admin doesn't exist, we can't create it directly in SQL
  -- This would need to be done via Supabase admin API or dashboard
  IF NOT admin_exists THEN
    RAISE NOTICE 'No admin user found with email admin@admin.com. Please create this user via the Supabase dashboard or API.';
  END IF;
END
$$; 