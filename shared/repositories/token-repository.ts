import { BaseRepository, RepositoryOptions } from './base-repository.ts';

/**
 * Token types stored in KV
 */
export interface RefreshTokenData {
  userId: string;
  tokenId: string;
  expiresAt: number;
  createdAt: string;
}

export interface BlacklistTokenData {
  tokenId: string;
  userId: string;
  reason?: string;
  expiresAt: number;
  createdAt: string;
}

export interface PasswordResetTokenData {
  userId: string;
  email: string;
  expiresAt: number;
  createdAt: string;
}

export interface EmailVerificationTokenData {
  userId: string;
  email: string;
  expiresAt: number;
  createdAt: string;
}

/**
 * Token Repository
 * 
 * Manages all token-related data:
 * - Refresh tokens
 * - Token blacklist
 * - Password reset tokens
 * - Email verification tokens
 */
export class TokenRepository extends BaseRepository<
  RefreshTokenData | BlacklistTokenData | PasswordResetTokenData | EmailVerificationTokenData
> {
  constructor(options: RepositoryOptions = {}) {
    super('Token', options);
  }

  // ============= Refresh Tokens =============

  /**
   * Store a refresh token
   */
  async storeRefreshToken(
    userId: string,
    tokenId: string,
    expiresAt: number
  ): Promise<void> {
    const tokenData: RefreshTokenData = {
      userId,
      tokenId,
      expiresAt,
      createdAt: new Date().toISOString(),
    };

    await this.set(['refresh_tokens', userId, tokenId], tokenData, {
      expireIn: expiresAt * 1000 - Date.now(),
    });

    this.logger.info('Refresh token stored', { userId, tokenId });
  }

  /**
   * Get refresh token
   */
  async getRefreshToken(userId: string, tokenId: string): Promise<RefreshTokenData | null> {
    return await this.get(['refresh_tokens', userId, tokenId]) as RefreshTokenData | null;
  }

  /**
   * Verify refresh token exists and is valid
   */
  async verifyRefreshToken(userId: string, tokenId: string): Promise<boolean> {
    const token = await this.getRefreshToken(userId, tokenId);
    
    if (!token) {
      return false;
    }

    // Check if expired
    if (token.expiresAt < Math.floor(Date.now() / 1000)) {
      await this.revokeRefreshToken(userId, tokenId);
      return false;
    }

    return true;
  }

  /**
   * Revoke a specific refresh token
   */
  async revokeRefreshToken(userId: string, tokenId: string): Promise<void> {
    await this.delete(['refresh_tokens', userId, tokenId]);
    this.logger.info('Refresh token revoked', { userId, tokenId });
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    try {
      const kv = await this.getKv();
      const tokens = kv.list({ prefix: ['refresh_tokens', userId] });
      
      const deleteOperations: Promise<void>[] = [];
      for await (const entry of tokens) {
        deleteOperations.push(kv.delete(entry.key));
      }
      
      await Promise.all(deleteOperations);
      this.logger.info('All refresh tokens revoked for user', { userId });
    } catch (error) {
      this.logger.error('Error revoking all user refresh tokens', { userId, error });
      throw error;
    }
  }

  /**
   * List all refresh tokens for a user
   */
  async listUserRefreshTokens(userId: string): Promise<RefreshTokenData[]> {
    try {
      const kv = await this.getKv();
      const tokens: RefreshTokenData[] = [];
      
      const entries = kv.list<RefreshTokenData>({ prefix: ['refresh_tokens', userId] });
      for await (const entry of entries) {
        if (entry.value) {
          tokens.push(entry.value);
        }
      }
      
      return tokens;
    } catch (error) {
      this.logger.error('Error listing user refresh tokens', { userId, error });
      throw error;
    }
  }

  // ============= Token Blacklist =============

  /**
   * Blacklist an access token
   */
  async blacklistToken(
    tokenId: string,
    userId: string,
    expiresAt: number,
    reason?: string
  ): Promise<void> {
    const blacklistData: BlacklistTokenData = {
      tokenId,
      userId,
      reason,
      expiresAt,
      createdAt: new Date().toISOString(),
    };

    await this.set(['token_blacklist', tokenId], blacklistData, {
      expireIn: expiresAt * 1000 - Date.now(),
    });

    this.logger.info('Token blacklisted', { tokenId, userId, reason });
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(tokenId: string): Promise<boolean> {
    return await this.exists(['token_blacklist', tokenId]);
  }

  /**
   * Get blacklist entry
   */
  async getBlacklistEntry(tokenId: string): Promise<BlacklistTokenData | null> {
    return await this.get(['token_blacklist', tokenId]) as BlacklistTokenData | null;
  }

  // ============= Password Reset Tokens =============

  /**
   * Store password reset token
   */
  async storePasswordResetToken(
    resetToken: string,
    userId: string,
    email: string,
    expiresAt: number
  ): Promise<void> {
    const tokenData: PasswordResetTokenData = {
      userId,
      email,
      expiresAt,
      createdAt: new Date().toISOString(),
    };

    await this.set(['password_reset', resetToken], tokenData, {
      expireIn: expiresAt * 1000 - Date.now(),
    });

    this.logger.info('Password reset token stored', { userId, email });
  }

  /**
   * Get password reset token
   */
  async getPasswordResetToken(resetToken: string): Promise<PasswordResetTokenData | null> {
    const token = await this.get(['password_reset', resetToken]) as PasswordResetTokenData | null;
    
    if (!token) {
      return null;
    }

    // Check if expired
    if (token.expiresAt < Math.floor(Date.now() / 1000)) {
      await this.deletePasswordResetToken(resetToken);
      return null;
    }

    return token;
  }

  /**
   * Delete password reset token
   */
  async deletePasswordResetToken(resetToken: string): Promise<void> {
    await this.delete(['password_reset', resetToken]);
    this.logger.info('Password reset token deleted', { resetToken });
  }

  // ============= Email Verification Tokens =============

  /**
   * Store email verification token
   */
  async storeEmailVerificationToken(
    verificationToken: string,
    userId: string,
    email: string,
    expiresAt: number
  ): Promise<void> {
    const tokenData: EmailVerificationTokenData = {
      userId,
      email,
      expiresAt,
      createdAt: new Date().toISOString(),
    };

    await this.set(['email_verification', verificationToken], tokenData, {
      expireIn: expiresAt * 1000 - Date.now(),
    });

    this.logger.info('Email verification token stored', { userId, email });
  }

  /**
   * Get email verification token
   */
  async getEmailVerificationToken(
    verificationToken: string
  ): Promise<EmailVerificationTokenData | null> {
    const token = await this.get(['email_verification', verificationToken]) as EmailVerificationTokenData | null;
    
    if (!token) {
      return null;
    }

    // Check if expired
    if (token.expiresAt < Math.floor(Date.now() / 1000)) {
      await this.deleteEmailVerificationToken(verificationToken);
      return null;
    }

    return token;
  }

  /**
   * Delete email verification token
   */
  async deleteEmailVerificationToken(verificationToken: string): Promise<void> {
    await this.delete(['email_verification', verificationToken]);
    this.logger.info('Email verification token deleted', { verificationToken });
  }

  /**
   * Cleanup expired tokens (utility method for maintenance)
   */
  async cleanupExpiredTokens(): Promise<{
    refreshTokens: number;
    passwordResets: number;
    emailVerifications: number;
  }> {
    const kv = await this.getKv();
    const now = Math.floor(Date.now() / 1000);
    let refreshTokens = 0;
    let passwordResets = 0;
    let emailVerifications = 0;

    try {
      // Cleanup refresh tokens
      const refreshEntries = kv.list<RefreshTokenData>({ prefix: ['refresh_tokens'] });
      for await (const entry of refreshEntries) {
        if (entry.value && entry.value.expiresAt < now) {
          await kv.delete(entry.key);
          refreshTokens++;
        }
      }

      // Cleanup password reset tokens
      const resetEntries = kv.list<PasswordResetTokenData>({ prefix: ['password_reset'] });
      for await (const entry of resetEntries) {
        if (entry.value && entry.value.expiresAt < now) {
          await kv.delete(entry.key);
          passwordResets++;
        }
      }

      // Cleanup email verification tokens
      const verifyEntries = kv.list<EmailVerificationTokenData>({ prefix: ['email_verification'] });
      for await (const entry of verifyEntries) {
        if (entry.value && entry.value.expiresAt < now) {
          await kv.delete(entry.key);
          emailVerifications++;
        }
      }

      this.logger.info('Expired tokens cleaned up', { refreshTokens, passwordResets, emailVerifications });
      
      return { refreshTokens, passwordResets, emailVerifications };
    } catch (error) {
      this.logger.error('Error cleaning up expired tokens', { error });
      throw error;
    }
  }
}
