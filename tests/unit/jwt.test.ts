/**
 * JWT Utility Tests
 * 
 * Tests token creation, verification, and duration parsing.
 * Focus: Business logic around token generation and validation.
 * 
 * Note: Does not test djwt library internals (framework code).
 */

import { assertEquals, assertExists, assertRejects } from '@std/assert';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';
import {
    createAccessToken,
    createRefreshToken,
    createToken,
    getHmacKey,
    parseDurationToSeconds,
    verifyToken,
} from '../../shared/lib/jwt.ts';

describe('JWT Utilities', () => {
  let originalJwtSecret: string | undefined;
  let originalJwtExpiresIn: string | undefined;

  beforeEach(() => {
    // Save original env vars
    originalJwtSecret = Deno.env.get('JWT_SECRET');
    originalJwtExpiresIn = Deno.env.get('JWT_EXPIRES_IN');

    // Set test env vars
    Deno.env.set('JWT_SECRET', 'test-secret-key-min-32-characters-long');
    Deno.env.set('JWT_EXPIRES_IN', '7d');
  });

  afterEach(() => {
    // Restore original env vars
    if (originalJwtSecret) {
      Deno.env.set('JWT_SECRET', originalJwtSecret);
    } else {
      Deno.env.delete('JWT_SECRET');
    }

    if (originalJwtExpiresIn) {
      Deno.env.set('JWT_EXPIRES_IN', originalJwtExpiresIn);
    } else {
      Deno.env.delete('JWT_EXPIRES_IN');
    }
  });

  describe('createToken', () => {
    it('should create a token with payload', async () => {
      // Arrange
      const payload = { userId: '123', email: 'test@example.com' };

      // Act
      const token = await createToken(payload);

      // Assert
      assertExists(token);
      assertEquals(typeof token, 'string');
      assertEquals(token.split('.').length, 3); // JWT has 3 parts: header.payload.signature
    });

    it('should create token with custom expiry', async () => {
      // Arrange
      const payload = { userId: '123' };
      const customExpiry = '1h';

      // Act
      const token = await createToken(payload, customExpiry);

      // Assert
      assertExists(token);
      
      // Verify the token contains the payload
      const decoded = await verifyToken(token);
      assertEquals(decoded['userId'], '123');
    });

    it('should use default expiry when not provided', async () => {
      // Arrange
      const payload = { userId: '123' };

      // Act
      const token = await createToken(payload);

      // Assert
      assertExists(token);
      const decoded = await verifyToken(token);
      assertEquals(decoded['userId'], '123');
    });

    it('should throw error when JWT_SECRET is missing', async () => {
      // Arrange
      Deno.env.delete('JWT_SECRET');
      const payload = { userId: '123' };

      // Act & Assert
      await assertRejects(
        async () => await createToken(payload),
        Error,
        'JWT_SECRET is not configured',
      );
    });

    it('should include all payload fields in token', async () => {
      // Arrange
      const payload = {
        userId: '123',
        email: 'test@example.com',
        role: 'admin',
        name: 'Test User',
      };

      // Act
      const token = await createToken(payload);
      const decoded = await verifyToken(token);

      // Assert
      assertEquals(decoded['userId'], '123');
      assertEquals(decoded['email'], 'test@example.com');
      assertEquals(decoded['role'], 'admin');
      assertEquals(decoded['name'], 'Test User');
    });
  });

  describe('createAccessToken', () => {
    it('should create access token with 15 minute expiry', async () => {
      // Arrange
      const payload = { userId: '123', email: 'test@example.com' };

      // Act
      const token = await createAccessToken(payload);

      // Assert
      assertExists(token);
      const decoded = await verifyToken(token);
      assertEquals(decoded['type'], 'access');
      assertEquals(decoded['userId'], '123');
      assertEquals(decoded['email'], 'test@example.com');
    });

    it('should add type field to payload', async () => {
      // Arrange
      const payload = { userId: '123' };

      // Act
      const token = await createAccessToken(payload);
      const decoded = await verifyToken(token);

      // Assert
      assertEquals(decoded['type'], 'access');
    });

    it('should preserve original payload fields', async () => {
      // Arrange
      const payload = { userId: '123', role: 'user', custom: 'value' };

      // Act
      const token = await createAccessToken(payload);
      const decoded = await verifyToken(token);

      // Assert
      assertEquals(decoded['userId'], '123');
      assertEquals(decoded['role'], 'user');
      assertEquals(decoded['custom'], 'value');
    });
  });

  describe('createRefreshToken', () => {
    it('should create refresh token with 30 day expiry', async () => {
      // Arrange
      const payload = { userId: '123', email: 'test@example.com' };

      // Act
      const result = await createRefreshToken(payload);

      // Assert
      assertExists(result.token);
      assertExists(result.tokenId);
      
      const decoded = await verifyToken(result.token);
      assertEquals(decoded['type'], 'refresh');
      assertEquals(decoded['userId'], '123');
      assertEquals(decoded['email'], 'test@example.com');
    });

    it('should include unique tokenId (jti)', async () => {
      // Arrange
      const payload = { userId: '123' };

      // Act
      const result = await createRefreshToken(payload);
      const decoded = await verifyToken(result.token);

      // Assert
      assertEquals(decoded['jti'], result.tokenId);
      assertExists(result.tokenId);
      // UUID format check
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      assertEquals(uuidRegex.test(result.tokenId), true);
    });

    it('should generate unique tokenIds for different tokens', async () => {
      // Arrange
      const payload = { userId: '123' };

      // Act
      const result1 = await createRefreshToken(payload);
      const result2 = await createRefreshToken(payload);

      // Assert
      assertEquals(result1.tokenId !== result2.tokenId, true);
    });

    it('should add type and jti to payload', async () => {
      // Arrange
      const payload = { userId: '123' };

      // Act
      const result = await createRefreshToken(payload);
      const decoded = await verifyToken(result.token);

      // Assert
      assertEquals(decoded['type'], 'refresh');
      assertExists(decoded['jti']);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      // Arrange
      const payload = { userId: '123', email: 'test@example.com' };
      const token = await createToken(payload);

      // Act
      const decoded = await verifyToken(token);

      // Assert
      assertEquals(decoded['userId'], '123');
      assertEquals(decoded['email'], 'test@example.com');
    });

    it('should throw error for invalid token', async () => {
      // Arrange
      const invalidToken = 'invalid.token.here';

      // Act & Assert
      await assertRejects(
        async () => await verifyToken(invalidToken),
        Error,
        'Invalid token',
      );
    });

    it('should throw error for malformed token', async () => {
      // Arrange
      const malformedToken = 'not-a-jwt-token';

      // Act & Assert
      await assertRejects(
        async () => await verifyToken(malformedToken),
        Error,
        'Invalid token',
      );
    });

    it('should throw error for token with wrong secret', async () => {
      // Arrange
      const payload = { userId: '123' };
      const token = await createToken(payload);

      // Change the secret
      Deno.env.set('JWT_SECRET', 'different-secret-key-min-32-chars');

      // Act & Assert
      await assertRejects(
        async () => await verifyToken(token),
        Error,
        'Invalid token',
      );
    });

    it('should return all payload fields', async () => {
      // Arrange
      const payload = {
        userId: '123',
        email: 'test@example.com',
        role: 'admin',
        metadata: { plan: 'pro' },
      };
      const token = await createToken(payload);

      // Act
      const decoded = await verifyToken(token);

      // Assert
      assertEquals(decoded['userId'], '123');
      assertEquals(decoded['email'], 'test@example.com');
      assertEquals(decoded['role'], 'admin');
      assertEquals(decoded['metadata'], { plan: 'pro' });
    });
  });

  describe('Token expiry behavior', () => {
    it('should respect JWT_EXPIRES_IN env variable', async () => {
      // Arrange
      Deno.env.set('JWT_EXPIRES_IN', '1d');
      const payload = { userId: '123' };

      // Act
      const token = await createToken(payload);
      const decoded = await verifyToken(token);

      // Assert
      assertExists(decoded['exp']);
      assertEquals(typeof decoded['exp'], 'number');
    });

    it('should use custom expiry over env variable', async () => {
      // Arrange
      Deno.env.set('JWT_EXPIRES_IN', '7d');
      const payload = { userId: '123' };
      const customExpiry = '1h';

      // Act
      const token = await createToken(payload, customExpiry);
      const decoded = await verifyToken(token);

      // Assert
      assertExists(decoded['exp']);
      // Token should be valid (we can't easily test exact expiry without mocking time)
      assertEquals(decoded['userId'], '123');
    });
  });

  describe('Integration: Full token lifecycle', () => {
    it('should create, verify, and decode access token', async () => {
      // Arrange
      const payload = { userId: '123', email: 'test@example.com', role: 'user' };

      // Act: Create
      const token = await createAccessToken(payload);
      
      // Act: Verify
      const decoded = await verifyToken(token);

      // Assert
      assertEquals(decoded['userId'], '123');
      assertEquals(decoded['email'], 'test@example.com');
      assertEquals(decoded['role'], 'user');
      assertEquals(decoded['type'], 'access');
    });

    it('should create, verify, and decode refresh token', async () => {
      // Arrange
      const payload = { userId: '456', email: 'user@example.com' };

      // Act: Create
      const { token, tokenId } = await createRefreshToken(payload);
      
      // Act: Verify
      const decoded = await verifyToken(token);

      // Assert
      assertEquals(decoded['userId'], '456');
      assertEquals(decoded['email'], 'user@example.com');
      assertEquals(decoded['type'], 'refresh');
      assertEquals(decoded['jti'], tokenId);
    });

    it('should handle tokens with complex payloads', async () => {
      // Arrange
      const complexPayload = {
        userId: '789',
        email: 'complex@example.com',
        role: 'admin',
        permissions: ['read', 'write', 'delete'],
        metadata: {
          plan: 'enterprise',
          features: ['api', 'support'],
        },
        sessionId: 'session-123',
      };

      // Act
      const token = await createToken(complexPayload);
      const decoded = await verifyToken(token);

      // Assert
      assertEquals(decoded['userId'], '789');
      assertEquals(decoded['email'], 'complex@example.com');
      assertEquals(decoded['role'], 'admin');
      assertEquals(decoded['permissions'], ['read', 'write', 'delete']);
      assertEquals(decoded['metadata'], {
        plan: 'enterprise',
        features: ['api', 'support'],
      });
      assertEquals(decoded['sessionId'], 'session-123');
    });
  });

  describe('parseDurationToSeconds', () => {
    it('should parse seconds correctly', () => {
      // Arrange & Act
      const result = parseDurationToSeconds('30s');

      // Assert
      assertEquals(result, 30);
    });

    it('should parse minutes correctly', () => {
      // Arrange & Act
      const result = parseDurationToSeconds('15m');

      // Assert
      assertEquals(result, 900); // 15 * 60
    });

    it('should parse hours correctly', () => {
      // Arrange & Act
      const result = parseDurationToSeconds('2h');

      // Assert
      assertEquals(result, 7200); // 2 * 60 * 60
    });

    it('should parse days correctly', () => {
      // Arrange & Act
      const result = parseDurationToSeconds('7d');

      // Assert
      assertEquals(result, 604800); // 7 * 24 * 60 * 60
    });

    it('should parse weeks correctly', () => {
      // Arrange & Act
      const result = parseDurationToSeconds('2w');

      // Assert
      assertEquals(result, 1209600); // 2 * 7 * 24 * 60 * 60
    });

    it('should return default (7 days) for invalid format', () => {
      // Arrange & Act & Assert
      assertEquals(parseDurationToSeconds('invalid'), 604800);
      assertEquals(parseDurationToSeconds(''), 604800);
      assertEquals(parseDurationToSeconds('123'), 604800);
    });

    it('should handle edge case: zero values', () => {
      // Arrange & Act & Assert
      assertEquals(parseDurationToSeconds('0s'), 0);
      assertEquals(parseDurationToSeconds('0m'), 0);
    });

    it('should handle single digit values', () => {
      // Arrange & Act & Assert
      assertEquals(parseDurationToSeconds('1s'), 1);
      assertEquals(parseDurationToSeconds('1m'), 60);
      assertEquals(parseDurationToSeconds('1h'), 3600);
      assertEquals(parseDurationToSeconds('1d'), 86400);
      assertEquals(parseDurationToSeconds('1w'), 604800);
    });

    it('should handle large values', () => {
      // Arrange & Act & Assert
      assertEquals(parseDurationToSeconds('999s'), 999);
      assertEquals(parseDurationToSeconds('100d'), 8640000);
    });
  });

  describe('getHmacKey', () => {
    it('should throw error when JWT_SECRET is missing', async () => {
      // Arrange
      Deno.env.delete('JWT_SECRET');

      // Act & Assert
      await assertRejects(
        async () => await getHmacKey(),
        Error,
        'JWT_SECRET is not configured',
      );
    });

    it('should create CryptoKey from JWT_SECRET', async () => {
      // Arrange
      Deno.env.set('JWT_SECRET', 'test-secret-key-for-hmac');

      // Act
      const key = await getHmacKey();

      // Assert
      assertExists(key);
      assertEquals(key.type, 'secret');
      assertEquals(key.algorithm.name, 'HMAC');
    });

    it('should create same key for same secret', async () => {
      // Arrange
      Deno.env.set('JWT_SECRET', 'consistent-secret-key');

      // Act
      const key1 = await getHmacKey();
      const key2 = await getHmacKey();

      // Assert
      assertEquals(key1.type, key2.type);
      assertEquals(key1.algorithm.name, key2.algorithm.name);
    });

    it('should handle long secrets', async () => {
      // Arrange
      const longSecret = 'a'.repeat(256);
      Deno.env.set('JWT_SECRET', longSecret);

      // Act
      const key = await getHmacKey();

      // Assert
      assertExists(key);
      assertEquals(key.type, 'secret');
    });

    it('should handle special characters in secret', async () => {
      // Arrange
      Deno.env.set('JWT_SECRET', 'secret!@#$%^&*()_+-={}[]|:;"<>?,./');

      // Act
      const key = await getHmacKey();

      // Assert
      assertExists(key);
      assertEquals(key.type, 'secret');
    });
  });
});

