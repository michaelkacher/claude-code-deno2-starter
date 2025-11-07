/**
 * Error Handling Utilities for Route Handlers
 * Provides consistent error handling and user-friendly error responses
 */

import { HandlerContext } from '$fresh/server.ts';

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
 */
export function createErrorResponse(
  code: string,
  message: string,
  status: number = 500,
  details?: unknown
): Response {
  const errorResponse: ErrorResponse = {
    error: {
      code,
      message,
      ...(details && { details }),
    },
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(errorResponse), {
    status,
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
 */
export async function handleApiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
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
        return {
          data: null,
          error: errorData.error?.message || `Request failed with status ${response.status}`,
        };
      } catch {
        return {
          data: null,
          error: `Request failed with status ${response.status}`,
        };
      }
    }

    const data = await response.json();
    return { data: data.data || data, error: null };
  } catch (error) {
    console.error('API fetch error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

/**
 * Async handler wrapper with error handling
 */
export function withErrorHandler<T>(
  handler: (req: Request, ctx: HandlerContext<T>) => Promise<Response>
) {
  return async (req: Request, ctx: HandlerContext<T>): Promise<Response> => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      console.error('Route handler error:', error);
      
      // Log error details for debugging
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString(),
      };
      
      console.error('Error details:', JSON.stringify(errorDetails, null, 2));

      // Return user-friendly error response
      return createErrorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'An unexpected error occurred. Please try again later.',
        500,
        process.env.DENO_ENV === 'development' ? errorDetails : undefined
      );
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
 */
export function logError(
  error: unknown,
  context: Record<string, unknown> = {}
): void {
  const errorInfo = {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
  };

  console.error('Error:', JSON.stringify(errorInfo, null, 2));
}
