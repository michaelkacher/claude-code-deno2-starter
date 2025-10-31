import { Context, Next } from 'hono';
import { verifyToken } from '../lib/jwt.ts';
import { env } from '../config/env.ts';

export async function authenticate(c: Context, next: Next) {
  // Skip auth check if disabled for local development
  if (env.DENO_ENV === 'development' && env.DISABLE_AUTH === true) {
    await next();
    return;
  }

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

  try {
    const payload = await verifyToken(token);
    // Add user info to context for route handlers
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ 
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token'
      }
    }, 401);
  }
}

// Role-based authorization middleware
export function authorize(roles: string[]) {
  return async function(c: Context, next: Next) {
    const user = c.get('user');
    if (!user?.role || !roles.includes(user.role)) {
      return c.json({ 
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      }, 403);
    }
    await next();
  };
}