/**
 * Admin Authentication Middleware
 * Protects routes that require admin access
 */

import { Context, Next } from 'hono';
import { verifyToken } from './jwt.ts';
import { getKv } from './kv.ts';

/**
 * Middleware to require admin role
 * Use this on routes that should only be accessible to admin users
 * 
 * Example usage:
 * ```typescript
 * app.get('/api/admin/users', requireAdmin, async (c) => {
 *   // Handler code - user is guaranteed to be an admin
 * });
 * ```
 */
export function requireAdmin() {
  return async (c: Context, next: Next) => {
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

      // Get user from database to check role
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

      // Check if user has admin role
      if (user.role !== 'admin') {
        return c.json({
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required. This action is restricted to administrators only.'
          }
        }, 403);
      }

      // Store user in context and continue
      c.set('user', user);
      c.set('isAdmin', true);
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
 * Middleware to optionally check admin status
 * Adds admin flag to context but doesn't block non-admin users
 * 
 * Example usage:
 * ```typescript
 * app.get('/api/profile', checkAdmin, async (c) => {
 *   const isAdmin = c.get('isAdmin');
 *   // Show admin features if true
 * });
 * ```
 */
export function checkAdmin() {
  return async (c: Context, next: Next) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        c.set('isAdmin', false);
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
        c.set('isAdmin', user.role === 'admin');
      } else {
        c.set('isAdmin', false);
      }
    } catch (error) {
      c.set('isAdmin', false);
    }
    
    await next();
  };
}
