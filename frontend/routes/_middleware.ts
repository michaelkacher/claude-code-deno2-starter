/**
 * Authentication Middleware
 * Protects routes by checking for valid auth token
 * Redirects to login if not authenticated
 */

import { MiddlewareHandler } from '$fresh/server.ts';
import { createLogger } from '../../shared/lib/logger.ts';
import { decodeJwt, isTokenExpired, isValidJwtStructure } from '../lib/jwt.ts';

const logger = createLogger('PageMiddleware');

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

export const handler: MiddlewareHandler = async (req, ctx) => {
    const url = new URL(req.url);
    const pathname = url.pathname;
    
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
    
    // Store user data in context state for _app.tsx to access
    ctx.state.userEmail = null;
    ctx.state.userRole = null;
    ctx.state.initialTheme = themeCookie === 'dark' || themeCookie === 'light' ? themeCookie : null;
    ctx.state.token = null;
    ctx.state.user = null;
    
    if (authToken) {
      try {
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
      } catch (_e) {
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

    if (isPublicRoute) {
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
      return await ctx.next();
    }

    // If no token, redirect to login
    if (!authToken) {
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      return Response.redirect(new URL(redirectUrl, url.origin).href, 307);
    }

    // Validate token structure
    if (!isValidJwtStructure(authToken)) {
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      return Response.redirect(new URL(redirectUrl, url.origin).href, 307);
    }

    // Check if token is expired (client-side check)
    if (isTokenExpired(authToken)) {
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}&reason=expired`;
      return Response.redirect(new URL(redirectUrl, url.origin).href, 307);
    }

    // Verify JWT signature server-side by calling Fresh API
    try {
      const verifyUrl = new URL('/api/auth/verify', url.origin).href;
      const verifyResponse = await fetch(verifyUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!verifyResponse.ok) {
        // Token verification failed (invalid signature, blacklisted, or other error)
        const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}&reason=invalid`;
        return Response.redirect(new URL(redirectUrl, url.origin).href, 307);
      }

      // Token verified successfully - user data is already set from JWT decode above
      // No need to update ctx.state again since we already have it from the token
    } catch (_error) {
      // Network error or backend unavailable - redirect to login
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}&reason=error`;
      return Response.redirect(new URL(redirectUrl, url.origin).href, 307);
    }

    // Token is valid and verified
    return await ctx.next();
};
