/**
 * API Configuration
 * This file contains the configuration for API endpoints and settings
 */

// API base URL - use local endpoint since no external API is needed
export const API_BASE_URL = '';

// API endpoints for different resources
export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    refreshToken: '/api/auth/refresh-token',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
  },
  
  // User endpoints
  user: {
    profile: '/api/user/profile',
    updateProfile: '/api/user/profile',
    changePassword: '/api/user/change-password',
  },
  
  // Search endpoints
  search: {
    universal: '/api/search',
    customers: '/api/customers/search',
    bookings: '/api/bookings/search',
    leads: '/api/leads/search',
    itineraries: '/api/itineraries/search',
    payments: '/api/payments/search',
    hotels: '/api/hotels/search',
  },
  
  // Resource endpoints
  customers: '/api/customers',
  leads: '/api/leads',
  bookings: '/api/bookings',
  itineraries: '/api/itineraries',
  payments: '/api/payments',
  hotels: '/api/hotels',
  reports: '/api/reports',
};

// Default request headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

// Request timeout in milliseconds
export const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * Get authorization headers with the current auth token
 * @returns Headers object with Authorization header
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    ...DEFAULT_HEADERS,
    'Authorization': token ? `Bearer ${token}` : '',
  };
}; 