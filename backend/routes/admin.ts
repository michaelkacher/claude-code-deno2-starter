/**
 * Admin Routes
 * Endpoints for administrative user management
 */

import { Context, Hono } from 'hono';
import { z } from 'zod';
import { requireAdmin } from '../lib/admin-auth.ts';
import { cacheStrategies } from '../lib/cache-control.ts';
import { getPaginationParams } from '../lib/pagination.ts';
import { revokeAllUserTokens } from '../lib/token-revocation.ts';
import { validateParams, validateQuery } from '../middleware/validate.ts';
import { TokenRepository, UserRepository } from '../repositories/index.ts';
import { ListUsersQuerySchema, UserIdParamSchema } from '../types/user.ts';

const admin = new Hono();

// All admin routes require admin role
admin.use('*', requireAdmin());

/**
 * GET /api/admin/users
 * List all users with optional filtering and pagination
 */
admin.get('/users', cacheStrategies.adminData(), validateQuery(ListUsersQuerySchema), async (c: Context) => {
  try {
    const userRepo = new UserRepository();
    
    // Get pagination params with enforced limits
    const pagination = getPaginationParams(c, { maxLimit: 100, defaultLimit: 10 });
    
    const query = c.get('validatedQuery') as {
      page?: number;
      search?: string;
      role?: 'admin' | 'user';
      emailVerified?: boolean;
    };
    
    const page = query.page || 1;
    const searchLower = query.search?.toLowerCase() || '';

    // Get all users using repository
    const allUsersResult = await userRepo.listUsers({ limit: 10000 });
    let users = allUsersResult.items;

    // Apply filters
    if (searchLower) {
      users = users.filter(user => 
        user.email.toLowerCase().includes(searchLower) ||
        user.name.toLowerCase().includes(searchLower) ||
        user.id.toLowerCase().includes(searchLower)
      );
    }

    if (query.role) {
      users = users.filter(user => user.role === query.role);
    }

    if (query.emailVerified !== undefined) {
      users = users.filter(user => user.emailVerified === query.emailVerified);
    }

    // Remove password from results
    const usersWithoutPassword = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    // Sort by creation date (newest first)
    usersWithoutPassword.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination with enforced limits
    const total = usersWithoutPassword.length;
    const totalPages = Math.ceil(total / pagination.limit);
    const startIndex = (page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const paginatedUsers = usersWithoutPassword.slice(startIndex, endIndex);

    return c.json({
      data: {
        users: paginatedUsers,
        pagination: {
          page,
          limit: pagination.limit, // Return enforced limit
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    return c.json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch users'
      }
    }, 500);
  }
});

/**
 * GET /api/admin/users/:id
 * Get detailed information about a specific user
 */
admin.get('/users/:id', async (c: Context) => {
  try {
    const userRepo = new UserRepository();
    const tokenRepo = new TokenRepository();
    const userId = c.req.param('id');
    
    const user = await userRepo.findById(userId);

    if (!user) {
      return c.json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      }, 404);
    }

    const { password, ...userWithoutPassword } = user;

    // Get user's refresh tokens count
    const refreshTokens = await tokenRepo.listUserRefreshTokens(userId);
    const activeSessionsCount = refreshTokens.length;

    return c.json({
      data: {
        user: userWithoutPassword,
        activeSessions: activeSessionsCount
      }
    });
  } catch (error) {
    return c.json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch user details'
      }
    }, 500);
  }
});

/**
 * PATCH /api/admin/users/:id/role
 * Update a user's role
 */
admin.patch('/users/:id/role', async (c: Context) => {
  try {
    const userRepo = new UserRepository();
    const userId = c.req.param('id');
    const body = await c.req.json();
    const { role } = z.object({
      role: z.enum(['admin', 'user'])
    }).parse(body);

    const updatedUser = await userRepo.update(userId, { role });
    
    if (!updatedUser) {
      return c.json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      }, 404);
    }

    const { password, ...userWithoutPassword } = updatedUser;

    return c.json({
      data: {
        user: userWithoutPassword,
        message: `User role updated to ${role}`
      }
    });
  } catch (error) {
    return c.json({
      error: {
        code: 'BAD_REQUEST',
        message: error.message
      }
    }, 400);
  }
});

/**
 * PATCH /api/admin/users/:id/verify-email
 * Manually verify a user's email
 */
admin.patch('/users/:id/verify-email', async (c: Context) => {
  try {
    const userRepo = new UserRepository();
    const userId = c.req.param('id');
    
    const user = await userRepo.findById(userId);

    if (!user) {
      return c.json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      }, 404);
    }
    
    if (user.emailVerified) {
      return c.json({
        error: {
          code: 'ALREADY_VERIFIED',
          message: 'Email is already verified'
        }
      }, 400);
    }

    const updatedUser = await userRepo.verifyEmail(userId);

    const { password, ...userWithoutPassword } = updatedUser!;

    return c.json({
      data: {
        user: userWithoutPassword,
        message: 'Email verified successfully'
      }
    });
  } catch (error) {
    return c.json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to verify email'
      }
    }, 500);
  }
});

/**
 * POST /api/admin/users/:id/revoke-sessions
 * Revoke all active sessions for a user
 */
admin.post('/users/:id/revoke-sessions', async (c: Context) => {
  try {
    const userRepo = new UserRepository();
    const userId = c.req.param('id');
    
    const user = await userRepo.findById(userId);

    if (!user) {
      return c.json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      }, 404);
    }

    await revokeAllUserTokens(userId);

    return c.json({
      data: {
        message: 'All sessions revoked successfully'
      }
    });
  } catch (error) {
    return c.json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to revoke sessions'
      }
    }, 500);
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user and all associated data
 */
admin.delete('/users/:id', validateParams(UserIdParamSchema), async (c: Context) => {
  try {
    const userRepo = new UserRepository();
    const { id: userId } = c.get('validatedParams') as { id: string };
    const currentUser = c.get('user');

    // Prevent deleting yourself
    if (userId === currentUser.id) {
      return c.json({
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot delete your own account'
        }
      }, 403);
    }

    const deleted = await userRepo.deleteUser(userId);
    
    if (!deleted) {
      return c.json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      }, 404);
    }

    // Revoke all user sessions
    await revokeAllUserTokens(userId);

    return c.json({
      data: {
        message: 'User deleted successfully'
      }
    });
  } catch (error) {
    return c.json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete user'
      }
    }, 500);
  }
});

/**
 * GET /api/admin/stats
 * Get admin dashboard statistics
 */
admin.get('/stats', cacheStrategies.adminData(), async (c: Context) => {
  try {
    const userRepo = new UserRepository();
    const stats = await userRepo.getStats();

    // Calculate recent signups (last 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const allUsers = await userRepo.listUsers({ limit: 10000 });
    const recentSignups = allUsers.items.filter(user => 
      new Date(user.createdAt).getTime() > oneDayAgo
    ).length;

    return c.json({
      data: {
        totalUsers: stats.totalUsers,
        verifiedUsers: stats.verifiedCount,
        unverifiedUsers: stats.totalUsers - stats.verifiedCount,
        adminUsers: stats.adminCount,
        regularUsers: stats.userCount,
        recentSignups24h: recentSignups,
        verificationRate: stats.totalUsers > 0 ? Math.round((stats.verifiedCount / stats.totalUsers) * 100) : 0
      }
    });
  } catch (error) {
    return c.json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch stats'
      }
    }, 500);
  }
});

export default admin;
