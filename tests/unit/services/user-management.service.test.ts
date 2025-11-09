/// <reference lib="deno.unstable" />

/**
 * UserManagementService Tests
 *
 * Tests business logic for admin user management operations including:
 * - User listing and filtering
 * - User details retrieval
 * - User deletion with self-protection
 * - Role updates with self-demotion prevention
 * - Email verification
 * - Session revocation
 *
 * Focus: Admin authorization rules and business logic
 */

import { assertEquals, assertExists, assertRejects } from '@std/assert';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';
import { AppError, AuthorizationError, NotFoundError } from '../../../frontend/lib/errors.ts';
import { hashPassword } from '../../../shared/lib/password.ts';
import { TokenRepository, UserRepository } from '../../../shared/repositories/index.ts';
import { UserManagementService } from '../../../shared/services/UserManagementService.ts';
import { setupTestKv } from '../../helpers/kv-test.ts';

describe('UserManagementService', () => {
  let kv: Deno.Kv;
  let cleanup: () => Promise<void>;
  let service: UserManagementService;
  let userRepo: UserRepository;
  let tokenRepo: TokenRepository;

  beforeEach(async () => {
    const setup = await setupTestKv();
    kv = setup.kv;
    cleanup = setup.cleanup;
    userRepo = new UserRepository({ kv });
    tokenRepo = new TokenRepository({ kv });
    service = new UserManagementService(userRepo, tokenRepo);
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('business logic: list users with filtering', () => {
    it('should list all users', async () => {
      // Arrange: Create multiple users
      await userRepo.create({
        email: 'user1@example.com',
        password: await hashPassword('password123'),
        name: 'User 1',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      await userRepo.create({
        email: 'admin1@example.com',
        password: await hashPassword('password123'),
        name: 'Admin 1',
        role: 'admin',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      // Act
      const result = await service.listUsers();

      // Assert: Business logic - all users returned, sanitized
      assertEquals(result.users.length, 2);
      assertEquals(result.pagination.total, 2);
      
      // Verify sanitization (no password field)
      const user = result.users[0];
      assertExists(user);
      assertExists(user.id);
      assertExists(user.email);
      assertEquals('password' in user, false);
    });

    it('should filter users by role', async () => {
      // Arrange: Create users with different roles
      await userRepo.create({
        email: 'user1@example.com',
        password: await hashPassword('password123'),
        name: 'User 1',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      await userRepo.create({
        email: 'admin1@example.com',
        password: await hashPassword('password123'),
        name: 'Admin 1',
        role: 'admin',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      // Act: Filter for admins only
      const result = await service.listUsers({ role: 'admin' });

      // Assert: Business logic - only admins returned
      assertEquals(result.users.length, 1);
      assertEquals(result.users[0]?.role, 'admin');
      assertEquals(result.users[0]?.email, 'admin1@example.com');
    });

    it('should respect limit option', async () => {
      // Arrange: Create users
      for (let i = 0; i < 5; i++) {
        await userRepo.create({
          email: `user${i}@example.com`,
          password: await hashPassword('password123'),
          name: `User ${i}`,
          role: 'user',
          emailVerified: true,
          emailVerifiedAt: new Date().toISOString(),
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorBackupCodes: [],
        });
      }

      // Act
      const result = await service.listUsers({ limit: 3 });

      // Assert: Business logic - limit respected
      assertEquals(result.users.length, 3);
    });
  });

  describe('business logic: get detailed user information', () => {
    it('should return user details with active session count', async () => {
      // Arrange: Create user and some refresh tokens
      const user = await userRepo.create({
        email: 'details@example.com',
        password: await hashPassword('password123'),
        name: 'Details User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      // Create some refresh tokens (simulating active sessions)
      const expiresAt = Math.floor(Date.now() / 1000) + 86400;
      await tokenRepo.storeRefreshToken(user.id, 'token1', expiresAt);
      await tokenRepo.storeRefreshToken(user.id, 'token2', expiresAt);

      // Act
      const details = await service.getUserDetails(user.id);

      // Assert: Business logic - includes session count
      assertEquals(details.id, user.id);
      assertEquals(details.email, 'details@example.com');
      assertEquals(details.activeSessions, 2);
      
      // Verify 2FA secret is masked
      assertEquals(details.twoFactorSecret, null);
    });

    it('should mask 2FA secret in user details', async () => {
      // Arrange: Create user with 2FA enabled
      const user = await userRepo.create({
        email: '2fa@example.com',
        password: await hashPassword('password123'),
        name: '2FA User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: true,
        twoFactorSecret: 'JBSWY3DPEHPK3PXP',
        twoFactorBackupCodes: ['code1', 'code2'],
      });

      // Act
      const details = await service.getUserDetails(user.id);

      // Assert: Business logic - secret is masked, not exposed
      assertEquals(details.twoFactorSecret, '***MASKED***');
    });

    it('should throw NotFoundError for non-existent user', async () => {
      // Act & Assert
      await assertRejects(
        () => service.getUserDetails('non-existent-id'),
        NotFoundError,
        'Resource not found',
      );
    });
  });

  describe('business rule: prevent admin self-deletion', () => {
    it('should allow admin to delete other users', async () => {
      // Arrange: Create admin and target user
      const admin = await userRepo.create({
        email: 'admin@example.com',
        password: await hashPassword('password123'),
        name: 'Admin User',
        role: 'admin',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      const targetUser = await userRepo.create({
        email: 'target@example.com',
        password: await hashPassword('password123'),
        name: 'Target User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      // Act
      await service.deleteUser(targetUser.id, admin.id);

      // Assert: Business logic - user should be deleted
      const deletedUser = await userRepo.findById(targetUser.id);
      assertEquals(deletedUser, null);
    });

    it('should prevent admin from deleting themselves', async () => {
      // Arrange: Create admin
      const admin = await userRepo.create({
        email: 'admin@example.com',
        password: await hashPassword('password123'),
        name: 'Admin User',
        role: 'admin',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      // Act & Assert: Business rule - cannot delete yourself
      await assertRejects(
        () => service.deleteUser(admin.id, admin.id),
        AuthorizationError,
        'Cannot delete your own account',
      );

      // Verify admin still exists
      const stillExists = await userRepo.findById(admin.id);
      assertExists(stillExists);
    });

    it('should throw NotFoundError when deleting non-existent user', async () => {
      // Act & Assert
      await assertRejects(
        () => service.deleteUser('non-existent-id', 'admin-id'),
        NotFoundError,
      );
    });
  });

  describe('business rule: prevent admin self-demotion', () => {
    it('should allow admin to update other user roles', async () => {
      // Arrange: Create admin and regular user
      const admin = await userRepo.create({
        email: 'admin@example.com',
        password: await hashPassword('password123'),
        name: 'Admin User',
        role: 'admin',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      const user = await userRepo.create({
        email: 'user@example.com',
        password: await hashPassword('password123'),
        name: 'Regular User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      // Act: Promote user to admin
      await service.updateUserRole(user.id, 'admin', admin.id);

      // Assert: Business logic - role updated
      const updatedUser = await userRepo.findById(user.id);
      assertExists(updatedUser);
      assertEquals(updatedUser.role, 'admin');
    });

    it('should prevent admin from demoting themselves', async () => {
      // Arrange: Create admin
      const admin = await userRepo.create({
        email: 'admin@example.com',
        password: await hashPassword('password123'),
        name: 'Admin User',
        role: 'admin',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      // Act & Assert: Business rule - cannot demote yourself
      await assertRejects(
        () => service.updateUserRole(admin.id, 'user', admin.id),
        AuthorizationError,
        'Cannot demote yourself from admin',
      );

      // Verify admin role unchanged
      const stillAdmin = await userRepo.findById(admin.id);
      assertExists(stillAdmin);
      assertEquals(stillAdmin.role, 'admin');
    });

    it('should allow admin to promote themselves (no restriction)', async () => {
      // Arrange: Create admin
      const admin = await userRepo.create({
        email: 'admin@example.com',
        password: await hashPassword('password123'),
        name: 'Admin User',
        role: 'admin',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      // Act: Try to set role to admin again (no-op but allowed)
      await service.updateUserRole(admin.id, 'admin', admin.id);

      // Assert: No error thrown
      const stillAdmin = await userRepo.findById(admin.id);
      assertExists(stillAdmin);
      assertEquals(stillAdmin.role, 'admin');
    });

    it('should throw NotFoundError when updating role of non-existent user', async () => {
      // Act & Assert
      await assertRejects(
        () => service.updateUserRole('non-existent-id', 'admin', 'admin-id'),
        NotFoundError,
      );
    });
  });

  describe('business logic: admin email verification', () => {
    it('should verify unverified user email', async () => {
      // Arrange: Create unverified user
      const user = await userRepo.create({
        email: 'unverified@example.com',
        password: await hashPassword('password123'),
        name: 'Unverified User',
        role: 'user',
        emailVerified: false,
        emailVerifiedAt: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      // Act
      await service.verifyUserEmail(user.id);

      // Assert: Business logic - email should be verified
      const verifiedUser = await userRepo.findById(user.id);
      assertExists(verifiedUser);
      assertEquals(verifiedUser.emailVerified, true);
    });

    it('should reject verification of already verified email', async () => {
      // Arrange: Create verified user
      const user = await userRepo.create({
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

      // Act & Assert: Business rule - cannot verify already verified email
      await assertRejects(
        () => service.verifyUserEmail(user.id),
        AppError,
        'already verified',
      );
    });

    it('should throw NotFoundError for non-existent user', async () => {
      // Act & Assert
      await assertRejects(
        () => service.verifyUserEmail('non-existent-id'),
        NotFoundError,
      );
    });
  });

  describe('business logic: revoke all user sessions', () => {
    it('should revoke all refresh tokens for user', async () => {
      // Arrange: Create user with multiple sessions
      const user = await userRepo.create({
        email: 'sessions@example.com',
        password: await hashPassword('password123'),
        name: 'Sessions User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      const expiresAt = Math.floor(Date.now() / 1000) + 86400;
      await tokenRepo.storeRefreshToken(user.id, 'token1', expiresAt);
      await tokenRepo.storeRefreshToken(user.id, 'token2', expiresAt);
      await tokenRepo.storeRefreshToken(user.id, 'token3', expiresAt);

      // Verify tokens exist
      const beforeTokens = await tokenRepo.listUserRefreshTokens(user.id);
      assertEquals(beforeTokens.length, 3);

      // Act
      await service.revokeAllUserSessions(user.id);

      // Assert: Business logic - all tokens should be revoked
      const afterTokens = await tokenRepo.listUserRefreshTokens(user.id);
      assertEquals(afterTokens.length, 0);
    });

    it('should not throw error for user with no sessions', async () => {
      // Arrange: Create user with no tokens
      const user = await userRepo.create({
        email: 'nosessions@example.com',
        password: await hashPassword('password123'),
        name: 'No Sessions User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      // Act: Should not throw
      await service.revokeAllUserSessions(user.id);

      // Assert: No error
      const tokens = await tokenRepo.listUserRefreshTokens(user.id);
      assertEquals(tokens.length, 0);
    });

    it('should allow revoking tokens even for deleted users', async () => {
      // Arrange: Create user with tokens, then delete user
      const user = await userRepo.create({
        email: 'deleted@example.com',
        password: await hashPassword('password123'),
        name: 'Deleted User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      const expiresAt = Math.floor(Date.now() / 1000) + 86400;
      await tokenRepo.storeRefreshToken(user.id, 'token1', expiresAt);

      // Delete user
      await userRepo.deleteUser(user.id);

      // Act: Should not throw (allows cleanup of orphaned tokens)
      await service.revokeAllUserSessions(user.id);

      // Assert: Tokens revoked
      const tokens = await tokenRepo.listUserRefreshTokens(user.id);
      assertEquals(tokens.length, 0);
    });
  });

  describe('business logic: user statistics', () => {
    it('should calculate correct user statistics', async () => {
      // Arrange: Create diverse set of users
      await userRepo.create({
        email: 'user1@example.com',
        password: await hashPassword('password123'),
        name: 'User 1',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      await userRepo.create({
        email: 'user2@example.com',
        password: await hashPassword('password123'),
        name: 'User 2',
        role: 'user',
        emailVerified: false,
        emailVerifiedAt: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      await userRepo.create({
        email: 'admin@example.com',
        password: await hashPassword('password123'),
        name: 'Admin',
        role: 'admin',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: true,
        twoFactorSecret: 'secret',
        twoFactorBackupCodes: ['code1'],
      });

      // Act
      const stats = await service.getUserStats();

      // Assert: Business logic - correct statistics
      assertEquals(stats.total, 3);
      assertEquals(stats.users, 2);
      assertEquals(stats.admins, 1);
      assertEquals(stats.verified, 2);
      assertEquals(stats.twoFactorEnabled, 1);
    });

    it('should return zero stats when no users exist', async () => {
      // Act
      const stats = await service.getUserStats();

      // Assert
      assertEquals(stats.total, 0);
      assertEquals(stats.users, 0);
      assertEquals(stats.admins, 0);
      assertEquals(stats.verified, 0);
      assertEquals(stats.twoFactorEnabled, 0);
    });
  });
});
