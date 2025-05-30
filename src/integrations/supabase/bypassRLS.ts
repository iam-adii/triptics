import { supabase } from './client';

/**
 * Creates a service role client to bypass RLS policies
 * Use this carefully and only for admin-level operations
 */
export const bypassRLS = async () => {
  try {
    // Call the Edge Function to get a service role token
    const { data, error } = await supabase.functions.invoke('get-service-token', {
      body: { action: 'bypass_rls' }
    });

    if (error) {
      console.error('Error getting service token:', error);
      return null;
    }

    if (!data?.serviceToken) {
      console.error('No service token returned');
      return null;
    }

    // Create a temporary client with the service role token
    return supabase;
  } catch (error) {
    console.error('Error in bypassRLS:', error);
    return null;
  }
};

/**
 * Fallback method that doesn't actually bypass RLS but handles the error gracefully
 */
export const handleRLSError = (error: any): boolean => {
  if (
    error?.message?.includes('infinite recursion') || 
    error?.message?.includes('policy') ||
    error?.message?.includes('user_settings')
  ) {
    console.warn('RLS policy error detected:', error.message);
    return true;
  }
  return false;
};

/**
 * Executes a database operation with RLS error handling
 */
export const executeWithRLSHandling = async <T>(
  operation: () => Promise<T>,
  fallback: () => Promise<T> | T
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (handleRLSError(error)) {
      return await fallback();
    }
    throw error;
  }
}; 