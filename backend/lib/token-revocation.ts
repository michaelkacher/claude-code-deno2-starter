/**
 * Token Revocation System
 * 
 * Thin wrapper around TokenRepository for backward compatibility
 * Uses Deno KV with automatic expiration
 */

import { TokenRepository } from '../repositories/index.ts';

// Singleton repository instance
const tokenRepo = new TokenRepository();

/**
 * Add a token to the blacklist
 * @param tokenId - Unique token identifier (jti claim)
 * @param expiresAt - Token expiration timestamp
 */
export async function blacklistToken(tokenId: string, expiresAt: number): Promise<void> {
  await tokenRepo.blacklistToken(tokenId, '', expiresAt);
}

/**
 * Check if a token is blacklisted
 * @param tokenId - Unique token identifier (jti claim)
 * @returns true if token is blacklisted
 */
export async function isTokenBlacklisted(tokenId: string): Promise<boolean> {
  return await tokenRepo.isTokenBlacklisted(tokenId);
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
  await tokenRepo.storeRefreshToken(userId, tokenId, expiresAt);
}

/**
 * Verify refresh token exists in database
 * @param userId - User ID
 * @param tokenId - Refresh token ID
 * @returns true if refresh token is valid
 */
export async function verifyRefreshToken(userId: string, tokenId: string): Promise<boolean> {
  return await tokenRepo.verifyRefreshToken(userId, tokenId);
}

/**
 * Revoke a specific refresh token
 * @param userId - User ID
 * @param tokenId - Refresh token ID
 */
export async function revokeRefreshToken(userId: string, tokenId: string): Promise<void> {
  await tokenRepo.revokeRefreshToken(userId, tokenId);
}

/**
 * Revoke all refresh tokens for a user
 * @param userId - User ID
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await tokenRepo.revokeAllUserRefreshTokens(userId);
}
