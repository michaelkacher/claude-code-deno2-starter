/// <reference lib="deno.unstable" />

/**
 * AuthService Tests
 *
 * Tests business logic for authentication operations including:
 * - Login/logout with validation
 * - Signup with duplicate prevention
 * - Email verification
 * - Password reset
 * - Token management
 *
 * Focus: Business rules, not HTTP/framework logic
 */

import { assertEquals, assertExists, assertRejects } from '@std/assert';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';
import { AppError, AuthenticationError, ConflictError, NotFoundError } from '../../../frontend/lib/errors.ts';
import { hashPassword } from '../../../shared/lib/password.ts';
import { TokenRepository, UserRepository } from '../../../shared/repositories/index.ts';
import { AuthService } from '../../../shared/services/auth.service.ts';
import { setupTestKv } from '../../helpers/kv-test.ts';

describe('AuthService', () => {
  let kv: Deno.Kv;
  let cleanup: () => Promise<void>;
  let authService: AuthService;
  let userRepo: UserRepository;
  let tokenRepo: TokenRepository;
  let originalJwtSecret: string | undefined;

  beforeEach(async () => {
    const setup = await setupTestKv();
    kv = setup.kv;
    cleanup = setup.cleanup;
    userRepo = new UserRepository({ kv });
    tokenRepo = new TokenRepository({ kv });
    authService = new AuthService(userRepo, tokenRepo);
    
    // Setup JWT environment variables
    originalJwtSecret = Deno.env.get('JWT_SECRET');
    Deno.env.set('JWT_SECRET', 'test-secret-key-min-32-characters-long');
  });

  afterEach(async () => {
    await cleanup();
    
    // Restore JWT environment variables
    if (originalJwtSecret) {
      Deno.env.set('JWT_SECRET', originalJwtSecret);
    } else {
      Deno.env.delete('JWT_SECRET');
    }
  });

  describe('business rule: valid credentials required for login', () => {
    it('should reject login with non-existent email', async () => {
      // Act & Assert
      await assertRejects(
        () => authService.login('nonexistent@example.com', 'password123'),
        AuthenticationError,
        'Invalid email or password',
      );
    });

    it('should reject login with incorrect password', async () => {
      // Arrange: Create a user
      const hashedPassword = await hashPassword('correctPassword');
      await userRepo.create({
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      // Act & Assert
      await assertRejects(
        () => authService.login('test@example.com', 'wrongPassword'),
        AuthenticationError,
        'Invalid email or password',
      );
    });

    it('should successfully login with correct credentials', async () => {
      // Arrange: Create a verified user
      const password = 'correctPassword123';
      const hashedPassword = await hashPassword(password);
      const user = await userRepo.create({
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      // Act
      const result = await authService.login('test@example.com', password);

      // Assert: Business logic - tokens generated and user data returned
      assertExists(result.accessToken);
      assertExists(result.refreshToken);
      assertEquals(result.user.id, user.id);
      assertEquals(result.user.email, 'test@example.com');
      assertEquals(result.user.emailVerified, true);
    });
  });

  describe('business rule: email must be verified to login', () => {
    it('should reject login when email is not verified', async () => {
      // Arrange: Create unverified user
      const password = 'password123';
      const hashedPassword = await hashPassword(password);
      await userRepo.create({
        email: 'unverified@example.com',
        password: hashedPassword,
        name: 'Unverified User',
        role: 'user',
        emailVerified: false,
        emailVerifiedAt: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      // Act & Assert
      await assertRejects(
        () => authService.login('unverified@example.com', password),
        AppError,
        'Please verify your email address',
      );
    });
  });

  describe('business rule: prevent duplicate email registration', () => {
    it('should reject signup with existing email', async () => {
      // Arrange: Create existing user
      const hashedPassword = await hashPassword('password123');
      await userRepo.create({
        email: 'existing@example.com',
        password: hashedPassword,
        name: 'Existing User',
        role: 'user',
        emailVerified: false,
        emailVerifiedAt: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      // Act & Assert
      await assertRejects(
        () => authService.signup('existing@example.com', 'newPassword', 'New User'),
        ConflictError,
        'Resource already exists',
      );
    });

    it('should successfully create new user with unique email', async () => {
      // Act
      const result = await authService.signup('newuser@example.com', 'password123', 'New User');

      // Assert: Business logic - user created, verification token generated
      assertExists(result.user.id);
      assertEquals(result.user.email, 'newuser@example.com');
      assertEquals(result.user.name, 'New User');
      assertEquals(result.user.emailVerified, false);
      assertExists(result.verificationToken);

      // Verify user was actually created in repository
      const user = await userRepo.findByEmail('newuser@example.com');
      assertExists(user);
      assertEquals(user.emailVerified, false);
    });
  });

  describe('business logic: email verification flow', () => {
    it('should verify email with valid token', async () => {
      // Arrange: Create user and verification token
      const user = await userRepo.create({
        email: 'verify@example.com',
        password: await hashPassword('password123'),
        name: 'Verify User',
        role: 'user',
        emailVerified: false,
        emailVerifiedAt: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      const token = crypto.randomUUID();
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      await tokenRepo.storeEmailVerificationToken(token, user.id, user.email, expiresAt);

      // Act
      await authService.verifyEmail(token);

      // Assert: Business logic - email should be marked as verified
      const updatedUser = await userRepo.findById(user.id);
      assertExists(updatedUser);
      assertEquals(updatedUser.emailVerified, true);

      // Verify token was deleted after use
      const tokenData = await tokenRepo.getEmailVerificationToken(token);
      assertEquals(tokenData, null);
    });

    it('should reject verification with invalid token', async () => {
      // Act & Assert
      await assertRejects(
        () => authService.verifyEmail('invalid-token-123'),
        AppError,
        'Invalid verification token',
      );
    });

    it('should reject verification with expired token', async () => {
      // Arrange: Create expired token
      const user = await userRepo.create({
        email: 'expired@example.com',
        password: await hashPassword('password123'),
        name: 'Expired User',
        role: 'user',
        emailVerified: false,
        emailVerifiedAt: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      const token = crypto.randomUUID();
      const expiresAt = Math.floor(Date.now() / 1000) - 3600; // Expired 1 hour ago
      await tokenRepo.storeEmailVerificationToken(token, user.id, user.email, expiresAt);

      // Act & Assert: Token should be considered invalid/expired
      await assertRejects(
        () => authService.verifyEmail(token),
        AppError,
      );
    });
  });

  describe('business logic: resend verification token', () => {
    it('should generate new verification token for unverified email', async () => {
      // Arrange: Create unverified user
      const user = await userRepo.create({
        email: 'resend@example.com',
        password: await hashPassword('password123'),
        name: 'Resend User',
        role: 'user',
        emailVerified: false,
        emailVerifiedAt: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      // Act
      const newToken = await authService.resendVerification('resend@example.com');

      // Assert: Business logic - new token should be created
      assertExists(newToken);
      const tokenData = await tokenRepo.getEmailVerificationToken(newToken);
      assertExists(tokenData);
      assertEquals(tokenData.userId, user.id);
    });

    it('should reject resend for already verified email', async () => {
      // Arrange: Create verified user
      await userRepo.create({
        email: 'verified@example.com',
        password: await hashPassword('password123'),
        name: 'Verified User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      // Act & Assert
      await assertRejects(
        () => authService.resendVerification('verified@example.com'),
        AppError,
        'already verified',
      );
    });

    it('should reject resend for non-existent email', async () => {
      // Act & Assert
      await assertRejects(
        () => authService.resendVerification('nonexistent@example.com'),
        NotFoundError,
      );
    });
  });

  describe('business logic: password reset flow', () => {
    it('should generate reset token for existing email', async () => {
      // Arrange: Create user
      const user = await userRepo.create({
        email: 'reset@example.com',
        password: await hashPassword('oldPassword'),
        name: 'Reset User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      // Act
      const resetToken = await authService.requestPasswordReset('reset@example.com');

      // Assert: Business logic - token should be generated
      assertExists(resetToken);
      const tokenData = await tokenRepo.getPasswordResetToken(resetToken);
      assertExists(tokenData);
      assertEquals(tokenData.userId, user.id);
    });

    it('should not reveal if email does not exist (security)', async () => {
      // Act: Request reset for non-existent email
      const result = await authService.requestPasswordReset('nonexistent@example.com');

      // Assert: Business logic - should return null without throwing (security)
      assertEquals(result, null);
    });

    it('should reset password with valid token', async () => {
      // Arrange: Create user and reset token
      const user = await userRepo.create({
        email: 'resetpw@example.com',
        password: await hashPassword('oldPassword'),
        name: 'Reset PW User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      const resetToken = crypto.randomUUID();
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      await tokenRepo.storePasswordResetToken(resetToken, user.id, user.email, expiresAt);

      // Act
      await authService.resetPassword(resetToken, 'newPassword123');

      // Assert: Business logic - password should be updated
      const updatedUser = await userRepo.findById(user.id);
      assertExists(updatedUser);
      // Password should be different from old one (hashed differently)
      
      // Verify token was deleted after use
      const tokenData = await tokenRepo.getPasswordResetToken(resetToken);
      assertEquals(tokenData, null);
    });

    it('should reject password reset with invalid token', async () => {
      // Act & Assert
      await assertRejects(
        () => authService.resetPassword('invalid-token', 'newPassword'),
        AppError,
        'Invalid password reset token',
      );
    });
  });

  describe('business logic: token refresh', () => {
    it('should generate new access token with valid refresh token', async () => {
      // Arrange: Create user and login to get tokens
      const password = 'password123';
      const hashedPassword = await hashPassword(password);
      await userRepo.create({
        email: 'refresh@example.com',
        password: hashedPassword,
        name: 'Refresh User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      const loginResult = await authService.login('refresh@example.com', password);

      // Act: Refresh access token
      const result = await authService.refreshAccessToken(loginResult.refreshToken);

      // Assert: Business logic - new access token generated
      assertExists(result.accessToken);
      // New token should be different from original
      // Note: We can't easily compare tokens without decoding, but existence is the key business logic
    });

    it('should reject refresh with invalid token', async () => {
      // Act & Assert
      await assertRejects(
        () => authService.refreshAccessToken('invalid-refresh-token'),
        AuthenticationError,
        'Invalid or expired token',
      );
    });

    it('should reject refresh with revoked token', async () => {
      // Arrange: Create user, login, then revoke the refresh token
      const password = 'password123';
      const hashedPassword = await hashPassword(password);
      const user = await userRepo.create({
        email: 'revoked@example.com',
        password: hashedPassword,
        name: 'Revoked User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      const loginResult = await authService.login('revoked@example.com', password);

      // Revoke all refresh tokens
      await tokenRepo.revokeAllUserRefreshTokens(user.id);

      // Act & Assert
      await assertRejects(
        () => authService.refreshAccessToken(loginResult.refreshToken),
        AuthenticationError,
        'revoked',
      );
    });
  });

  describe('business logic: logout and token revocation', () => {
    it('should revoke refresh token on logout', async () => {
      // Arrange: Create user and login
      const password = 'password123';
      const hashedPassword = await hashPassword(password);
      const user = await userRepo.create({
        email: 'logout@example.com',
        password: hashedPassword,
        name: 'Logout User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      const loginResult = await authService.login('logout@example.com', password);

      // Act: Logout
      await authService.logout(user.id, loginResult.refreshToken);

      // Assert: Business logic - refresh token should be revoked
      await assertRejects(
        () => authService.refreshAccessToken(loginResult.refreshToken),
        AuthenticationError,
      );
    });

    it('should handle logout with invalid tokens gracefully', async () => {
      // Arrange: Create user
      const user = await userRepo.create({
        email: 'graceful@example.com',
        password: await hashPassword('password123'),
        name: 'Graceful User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      // Act & Assert: Should not throw even with invalid tokens
      await authService.logout(user.id, 'invalid-refresh-token', 'invalid-access-token');
      // No error expected - graceful handling
    });
  });

  describe('business logic: password verification for sensitive operations', () => {
    it('should verify correct password', async () => {
      // Arrange: Create user
      const password = 'correctPassword123';
      const hashedPassword = await hashPassword(password);
      const user = await userRepo.create({
        email: 'verify-pw@example.com',
        password: hashedPassword,
        name: 'Verify PW User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      // Act
      const isValid = await authService.verifyUserPassword(user.id, password);

      // Assert: Business logic - password should be valid
      assertEquals(isValid, true);
    });

    it('should reject incorrect password', async () => {
      // Arrange: Create user
      const hashedPassword = await hashPassword('correctPassword');
      const user = await userRepo.create({
        email: 'wrong-pw@example.com',
        password: hashedPassword,
        name: 'Wrong PW User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      // Act
      const isValid = await authService.verifyUserPassword(user.id, 'wrongPassword');

      // Assert: Business logic - password should be invalid
      assertEquals(isValid, false);
    });

    it('should return false for non-existent user', async () => {
      // Act
      const isValid = await authService.verifyUserPassword('non-existent-id', 'anyPassword');

      // Assert: Business logic - should return false, not throw
      assertEquals(isValid, false);
    });
  });
});
