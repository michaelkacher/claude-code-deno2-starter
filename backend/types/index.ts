/**
 * Common types used throughout the application
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

/**
 * Standard API error response
 */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * User type
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

/**
 * Create user input
 */
export interface CreateUserInput {
  email: string;
  name: string;
  role?: 'admin' | 'user';
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Sort parameters
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
