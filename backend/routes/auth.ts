import { Context, Hono } from 'hono';
import { setCookie } from 'jsr:@hono/hono/cookie';
import { z } from 'zod';
import { bodySizeLimits } from '../lib/body-limit.ts';
import { csrfProtection, setCsrfToken } from '../lib/csrf.ts';
import { sendPasswordResetEmail, sendVerificationEmail } from '../lib/email.ts';
import { createAccessToken, createRefreshToken, verifyToken } from '../lib/jwt.ts';
import { getKv } from '../lib/kv.ts';
import { hashPassword, verifyPassword } from '../lib/password.ts';
import { rateLimiters } from '../lib/rate-limit.ts';
import {
  blacklistToken,
  isTokenBlacklisted,
  revokeAllUserTokens,
  revokeRefreshToken,
  storeRefreshToken,
  verifyRefreshToken,
} from '../lib/token-revocation.ts';
import { CreateUserSchema, LoginSchema } from '../types/user.ts';

const auth = new Hono();
const kv = await getKv();

// Get CSRF token endpoint (for login/signup forms)
auth.get('/csrf-token', (c: Context) => {
  const csrfToken = setCsrfToken(c);
  return c.json({
    data: {
      csrfToken,
    }
  });
});

// Apply CSRF protection, strict body size limit and rate limiting to login endpoint
auth.post('/login', csrfProtection(), bodySizeLimits.strict, rateLimiters.auth, async (c: Context) => {
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

    // Create access token (short-lived, 15 minutes)
    const accessToken = await createAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Create refresh token (long-lived, 30 days)
    const { token: refreshToken, tokenId } = await createRefreshToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Store refresh token in database
    const refreshTokenExpiry = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
    await storeRefreshToken(user.id, tokenId, refreshTokenExpiry);

    // Set refresh token in httpOnly cookie
    setCookie(c, 'refresh_token', refreshToken, {
      httpOnly: true,
      secure: Deno.env.get('DENO_ENV') === 'production',
      sameSite: 'Strict',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return c.json({
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified || false
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

// Apply CSRF protection, strict body size limit and rate limiting to signup endpoint
auth.post('/signup', csrfProtection(), bodySizeLimits.strict, rateLimiters.signup, async (c: Context) => {
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
      emailVerified: false,
      emailVerifiedAt: null,
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

    // Generate verification token
    const verificationToken = crypto.randomUUID();
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    // Store verification token
    await kv.set(['email_verification', verificationToken], {
      userId: user.id,
      email: user.email,
      expiresAt
    }, {
      expireIn: 24 * 60 * 60 * 1000 // Auto-delete after 24 hours
    });

    // Send verification email (don't block signup if this fails)
    try {
      await sendVerificationEmail(user.email, user.name, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue with signup even if email fails
    }

    // Create access and refresh tokens for auto-login
    const accessToken = await createAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const { token: refreshToken, tokenId } = await createRefreshToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Store refresh token
    const refreshTokenExpiry = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
    await storeRefreshToken(user.id, tokenId, refreshTokenExpiry);

    // Set refresh token in httpOnly cookie
    setCookie(c, 'refresh_token', refreshToken, {
      httpOnly: true,
      secure: Deno.env.get('DENO_ENV') === 'production',
      sameSite: 'Strict',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return c.json({
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified
        },
        message: 'Account created successfully! Please check your email to verify your account.'
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

// Refresh token endpoint - get new access token using refresh token
auth.post('/refresh', async (c: Context) => {
  try {
    const refreshToken = c.req.header('Cookie')
      ?.split(';')
      .find(c => c.trim().startsWith('refresh_token='))
      ?.split('=')[1];

    if (!refreshToken) {
      return c.json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Refresh token not found'
        }
      }, 401);
    }

    // Verify refresh token
    const payload = await verifyToken(refreshToken);

    // Check token type
    if (payload.type !== 'refresh') {
      return c.json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token type'
        }
      }, 401);
    }

    // Check if token is blacklisted
    if (payload.jti && await isTokenBlacklisted(payload.jti as string)) {
      return c.json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token has been revoked'
        }
      }, 401);
    }

    // Verify refresh token exists in database
    if (payload.jti && !await verifyRefreshToken(payload.sub as string, payload.jti as string)) {
      return c.json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Refresh token not found'
        }
      }, 401);
    }

    // Create new access token
    const accessToken = await createAccessToken({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    });

    return c.json({
      data: {
        accessToken,
      }
    });
  } catch (error) {
    return c.json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired refresh token'
      }
    }, 401);
  }
});

// Logout endpoint - revoke current refresh token
auth.post('/logout', async (c: Context) => {
  try {
    const refreshToken = c.req.header('Cookie')
      ?.split(';')
      .find(c => c.trim().startsWith('refresh_token='))
      ?.split('=')[1];

    if (refreshToken) {
      const payload = await verifyToken(refreshToken);
      
      // Blacklist the refresh token
      if (payload.jti && payload.exp) {
        await blacklistToken(payload.jti as string, payload.exp as number);
        await revokeRefreshToken(payload.sub as string, payload.jti as string);
      }
    }

    // Clear refresh token cookie
    setCookie(c, 'refresh_token', '', {
      httpOnly: true,
      secure: Deno.env.get('DENO_ENV') === 'production',
      sameSite: 'Strict',
      maxAge: 0, // Delete cookie
      path: '/',
    });

    return c.json({
      data: {
        message: 'Logged out successfully'
      }
    });
  } catch (error) {
    // Still return success even if token verification fails
    return c.json({
      data: {
        message: 'Logged out successfully'
      }
    });
  }
});

// Logout from all devices - revoke all refresh tokens
auth.post('/logout-all', async (c: Context) => {
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

    const accessToken = authHeader.replace('Bearer ', '');
    const payload = await verifyToken(accessToken);

    // Revoke all refresh tokens for this user
    await revokeAllUserTokens(payload.sub as string);

    // Clear refresh token cookie
    setCookie(c, 'refresh_token', '', {
      httpOnly: true,
      secure: Deno.env.get('DENO_ENV') === 'production',
      sameSite: 'Strict',
      maxAge: 0,
      path: '/',
    });

    return c.json({
      data: {
        message: 'Logged out from all devices successfully'
      }
    });
  } catch (error) {
    return c.json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid token'
      }
    }, 401);
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
    const payload = await verifyToken(token);

    // Check if it's an access token and if it's blacklisted
    if (payload.jti && await isTokenBlacklisted(payload.jti as string)) {
      return c.json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token has been revoked'
        }
      }, 401);
    }
    
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

// Verify email with token
auth.get('/verify-email', async (c: Context) => {
  try {
    const token = c.req.query('token');
    
    if (!token) {
      return c.json({
        error: {
          code: 'BAD_REQUEST',
          message: 'Verification token is required'
        }
      }, 400);
    }

    // Get verification data from KV
    const verificationKey = ['email_verification', token];
    const verificationEntry = await kv.get<{
      userId: string;
      email: string;
      expiresAt: number;
    }>(verificationKey);

    if (!verificationEntry.value) {
      return c.json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired verification token'
        }
      }, 400);
    }

    const { userId, email, expiresAt } = verificationEntry.value;

    // Check if token has expired
    if (Date.now() > expiresAt) {
      await kv.delete(verificationKey);
      return c.json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Verification token has expired. Please request a new one.'
        }
      }, 400);
    }

    // Get user and update verification status
    const userEntry = await kv.get(['users', userId]);
    if (!userEntry.value) {
      return c.json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      }, 404);
    }

    const user = userEntry.value as any;
    const now = new Date().toISOString();
    
    const updatedUser = {
      ...user,
      emailVerified: true,
      emailVerifiedAt: now,
      updatedAt: now
    };

    // Update user atomically
    await kv.set(['users', userId], updatedUser);

    // Delete verification token
    await kv.delete(verificationKey);

    return c.json({
      data: {
        message: 'Email verified successfully!',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          emailVerified: updatedUser.emailVerified
        }
      }
    });
  } catch (error) {
    return c.json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to verify email'
      }
    }, 500);
  }
});

// Resend verification email
auth.post('/resend-verification', rateLimiters.emailVerification, async (c: Context) => {
  try {
    const body = await c.req.json();
    const { email } = body;

    if (!email) {
      return c.json({
        error: {
          code: 'BAD_REQUEST',
          message: 'Email is required'
        }
      }, 400);
    }

    // Get user by email
    const userKey = await kv.get(['users_by_email', email]);
    if (!userKey.value) {
      // Don't reveal if email exists or not
      return c.json({
        data: {
          message: 'If an account exists with this email, a verification link will be sent.'
        }
      });
    }

    const userId = userKey.value as string;
    const userEntry = await kv.get(['users', userId]);
    const user = userEntry.value as any;

    // Check if already verified
    if (user.emailVerified) {
      return c.json({
        error: {
          code: 'ALREADY_VERIFIED',
          message: 'Email is already verified'
        }
      }, 400);
    }

    // Generate new verification token
    const verificationToken = crypto.randomUUID();
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    // Store verification token
    await kv.set(['email_verification', verificationToken], {
      userId: user.id,
      email: user.email,
      expiresAt
    }, {
      expireIn: 24 * 60 * 60 * 1000 // Auto-delete after 24 hours
    });

    // Send verification email
    const result = await sendVerificationEmail(user.email, user.name, verificationToken);

    if (!result.success) {
      return c.json({
        error: {
          code: 'EMAIL_SEND_FAILED',
          message: 'Failed to send verification email. Please try again later.'
        }
      }, 500);
    }

    return c.json({
      data: {
        message: 'Verification email sent successfully. Please check your inbox.'
      }
    });
  } catch (error) {
    return c.json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to resend verification email'
      }
    }, 500);
  }
});

// Forgot password - request reset email
auth.post('/forgot-password', rateLimiters.passwordReset, async (c: Context) => {
  try {
    const body = await c.req.json();
    const { email } = z.object({ email: z.string().email() }).parse(body);

    // Get user by email
    const userKey = await kv.get(['users_by_email', email]);
    
    // Always return success (don't reveal if email exists - security best practice)
    if (!userKey.value) {
      return c.json({
        data: {
          message: 'If an account exists with this email, a password reset link will be sent.'
        }
      });
    }

    const userId = userKey.value as string;
    const userEntry = await kv.get(['users', userId]);
    const user = userEntry.value as any;

    // Generate reset token
    const resetToken = crypto.randomUUID();
    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour

    // Store reset token
    await kv.set(['password_reset', resetToken], {
      userId: user.id,
      email: user.email,
      expiresAt,
      createdAt: new Date().toISOString()
    }, {
      expireIn: 60 * 60 * 1000 // Auto-delete after 1 hour
    });

    // Send reset email
    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Continue even if email fails - don't reveal this to user
    }

    return c.json({
      data: {
        message: 'If an account exists with this email, a password reset link will be sent.'
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

// Validate reset token
auth.get('/validate-reset-token', async (c: Context) => {
  try {
    const token = c.req.query('token');
    
    if (!token) {
      return c.json({
        error: {
          code: 'BAD_REQUEST',
          message: 'Token is required'
        }
      }, 400);
    }

    const resetEntry = await kv.get(['password_reset', token]);
    
    if (!resetEntry.value) {
      return c.json({
        data: { valid: false, reason: 'invalid' }
      });
    }

    const { expiresAt } = resetEntry.value as any;
    
    if (Date.now() > expiresAt) {
      return c.json({
        data: { valid: false, reason: 'expired' }
      });
    }

    return c.json({
      data: { valid: true }
    });
  } catch (error) {
    return c.json({
      data: { valid: false, reason: 'error' }
    });
  }
});

// Reset password with token
auth.post('/reset-password', bodySizeLimits.strict, async (c: Context) => {
  try {
    const body = await c.req.json();
    const { token, password } = z.object({
      token: z.string().uuid(),
      password: z.string().min(8)
    }).parse(body);

    // Get reset token data
    const resetKey = ['password_reset', token];
    const resetEntry = await kv.get<{
      userId: string;
      email: string;
      expiresAt: number;
    }>(resetKey);

    if (!resetEntry.value) {
      return c.json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired reset token'
        }
      }, 400);
    }

    const { userId, expiresAt } = resetEntry.value;

    // Check expiry
    if (Date.now() > expiresAt) {
      await kv.delete(resetKey);
      return c.json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Reset token has expired. Please request a new one.'
        }
      }, 400);
    }

    // Get user
    const userEntry = await kv.get(['users', userId]);
    if (!userEntry.value) {
      return c.json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      }, 404);
    }

    const user = userEntry.value as any;

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user with new password
    const now = new Date().toISOString();
    const updatedUser = {
      ...user,
      password: hashedPassword,
      updatedAt: now
    };

    await kv.set(['users', userId], updatedUser);

    // Delete reset token (single-use)
    await kv.delete(resetKey);

    // Revoke all refresh tokens for security
    await revokeAllUserTokens(userId);

    return c.json({
      data: {
        message: 'Password reset successfully. Please login with your new password.'
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

export default auth;