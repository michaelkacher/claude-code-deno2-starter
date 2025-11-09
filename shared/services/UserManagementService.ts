/**
 * User Management Service
 *
 * Centralizes user management operations to eliminate 100-150 duplicate lines across admin routes.
 * Handles admin checks, user lookup, role updates, and user operations.
 */

import { TokenRepository, UserRepository } from "../repositories/index.ts";
import { ErrorCode } from "../lib/error-codes.ts";
import {
  AppError,
  NotFoundError,
  AuthorizationError,
} from "../../frontend/lib/errors.ts";

export interface UserListOptions {
  limit?: number;
  role?: "user" | "admin";
}

export interface UserListResult {
  users: SanitizedUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SanitizedUser {
  id: string;
  email: string;
  name?: string;
  role: "user" | "admin";
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DetailedUser extends SanitizedUser {
  twoFactorSecret: string | null;
  activeSessions: number;
}

export class UserManagementService {
  private userRepo: UserRepository;
  private tokenRepo: TokenRepository;

  constructor() {
    this.userRepo = new UserRepository();
    this.tokenRepo = new TokenRepository();
  }

  /**
   * Get user and validate they exist
   * Eliminates duplicate user lookup + null check pattern (5+ occurrences)
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
   * Prevent admin from performing actions on themselves
   * Eliminates duplicate self-action checks (2+ occurrences)
   *
   * @throws AuthorizationError if admin tries to perform action on themselves
   */
  private preventSelfAction(userId: string, adminId: string, action: string): void {
    if (userId === adminId) {
      throw new AuthorizationError(`Cannot ${action} your own account`);
    }
  }

  /**
   * Sanitize user object (remove sensitive fields)
   * Eliminates duplicate sanitization logic (3+ occurrences)
   */
  private sanitizeUser(user: {
    id: string;
    email: string;
    name?: string;
    role: "user" | "admin";
    emailVerified: boolean;
    twoFactorEnabled: boolean;
    createdAt: string;
    updatedAt: string;
    password?: string;
    twoFactorSecret?: string | null;
    twoFactorBackupCodes?: string[];
  }): SanitizedUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * List all users with optional filtering
   * Replaces: frontend/routes/api/admin/users/index.ts (30-40 lines → service call)
   */
  async listUsers(options: UserListOptions = {}): Promise<UserListResult> {
    const limit = options.limit || 100;
    const role = options.role;

    // Get users
    const result = await this.userRepo.listUsers({ limit });
    let users = result.items;

    // Filter by role if specified
    if (role) {
      users = users.filter((u) => u.role === role);
    }

    // Sanitize users
    const sanitizedUsers = users.map((user) => this.sanitizeUser(user));

    return {
      users: sanitizedUsers,
      pagination: {
        page: 1,
        limit,
        total: sanitizedUsers.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  /**
   * Get detailed user information
   * Replaces: frontend/routes/api/admin/users/[id].ts (20-30 lines → service call)
   */
  async getUserDetails(userId: string): Promise<DetailedUser> {
    const user = await this.getUser(userId);

    // Get user's active sessions
    const tokens = await this.tokenRepo.listUserRefreshTokens(userId);

    return {
      ...this.sanitizeUser(user),
      twoFactorSecret: user.twoFactorSecret ? "***MASKED***" : null,
      activeSessions: tokens.length,
    };
  }

  /**
   * Delete user account (prevents self-deletion)
   * Replaces: frontend/routes/api/admin/users/[id]/index.ts (20-30 lines → service call)
   */
  async deleteUser(userId: string, adminId: string): Promise<void> {
    this.preventSelfAction(userId, adminId, "delete");

    // Check if user exists
    await this.getUser(userId);

    // Delete user (also removes email index)
    await this.userRepo.deleteUser(userId);
  }

  /**
   * Update user's role (prevents self-demotion)
   * Replaces: frontend/routes/api/admin/users/[id]/role.ts (20-30 lines → service call)
   *
   * @throws AuthorizationError if admin tries to demote themselves
   */
  async updateUserRole(
    userId: string,
    role: "user" | "admin",
    adminId: string
  ): Promise<void> {
    // Prevent self-demotion
    if (userId === adminId && role === "user") {
      throw new AuthorizationError('Cannot demote yourself from admin');
    }

    // Check if user exists
    await this.getUser(userId);

    // Update role
    await this.userRepo.update(userId, { role });
  }

  /**
   * Admin-initiated email verification
   * Replaces: frontend/routes/api/admin/users/[id]/verify-email.ts (15-25 lines → service call)
   *
   * @throws AppError if email already verified
   */
  async verifyUserEmail(userId: string): Promise<void> {
    const user = await this.getUser(userId);

    // Check if already verified
    if (user.emailVerified) {
      throw new AppError(ErrorCode.EMAIL_NOT_VERIFIED, 'Email is already verified');
    }

    // Verify email
    await this.userRepo.verifyEmail(userId);
  }

  /**
   * Revoke all user's sessions (logout from all devices)
   * Replaces: frontend/routes/api/admin/users/[id]/sessions.ts (10-20 lines → service call)
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    // Note: Don't check if user exists - allow revoking tokens even if user deleted
    await this.tokenRepo.revokeAllUserRefreshTokens(userId);
  }

  /**
   * Get user count by role (for stats)
   */
  async getUserStats(): Promise<{
    total: number;
    admins: number;
    users: number;
    verified: number;
    twoFactorEnabled: number;
  }> {
    const result = await this.userRepo.listUsers({ limit: 1000 });
    const users = result.items;

    return {
      total: users.length,
      admins: users.filter((u) => u.role === "admin").length,
      users: users.filter((u) => u.role === "user").length,
      verified: users.filter((u) => u.emailVerified).length,
      twoFactorEnabled: users.filter((u) => u.twoFactorEnabled).length,
    };
  }
}
