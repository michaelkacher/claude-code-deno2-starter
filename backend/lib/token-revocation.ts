/**
 * Token Revocation System
 * 
 * Implements token blacklisting for logout and revocation
 * Uses Deno KV with automatic expiration
 */

import { getKv } from './kv.ts';

/**
 * Add a token to the blacklist
 * @param tokenId - Unique token identifier (jti claim)
 * @param expiresAt - Token expiration timestamp
 */
export async function blacklistToken(tokenId: string, expiresAt: number): Promise<void> {
  const kv = await getKv();
  
  // Calculate TTL (time until token naturally expires)
  const now = Date.now();
  const ttlMs = Math.max(0, expiresAt * 1000 - now);
  
  // Store in blacklist with automatic expiration
  await kv.set(
    ['token_blacklist', tokenId],
    {
      blacklistedAt: new Date().toISOString(),
      expiresAt: new Date(expiresAt * 1000).toISOString(),
    },
    { expireIn: ttlMs }
  );
}

/**
 * Check if a token is blacklisted
 * @param tokenId - Unique token identifier (jti claim)
 * @returns true if token is blacklisted
 */
export async function isTokenBlacklisted(tokenId: string): Promise<boolean> {
  const kv = await getKv();
  const entry = await kv.get(['token_blacklist', tokenId]);
  return entry.value !== null;
}

/**
 * Store refresh token in database
 * @param userId - User ID
 * @param tokenId - Refresh token ID
 * @param expiresAt - Token expiration timestamp
 */
export async function storeRefreshToken(
  userId: string,
  tokenId: string,
  expiresAt: number
): Promise<void> {
  const kv = await getKv();
  
  const ttlMs = Math.max(0, expiresAt * 1000 - Date.now());
  
  await kv.set(
    ['refresh_tokens', userId, tokenId],
    {
      tokenId,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(expiresAt * 1000).toISOString(),
    },
    { expireIn: ttlMs }
  );
}

/**
 * Verify refresh token exists in database
 * @param userId - User ID
 * @param tokenId - Refresh token ID
 * @returns true if refresh token is valid
 */
export async function verifyRefreshToken(userId: string, tokenId: string): Promise<boolean> {
  const kv = await getKv();
  const entry = await kv.get(['refresh_tokens', userId, tokenId]);
  return entry.value !== null;
}

/**
 * Revoke a specific refresh token
 * @param userId - User ID
 * @param tokenId - Refresh token ID
 */
export async function revokeRefreshToken(userId: string, tokenId: string): Promise<void> {
  const kv = await getKv();
  await kv.delete(['refresh_tokens', userId, tokenId]);
}

/**
 * Revoke all refresh tokens for a user
 * @param userId - User ID
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  const kv = await getKv();
  
  // List all refresh tokens for this user
  const entries = kv.list<{ tokenId: string }>({ prefix: ['refresh_tokens', userId] });
  
  // Delete all tokens
  const deleteOperations: Promise<void>[] = [];
  for await (const entry of entries) {
    deleteOperations.push(kv.delete(entry.key));
  }
  
  await Promise.all(deleteOperations);
}
