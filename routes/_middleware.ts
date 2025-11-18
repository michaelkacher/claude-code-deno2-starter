/**
 * Authentication Middleware
 * Protects routes by checking for valid auth token
 * Redirects to login if not authenticated
 */

import { createLogger } from '@/lib/logger.ts';
import { FreshContext } from 'fresh';
import { decodeJwt, isTokenExpired, isValidJwtStructure, verifyToken } from '../lib/jwt.ts';

const logger = createLogger('PageMiddleware');

// Enable verbose logging only if DEBUG_MIDDLEWARE env var is set
const DEBUG = Deno.env.get('DEBUG_MIDDLEWARE') === 'true';

// Define state type for Fresh 2
interface State {
  userEmail?: string | null;
  userRole?: string | null;
  initialTheme?: 'light' | 'dark' | null;
  token?: string | null;
  user?: {
    sub: string;
    email: string;
    role: string;
    emailVerified: boolean;
    iat: number;
    exp: number;
  } | null;
}

// Routes that don't require authentication
const publicRoutes = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/_frsh/',
  '/api/',
  '/lib/',
];

// Static file extensions and Fresh internals to allow
const allowedPaths = [
  '/styles.css',
  '/favicon.ico',
  '/_fresh/',
  '/island-',
  '/chunk-',
  '.js',
  '.css',
  '.png',
  '.jpg',
  '.svg',
  '.ico',
];

export const handler = async (ctx: FreshContext<State>) => {
    try {
    const req = ctx.req;
    const url = new URL(req.url);
    const pathname = url.pathname;
    
    if (DEBUG) console.log('[Middleware] Processing:', pathname);
    
    // Extract user info and theme from cookies for all requests
    const cookies = req.headers.get('cookie') || '';
    const authToken = cookies.split(';')
      .map(c => c.trim())
      .find(c => c.startsWith('auth_token='))
      ?.split('=')[1];
    
    const themeCookie = cookies.split(';')
      .map(c => c.trim())
      .find(c => c.startsWith('theme='))
      ?.split('=')[1];
    
    if (DEBUG) console.log('[Middleware] Auth token present:', !!authToken);
    
    // Store user data in context state for _app.tsx to access
    ctx.state.userEmail = null;
    ctx.state.userRole = null;
    ctx.state.initialTheme = themeCookie === 'dark' || themeCookie === 'light' ? themeCookie : null;
    ctx.state.token = null;
    ctx.state.user = null;
    
    if (authToken) {
      try {
        if (DEBUG) console.log('[Middleware] Decoding JWT...');
        const payload = decodeJwt(authToken);
        ctx.state.userEmail = payload.email || null;
        ctx.state.userRole = payload.role || null;
        ctx.state.token = authToken;
        ctx.state.user = {
          sub: payload.sub,
          email: payload.email,
          role: payload.role,
          emailVerified: payload.emailVerified,
          iat: payload.iat,
          exp: payload.exp,
        };
        if (DEBUG) console.log('[Middleware] JWT decoded successfully');
      } catch (e) {
        if (DEBUG) console.error('[Middleware] JWT decode error:', e);
        // Invalid token
      }
    }

    // Allow public routes
    const isPublicRoute = publicRoutes.some(route => {
      // Prefix match for routes ending with /
      if (route.endsWith('/')) {
        return pathname.startsWith(route);
      }
      // Exact match for other routes
      return pathname === route;
    });

    if (DEBUG) console.log('[Middleware] Is public route:', isPublicRoute);

    if (isPublicRoute) {
      if (DEBUG) console.log('[Middleware] Allowing public route');
      return await ctx.next();
    }

    // Allow static files and Fresh internals
    const isAllowedPath = allowedPaths.some(path => {
      // For paths starting with /, check if pathname starts with them
      if (path.startsWith('/')) {
        return pathname.startsWith(path);
      }
      // For extensions, check if pathname ends with them
      return pathname.endsWith(path);
    });
    
    if (isAllowedPath) {
      if (DEBUG) console.log('[Middleware] Allowing static path');
      return await ctx.next();
    }

    // If no token, redirect to login
    if (!authToken) {
      if (DEBUG) console.log('[Middleware] No auth token, redirecting to login');
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      return Response.redirect(new URL(redirectUrl, url.origin).href, 307);
    }

    // Validate token structure
    if (!isValidJwtStructure(authToken)) {
      if (DEBUG) console.log('[Middleware] Invalid JWT structure');
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      return Response.redirect(new URL(redirectUrl, url.origin).href, 307);
    }

    // Check if token is expired (client-side check)
    if (isTokenExpired(authToken)) {
      if (DEBUG) console.log('[Middleware] Token expired');
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}&reason=expired`;
      return Response.redirect(new URL(redirectUrl, url.origin).href, 307);
    }

    // Verify JWT signature directly (no HTTP fetch overhead)
    try {
      await verifyToken(authToken);
      if (DEBUG) console.log('[Middleware] Token verified successfully');
      // Token verified successfully - user data is already set from JWT decode above
    } catch (error) {
      if (DEBUG) console.error('[Middleware] Token verification error:', error);
      // Invalid signature or verification failed - redirect to login
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}&reason=invalid`;
      return Response.redirect(new URL(redirectUrl, url.origin).href, 307);
    }

    // Token is valid and verified
    if (DEBUG) console.log('[Middleware] Auth check complete, proceeding');
    return await ctx.next();
  } catch (error) {
    console.error('[Middleware] FATAL ERROR:', error);
    throw error;
  }
};

