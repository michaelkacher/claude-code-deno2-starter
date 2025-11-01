import { Context, Hono } from 'hono';
import { encodeHex } from 'jsr:@std/encoding/hex';
import { createToken } from '../lib/jwt.ts';
import { getKv } from '../lib/kv.ts';
import { CreateUserSchema, LoginSchema } from '../types/user.ts';

const auth = new Hono();
const kv = await getKv();

auth.post('/login', async (c: Context) => {
  try {
    const body = await c.req.json();
    const { email, password } = LoginSchema.parse(body);

    // Get user by email
    const userKey = await kv.get(['users_by_email', email]);
    if (!userKey.value) {
      return c.json({ 
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password'
        }
      }, 401);
    }

    const userEntry = await kv.get(['users', userKey.value]);
    const user = userEntry.value;

    // Hash the provided password and compare
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashedPassword = encodeHex(new Uint8Array(hashBuffer));

    if (hashedPassword !== user.password) {
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

auth.post('/signup', async (c: Context) => {
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

    // Hash password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashedPassword = encodeHex(new Uint8Array(hashBuffer));

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

export default auth;