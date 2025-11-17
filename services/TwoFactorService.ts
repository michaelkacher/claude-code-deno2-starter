/**
 * Two-Factor Authentication Service
 *
 * Centralizes 2FA operations to eliminate 150-200 duplicate lines across 5 routes.
 * Handles user lookup, password verification, TOTP validation, and backup code management.
 */

import {
  AppError,
  AuthenticationError,
  NotFoundError,
} from '@/lib/errors.ts';

export interface TwoFactorSetupResult {
  secret: string;
  qrCodeURL: string;
}

export interface TwoFactorEnableResult {
  backupCodes: string[];
}

export interface TwoFactorVerifyResult {
  isValid: boolean;
  remainingBackupCodes?: number;
}

export class TwoFactorService {
  private userRepo: UserRepository;
  private authService: AuthService;

  constructor(
    userRepo?: UserRepository,
    authService?: AuthService,
  ) {
    this.userRepo = userRepo || new UserRepository();
    this.authService = authService || new AuthService();
  }

  /**
   * Get user and validate they exist
   * Eliminates duplicate user lookup + null check pattern (5 occurrences)
   *
   * @throws NotFoundError if user not found
   */
  private async getUser(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError(undefined, 'User', userId);
    }
    return user;
  }

  /**
   * Verify user's password
   * Eliminates duplicate password verification pattern (2 occurrences)
   */
  async verifyPassword(userId: string, password: string): Promise<boolean> {
    return await this.authService.verifyUserPassword(userId, password);
  }

  /**
   * Check if 2FA is enabled for user
   * Eliminates duplicate 2FA status checks (5 occurrences)
   */
  private is2FAEnabled(user: { twoFactorEnabled?: boolean; twoFactorSecret?: string | null }): boolean {
    return Boolean(user.twoFactorEnabled && user.twoFactorSecret);
  }

  /**
   * Generate backup codes
   * Eliminates duplicate backup code generation (2 occurrences)
   */
  private generateBackupCodes(count: number = 10): string[] {
    return Array.from({ length: count }, () =>
      crypto.randomUUID().slice(0, 8)
    );
  }

  /**
   * Verify TOTP code or backup code
   * Eliminates duplicate verification logic (3 occurrences)
   */
  private async verifyCode(
    code: string,
    secret: string,
    backupCodes: string[] = []
  ): Promise<{ isValid: boolean; usedBackupCode?: string }> {
    // 6-digit code = TOTP
    if (code.length === 6) {
      const isValid = await verifyTOTP(code, secret);
      return { isValid };
    }

    // 8-character code = backup code
    if (code.length === 8 && backupCodes.includes(code)) {
      return { isValid: true, usedBackupCode: code };
    }

    return { isValid: false };
  }

  /**
   * Setup 2FA - Generate secret and QR code
   * Replaces: frontend/routes/api/2fa/setup.ts (30-40 lines → service call)
   *
   * @throws AppError if 2FA already enabled
   */
  async setup(userId: string, issuer: string = "Deno Fresh App"): Promise<TwoFactorSetupResult> {
    const user = await this.getUser(userId);

    if (this.is2FAEnabled(user)) {
      throw new AppError(ErrorCode.TWO_FACTOR_ALREADY_ENABLED);
    }

    // Generate new TOTP secret
    const secret = generateSecret();

    // Store secret temporarily (not enabled yet)
    await this.userRepo.update(userId, { twoFactorSecret: secret });

    // Generate QR code
    const otpURL = generateQRCodeURL(secret, user.email, issuer);
    const qrCodeURL = generateQRCodeDataURL(otpURL);

    return { secret, qrCodeURL };
  }

  /**
   * Enable 2FA after verifying TOTP code
   * Replaces: frontend/routes/api/2fa/enable.ts (35-45 lines → service call)
   *
   * @throws AppError if 2FA already enabled or not setup
   * @throws AuthenticationError if verification code invalid
   */
  async enable(userId: string, code: string): Promise<TwoFactorEnableResult> {
    const user = await this.getUser(userId);

    if (this.is2FAEnabled(user)) {
      throw new AppError(ErrorCode.TWO_FACTOR_ALREADY_ENABLED);
    }

    if (!user.twoFactorSecret) {
      throw new AppError(ErrorCode.TWO_FACTOR_NOT_ENABLED, '2FA not setup. Call setup() first');
    }

    // Verify TOTP code
    const { isValid } = await this.verifyCode(code, user.twoFactorSecret);
    if (!isValid) {
      throw new AuthenticationError(ErrorCode.INVALID_TWO_FACTOR_CODE);
    }

    // Generate backup codes
    const backupCodes = this.generateBackupCodes(10);

    // Enable 2FA
    await this.userRepo.update(userId, {
      twoFactorEnabled: true,
      twoFactorBackupCodes: backupCodes,
    });

    return { backupCodes };
  }

  /**
   * Disable 2FA with password and code verification
   * Replaces: frontend/routes/api/2fa/disable.ts (40-50 lines → service call)
   *
   * @throws AppError if 2FA not enabled
   * @throws AuthenticationError if password or code invalid
   */
  async disable(userId: string, password: string, code: string): Promise<void> {
    const user = await this.getUser(userId);

    if (!this.is2FAEnabled(user)) {
      throw new AppError(ErrorCode.TWO_FACTOR_NOT_ENABLED);
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(userId, password);
    if (!isPasswordValid) {
      throw new AuthenticationError(ErrorCode.INVALID_CREDENTIALS, 'Invalid password');
    }

    // Verify 2FA code
    const { isValid } = await this.verifyCode(
      code,
      user.twoFactorSecret!,
      user.twoFactorBackupCodes || []
    );
    if (!isValid) {
      throw new AuthenticationError(ErrorCode.INVALID_TWO_FACTOR_CODE);
    }

    // Disable 2FA
    await this.userRepo.update(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: [],
    });
  }

  /**
   * Verify TOTP or backup code during login
   * Replaces: frontend/routes/api/2fa/verify.ts (35-45 lines → service call)
   *
   * @throws AppError if 2FA not enabled
   */
  async verify(userId: string, code: string): Promise<TwoFactorVerifyResult> {
    const user = await this.getUser(userId);

    if (!this.is2FAEnabled(user)) {
      throw new AppError(ErrorCode.TWO_FACTOR_NOT_ENABLED);
    }

    // Verify code
    const { isValid, usedBackupCode } = await this.verifyCode(
      code,
      user.twoFactorSecret!,
      user.twoFactorBackupCodes || []
    );

    if (!isValid) {
      return { isValid: false };
    }

    // If backup code was used, remove it
    if (usedBackupCode) {
      const remainingCodes = (user.twoFactorBackupCodes || [])
        .filter((c) => c !== usedBackupCode);
      
      await this.userRepo.update(userId, {
        twoFactorBackupCodes: remainingCodes,
      });

      return { isValid: true, remainingBackupCodes: remainingCodes.length };
    }

    return { isValid: true };
  }

  /**
   * Regenerate backup codes with password + code verification
   * Replaces: frontend/routes/api/2fa/regenerate-backup-codes.ts (35-45 lines → service call)
   *
   * @throws AppError if 2FA not enabled
   * @throws AuthenticationError if password or code invalid
   */
  async regenerateBackupCodes(
    userId: string,
    password: string,
    code: string
  ): Promise<TwoFactorEnableResult> {
    const user = await this.getUser(userId);

    if (!this.is2FAEnabled(user)) {
      throw new AppError(ErrorCode.TWO_FACTOR_NOT_ENABLED);
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(userId, password);
    if (!isPasswordValid) {
      throw new AuthenticationError(ErrorCode.INVALID_CREDENTIALS, 'Invalid password');
    }

    // Verify TOTP code (only TOTP, not backup codes)
    const isCodeValid = await verifyTOTP(code, user.twoFactorSecret!);
    if (!isCodeValid) {
      throw new AuthenticationError(ErrorCode.INVALID_TWO_FACTOR_CODE);
    }

    // Generate new backup codes
    const backupCodes = this.generateBackupCodes(10);

    // Update backup codes
    await this.userRepo.update(userId, {
      twoFactorBackupCodes: backupCodes,
    });

    return { backupCodes };
  }

  /**
   * Get 2FA status for user
   */
  async getStatus(userId: string): Promise<{
    enabled: boolean;
    hasBackupCodes: boolean;
    backupCodesCount: number;
  }> {
    const user = await this.getUser(userId);

    return {
      enabled: this.is2FAEnabled(user),
      hasBackupCodes: (user.twoFactorBackupCodes?.length || 0) > 0,
      backupCodesCount: user.twoFactorBackupCodes?.length || 0,
    };
  }
}
