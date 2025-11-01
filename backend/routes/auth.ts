import { Context, Hono } from 'hono';
import { bodySizeLimits } from '../lib/body-limit.ts';
import { createToken } from '../lib/jwt.ts';
import { getKv } from '../lib/kv.ts';
import { hashPassword, verifyPassword } from '../lib/password.ts';
import { rateLimiters } from '../lib/rate-limit.ts';
import { CreateUserSchema, LoginSchema } from '../types/user.ts';

const auth = new Hono();
const kv = await getKv();

// Apply strict body size limit and rate limiting to login endpoint
auth.post('/login', bodySizeLimits.strict, rateLimiters.auth, async (c: Context) => {
  try {
    const body = await c.req.json();
    const { email, password } = LoginSchema.parse(body);

    // Get user by email
    const userKey = await kv.get(['users_by_email', email]);
    
    // Use constant-time approach: always verify password even if user doesn't exist
    // This prevents timing attacks that could reveal valid email addresses
    const userExists = !!userKey.value;
    const userId = userKey.value as string || 'dummy_id';
    const userEntry = await kv.get(['users', userId]);
    const user = userEntry.value || { password: '$2a$10$dummyhashtopreventtimingattack' };

    // Verify password using bcrypt (constant time operation)
    const passwordMatches = await verifyPassword(password, user.password);

    // Check both conditions together to maintain constant timing
    if (!userExists || !passwordMatches) {
      return c.json({ 
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password'
        }
      }, 401);
    }

    // Create JWT token
    const token = await createToken({
      sub: user.id,
      email: user.email,
      role: user.role
    });

    return c.json({
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    });
  } catch (error) {
    return c.json({ 
      error: {
        code: 'BAD_REQUEST',
        message: error.message
      }
    }, 400);
  }
});

// Apply strict body size limit and rate limiting to signup endpoint
auth.post('/signup', bodySizeLimits.strict, rateLimiters.signup, async (c: Context) => {
  try {
    const body = await c.req.json();
    const { email, password, name } = CreateUserSchema.parse(body);

    // Check if user already exists
    const existingUserKey = await kv.get(['users_by_email', email]);
    if (existingUserKey.value) {
      return c.json({
        error: {
          code: 'CONFLICT',
          message: 'Email already registered'
        }
      }, 409);
    }

    // Hash password using bcrypt
    const hashedPassword = await hashPassword(password);

    // Create user
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    const user = {
      id: userId,
      email,
      password: hashedPassword,
      name,
      role: 'user',
      createdAt: now,
      updatedAt: now,
    };

    // Store user atomically
    const result = await kv
      .atomic()
      .set(['users', userId], user)
      .set(['users_by_email', email], userId)
      .commit();

    if (!result.ok) {
      return c.json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create user'
        }
      }, 500);
    }

    // Create JWT token for auto-login
    const token = await createToken({
      sub: user.id,
      email: user.email,
      role: user.role
    });

    return c.json({
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    }, 201);
  } catch (error) {
    return c.json({
      error: {
        code: 'BAD_REQUEST',
        message: error.message
      }
    }, 400);
  }
});

// Token verification endpoint
auth.get('/verify', async (c: Context) => {
  try {
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
    
    // Import verifyToken here to avoid circular dependency
    const { verifyToken } = await import('../lib/jwt.ts');
    const payload = await verifyToken(token);
    
    // Token is valid
    return c.json({
      data: {
        valid: true,
        user: {
          id: payload.sub,
          email: payload.email,
          role: payload.role
        }
      }
    });
  } catch (error) {
    return c.json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token'
      }
    }, 401);
  }
});

export default auth;