# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/9a7d2fbd-6f1a-495c-8e89-6ede193e037e

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/9a7d2fbd-6f1a-495c-8e89-6ede193e037e) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/9a7d2fbd-6f1a-495c-8e89-6ede193e037e) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

# Triptics

Travel management system built with Next.js and Supabase.

## Role Permissions Fix

If you're experiencing the error "Failed to load users: infinite recursion detected in policy for relation 'role_permissions'", follow these steps to fix it:

### Option 1: Run the SQL Migration Directly

1. Navigate to your Supabase dashboard
2. Go to the SQL Editor
3. Paste and run the following SQL:

```sql
-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Allow all access for admins" ON roles;
DROP POLICY IF EXISTS "Allow all access for admins" ON permissions;
DROP POLICY IF EXISTS "Allow all access for admins" ON role_permissions;

-- Create a special admin bypass policy for admin@admin.com
CREATE POLICY "Admin email bypass for roles" ON roles
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id AND email = 'admin@admin.com'
    )
  );

CREATE POLICY "Admin email bypass for permissions" ON permissions
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id AND email = 'admin@admin.com'
    )
  );

CREATE POLICY "Admin email bypass for role_permissions" ON role_permissions
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id AND email = 'admin@admin.com'
    )
  );

-- Create a policy for users with admin role
CREATE POLICY "Admin role access for roles" ON roles
  USING (
    EXISTS (
      SELECT 1 FROM user_settings us
      JOIN roles r ON us.role_id = r.id
      WHERE us.user_id = auth.uid() AND r.name = 'admin'
    )
  );

CREATE POLICY "Admin role access for permissions" ON permissions
  USING (
    EXISTS (
      SELECT 1 FROM user_settings us
      JOIN roles r ON us.role_id = r.id
      WHERE us.user_id = auth.uid() AND r.name = 'admin'
    )
  );

CREATE POLICY "Admin role access for role_permissions" ON role_permissions
  USING (
    EXISTS (
      SELECT 1 FROM user_settings us
      JOIN roles r ON us.role_id = r.id
      WHERE us.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Create a function to bypass permissions check for admin@admin.com
CREATE OR REPLACE FUNCTION is_admin_user() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND email = 'admin@admin.com'
    )
    OR
    EXISTS (
      SELECT 1 FROM user_settings us
      JOIN roles r ON us.role_id = r.id
      WHERE us.user_id = auth.uid() AND r.name = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the has_permission function to use the is_admin_user function
CREATE OR REPLACE FUNCTION has_permission(user_id UUID, resource TEXT, action TEXT) 
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Check if user is admin
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = user_id AND email = 'admin@admin.com'
  ) OR EXISTS (
    SELECT 1 FROM user_settings us
    JOIN roles r ON us.role_id = r.id
    WHERE us.user_id = user_id AND r.name = 'admin'
  ) INTO is_admin;
  
  -- If admin, return true immediately
  IF is_admin THEN
    RETURN TRUE;
  END IF;
  
  -- Otherwise check specific permissions
  RETURN EXISTS (
    SELECT 1
    FROM user_settings us
    JOIN role_permissions rp ON us.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE us.user_id = user_id
    AND p.resource = resource
    AND p.action = action
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Option 2: Use the Fix Script

1. We've provided a script (`fix-permissions.js`) that will apply the necessary changes to fix the recursion issue
2. You'll need to run this with your Supabase service key (not the anon key)
3. To run the script:

```bash
# Install required packages if needed
npm install @supabase/supabase-js

# Run the script
node fix-permissions.js
```

## Development

[Add your development instructions here]

## Role-Based Access Control

This application uses Supabase Auth with a custom role-based access control system. Here's how it works:

### Database Structure

- `roles`: Stores available roles (admin, sales, operations, etc.)
- `permissions`: Maps page keys to permissions
- `role_permissions`: Junction table linking roles to their permissions
- `user_settings`: Contains user profile data including assigned role

### User Creation Process

1. Admins can create users directly from the "Users & Roles" tab in Settings
2. Users are created with the Supabase Admin API (no email verification)
3. Role assignment happens during user creation
4. New users can log in immediately

### Role Management

The role management interface allows admins to:
- Create, edit, and delete roles
- Assign permissions to roles using a checkbox interface
- Control which pages/features each role can access

### Access Control Implementation

1. A `RoleContext` fetches and manages the current user's role and permissions
2. `ProtectedRoute` component checks permissions before rendering routes
3. Pages that require specific permissions will redirect to an "Access Denied" page

### Permission Checks

To check if a user can access a specific page:
```typescript
const { canAccessPage } = useRole();
if (canAccessPage('dashboard')) {
  // User can access dashboard
}
```

### Default Roles

- **Admin**: Full access to all system features
- **Sales**: Access to sales-related features (leads, customers, itineraries, etc.)
- **Operations**: Access to operational features (transfers, bookings, hotels, etc.)

### Adding New Protected Routes

When adding new pages that should be protected:
1. Add the page key to the permissions table
2. Use the `ProtectedRoute` component with the appropriate page key
3. Assign the permission to relevant roles

## Email Server Setup

This application includes an Express server for handling email functionality with cPanel SMTP. Follow these steps to set up the email server:

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the server directory with the following content:
   ```
   # Server configuration
   PORT=3001

   # CORS settings
   CORS_ORIGIN=http://localhost:8080
   ```

4. Start the server:
   ```
   npm run dev
   ```

5. The email server will run on port 3001 by default. The frontend application is configured to connect to this server for email operations.

## cPanel SMTP Configuration

To use cPanel SMTP with this application:

1. Log in to the application
2. Navigate to Settings > Email
3. Enter your cPanel email server details:
   - SMTP Host (e.g., mail.yourdomain.com)
   - SMTP Port (typically 587 or 465)
   - SMTP Username (your email address)
   - SMTP Password
   - Sender Name (how the email will appear to recipients)
   - Sender Email (the email address used as the sender)
4. Click "Test Email" to verify the settings
5. Save the settings once confirmed working

The application will use these settings for all email communications, including booking confirmations and payment receipts.
