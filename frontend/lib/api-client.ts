/**
 * API Client
 * 
 * Centralized HTTP client with consistent error handling and TypeScript types
 * 
 * Features:
 * - Automatic token injection
 * - Standardized error responses
 * - Type-safe requests and responses
 * - Credential handling
 * - Port translation (3000 → 8000)
 * 
 * @example
 * ```typescript
 * import { api } from '../lib/api-client.ts';
 * 
 * const result = await api.get<User>('/users/me');
 * if (result.error) {
 *   console.error(result.error.message);
 * } else {
 *   console.log(result.data);
 * }
 * ```
 */

import { TokenStorage } from './storage.ts';

/**
 * Standardized API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  statusCode?: number;
}

/**
 * Standardized API response wrapper
 */
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

/**
 * Request options extending fetch RequestInit
 */
export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuth?: boolean;
}

/**
 * Centralized API client
 */
export class ApiClient {
  private baseUrl: string;

  constructor() {
    // Translate port 3000 to 8000 for API calls
    this.baseUrl = typeof window !== 'undefined'
      ? window.location.origin.replace(':3000', ':8000')
      : 'http://localhost:8000';
  }

  /**
   * Get the current access token
   */
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return TokenStorage.getAccessToken();
  }

  /**
   * Make a request to the API
   */
  async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { skipAuth = false, body, ...fetchOptions } = options;

    try {
      // Prepare headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      };

      // Add authorization header if not skipped
      if (!skipAuth) {
        const token = this.getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      // Make the request
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...fetchOptions,
        headers,
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
      });

      // Parse response
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle error responses
      if (!response.ok) {
        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401 && !skipAuth) {
          console.log('🔒 [API] 401 Unauthorized - token expired, logging out');
          
          // Clear auth data
          if (typeof window !== 'undefined') {
            TokenStorage.clearAuth();
            document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
            document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict';
            
            // Redirect to login with reason
            window.location.href = '/login?reason=expired';
          }
        }
        
        return {
          error: {
            code: data.error?.code || 'UNKNOWN_ERROR',
            message: data.error?.message || `Request failed with status ${response.status}`,
            details: data.error?.details,
            statusCode: response.status,
          },
        };
      }

      // Handle successful response
      return { 
        data: data.data !== undefined ? data.data : data 
      };
    } catch (error) {
      // Handle network errors
      console.error('API request failed:', error);
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error 
            ? error.message 
            : 'Network request failed. Please check your connection.',
          statusCode: 0,
        },
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: unknown, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: unknown, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: unknown, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }
}

/**
 * Default API client instance
 * Import this for making API calls
 */
export const api = new ApiClient();

/**
 * Helper function to check if response has an error
 */
export function hasError<T>(response: ApiResponse<T>): response is { error: ApiError } {
  return response.error !== undefined;
}

/**
 * Helper function to extract data or throw error
 */
export function unwrap<T>(response: ApiResponse<T>): T {
  if (hasError(response)) {
    throw new Error(response.error.message);
  }
  if (response.data === undefined) {
    throw new Error('Response data is undefined');
  }
  return response.data;
}
