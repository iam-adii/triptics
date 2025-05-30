# Triptics Scripts

## Assigning a Sales Role to a User

To assign the sales role to a user (specifically for Reek@triptics.com):

1. Log in to the Supabase dashboard
2. Go to the SQL Editor section
3. Copy the contents of the `assign_sales_role.sql` file
4. Paste the SQL code into the SQL Editor
5. Execute the script

The script will:
1. Update any existing user_settings record to set the role_id to the sales role
2. If no user_settings record exists for the user, it will create one with the sales role
3. Verify the change by selecting the user's email and role name

## Adding Additional Roles

To add additional roles to the system:

1. Log in to the Supabase dashboard
2. Go to the SQL Editor section
3. Copy the contents of the `add_additional_roles.sql` file
4. Paste the SQL code into the SQL Editor
5. Execute the script

The script will add the following roles:
- manager: Manager with access to team management and reporting features
- finance: Finance team member with access to payment and financial reports
- support: Support team member with access to customer service features
- marketing: Marketing team member with access to campaigns and analytics

### Troubleshooting

If you encounter any issues:
- Make sure the user already exists in the Supabase authentication system
- Verify that the "sales" role exists in the roles table
- Check that you have admin privileges in Supabase 