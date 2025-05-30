/**
 * This script confirms all unconfirmed users in Supabase
 * 
 * Usage:
 * 1. Add your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env
 * 2. Run with: node scripts/confirm-users.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
  process.exit(1);
}

// Create admin client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function confirmAllUsers() {
  try {
    // Get all users
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      throw error;
    }
    
    console.log(`Found ${users.users.length} total users`);
    
    // Filter unconfirmed users
    const unconfirmedUsers = users.users.filter(user => 
      !user.email_confirmed_at && 
      user.confirmed_at === null
    );
    
    console.log(`Found ${unconfirmedUsers.length} unconfirmed users`);
    
    if (unconfirmedUsers.length === 0) {
      console.log('No users to confirm. Exiting...');
      return;
    }
    
    // Confirm each user
    for (const user of unconfirmedUsers) {
      console.log(`Confirming user: ${user.email}`);
      
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
      );
      
      if (updateError) {
        console.error(`Failed to confirm ${user.email}: ${updateError.message}`);
      } else {
        console.log(`Successfully confirmed ${user.email}`);
      }
    }
    
    console.log('User confirmation process completed');
    
  } catch (error) {
    console.error('Error confirming users:', error);
  }
}

// Run the script
confirmAllUsers()
  .then(() => console.log('Script completed'))
  .catch(err => console.error('Script failed:', err));

// For confirming a specific user by email
async function confirmUserByEmail(email) {
  try {
    // Get the user by email
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      throw error;
    }
    
    const user = data.users.find(u => u.email === email);
    
    if (!user) {
      console.log(`User with email ${email} not found`);
      return;
    }
    
    console.log(`Confirming user: ${user.email}`);
    
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );
    
    if (updateError) {
      console.error(`Failed to confirm ${user.email}: ${updateError.message}`);
    } else {
      console.log(`Successfully confirmed ${user.email}`);
    }
    
  } catch (error) {
    console.error('Error confirming user:', error);
  }
}

// Uncomment this line and modify the email to confirm a specific user
// confirmUserByEmail('user@example.com'); 