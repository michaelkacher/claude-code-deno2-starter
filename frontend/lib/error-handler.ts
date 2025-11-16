/**
 * Error Handling Utilities for Route Handlers
 * Provides consistent error handling and user-friendly error responses
 */

import { FreshContext } from 'fresh';
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  logAppError,
  NetworkError,
  toAppError
} from './errors.ts';

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

/**
 * Standard error codes
 * @deprecated Use error classes from errors.ts instead
 */
export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

/**
 * Error response builder
 * Handles both AppError instances and legacy string-based errors
 */
export function createErrorResponse(
  error: AppError | string,
  legacyMessage?: string,
  legacyStatus?: number,
  legacyDetails?: unknown
): Response {
  // Handle AppError instances
  if (error instanceof AppError) {
    const errorResponse: ErrorResponse = {
      error: {
        code: error.code,
        message: error.toUserMessage(),
        ...(error.context && { details: error.context }),
      },
      timestamp: error.timestamp,
    };

    return new Response(JSON.stringify(errorResponse), {
      status: error.statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Legacy support for string-based errors
  const errorResponse: ErrorResponse = {
    error: {
      code: error,
      message: legacyMessage || 'An error occurred',
      ...(legacyDetails ? { details: legacyDetails } : {}),
    },
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(errorResponse), {
    status: legacyStatus || 500,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Redirect to error page with details
 */
export function redirectToError(
  message: string,
  returnUrl?: string
): Response {
  const errorUrl = new URL('/error', 'http://localhost:3000');
  errorUrl.searchParams.set('message', message);
  if (returnUrl) {
    errorUrl.searchParams.set('return', returnUrl);
  }

  return new Response(null, {
    status: 302,
    headers: {
      'Location': errorUrl.pathname + errorUrl.search,
    },
  });
}

/**
 * Redirect to login with error reason
 */
export function redirectToLogin(
  redirectUrl: string,
  reason?: string
): Response {
  const loginUrl = new URL('/login', 'http://localhost:3000');
  loginUrl.searchParams.set('redirect', redirectUrl);
  if (reason) {
    loginUrl.searchParams.set('reason', reason);
  }

  return new Response(null, {
    status: 302,
    headers: {
      'Location': loginUrl.pathname + loginUrl.search,
    },
  });
}

/**
 * Handle API fetch errors with consistent error handling
 * Returns typed data or throws AppError
 */
export async function handleApiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Try to parse error from response
      try {
        const errorData = await response.json();
        const message = errorData.error?.message || `Request failed with status ${response.status}`;
        
        // Create appropriate error type based on status code
        if (response.status === 401) {
          return {
            data: null,
            error: new AuthenticationError(message, 'invalid_token'),
          };
        }
        
        if (response.status === 403) {
          return {
            data: null,
            error: new AuthorizationError(message),
          };
        }
        
        return {
          data: null,
          error: toAppError(new Error(message)),
        };
      } catch {
        return {
          data: null,
          error: toAppError(new Error(`Request failed with status ${response.status}`)),
        };
      }
    }

    const data = await response.json();
    return { data: data.data || data, error: null };
  } catch (error) {
    console.error('API fetch error:', error);
    
    // Network errors
    const networkError = new NetworkError(
      error instanceof Error ? error.message : 'Network error occurred',
      url,
      options.method?.toString()
    );
    
    return {
      data: null,
      error: networkError,
    };
  }
}

/**
 * Async handler wrapper with error handling
 * Catches errors and converts them to AppError instances
 */
export function withErrorHandler<T>(
  handler: (ctx: FreshContext<T>) => Promise<Response>
) {
  return async (ctx: FreshContext<T>): Promise<Response> => {
    const req = ctx.req;
    try {
      return await handler(ctx);
    } catch (error) {
      // Convert to AppError if not already
      const appError = toAppError(error);
      
      // Log error with appropriate level
      logAppError(appError, {
        url: req.url,
        method: req.method,
      });

      // Handle authentication errors with redirect
      if (appError instanceof AuthenticationError) {
        return redirectToLogin(new URL(req.url).pathname, appError.reason || 'auth_required');
      }

      // Handle authorization errors with redirect
      if (appError instanceof AuthorizationError) {
        return redirectToLogin(new URL(req.url).pathname, 'insufficient_permissions');
      }

      // Return user-friendly error response
      return createErrorResponse(appError);
    }
  };
}

/**
 * Validate required fields in request data
 */
export function validateRequired(
  data: Record<string, unknown>,
  fields: string[]
): { valid: boolean; missing: string[] } {
  const missing = fields.filter(field => !data[field]);
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(
  json: string,
  fallback: T
): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Extract auth token from request
 */
export function extractAuthToken(req: Request): string | null {
  // Try Authorization header first
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '');
  }

  // Try cookie
  const cookies = req.headers.get('cookie') || '';
  const authToken = cookies
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith('auth_token='))
    ?.split('=')[1];

  return authToken || null;
}

/**
 * Check if user has required role
 */
export function hasRole(
  userRole: string | null | undefined,
  requiredRole: string | string[]
): boolean {
  if (!userRole) return false;
  
  const required = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return required.includes(userRole);
}

/**
 * Log error with context
 * Supports both AppError and generic errors
 */
export function logError(
  error: unknown,
  context: Record<string, unknown> = {}
): void {
  // Use AppError logging if available
  if (error instanceof AppError) {
    logAppError(error, context);
    return;
  }

  // Fallback for non-AppError instances
  const errorInfo = {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
  };

  console.error('Error:', JSON.stringify(errorInfo, null, 2));
}
