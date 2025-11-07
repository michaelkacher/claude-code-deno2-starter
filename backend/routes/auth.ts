import { Context, Hono } from 'hono';
import { setCookie } from 'jsr:@hono/hono/cookie';
import { z } from 'zod';
import { bodySizeLimits } from '../lib/body-limit.ts';
import { cacheStrategies } from '../lib/cache-control.ts';
import { csrfProtection, setCsrfToken } from '../lib/csrf.ts';
import { sendPasswordResetEmail, sendVerificationEmail } from '../lib/email.ts';
import { createAccessToken, createRefreshToken, verifyToken } from '../lib/jwt.ts';
import { verifyPassword } from '../lib/password.ts';
import { rateLimiters } from '../lib/rate-limit.ts';
import {
  blacklistToken,
  isTokenBlacklisted,
  revokeAllUserTokens,
  revokeRefreshToken,
  storeRefreshToken,
  verifyRefreshToken,
} from '../lib/token-revocation.ts';
import { validateBody } from '../middleware/validate.ts';
import { TokenRepository, UserRepository } from '../repositories/index.ts';
import {
  LoginSchema,
  PasswordResetRequestSchema,
  PasswordResetSchema,
  SignupSchema
} from '../types/user.ts';

const auth = new Hono();

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
auth.post('/login', cacheStrategies.noCache(), csrfProtection(), bodySizeLimits.strict, rateLimiters.auth, validateBody(LoginSchema), async (c: Context) => {
  try {
    const userRepo = new UserRepository();
    const { email, password } = c.get('validatedBody') as { email: string; password: string };

    // Get user by email
    const user = await userRepo.findByEmail(email);
    
    // Use constant-time approach: always verify password even if user doesn't exist
    // This prevents timing attacks that could reveal valid email addresses
    const userExists = !!user;
    const dummyUser = { password: '$2a$10$dummyhashtopreventtimingattack' };
    const passwordToVerify = user?.password || dummyUser.password;

    // Verify password using bcrypt (constant time operation)
    const passwordMatches = await verifyPassword(password, passwordToVerify);

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
auth.post('/signup', cacheStrategies.noCache(), csrfProtection(), bodySizeLimits.strict, rateLimiters.signup, validateBody(SignupSchema), async (c: Context) => {
  try {
    const userRepo = new UserRepository();
    const tokenRepo = new TokenRepository();
    const { email, password, name } = c.get('validatedBody') as { email: string; password: string; name: string };

    // Check if user already exists
    const existingUser = await userRepo.findByEmail(email);
    if (existingUser) {
      return c.json({
        error: {
          code: 'CONFLICT',
          message: 'Email already registered'
        }
      }, 409);
    }

    // Create user (password hashing handled by repository)
    let user;
    try {
      user = await userRepo.create({
        email,
        password,
        name,
        role: 'user',
        emailVerified: false,
        emailVerifiedAt: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });
    } catch (error) {
      return c.json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create user'
        }
      }, 500);
    }

    // Generate verification token
    const verificationToken = crypto.randomUUID();
    const expiresAt = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours

    // Store verification token
    await tokenRepo.storeEmailVerificationToken(
      verificationToken,
      user.id,
      user.email,
      expiresAt
    );

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
auth.post('/logout', cacheStrategies.noCache(), async (c: Context) => {
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
    const userRepo = new UserRepository();
    const tokenRepo = new TokenRepository();
    const token = c.req.query('token');
    
    if (!token) {
      return c.json({
        error: {
          code: 'BAD_REQUEST',
          message: 'Verification token is required'
        }
      }, 400);
    }

    // Get verification data
    const verificationData = await tokenRepo.getEmailVerificationToken(token);

    if (!verificationData) {
      return c.json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired verification token'
        }
      }, 400);
    }

    const { userId } = verificationData;

    // Get user
    const user = await userRepo.findById(userId);
    if (!user) {
      return c.json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      }, 404);
    }

    // Update user verification status
    const updatedUser = await userRepo.verifyEmail(userId);

    // Delete verification token
    await tokenRepo.deleteEmailVerificationToken(token);

    return c.json({
      data: {
        message: 'Email verified successfully!',
        user: {
          id: updatedUser!.id,
          email: updatedUser!.email,
          name: updatedUser!.name,
          emailVerified: updatedUser!.emailVerified
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
    const userRepo = new UserRepository();
    const tokenRepo = new TokenRepository();
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
    const user = await userRepo.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not
      return c.json({
        data: {
          message: 'If an account exists with this email, a verification link will be sent.'
        }
      });
    }

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
    const expiresAt = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours

    // Store verification token
    await tokenRepo.storeEmailVerificationToken(
      verificationToken,
      user.id,
      user.email,
      expiresAt
    );

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
auth.post('/forgot-password', rateLimiters.passwordReset, validateBody(PasswordResetRequestSchema), async (c: Context) => {
  try {
    const userRepo = new UserRepository();
    const tokenRepo = new TokenRepository();
    const { email } = c.get('validatedBody') as { email: string };

    // Get user by email
    const user = await userRepo.findByEmail(email);
    
    // Always return success (don't reveal if email exists - security best practice)
    if (!user) {
      return c.json({
        data: {
          message: 'If an account exists with this email, a password reset link will be sent.'
        }
      });
    }

    // Generate reset token
    const resetToken = crypto.randomUUID();
    const expiresAt = Math.floor(Date.now() / 1000) + (60 * 60); // 1 hour

    // Store reset token
    await tokenRepo.storePasswordResetToken(
      resetToken,
      user.id,
      user.email,
      expiresAt
    );

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
    const userRepo = new UserRepository();
    const tokenRepo = new TokenRepository();
    const token = c.req.query('token');
    
    if (!token) {
      return c.json({
        error: {
          code: 'BAD_REQUEST',
          message: 'Token is required'
        }
      }, 400);
    }

    const resetData = await tokenRepo.getPasswordResetToken(token);
    
    if (!resetData) {
      return c.json({
        data: { valid: false, reason: 'invalid' }
      });
    }

    // Check if user has 2FA enabled
    const user = await userRepo.findById(resetData.userId);
    
    return c.json({
      data: { 
        valid: true,
        requires2FA: user?.twoFactorEnabled || false
      }
    });
  } catch (error) {
    return c.json({
      data: { valid: false, reason: 'error' }
    });
  }
});

// Reset password with token
auth.post('/reset-password', bodySizeLimits.strict, validateBody(PasswordResetSchema.extend({ twoFactorCode: z.string().optional() })), async (c: Context) => {
  try {
    const userRepo = new UserRepository();
    const tokenRepo = new TokenRepository();
    const { token, password, twoFactorCode } = c.get('validatedBody') as { token: string; password: string; twoFactorCode?: string };

    // Get reset token data
    const resetData = await tokenRepo.getPasswordResetToken(token);

    if (!resetData) {
      return c.json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired reset token'
        }
      }, 400);
    }

    const { userId } = resetData;

    // Get user
    const user = await userRepo.findById(userId);
    if (!user) {
      return c.json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      }, 404);
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!twoFactorCode) {
        return c.json({
          error: {
            code: '2FA_REQUIRED',
            message: 'Two-factor authentication code required'
          }
        }, 403);
      }

      // Verify 2FA code (TOTP or backup code)
      const { verifyTOTP } = await import('../lib/totp.ts');
      let isValid = false;

      // Try TOTP first (6 digits)
      if (twoFactorCode.length === 6) {
        isValid = await verifyTOTP(twoFactorCode, user.twoFactorSecret);
      }
      
      // Try backup codes (8 characters)
      if (!isValid && twoFactorCode.length === 8 && user.twoFactorBackupCodes) {
        const bcrypt = await import('bcrypt');
        
        for (let i = 0; i < user.twoFactorBackupCodes.length; i++) {
          const hashedCode = user.twoFactorBackupCodes[i];
          isValid = await bcrypt.compare(twoFactorCode, hashedCode);
          
          if (isValid) {
            // Remove used backup code
            user.twoFactorBackupCodes.splice(i, 1);
            break;
          }
        }
      }

      if (!isValid) {
        return c.json({
          error: {
            code: 'INVALID_2FA_CODE',
            message: 'Invalid two-factor authentication code'
          }
        }, 401);
      }
    }

    // Update user with new password (hash handled by repository)
    await userRepo.updatePassword(userId, password);

    // Delete reset token (single-use)
    await tokenRepo.deletePasswordResetToken(token);

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

/**
 * GET /api/auth/me
 * Get current user information
 * Requires valid JWT token
 */
auth.get('/me', cacheStrategies.userProfile(), async (c: Context) => {
  const userRepo = new UserRepository();
  
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
    
    // Check if token is blacklisted
    if (await isTokenBlacklisted(token)) {
      return c.json({
        error: {
          code: 'TOKEN_REVOKED',
          message: 'Token has been revoked'
        }
      }, 401);
    }

    const payload = await verifyToken(token);

    // Get user from database
    const user = await userRepo.findById(payload.sub as string);
    
    if (!user) {
      return c.json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      }, 404);
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return c.json({
      data: {
        user: userWithoutPassword
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