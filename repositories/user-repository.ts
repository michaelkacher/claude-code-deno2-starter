import { hashPassword } from '../lib/password.ts';
import { User } from '../types/user.ts';
import { BaseRepository, ListOptions, ListResult, RepositoryOptions } from './base-repository.ts';

/**
 * User Repository
 * 
 * Handles all user data access operations:
 * - CRUD operations
 * - Email-based lookups
 * - Role filtering
 * - 2FA management
 */
export class UserRepository extends BaseRepository<User> {
  constructor(options: RepositoryOptions = {}) {
    super('User', options);
  }

  /**
   * Find user by ID
   */
  async findById(userId: string): Promise<User | null> {
    return await this.get(['users', userId]);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const kv = await this.getKv();
      
      // First get the userId from the email index
      const userIdEntry = await kv.get<string>(['users_by_email', email]);
      
      if (!userIdEntry.value) {
        this.logger.debug('User not found by email', { email });
        return null;
      }
      
      // Then get the actual user
      return await this.findById(userIdEntry.value);
    } catch (error) {
      this.logger.error('Error finding user by email', { email, error });
      throw error;
    }
  }

  /**
   * Create a new user
   * Automatically creates email index and hashes password
   */
  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const userId = crypto.randomUUID();
      const now = new Date().toISOString();
      
      // Hash password if not already hashed (PBKDF2 format: iterations$salt$hash)
      const hashedPassword = this.isPasswordHashed(userData.password)
        ? userData.password
        : await hashPassword(userData.password);
      
      const user: User = {
        ...userData,
        id: userId,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      };

      const kv = await this.getKv();
      
      // Use atomic operation to ensure both records are created together
      const result = await kv.atomic()
        .check({ key: ['users_by_email', userData.email], versionstamp: null }) // Ensure email doesn't exist
        .set(['users', userId], user)
        .set(['users_by_email', userData.email], userId)
        .commit();

      if (!result.ok) {
        throw new Error(`Email already exists: ${userData.email}`);
      }

      this.logger.info('User created', { userId, email: userData.email });
      return user;
    } catch (error) {
      this.logger.error('Error creating user', { email: userData.email, error });
      throw error;
    }
  }

  /**
   * Update an existing user
   * Handles email change by updating the index
   */
  async update(userId: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    try {
      const existingUser = await this.findById(userId);
      
      if (!existingUser) {
        this.logger.warn('Cannot update non-existent user', { userId });
        return null;
      }

      const updatedUser: User = {
        ...existingUser,
        ...updates,
        id: userId, // Ensure ID is not changed
        createdAt: existingUser.createdAt, // Preserve creation date
        updatedAt: new Date().toISOString(),
      };

      const kv = await this.getKv();
      
      // If email changed, update the email index
      if (updates.email && updates.email !== existingUser.email) {
        const atomic = kv.atomic()
          .check({ key: ['users_by_email', updates.email], versionstamp: null }) // Ensure new email doesn't exist
          .set(['users', userId], updatedUser)
          .set(['users_by_email', updates.email], userId)
          .delete(['users_by_email', existingUser.email]);
        
        const result = await atomic.commit();
        
        if (!result.ok) {
          throw new Error(`Email already exists: ${updates.email}`);
        }
      } else {
        // No email change, just update user
        await this.set(['users', userId], updatedUser);
      }

      this.logger.info('User updated', { userId });
      return updatedUser;
    } catch (error) {
      this.logger.error('Error updating user', { userId, error });
      throw error;
    }
  }

  /**
   * Delete a user
   * Also removes email index and associated data
   */
  async deleteUser(userId: string): Promise<boolean> {
    try {
      const user = await this.findById(userId);
      
      if (!user) {
        this.logger.warn('Cannot delete non-existent user', { userId });
        return false;
      }

      const kv = await this.getKv();
      
      // Delete user and email index atomically
      await kv.atomic()
        .delete(['users', userId])
        .delete(['users_by_email', user.email])
        .commit();

      this.logger.info('User deleted', { userId, email: user.email });
      return true;
    } catch (error) {
      this.logger.error('Error deleting user', { userId, error });
      throw error;
    }
  }

  /**
   * List all users with pagination
   */
  async listUsers(options: ListOptions = {}): Promise<ListResult<User>> {
    return await this.list(['users'], options);
  }

  /**
   * List users by role
   */
  async listByRole(role: 'admin' | 'user', options: ListOptions = {}): Promise<ListResult<User>> {
    try {
      const allUsers = await this.listUsers({ limit: 1000 }); // Get all users (consider pagination for large datasets)
      const filteredUsers = allUsers.items.filter(user => user.role === role);
      
      // Apply limit if specified
      const limit = options.limit || filteredUsers.length;
      const items = filteredUsers.slice(0, limit);
      
      return {
        items,
        cursor: null,
        hasMore: false,
      };
    } catch (error) {
      this.logger.error('Error listing users by role', { role, error });
      throw error;
    }
  }

  /**
   * Count total users
   */
  async countUsers(): Promise<number> {
    return await this.count(['users']);
  }

  /**
   * Count users by role
   */
  async countByRole(role: 'admin' | 'user'): Promise<number> {
    try {
      const users = await this.listByRole(role, { limit: 1000 });
      return users.items.length;
    } catch (error) {
      this.logger.error('Error counting users by role', { role, error });
      throw error;
    }
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    return await this.exists(['users_by_email', email]);
  }

  /**
   * Enable 2FA for user
   */
  async enable2FA(userId: string, secret: string, backupCodes: string[]): Promise<User | null> {
    return await this.update(userId, {
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      twoFactorBackupCodes: backupCodes,
    });
  }

  /**
   * Disable 2FA for user
   */
  async disable2FA(userId: string): Promise<User | null> {
    return await this.update(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: [],
    });
  }

  /**
   * Verify user's email
   */
  async verifyEmail(userId: string): Promise<User | null> {
    return await this.update(userId, {
      emailVerified: true,
      emailVerifiedAt: new Date().toISOString(),
    });
  }

  /**
   * Update password
   */
  async updatePassword(userId: string, newPassword: string): Promise<User | null> {
    const hashedPassword = await hashPassword(newPassword);
    return await this.update(userId, {
      password: hashedPassword,
    });
  }

  /**
   * Get user stats (admin dashboard)
   */
  async getStats(): Promise<{
    totalUsers: number;
    adminCount: number;
    userCount: number;
    verifiedCount: number;
    twoFactorCount: number;
  }> {
    try {
      const allUsers = await this.listUsers({ limit: 10000 });
      const users = allUsers.items;
      
      return {
        totalUsers: users.length,
        adminCount: users.filter(u => u.role === 'admin').length,
        userCount: users.filter(u => u.role === 'user').length,
        verifiedCount: users.filter(u => u.emailVerified).length,
        twoFactorCount: users.filter(u => u.twoFactorEnabled).length,
      };
    } catch (error) {
      this.logger.error('Error getting user stats', { error });
      throw error;
    }
  }

  /**
   * Check if a password is already hashed
   * PBKDF2 format: iterations$salt$hash (e.g., "100000$abcd1234$efgh5678")
   * Legacy bcrypt format: $2a$ or $2b$ (deprecated, for backwards compatibility only)
   */
  private isPasswordHashed(password: string): boolean {
    // PBKDF2 format check (current standard)
    const pbkdf2Pattern = /^\d+\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/;
    if (pbkdf2Pattern.test(password)) {
      return true;
    }
    
    // Legacy bcrypt format check (backwards compatibility)
    if (password.startsWith('$2a$') || password.startsWith('$2b$')) {
      this.logger.warn('Legacy bcrypt hash detected - consider migrating to PBKDF2');
      return true;
    }
    
    return false;
  }
}
