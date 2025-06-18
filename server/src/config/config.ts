import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  port: number;
  nodeEnv: string;
  corsOrigin: string | string[];
  jwtSecret: string;
  supabaseUrl: string;
  supabaseKey: string;
}

const config: Config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  jwtSecret: process.env.JWT_SECRET || 'your-default-jwt-secret-key-change-in-production',
  supabaseUrl: process.env.SUPABASE_URL || 'https://omqevjttukrrmhaltzdz.supabase.co',
  supabaseKey: process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tcWV2anR0dWtycm1oYWx0emR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMTUyMDAsImV4cCI6MjA2NDc5MTIwMH0.CHYSxCjbZUDzhWtxhSxHl8__UkCj0ruLSYnHOJ-0tbw'
};

export default config; 