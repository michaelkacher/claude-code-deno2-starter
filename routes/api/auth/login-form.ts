/**
 * POST /api/auth/login-form
 * Traditional form-based login endpoint
 * Returns redirect response instead of JSON
 */

import { withErrorHandler, type AppState } from '@/lib/fresh-helpers.ts';
import { AuthService } from '@/services/auth.service.ts';
import { Handlers } from "fresh";
import { setCookie } from 'jsr:@std/http/cookie';

export const handler: Handlers<unknown, AppState> = {
  POST: withErrorHandler(async (ctx) => {
    console.log('[Login Form API] Received login request');
    const req = ctx.req;
    
    // Parse form data
    const formData = await req.formData();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();
    const redirectTo = formData.get('redirect')?.toString() || '/';
    
    if (!email || !password) {
      // Return to login page with error
      const url = new URL(req.url);
      return Response.redirect(
        new URL(`/login?error=missing_credentials&redirect=${encodeURIComponent(redirectTo)}`, url.origin).href,
        303
      );
    }

    console.log('[Login Form API] Login attempt for:', email);

    const authService = new AuthService();

    try {
      // Authenticate user (service throws typed errors)
      const loginResult = await authService.login(email, password);

      // Set cookies in response headers
      const headers = new Headers();
      
      // Set refresh token as httpOnly cookie
      setCookie(headers, "refresh_token", loginResult.refreshToken, {
        httpOnly: true,
        secure: Deno.env.get("DENO_ENV") === "production",
        sameSite: "Lax",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      });

      // Set auth_token cookie for server-side middleware (15 minutes expiry)
      setCookie(headers, "auth_token", loginResult.accessToken, {
        httpOnly: false, // Allow client-side access for API calls
        secure: Deno.env.get("DENO_ENV") === "production",
        sameSite: "Lax",
        maxAge: 15 * 60, // 15 minutes
        path: "/",
      });

      console.log('[Login Form API] Login successful, redirecting to:', redirectTo);
      console.log('[Login Form API] Set-Cookie headers:', headers.getSetCookie());
      console.log('[Login Form API] Auth token (first 20 chars):', loginResult.accessToken.substring(0, 20));

      // Return HTML that sets cookies via JavaScript before redirecting
      // This ensures cookies are available before navigation
      const expiresDate = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      const refreshExpiresDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      const html = `<!DOCTYPE html>
<html>
<head>
  <title>Redirecting...</title>
</head>
<body>
  <p>Login successful. Redirecting to: ${redirectTo}</p>
  <script>
    console.log('[Login Success] Setting cookies and redirecting to:', '${redirectTo}');
    
    // Set cookies client-side to ensure they're available
    document.cookie = 'auth_token=${loginResult.accessToken}; path=/; expires=${expiresDate.toUTCString()}; SameSite=Lax';
    document.cookie = 'refresh_token=${loginResult.refreshToken}; path=/; expires=${refreshExpiresDate.toUTCString()}; SameSite=Lax';
    
    // Also store in localStorage for client-side use
    localStorage.setItem('access_token', '${loginResult.accessToken}');
    localStorage.setItem('user_email', '${loginResult.user.email}');
    localStorage.setItem('user_role', '${loginResult.user.role}');
    
    console.log('[Login Success] Cookies set, navigating now...');
    
    // Navigate after cookies are set
    window.location.href = '${redirectTo}';
  </script>
</body>
</html>`;

      // Return HTML response with cookies set
      const url = new URL(req.url);
      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          ...Object.fromEntries(headers.entries()),
        },
      });
      
    } catch (error) {
      // Login failed - redirect back to login page with error
      console.error('[Login Form API] Login failed:', error);
      const url = new URL(req.url);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      return Response.redirect(
        new URL(`/login?error=${encodeURIComponent(errorMessage)}&redirect=${encodeURIComponent(redirectTo)}`, url.origin).href,
        303
      );
    }
  }),
};
