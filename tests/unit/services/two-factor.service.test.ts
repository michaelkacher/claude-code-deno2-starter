/// <reference lib="deno.unstable" />

/**
 * TwoFactorService Tests
 *
 * Tests business logic for two-factor authentication operations including:
 * - 2FA setup (secret generation, QR code)
 * - 2FA enable (TOTP verification, backup codes)
 * - 2FA disable (password + code verification)
 * - 2FA verify (TOTP and backup code validation)
 * - Backup code regeneration
 * - 2FA status checking
 *
 * Focus: Security-critical business logic, not HTTP/framework
 */

import { assert, assertEquals, assertExists, assertRejects } from '@std/assert';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';
import { AppError, AuthenticationError, NotFoundError } from '../../../frontend/lib/errors.ts';
import { hashPassword } from '../../../shared/lib/password.ts';
import { generateSecret, generateTOTP } from '../../../shared/lib/totp.ts';
import { UserRepository } from '../../../shared/repositories/index.ts';
import { TokenRepository } from '../../../shared/repositories/token-repository.ts';
import { AuthService } from '../../../shared/services/auth.service.ts';
import { TwoFactorService } from '../../../shared/services/TwoFactorService.ts';
import { setupTestKv } from '../../helpers/kv-test.ts';

describe('TwoFactorService', () => {
  let kv: Deno.Kv;
  let cleanup: () => Promise<void>;
  let service: TwoFactorService;
  let userRepo: UserRepository;

  beforeEach(async () => {
    const setup = await setupTestKv();
    kv = setup.kv;
    cleanup = setup.cleanup;
    userRepo = new UserRepository({ kv });
    const tokenRepo = new TokenRepository({ kv });
    const authService = new AuthService(userRepo, tokenRepo);
    service = new TwoFactorService(userRepo, authService);
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('business logic: 2FA setup generates secret and QR code', () => {
    it('should generate new secret and QR code for user', async () => {
      // Arrange: Create user without 2FA
      const user = await userRepo.create({
        email: 'setup@example.com',
        password: await hashPassword('password123'),
        name: 'Setup User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      // Act
      const result = await service.setup(user.id, 'Test App');

      // Assert: Business logic - secret and QR code generated
      assertExists(result.secret);
      assertExists(result.qrCodeURL);
      
      // Verify secret format (base32) - assert true directly
      assert(result.secret.length > 0, `Expected secret length > 0, got ${result.secret.length}`);
      
      // Verify QR code is Google Charts URL
      assert(result.qrCodeURL.startsWith('https://chart.googleapis.com'), `Expected QR code to start with Google Charts URL, got ${result.qrCodeURL.substring(0, 40)}`);

      // Verify secret stored but 2FA not enabled yet
      const updatedUser = await userRepo.findById(user.id);
      assertExists(updatedUser);
      assertEquals(updatedUser.twoFactorSecret, result.secret);
      assertEquals(updatedUser.twoFactorEnabled, false);
    });

    it('should reject setup if 2FA already enabled', async () => {
      // Arrange: Create user with 2FA already enabled
      const user = await userRepo.create({
        email: 'enabled@example.com',
        password: await hashPassword('password123'),
        name: 'Enabled User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: true,
        twoFactorSecret: 'JBSWY3DPEHPK3PXP',
        twoFactorBackupCodes: ['code1'],
      });

      // Act & Assert: Business rule - cannot setup when already enabled
      await assertRejects(
        () => service.setup(user.id),
        AppError,
        'Two-factor authentication is already enabled',
      );
    });

    it('should throw NotFoundError for non-existent user', async () => {
      // Act & Assert
      await assertRejects(
        () => service.setup('non-existent-id'),
        NotFoundError,
        'Resource not found',
      );
    });
  });

  describe('business logic: 2FA enable requires TOTP verification', () => {
    it('should enable 2FA and generate backup codes with valid TOTP', async () => {
      // Arrange: Create user and setup 2FA
      const user = await userRepo.create({
        email: 'enable@example.com',
        password: await hashPassword('password123'),
        name: 'Enable User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      const setupResult = await service.setup(user.id);
      
      // Generate valid TOTP code
      const validCode = await generateValidTOTP(setupResult.secret);

      // Act
      const result = await service.enable(user.id, validCode);

      // Assert: Business logic - 2FA enabled, backup codes generated
      assertExists(result.backupCodes);
      assertEquals(result.backupCodes.length, 10);
      
      // Verify all backup codes are 8 characters
      for (const code of result.backupCodes) {
        assertEquals(code.length, 8);
      }

      // Verify 2FA is enabled in database
      const enabledUser = await userRepo.findById(user.id);
      assertExists(enabledUser);
      assertEquals(enabledUser.twoFactorEnabled, true);
      assertEquals(enabledUser.twoFactorBackupCodes?.length, 10);
    });

    it('should reject enable with invalid TOTP code', async () => {
      // Arrange: Create user and setup 2FA
      const user = await userRepo.create({
        email: 'invalid@example.com',
        password: await hashPassword('password123'),
        name: 'Invalid User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      await service.setup(user.id);

      // Act & Assert: Business rule - invalid code rejected
      await assertRejects(
        () => service.enable(user.id, '000000'),
        AuthenticationError,
        'Invalid two-factor authentication code',
      );

      // Verify 2FA not enabled
      const stillDisabled = await userRepo.findById(user.id);
      assertExists(stillDisabled);
      assertEquals(stillDisabled.twoFactorEnabled, false);
    });

    it('should reject enable if 2FA already enabled', async () => {
      // Arrange: Create user with 2FA enabled
      const user = await userRepo.create({
        email: 'already@example.com',
        password: await hashPassword('password123'),
        name: 'Already User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: true,
        twoFactorSecret: 'JBSWY3DPEHPK3PXP',
        twoFactorBackupCodes: ['code1'],
      });

      // Act & Assert
      await assertRejects(
        () => service.enable(user.id, '123456'),
        AppError,
        'Two-factor authentication is already enabled',
      );
    });

    it('should reject enable if setup not called first', async () => {
      // Arrange: Create user without calling setup
      const user = await userRepo.create({
        email: 'nosetup@example.com',
        password: await hashPassword('password123'),
        name: 'No Setup User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      // Act & Assert: Business rule - must setup first
      await assertRejects(
        () => service.enable(user.id, '123456'),
        AppError,
        'not setup',
      );
    });
  });

  describe('business logic: 2FA disable requires password and code', () => {
    it('should disable 2FA with valid password and TOTP', async () => {
      // Arrange: Create user with 2FA enabled
      const password = 'password123';
      const secret = generateSecret();
      const user = await userRepo.create({
        email: 'disable@example.com',
        password: await hashPassword(password),
        name: 'Disable User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorBackupCodes: ['backup1', 'backup2'],
      });

      const validCode = await generateValidTOTP(secret);

      // Act
      await service.disable(user.id, password, validCode);

      // Assert: Business logic - 2FA disabled, secret and backup codes cleared
      const disabledUser = await userRepo.findById(user.id);
      assertExists(disabledUser);
      assertEquals(disabledUser.twoFactorEnabled, false);
      assertEquals(disabledUser.twoFactorSecret, null);
      assertEquals(disabledUser.twoFactorBackupCodes?.length, 0);
    });

    it('should reject disable with incorrect password', async () => {
      // Arrange: Create user with 2FA enabled
      const secret = generateSecret();
      const user = await userRepo.create({
        email: 'wrongpw@example.com',
        password: await hashPassword('correctPassword'),
        name: 'Wrong PW User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorBackupCodes: ['backup1'],
      });

      const validCode = await generateValidTOTP(secret);

      // Act & Assert: Business rule - password must be valid
      await assertRejects(
        () => service.disable(user.id, 'wrongPassword', validCode),
        AuthenticationError,
        'Invalid password',
      );

      // Verify 2FA still enabled
      const stillEnabled = await userRepo.findById(user.id);
      assertExists(stillEnabled);
      assertEquals(stillEnabled.twoFactorEnabled, true);
    });

    it('should reject disable with invalid TOTP code', async () => {
      // Arrange: Create user with 2FA enabled
      const password = 'password123';
      const secret = generateSecret();
      const user = await userRepo.create({
        email: 'invalidcode@example.com',
        password: await hashPassword(password),
        name: 'Invalid Code User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorBackupCodes: ['backup1'],
      });

      // Act & Assert: Business rule - TOTP code must be valid
      await assertRejects(
        () => service.disable(user.id, password, '000000'),
        AuthenticationError,
        'Invalid two-factor authentication code',
      );

      // Verify 2FA still enabled
      const stillEnabled = await userRepo.findById(user.id);
      assertExists(stillEnabled);
      assertEquals(stillEnabled.twoFactorEnabled, true);
    });

    it('should reject disable if 2FA not enabled', async () => {
      // Arrange: Create user without 2FA
      const password = 'password123';
      const user = await userRepo.create({
        email: 'notenabled@example.com',
        password: await hashPassword(password),
        name: 'Not Enabled User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      // Act & Assert
      await assertRejects(
        () => service.disable(user.id, password, '123456'),
        AppError,
        'Two-factor authentication is not enabled',
      );
    });
  });

  describe('business logic: verify TOTP and backup codes', () => {
    it('should verify valid TOTP code', async () => {
      // Arrange: Create user with 2FA enabled
      const secret = generateSecret();
      const user = await userRepo.create({
        email: 'verify@example.com',
        password: await hashPassword('password123'),
        name: 'Verify User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorBackupCodes: ['backup1', 'backup2'],
      });

      const validCode = await generateValidTOTP(secret);

      // Act
      const result = await service.verify(user.id, validCode);

      // Assert: Business logic - TOTP verified
      assertEquals(result.isValid, true);
      assertEquals(result.remainingBackupCodes, undefined); // TOTP doesn't consume backup codes
    });

    it('should verify valid backup code and remove it', async () => {
      // Arrange: Create user with 2FA and backup codes
      const secret = generateSecret();
      const backupCodes = ['backup01', 'backup02', 'backup03']; // 8-character codes
      const user = await userRepo.create({
        email: 'backup@example.com',
        password: await hashPassword('password123'),
        name: 'Backup User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorBackupCodes: backupCodes,
      });

      // Act: Use backup code
      const result = await service.verify(user.id, 'backup02');

      // Assert: Business logic - backup code verified and removed
      assert(result.isValid === true, `Expected isValid to be true, got ${result.isValid}`);
      assertEquals(result.remainingBackupCodes, 2);

      // Verify backup code was removed from database
      const updatedUser = await userRepo.findById(user.id);
      assertExists(updatedUser);
      assertEquals(updatedUser.twoFactorBackupCodes?.length, 2);
      assertEquals(updatedUser.twoFactorBackupCodes?.includes('backup02'), false);
      assertEquals(updatedUser.twoFactorBackupCodes?.includes('backup01'), true);
      assertEquals(updatedUser.twoFactorBackupCodes?.includes('backup03'), true);
    });

    it('should reject invalid TOTP code', async () => {
      // Arrange: Create user with 2FA
      const secret = generateSecret();
      const user = await userRepo.create({
        email: 'invalid@example.com',
        password: await hashPassword('password123'),
        name: 'Invalid User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorBackupCodes: [],
      });

      // Act
      const result = await service.verify(user.id, '000000');

      // Assert: Business logic - invalid code
      assertEquals(result.isValid, false);
    });

    it('should reject invalid backup code', async () => {
      // Arrange: Create user with 2FA
      const secret = generateSecret();
      const user = await userRepo.create({
        email: 'wrongbackup@example.com',
        password: await hashPassword('password123'),
        name: 'Wrong Backup User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorBackupCodes: ['backup1'],
      });

      // Act
      const result = await service.verify(user.id, 'wrongcode');

      // Assert: Business logic - invalid backup code
      assertEquals(result.isValid, false);
    });

    it('should reject verification if 2FA not enabled', async () => {
      // Arrange: Create user without 2FA
      const user = await userRepo.create({
        email: 'notenabled@example.com',
        password: await hashPassword('password123'),
        name: 'Not Enabled User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      // Act & Assert
      await assertRejects(
        () => service.verify(user.id, '123456'),
        AppError,
        'Two-factor authentication is not enabled',
      );
    });
  });

  describe('business logic: regenerate backup codes', () => {
    it('should regenerate backup codes with valid password and TOTP', async () => {
      // Arrange: Create user with 2FA
      const password = 'password123';
      const secret = generateSecret();
      const user = await userRepo.create({
        email: 'regen@example.com',
        password: await hashPassword(password),
        name: 'Regen User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorBackupCodes: ['old1', 'old2'],
      });

      const validCode = await generateValidTOTP(secret);

      // Act
      const result = await service.regenerateBackupCodes(user.id, password, validCode);

      // Assert: Business logic - new backup codes generated
      assertExists(result.backupCodes);
      assertEquals(result.backupCodes.length, 10);
      
      // Verify old codes replaced
      assertEquals(result.backupCodes.includes('old1'), false);
      assertEquals(result.backupCodes.includes('old2'), false);

      // Verify in database
      const updatedUser = await userRepo.findById(user.id);
      assertExists(updatedUser);
      assertEquals(updatedUser.twoFactorBackupCodes?.length, 10);
    });

    it('should reject regeneration with invalid password', async () => {
      // Arrange: Create user with 2FA
      const secret = generateSecret();
      const user = await userRepo.create({
        email: 'wrongpw@example.com',
        password: await hashPassword('correctPassword'),
        name: 'Wrong PW User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorBackupCodes: ['code1'],
      });

      const validCode = await generateValidTOTP(secret);

      // Act & Assert
      await assertRejects(
        () => service.regenerateBackupCodes(user.id, 'wrongPassword', validCode),
        AuthenticationError,
        'Invalid password',
      );
    });

    it('should reject regeneration with invalid TOTP code', async () => {
      // Arrange: Create user with 2FA
      const password = 'password123';
      const secret = generateSecret();
      const user = await userRepo.create({
        email: 'invalidcode@example.com',
        password: await hashPassword(password),
        name: 'Invalid Code User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorBackupCodes: ['code1'],
      });

      // Act & Assert
      await assertRejects(
        () => service.regenerateBackupCodes(user.id, password, '000000'),
        AuthenticationError,
        'Invalid two-factor authentication code',
      );
    });

    it('should not accept backup code for regeneration (TOTP only)', async () => {
      // Arrange: Create user with 2FA
      const password = 'password123';
      const secret = generateSecret();
      const user = await userRepo.create({
        email: 'backuponly@example.com',
        password: await hashPassword(password),
        name: 'Backup Only User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorBackupCodes: ['backup99'],
      });

      // Act & Assert: Business rule - backup codes cannot be used for regeneration
      await assertRejects(
        () => service.regenerateBackupCodes(user.id, password, 'backup99'),
        AuthenticationError,
        'Invalid two-factor authentication code',
      );
    });
  });

  describe('business logic: get 2FA status', () => {
    it('should return status for user with 2FA enabled', async () => {
      // Arrange: Create user with 2FA
      const user = await userRepo.create({
        email: 'status@example.com',
        password: await hashPassword('password123'),
        name: 'Status User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: true,
        twoFactorSecret: 'JBSWY3DPEHPK3PXP',
        twoFactorBackupCodes: ['code1', 'code2', 'code3'],
      });

      // Act
      const status = await service.getStatus(user.id);

      // Assert: Business logic - correct status
      assertEquals(status.enabled, true);
      assertEquals(status.hasBackupCodes, true);
      assertEquals(status.backupCodesCount, 3);
    });

    it('should return status for user without 2FA', async () => {
      // Arrange: Create user without 2FA
      const user = await userRepo.create({
        email: 'nostatus@example.com',
        password: await hashPassword('password123'),
        name: 'No Status User',
        role: 'user',
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      // Act
      const status = await service.getStatus(user.id);

      // Assert
      assertEquals(status.enabled, false);
      assertEquals(status.hasBackupCodes, false);
      assertEquals(status.backupCodesCount, 0);
    });

    it('should throw NotFoundError for non-existent user', async () => {
      // Act & Assert
      await assertRejects(
        () => service.getStatus('non-existent-id'),
        NotFoundError,
      );
    });
  });
});

/**
 * Helper function to generate a valid TOTP code for testing
 * Uses the actual TOTP library for accurate code generation
 */
async function generateValidTOTP(secret: string): Promise<string> {
  return await generateTOTP(secret);
}
