/**
 * Admin Routes Middleware
 * Ensures all /admin routes are protected and only accessible to admin users
 * 
 * This middleware:
 * 1. Checks for authentication token
 * 2. Validates token with backend
 * 3. Verifies user has admin role
 * 4. Injects user data into context for page handlers
 */

import { FreshContext } from 'fresh';
import { createLogger } from '../../../shared/lib/logger.ts';

const logger = createLogger('AdminMiddleware');

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  emailVerified: boolean;
}

export async function handler(ctx: FreshContext) {
  const req = ctx.req;
  const url = new URL(req.url);
  logger.debug('Admin route access', { pathname: url.pathname });
  
  // Extract token from cookies
  const cookieHeader = req.headers.get('cookie');
  const token = cookieHeader?.split('; ')
    .find((c) => c.startsWith('auth_token='))
    ?.split('=')[1];

    if (!token) {
    // Not logged in - redirect to login with return URL
    const url = new URL(ctx.req.url);
    logger.debug('No token found, redirecting to login', { pathname: url.pathname });
    return new Response(null, {
      status: 302,
      headers: { location: `/login?redirect=${url.pathname}` },
    });
  }

  logger.debug('Token found, verifying');

  try {
    // Verify token and get user data (using internal Fresh API route)
    const apiUrl = new URL('/api/auth/me', ctx.req.url).href;
    logger.debug('Calling auth verification', { apiUrl });
    const userResponse = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    logger.debug('Auth response received', { status: userResponse.status });

    if (!userResponse.ok) {
      // Invalid or expired token - redirect to login with reason
      // This will trigger the login page to show an appropriate error message
      logger.debug('Token verification failed, redirecting to login');
      return new Response(null, {
        status: 302,
        headers: { location: '/login?reason=invalid_session' },
      });
    }

    const userData = await userResponse.json();
    const user: User = userData.data;

    logger.debug('User verified', { email: user.email, role: user.role });

    // Check if user has admin role
    if (user.role !== 'admin') {
      // Not an admin - redirect to home with error message
      logger.debug('User is not admin, redirecting', { email: user.email });
      return new Response(null, {
        status: 302,
        headers: { location: '/?error=unauthorized' },
      });
    }

    // User is authenticated and is admin
    // Inject user data into context for page handlers to use
    ctx.state.user = user;
    ctx.state.token = token;

    logger.debug('Admin verified, proceeding', { email: user.email });

    // Continue to the requested page
    return await ctx.next();
  } catch (error) {
    console.error('❌ [Admin Middleware] Error:', error);
    // On error, redirect to login
    return new Response(null, {
      status: 302,
      headers: { location: '/login?reason=error' },
    });
  }
}
