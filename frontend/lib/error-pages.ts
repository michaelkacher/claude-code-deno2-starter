/**
 * Error Page Helpers
 * Utilities for redirecting to custom error pages
 */

/**
 * Redirect to 404 error page
 */
export function redirectTo404(): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/404',
    },
  });
}

/**
 * Redirect to 401 unauthorized error page
 * @param returnUrl - URL to return to after login
 */
export function redirectTo401(returnUrl?: string): Response {
  const url = returnUrl 
    ? `/401?return=${encodeURIComponent(returnUrl)}`
    : '/401';
  
  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
    },
  });
}

/**
 * Redirect to 403 forbidden error page
 * @param returnUrl - URL that was attempted
 */
export function redirectTo403(returnUrl?: string): Response {
  const url = returnUrl 
    ? `/403?return=${encodeURIComponent(returnUrl)}`
    : '/403';
  
  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
    },
  });
}

/**
 * Redirect to 500 server error page
 * @param error - Optional error object (shown in development)
 */
export function redirectTo500(error?: Error): Response {
  // Log the error server-side
  if (error) {
    console.error('Server Error:', error);
  }
  
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/500',
    },
  });
}

/**
 * Redirect to generic error page with custom message
 * @param message - Error message to display
 * @param code - Optional error code
 * @param returnUrl - URL to return to
 */
export function redirectToError(
  message: string,
  code?: string,
  returnUrl?: string
): Response {
  const params = new URLSearchParams({
    message,
    ...(code && { code }),
    ...(returnUrl && { return: returnUrl }),
  });
  
  return new Response(null, {
    status: 302,
    headers: {
      Location: `/error?${params.toString()}`,
    },
  });
}

/**
 * Return error response with status code (for API endpoints)
 * This doesn't redirect but returns a JSON error
 */
export function errorResponse(
  code: string,
  message: string,
  status: number = 400
): Response {
  return new Response(
    JSON.stringify({
      error: {
        code,
        message,
      },
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
