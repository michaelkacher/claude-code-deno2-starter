/**
 * Authentication Middleware
 * Protects routes by checking for valid auth token
 * Redirects to login if not authenticated
 */

import { MiddlewareHandler } from '$fresh/server.ts';
import { decodeJwt, isTokenExpired, isValidJwtStructure } from '../lib/jwt.ts';

// Routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/mockups/',
  '/design-system',
  '/_frsh/',
  '/api/',
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
    
    if (authToken) {
      try {
        const payload = decodeJwt(authToken);
        ctx.state.userEmail = payload.email || null;
        ctx.state.userRole = payload.role || null;
      } catch (_e) {
        // Invalid token
      }
    }
    
    // Check if auth is disabled via environment variable (defaults to true if not set)
    const disableAuthEnv = Deno.env.get('DISABLE_AUTH');
    const disableAuth = disableAuthEnv === 'true' || disableAuthEnv === undefined;
    if (disableAuth) {
      return await ctx.next();
    }

    // Allow public routes
    const isPublicRoute = publicRoutes.some(route => {
      // Exact match for home page
      if (route === '/') {
        return pathname === '/';
      }
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

    // Token is valid
    return await ctx.next();
};
