/**
 * CSRF (Cross-Site Request Forgery) Protection
 * 
 * Implements Double Submit Cookie pattern:
 * - Server generates CSRF token and sends in cookie + response body
 * - Client must send token in both cookie AND custom header
 * - Server verifies both match
 * 
 * This works because:
 * - Attackers can't read cookies from other domains (Same-Origin Policy)
 * - Attackers can't set custom headers in cross-origin requests
 */

import { Context, Next } from 'hono';
import { getCookie, setCookie } from 'jsr:@hono/hono/cookie';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure random token
 */
function generateCsrfToken(): string {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate and set CSRF token in cookie
 * Should be called on GET requests to auth endpoints
 */
export function setCsrfToken(c: Context): string {
  const token = generateCsrfToken();
  
  setCookie(c, CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by JavaScript
    secure: Deno.env.get('DENO_ENV') === 'production',
    sameSite: 'Strict',
    maxAge: 3600, // 1 hour
    path: '/',
  });
  
  return token;
}

/**
 * CSRF protection middleware for state-changing operations
 * Use on POST, PUT, DELETE, PATCH routes
 */
export function csrfProtection() {
  return async (c: Context, next: Next) => {
    const method = c.req.method;
    
    // Skip CSRF check for safe methods (GET, HEAD, OPTIONS)
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      await next();
      return;
    }
    
    // Get CSRF token from cookie and header
    const cookieToken = getCookie(c, CSRF_COOKIE_NAME);
    const headerToken = c.req.header(CSRF_HEADER_NAME);
    
    // Verify both exist
    if (!cookieToken || !headerToken) {
      return c.json({
        error: {
          code: 'CSRF_TOKEN_MISSING',
          message: 'CSRF token is required',
        }
      }, 403);
    }
    
    // Verify tokens match (constant-time comparison)
    if (!constantTimeCompare(cookieToken, headerToken)) {
      return c.json({
        error: {
          code: 'CSRF_TOKEN_INVALID',
          message: 'Invalid CSRF token',
        }
      }, 403);
    }
    
    await next();
  };
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Helper to get CSRF token for responses
 * Returns existing token or generates a new one
 */
export function getCsrfToken(c: Context): string {
  const existingToken = getCookie(c, CSRF_COOKIE_NAME);
  if (existingToken) {
    return existingToken;
  }
  return setCsrfToken(c);
}
