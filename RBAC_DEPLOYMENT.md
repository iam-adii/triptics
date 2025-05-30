# Role-Based Access Control Deployment Guide

Follow these steps to deploy the Role-Based Access Control (RBAC) system in your Triptics application.

## Database Setup

1. Run the database migration to create the required tables:

```bash
# Navigate to your Supabase project
# Go to SQL Editor
# Run the SQL from supabase/migrations/20240701000000_create_rbac_tables.sql
```

2. Run the seed script to create initial roles and permissions:

```bash
# Navigate to your Supabase project
# Go to SQL Editor
# Run the SQL from supabase/seed.sql
```

## Create Initial Admin User

1. Create an admin user via the Supabase dashboard:
   - Go to Authentication > Users
   - Click "Add User"
   - Enter email "admin@admin.com" (or your preferred admin email)
   - Set a secure password
   - Click "Create User"

2. Assign admin role to the user:
   - Go to SQL Editor and run:

```sql
INSERT INTO public.user_settings (user_id, email, role_id)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'admin@admin.com'),
  'admin@admin.com',
  (SELECT id FROM public.roles WHERE name = 'admin')
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_settings 
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@admin.com')
);
```

## Frontend Implementation

1. Ensure all required files are present:
   - `src/types/auth.ts`
   - `src/contexts/RoleContext.tsx`
   - `src/components/ProtectedRoute.tsx`
   - `src/pages/AccessDenied.tsx`
   - `src/components/settings/UserManagement.tsx`
   - `src/components/settings/RoleManagement.tsx`

2. Make sure App.tsx includes the RoleProvider and ProtectedRoute components for each page:

```jsx
<AuthProvider>
  <UserProvider>
    <RoleProvider>
      {/* Routes... */}
    </RoleProvider>
  </UserProvider>
</AuthProvider>
```

3. Update the Settings page to include the User and Role Management tabs.

## Testing the RBAC System

1. Log in as the admin user.
2. Navigate to Settings > Users & Roles.
3. Create additional users with different roles.
4. Test access control by logging in as these users and ensuring:
   - They can only access pages permitted by their role
   - They are redirected to the Access Denied page for unauthorized pages

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**: Check if the admin user has the correct role_id in the user_settings table.

2. **RLS Policy Errors**: If you encounter RLS policy errors, run the fix script:

```sql
-- Run this SQL to fix RLS policies
DROP POLICY IF EXISTS "Allow all access for admins" ON roles;
DROP POLICY IF EXISTS "Allow all access for admins" ON permissions;
DROP POLICY IF EXISTS "Allow all access for admins" ON role_permissions;

-- Create admin bypass policies instead
CREATE POLICY "Admin email bypass for roles" ON roles
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id AND email = 'admin@admin.com'
    )
  );
```

3. **User Creation Issues**: Make sure you have the correct Supabase service role key set in your environment variables.

## Additional Customization

### Adding New Permissions

1. Add a new permission to the database:

```sql
INSERT INTO public.permissions (page_key, description)
VALUES ('new_page', 'Access to the new page')
ON CONFLICT (page_key) DO NOTHING;
```

2. Assign the permission to relevant roles:

```sql
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'admin'),
  (SELECT id FROM public.permissions WHERE page_key = 'new_page')
WHERE NOT EXISTS (
  SELECT 1 FROM public.role_permissions 
  WHERE role_id = (SELECT id FROM public.roles WHERE name = 'admin')
  AND permission_id = (SELECT id FROM public.permissions WHERE page_key = 'new_page')
);
```

3. Protect the new route in your application:

```jsx
<Route path="new-page" element={<ProtectedRoute pageKey="new_page"><NewPage /></ProtectedRoute>} />
``` 