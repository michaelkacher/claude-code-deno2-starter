/**
 * Email Verification Middleware
 * 
 * Protects routes that require verified email addresses
 */

import { Context, Next } from 'hono';
import { verifyToken } from './jwt.ts';
import { getKv } from './kv.ts';

/**
 * Middleware to require verified email
 * Use this on routes that should only be accessible to users with verified emails
 * 
 * Example usage:
 * ```typescript
 * app.post('/api/sensitive-action', requireVerifiedEmail, async (c) => {
 *   // Handler code - user is guaranteed to have verified email
 * });
 * ```
 */
export function requireVerifiedEmail() {
  return async (c: Context, next: Next) => {
    // Check if email verification is required
    const requireVerification = Deno.env.get('REQUIRE_EMAIL_VERIFICATION') === 'true';
    
    if (!requireVerification) {
      // Email verification not enforced, continue
      await next();
      return;
    }

    try {
      // Get token from Authorization header
      const authHeader = c.req.header('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return c.json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Missing or invalid authorization header'
          }
        }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const payload = await verifyToken(token);

      // Get user from database
      const kv = await getKv();
      const userEntry = await kv.get(['users', payload.sub]);
      
      if (!userEntry.value) {
        return c.json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        }, 404);
      }

      const user = userEntry.value as any;

      // Check if email is verified
      if (!user.emailVerified) {
        return c.json({
          error: {
            code: 'EMAIL_NOT_VERIFIED',
            message: 'Please verify your email address to access this feature',
            details: {
              email: user.email,
              action: 'Please check your email for a verification link or request a new one'
            }
          }
        }, 403);
      }

      // Email is verified, store user in context and continue
      c.set('user', user);
      await next();
    } catch (error) {
      return c.json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token'
        }
      }, 401);
    }
  };
}

/**
 * Middleware to optionally check email verification status
 * Adds user info to context but doesn't block unverified users
 * Sets a flag indicating verification status
 * 
 * Example usage:
 * ```typescript
 * app.get('/api/profile', checkEmailVerification, async (c) => {
 *   const user = c.get('user');
 *   const isVerified = c.get('emailVerified');
 *   // Show warning banner if not verified but allow access
 * });
 * ```
 */
export function checkEmailVerification() {
  return async (c: Context, next: Next) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        await next();
        return;
      }

      const token = authHeader.replace('Bearer ', '');
      const payload = await verifyToken(token);

      const kv = await getKv();
      const userEntry = await kv.get(['users', payload.sub]);
      
      if (userEntry.value) {
        const user = userEntry.value as any;
        c.set('user', user);
        c.set('emailVerified', user.emailVerified || false);
      }
    } catch (error) {
      // Don't block on errors, just continue without user info
    }
    
    await next();
  };
}
