/**
 * Password Utility Tests
 * 
 * Tests password hashing and verification using PBKDF2.
 * Focus: Business logic around password security and error handling.
 * 
 * Note: Does not test PBKDF2 library internals (framework code).
 */

import { assertEquals, assertExists, assertNotEquals } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import {
    hashPassword,
    verifyPassword,
} from '../../shared/lib/password.ts';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      // Arrange
      const password = 'MySecurePassword123!';

      // Act
      const hash = await hashPassword(password);

      // Assert
      assertExists(hash);
      assertEquals(typeof hash, 'string');
      // PBKDF2 format: iterations$salt$hash
      const parts = hash.split('$');
      assertEquals(parts.length, 3);
      assertEquals(!isNaN(parseInt(parts[0])), true); // iterations is a number
    });

    it('should produce different hashes for same password (salt randomization)', async () => {
      // Arrange
      const password = 'SamePassword123';

      // Act
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // Assert
      assertExists(hash1);
      assertExists(hash2);
      assertNotEquals(hash1, hash2); // Different salts = different hashes
      
      // But both should verify the same password
      assertEquals(await verifyPassword(password, hash1), true);
      assertEquals(await verifyPassword(password, hash2), true);
    });

    it('should handle special characters in password', async () => {
      // Arrange
      const password = 'P@ssw0rd!#$%^&*()_+-={}[]|:;"<>?,./~`';

      // Act
      const hash = await hashPassword(password);

      // Assert
      assertExists(hash);
      const parts = hash.split('$');
      assertEquals(parts.length, 3);
      
      // Verify the special character password works
      assertEquals(await verifyPassword(password, hash), true);
    });

    it('should handle long passwords', async () => {
      // Arrange
      // PBKDF2 handles long passwords without truncation
      const password = 'A'.repeat(100);

      // Act
      const hash = await hashPassword(password);

      // Assert
      assertExists(hash);
      const parts = hash.split('$');
      assertEquals(parts.length, 3);
      assertEquals(await verifyPassword(password, hash), true);
    });

    it('should handle empty string password', async () => {
      // Arrange
      const password = '';

      // Act
      const hash = await hashPassword(password);

      // Assert
      assertExists(hash);
      assertEquals(hash.length, 60);
      assertEquals(await verifyPassword(password, hash), true);
    });

    it('should handle unicode characters', async () => {
      // Arrange
      const password = 'P@ssw0rd_🔐_密码_пароль';

      // Act
      const hash = await hashPassword(password);

      // Assert
      assertExists(hash);
      assertEquals(await verifyPassword(password, hash), true);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      // Arrange
      const password = 'CorrectPassword123!';
      const hash = await hashPassword(password);

      // Act
      const result = await verifyPassword(password, hash);

      // Assert
      assertEquals(result, true);
    });

    it('should reject incorrect password', async () => {
      // Arrange
      const correctPassword = 'CorrectPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hash = await hashPassword(correctPassword);

      // Act
      const result = await verifyPassword(wrongPassword, hash);

      // Assert
      assertEquals(result, false);
    });

    it('should reject password with different case', async () => {
      // Arrange
      const password = 'CaseSensitive123';
      const hash = await hashPassword(password);

      // Act
      const result = await verifyPassword('casesensitive123', hash);

      // Assert
      assertEquals(result, false); // Passwords are case-sensitive
    });

    it('should return false for invalid hash format', async () => {
      // Arrange
      const password = 'AnyPassword123';
      const invalidHash = 'not-a-valid-hash';

      // Act
      const result = await verifyPassword(password, invalidHash);

      // Assert
      assertEquals(result, false); // Should gracefully handle invalid hash
    });

    it('should return false for malformed hash', async () => {
      // Arrange
      const password = 'AnyPassword123';
      const malformedHash = '100000$invalid$hash';

      // Act
      const result = await verifyPassword(password, malformedHash);

      // Assert
      assertEquals(result, false); // Should handle malformed hashes
    });

    it('should return false for empty hash', async () => {
      // Arrange
      const password = 'AnyPassword123';
      const emptyHash = '';

      // Act
      const result = await verifyPassword(password, emptyHash);

      // Assert
      assertEquals(result, false);
    });

    it('should handle empty password verification', async () => {
      // Arrange
      const password = '';
      const hash = await hashPassword(password);

      // Act
      const correctResult = await verifyPassword('', hash);
      const wrongResult = await verifyPassword('not-empty', hash);

      // Assert
      assertEquals(correctResult, true);
      assertEquals(wrongResult, false);
    });

    it('should handle very long password verification', async () => {
      // Arrange
      const password = 'A'.repeat(100);
      const hash = await hashPassword(password);

      // Act
      const result = await verifyPassword(password, hash);

      // Assert
      assertEquals(result, true);
    });
  });

  describe('Integration: Hash/Verify Cycle', () => {
    it('should complete full cycle: hash then verify', async () => {
      // Arrange
      const password = 'FullCyclePassword123!';

      // Act
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      // Assert
      assertEquals(isValid, true);
    });

    it('should work with different password types', async () => {
      // Arrange
      const testCases = [
        'SimplePassword',
        'P@ssw0rd!#$%',
        '12345678',
        'password with spaces',
        'MixedCASE123',
        'emoji-password-🔐',
      ];

      // Act & Assert
      for (const password of testCases) {
        const hash = await hashPassword(password);
        const isValid = await verifyPassword(password, hash);
        assertEquals(isValid, true, `Failed for password: ${password}`);
      }
    });

    it('should maintain hash portability (verify hash from different session)', async () => {
      // Arrange
      // Simulate a hash created in a previous session
      const password = 'UserPassword123!';
      const sessionOneHash = await hashPassword(password);

      // Act
      // Simulate verifying in a new session (new function call)
      const sessionTwoVerification = await verifyPassword(password, sessionOneHash);

      // Assert
      assertEquals(sessionTwoVerification, true);
      
      // Also verify wrong password still fails
      const wrongPasswordVerification = await verifyPassword('WrongPassword', sessionOneHash);
      assertEquals(wrongPasswordVerification, false);
    });

    it('should reject similar but different passwords', async () => {
      // Arrange
      const basePassword = 'SecurePassword123';
      const hash = await hashPassword(basePassword);

      const similarPasswords = [
        'SecurePassword124', // Different digit
        'SecurePassword12',  // Missing digit
        'securePassword123', // Different case
        'SecurePassword123 ', // Extra space
        ' SecurePassword123', // Leading space
      ];

      // Act & Assert
      for (const similarPassword of similarPasswords) {
        const result = await verifyPassword(similarPassword, hash);
        assertEquals(result, false, `Should reject: ${similarPassword}`);
      }
    });
  });

  describe('Security: Timing Attack Resistance', () => {
    it('should take similar time for correct and incorrect passwords', async () => {
      // Arrange
      const password = 'TimingTestPassword123';
      const hash = await hashPassword(password);

      // Act - Measure time for correct password
      const correctStart = performance.now();
      await verifyPassword(password, hash);
      const correctTime = performance.now() - correctStart;

      // Act - Measure time for incorrect password
      const wrongStart = performance.now();
      await verifyPassword('WrongPassword123', hash);
      const wrongTime = performance.now() - wrongStart;

      // Assert
      // Both should take similar time (within 50% variance)
      // This is a basic check; PBKDF2 is designed to resist timing attacks
      const timeDifference = Math.abs(correctTime - wrongTime);
      const averageTime = (correctTime + wrongTime) / 2;
      const percentageDifference = (timeDifference / averageTime) * 100;

      // If difference is more than 50%, it might indicate timing vulnerability
      // (though PBKDF2 with constant-time comparison should inherently protect against this)
      assertEquals(
        percentageDifference < 50,
        true,
        `Timing difference too large: ${percentageDifference.toFixed(2)}% (correct: ${correctTime.toFixed(2)}ms, wrong: ${wrongTime.toFixed(2)}ms)`,
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum length password', async () => {
      // Arrange
      const password = 'a'; // Single character

      // Act
      const hash = await hashPassword(password);
      const result = await verifyPassword(password, hash);

      // Assert
      assertEquals(result, true);
    });

    it('should handle password with only whitespace', async () => {
      // Arrange
      const password = '   '; // Only spaces

      // Act
      const hash = await hashPassword(password);
      const correctResult = await verifyPassword('   ', hash);
      const wrongResult = await verifyPassword('  ', hash); // Different number of spaces

      // Assert
      assertEquals(correctResult, true);
      assertEquals(wrongResult, false);
    });

    it('should handle password with newlines and tabs', async () => {
      // Arrange
      const password = 'Pass\nword\t123';

      // Act
      const hash = await hashPassword(password);
      const result = await verifyPassword('Pass\nword\t123', hash);

      // Assert
      assertEquals(result, true);
    });

    it('should reject null-byte injection attempts', async () => {
      // Arrange
      const password = 'Password\x00Injection';
      const hash = await hashPassword(password);

      // Act
      const exactMatch = await verifyPassword('Password\x00Injection', hash);
      const beforeNullByte = await verifyPassword('Password', hash);

      // Assert
      assertEquals(exactMatch, true);
      assertEquals(beforeNullByte, false); // Should not truncate at null byte
    });
  });
});
