import { createClient } from '@supabase/supabase-js';
import config from './config';

let supabase: any = null;

try {
  if (config.supabaseUrl && config.supabaseKey) {
    supabase = createClient(config.supabaseUrl, config.supabaseKey);
    console.log('Supabase client initialized successfully');
  } else {
    console.warn('Supabase URL or API key not provided. Some features may not work.');
  }
} catch (error) {
  console.error('Error initializing Supabase client:', error);
}

export default supabase; 