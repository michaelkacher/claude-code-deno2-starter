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

import { MiddlewareHandlerContext } from '$fresh/server.ts';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  emailVerified: boolean;
}

export async function handler(req: Request, ctx: MiddlewareHandlerContext) {
  const url = new URL(req.url);
  console.log("🔶 [Admin Middleware] CALLED for:", url.pathname);
  
  // Extract token from cookies
  const cookieHeader = req.headers.get('cookie');
  const token = cookieHeader?.split('; ')
    .find((c) => c.startsWith('auth_token='))
    ?.split('=')[1];

  if (!token) {
    // Not logged in - redirect to login with return URL
    const url = new URL(req.url);
    console.log("🚫 [Admin Middleware] No token found, redirecting to login");
    return new Response(null, {
      status: 302,
      headers: { location: `/login?redirect=${url.pathname}` },
    });
  }

  console.log("🔐 [Admin Middleware] Token found, verifying...");

  try {
    // Verify token and get user data (using internal Fresh API route)
    const apiUrl = new URL('/api/auth/me', req.url).href;
    console.log("📞 [Admin Middleware] Calling:", apiUrl);
    const userResponse = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log("📥 [Admin Middleware] API response:", userResponse.status, userResponse.statusText);

    if (!userResponse.ok) {
      // Invalid or expired token - redirect to login with reason
      // This will trigger the login page to show an appropriate error message
      console.log("❌ [Admin Middleware] Token verification failed, redirecting to login");
      return new Response(null, {
        status: 302,
        headers: { location: '/login?reason=invalid_session' },
      });
    }

    const userData = await userResponse.json();
    const user: User = userData.data;

    console.log("👤 [Admin Middleware] User verified:", user.email, "Role:", user.role);

    // Check if user has admin role
    if (user.role !== 'admin') {
      // Not an admin - redirect to home with error message
      console.log("🚫 [Admin Middleware] User is not admin, redirecting");
      return new Response(null, {
        status: 302,
        headers: { location: '/?error=unauthorized' },
      });
    }

    // User is authenticated and is admin
    // Inject user data into context for page handlers to use
    ctx.state.user = user;
    ctx.state.token = token;

    console.log("✅ [Admin Middleware] Admin verified, proceeding to page");

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
