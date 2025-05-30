const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

const supabase = createClient(supabaseUrl, supabaseKey);

const defaultEmailSettings = {
  smtp_host: 'mail.example.com',
  smtp_port: 587,
  smtp_user: 'noreply@example.com',
  smtp_password: 'your-password-here',
  sender_name: 'Triptics Travel',
  sender_email: 'noreply@example.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

async function setupEmailSettings() {
  try {
    console.log('Checking if email settings exist...');
    const { data: existingSettings, error: queryError } = await supabase
      .from('email_settings')
      .select('id')
      .limit(1);
    
    if (queryError) {
      console.error('Error checking existing settings:', queryError);
      throw queryError;
    }
    
    const hasExistingSettings = existingSettings && existingSettings.length > 0;
    console.log('Existing settings found:', hasExistingSettings);
    
    let result;
    if (hasExistingSettings) {
      console.log('Updating existing email settings...');
      result = await supabase
        .from('email_settings')
        .update(defaultEmailSettings)
        .eq('id', existingSettings[0].id);
    } else {
      console.log('Inserting new email settings...');
      result = await supabase
        .from('email_settings')
        .insert([defaultEmailSettings]);
    }
    
    if (result.error) {
      console.error('Error saving settings to database:', result.error);
      throw result.error;
    }
    
    console.log('Email settings saved successfully!');
    console.log('Please update the settings with your actual SMTP credentials in the Settings page.');
    
  } catch (error) {
    console.error('Error setting up email settings:', error);
  }
}

setupEmailSettings(); 