import { API_BASE_URL } from "@/config/api";

// Default request timeout in milliseconds
export const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * Get authentication headers for API requests
 * @returns Authentication headers
 */
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * API request options
 */
interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

/**
 * API response type
 */
export interface ApiResponse<T = any> {
  data: T | null;
  error: Error | null;
  status: number;
}

/**
 * Format query parameters for URL
 * @param params Object with parameters
 * @returns Formatted query string
 */
export function formatQueryParams(params: Record<string, string | number | boolean>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Make an API request with timeout and error handling
 * @param endpoint API endpoint
 * @param options Request options
 * @returns Promise with typed response
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    headers = getAuthHeaders(),
    body,
    timeout = REQUEST_TIMEOUT
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    const requestOptions: RequestInit = {
      method,
      headers,
      signal: controller.signal
    };

    // Add body for non-GET requests
    if (method !== 'GET' && body) {
      requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(url, requestOptions);
    clearTimeout(timeoutId);

    // Parse response data
    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else if (contentType && contentType.includes('text/')) {
      data = await response.text();
    }

    if (!response.ok) {
      // Handle API error responses
      const errorMessage = data?.message || response.statusText || 'API request failed';
      const error = new Error(errorMessage);
      return { data: null, error, status: response.status };
    }

    return { data, error: null, status: response.status };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { 
          data: null, 
          error: new Error('Request timeout'), 
          status: 408 // Request Timeout
        };
      }
      return { data: null, error, status: 500 };
    }
    
    return { 
      data: null, 
      error: new Error('Unknown error occurred'), 
      status: 500 
    };
  }
}

/**
 * Make a GET request
 * @param endpoint API endpoint
 * @param params URL parameters
 * @param options Request options
 * @returns Promise with typed response
 */
export async function get<T = any>(
  endpoint: string,
  params?: Record<string, string | number | boolean>,
  options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
): Promise<ApiResponse<T>> {
  const url = params ? `${endpoint}${formatQueryParams(params)}` : endpoint;
  return apiRequest<T>(url, { ...options, method: 'GET' });
}

/**
 * Make a POST request
 * @param endpoint API endpoint
 * @param data Request body
 * @param options Request options
 * @returns Promise with typed response
 */
export async function post<T = any>(
  endpoint: string,
  data?: any,
  options: Omit<ApiRequestOptions, 'method'> = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: 'POST', body: data });
}

/**
 * Make a PUT request
 * @param endpoint API endpoint
 * @param data Request body
 * @param options Request options
 * @returns Promise with typed response
 */
export async function put<T = any>(
  endpoint: string,
  data?: any,
  options: Omit<ApiRequestOptions, 'method'> = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: 'PUT', body: data });
}

/**
 * Make a PATCH request
 * @param endpoint API endpoint
 * @param data Request body
 * @param options Request options
 * @returns Promise with typed response
 */
export async function patch<T = any>(
  endpoint: string,
  data?: any,
  options: Omit<ApiRequestOptions, 'method'> = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: 'PATCH', body: data });
}

/**
 * Make a DELETE request
 * @param endpoint API endpoint
 * @param options Request options
 * @returns Promise with typed response
 */
export async function del<T = any>(
  endpoint: string,
  options: Omit<ApiRequestOptions, 'method'> = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
} 