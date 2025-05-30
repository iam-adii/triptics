# User Management Guide

## Overview
In this application, user accounts are created solely through the admin interface in the Settings page. There is no user self-registration (signup) functionality available.

## Key Features
- **Admin-Only User Creation**: Only users with appropriate permissions can create new user accounts
- **Role-Based Access Control**: Admins can assign specific roles to users
- **Direct Account Creation**: Users are created directly in the system without email verification workflows

## How to Create Users

1. Navigate to the **Settings** page
2. Select the **Users** tab
3. Click the **Add User** button
4. Fill in the required information:
   - First Name
   - Last Name
   - Email Address (required)
   - Password (required)
   - Role (optional)
5. Click **Create User**

## User Roles

Users can be assigned the following roles:
- **Admin**: Full access to all system features
- **Manager**: Access to most features except sensitive settings
- **Staff**: Limited access to daily operations
- **Custom roles**: Create additional roles with specific permissions

## Managing Existing Users

1. Navigate to the **Settings** page
2. Select the **Users** tab
3. View the list of all users in the system
4. Click the user management icon to change a user's role

## Security Considerations

- Use strong passwords when creating user accounts
- Assign appropriate roles based on the principle of least privilege
- Regularly audit user accounts and permissions

## Technical Implementation

This approach uses Supabase Auth with admin-level functions for user creation:

```typescript
// Admin creation of users
const { data, error } = await supabase.auth.admin.createUser({
  email: userEmail,
  password: userPassword,
  email_confirm: true, // No email verification needed
  user_metadata: {
    first_name: firstName,
    last_name: lastName
  }
});
```

Role management is handled through the Role Context which maintains permissions for each role. 