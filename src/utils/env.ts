/**
 * Safe access to environment variables in both browser and Node.js environments
 */

/**
 * Safely get environment variables regardless of environment
 */
export const getEnv = (key: string, defaultValue: string = ''): string => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Try to get from import.meta.env (Vite)
    const viteEnv = (import.meta as any)?.env?.[`VITE_${key}`];
    if (viteEnv) return viteEnv;
    
    // Try to get from window.__ENV__ (if you're using a runtime env solution)
    const windowEnv = (window as any)?.__ENV__?.[key];
    if (windowEnv) return windowEnv;
    
    return defaultValue;
  }
  
  // Node.js environment
  if (typeof process !== 'undefined' && process.env) {
    // First check for REACT_APP_ prefix (CRA)
    const craValue = process.env[`REACT_APP_${key}`];
    if (craValue) return craValue;
    
    // Then check for VITE_ prefix (Vite)
    const viteValue = process.env[`VITE_${key}`];
    if (viteValue) return viteValue;
    
    // Finally check for the key directly
    const directValue = process.env[key];
    if (directValue) return directValue;
  }
  
  return defaultValue;
};

/**
 * Get the current environment (development, production, test)
 */
export const getNodeEnv = (): string => {
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) {
    return process.env.NODE_ENV;
  }
  
  // For Vite in browser
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env.MODE || 'development';
  }
  
  return 'development'; // Default to development
};

/**
 * Check if currently in development mode
 */
export const isDevelopment = (): boolean => {
  return getNodeEnv() === 'development';
};

/**
 * Check if running on localhost
 */
export const isLocalhost = (): boolean => {
  return typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1');
};

// Export commonly used environment variables
export const ENV = {
  SUPABASE_URL: getEnv('SUPABASE_URL', 'https://omqevjttukrrmhaltzdz.supabase.co'),
  SUPABASE_ANON_KEY: getEnv('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tcWV2anR0dWtycm1oYWx0emR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMTUyMDAsImV4cCI6MjA2NDc5MTIwMH0.CHYSxCjbZUDzhWtxhSxHl8__UkCj0ruLSYnHOJ-0tbw'),
  SUPABASE_SERVICE_ROLE_KEY: getEnv('SUPABASE_SERVICE_ROLE_KEY', '')
}; 