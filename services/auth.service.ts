/**
 * Authentication Service
 *
 * Centralized service for all authentication operations including:
 * - User login/logout
 * - Token generation and validation
 * - Password verification
 * - Session management
 * - Email verification
 * - Password reset
 *
 * This service eliminates duplicate authentication logic across 7+ API routes.
 */

import {
  AppError,
  AuthenticationError,
  ConflictError,
  NotFoundError,
} from '@/lib/errors.ts';

// ============================================================================
// Types
// ============================================================================

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    emailVerified: boolean;
  };
}

export interface SignupResult {
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
  };
  verificationToken: string;
}

export interface RefreshResult {
  accessToken: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  emailVerified: boolean;
}

export interface PasswordResetTokenData {
  userId: string;
  email: string;
}

// ============================================================================
// Service Class
// ============================================================================

export class AuthService {
  private userRepo: UserRepository;
  private tokenRepo: TokenRepository;

  constructor(
    userRepo?: UserRepository,
    tokenRepo?: TokenRepository,
  ) {
    this.userRepo = userRepo || new UserRepository();
    this.tokenRepo = tokenRepo || new TokenRepository();
  }

  // ==========================================================================
  // Login & Logout
  // ==========================================================================

  /**
   * Authenticate user with email and password
   *
   * @throws AuthenticationError if credentials are invalid
   * @throws AppError if email not verified
   */
  async login(email: string, password: string): Promise<LoginResult> {
    // Find user by email
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new AuthenticationError(ErrorCode.INVALID_CREDENTIALS);
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      throw new AuthenticationError(ErrorCode.INVALID_CREDENTIALS);
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new AppError(ErrorCode.EMAIL_NOT_VERIFIED);
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, {
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    });

    // Store refresh token
    const expiresAt = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
    await this.tokenRepo.storeRefreshToken(user.id, tokens.refreshTokenId, expiresAt);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    };
  }

  /**
   * Logout user and revoke tokens
   * 
   * @param userId - User ID
   * @param refreshToken - Refresh token from cookie (optional)
   * @param accessToken - Access token from header (optional)
   */
  async logout(userId: string, refreshToken?: string, accessToken?: string): Promise<void> {
    // Revoke refresh token if provided
    if (refreshToken) {
      try {
        const refreshPayload = await verifyToken(refreshToken);
        const tokenId = refreshPayload['jti'] as string;
        await this.tokenRepo.revokeRefreshToken(userId, tokenId);
      } catch {
        // Refresh token invalid or expired - ignore
      }
    }

    // Blacklist access token if provided
    if (accessToken) {
      try {
        const accessPayload = await verifyToken(accessToken);
        const tokenId = accessPayload['jti'] as string;
        const expiresAt = accessPayload['exp'] as number;
        await this.tokenRepo.blacklistToken(tokenId, userId, expiresAt);
      } catch {
        // Access token invalid - ignore
      }
    }
  }

  // ==========================================================================
  // Signup & Email Verification
  // ==========================================================================

  /**
   * Register new user account
   *
   * @throws ConflictError if email already exists
   */
  async signup(email: string, password: string, name: string): Promise<SignupResult> {
    // Check if email already exists
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new ConflictError(undefined, 'email', email);
    }

    // Create user (password is automatically hashed by repository)
    const user = await this.userRepo.create({
      email,
      password,
      name,
      role: "user",
      emailVerified: false,
      emailVerifiedAt: null,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: [],
    });

    // Generate email verification token
    const verificationToken = crypto.randomUUID();
    const expiresAt = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours

    await this.tokenRepo.storeEmailVerificationToken(
      verificationToken,
      user.id,
      user.email,
      expiresAt
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      },
      verificationToken,
    };
  }

  /**
   * Verify user email with token
   *
   * @throws AppError if token is invalid or expired
   */
  async verifyEmail(token: string): Promise<void> {
    const tokenData = await this.tokenRepo.getEmailVerificationToken(token);

    if (!tokenData) {
      throw new AppError(ErrorCode.INVALID_VERIFICATION_TOKEN);
    }

    // Mark email as verified
    await this.userRepo.verifyEmail(tokenData.userId);

    // Delete used token
    await this.tokenRepo.deleteEmailVerificationToken(token);
  }

  /**
   * Resend email verification token
   *
   * @throws NotFoundError if user not found
   * @throws AppError if already verified
   */
  async resendVerification(email: string): Promise<string> {
    const user = await this.userRepo.findByEmail(email);

    if (!user) {
      throw new NotFoundError(undefined, 'User', email);
    }

    if (user.emailVerified) {
      throw new AppError(ErrorCode.EMAIL_NOT_VERIFIED, 'Email is already verified');
    }

    // Generate new verification token
    const verificationToken = crypto.randomUUID();
    const expiresAt = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours

    await this.tokenRepo.storeEmailVerificationToken(
      verificationToken,
      user.id,
      user.email,
      expiresAt
    );

    return verificationToken;
  }

  // ==========================================================================
  // Password Reset
  // ==========================================================================

  /**
   * Request password reset (send reset email)
   * 
   * Always returns success even if email doesn't exist (security)
   */
  async requestPasswordReset(email: string): Promise<string | null> {
    const user = await this.userRepo.findByEmail(email);
    
    if (!user) {
      return null; // Don't reveal if email exists
    }

    // Generate password reset token
    const resetToken = crypto.randomUUID();
    const expiresAt = Math.floor(Date.now() / 1000) + (60 * 60); // 1 hour

    await this.tokenRepo.storePasswordResetToken(
      resetToken,
      user.id,
      user.email,
      expiresAt
    );

    return resetToken;
  }

  /**
   * Reset password with token
   *
   * @throws AppError if token is invalid or expired
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenData = await this.tokenRepo.getPasswordResetToken(token);

    if (!tokenData) {
      throw new AppError(ErrorCode.INVALID_RESET_TOKEN);
    }

    // Update password (automatically hashed by repository)
    await this.userRepo.updatePassword(tokenData.userId, newPassword);

    // Delete used token
    await this.tokenRepo.deletePasswordResetToken(token);

    // Revoke all existing sessions for security
    await this.tokenRepo.revokeAllUserRefreshTokens(tokenData.userId);
  }

  // ==========================================================================
  // Token Management
  // ==========================================================================

  /**
   * Refresh access token using refresh token
   *
   * @throws AuthenticationError if refresh token is invalid
   * @throws AppError if refresh token is revoked
   * @throws NotFoundError if user not found
   */
  async refreshAccessToken(refreshToken: string): Promise<RefreshResult> {
    // Verify refresh token
    let payload;
    try {
      payload = await verifyToken(refreshToken);
    } catch {
      throw new AuthenticationError(ErrorCode.INVALID_TOKEN);
    }

    const userId = payload['sub'] as string;
    const tokenId = payload['jti'] as string;

    // Verify refresh token exists in database
    const isValid = await this.tokenRepo.verifyRefreshToken(userId, tokenId);
    if (!isValid) {
      throw new AuthenticationError(ErrorCode.REFRESH_TOKEN_INVALID, 'Refresh token has been revoked');
    }

    // Get user data
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError(undefined, 'User', userId);
    }

    // Generate new access token
    const accessToken = await createAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    });

    return { accessToken };
  }

  /**
   * Verify password for sensitive operations
   * Used by 2FA operations and account changes
   */
  async verifyUserPassword(userId: string, password: string): Promise<boolean> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      return false;
    }

    return await verifyPassword(password, user.password);
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  /**
   * Generate access and refresh tokens for a user
   */
  private async generateTokens(userId: string, userData: Omit<TokenPayload, 'sub'>) {
    const accessToken = await createAccessToken({
      sub: userId,
      ...userData,
    });

    const refreshTokenData = await createRefreshToken({
      sub: userId,
    });

    return {
      accessToken,
      refreshToken: refreshTokenData.token,
      refreshTokenId: refreshTokenData.tokenId,
    };
  }
}
