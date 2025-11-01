/**
 * Authentication Middleware
 * Protects routes by checking for valid auth token
 * Redirects to login if not authenticated
 */

import { MiddlewareHandler } from '$fresh/server.ts';

// Routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/signup',
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
    
    console.log(`\n🔍 MIDDLEWARE CALLED for: ${pathname}`);

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
      console.log(`   ✓ Public route allowed: ${pathname}`);
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
      console.log(`   ✓ Allowed path (static/Fresh): ${pathname}`);
      return await ctx.next();
    }

    // Check for auth token in cookie or header
    const cookies = req.headers.get('cookie') || '';
    const authToken = cookies.split(';')
      .map(c => c.trim())
      .find(c => c.startsWith('auth_token='))
      ?.split('=')[1];

    // Debug logging
    console.log(`🔒 Auth check for: ${pathname}`);
    console.log(`   Token present: ${!!authToken}`);

    // If no token, redirect to login with original URL as redirect parameter
    if (!authToken) {
      console.log(`   ⛔ Redirecting to login from: ${pathname}`);
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      
      // Use 307 Temporary Redirect to preserve the original request method
      return Response.redirect(new URL(redirectUrl, url.origin).href, 307);
    }

    console.log(`   ✅ Access granted`);
    return await ctx.next();
};
