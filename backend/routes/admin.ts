/**
 * Admin Routes
 * Endpoints for administrative user management
 */

import { Context, Hono } from 'hono';
import { z } from 'zod';
import { requireAdmin } from '../lib/admin-auth.ts';
import { getKv } from '../lib/kv.ts';
import { revokeAllUserTokens } from '../lib/token-revocation.ts';
import { validateParams, validateQuery } from '../middleware/validate.ts';
import { ListUsersQuerySchema, UserIdParamSchema } from '../types/user.ts';

const admin = new Hono();
const kv = await getKv();

// All admin routes require admin role
admin.use('*', requireAdmin());

/**
 * GET /api/admin/users
 * List all users with optional filtering and pagination
 */
admin.get('/users', validateQuery(ListUsersQuerySchema), async (c: Context) => {
  try {
    const { page, limit, search, role, emailVerified } = c.get('validatedQuery') as {
      page: number;
      limit: number;
      search?: string;
      role?: 'admin' | 'user';
      emailVerified?: boolean;
    };
    const searchLower = search?.toLowerCase() || '';

    const users: any[] = [];
    const allUsers = kv.list({ prefix: ['users'] });

    for await (const entry of allUsers) {
      const user = entry.value as any;
      
      // Apply filters
      if (searchLower && !(
        user.email.toLowerCase().includes(searchLower) ||
        user.name.toLowerCase().includes(searchLower) ||
        user.id.toLowerCase().includes(searchLower)
      )) {
        continue;
      }

      if (role && user.role !== role) {
        continue;
      }

      if (emailVerified !== undefined && user.emailVerified !== emailVerified) {
        continue;
      }

      // Don't send password hash to frontend
      const { password, ...userWithoutPassword } = user;
      users.push(userWithoutPassword);
    }

    // Sort by creation date (newest first)
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const total = users.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = users.slice(startIndex, endIndex);

    return c.json({
      data: {
        users: paginatedUsers,
        pagination: {
          page,
          limit,
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
    const userId = c.req.param('id');
    const userEntry = await kv.get(['users', userId]);

    if (!userEntry.value) {
      return c.json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      }, 404);
    }

    const user = userEntry.value as any;
    const { password, ...userWithoutPassword } = user;

    // Get user's refresh tokens count
    const refreshTokens = kv.list({ prefix: ['refresh_tokens', userId] });
    let activeSessionsCount = 0;
    for await (const _token of refreshTokens) {
      activeSessionsCount++;
    }

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
    const userId = c.req.param('id');
    const body = await c.req.json();
    const { role } = z.object({
      role: z.enum(['admin', 'user'])
    }).parse(body);

    const userEntry = await kv.get(['users', userId]);
    if (!userEntry.value) {
      return c.json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      }, 404);
    }

    const user = userEntry.value as any;
    const updatedUser = {
      ...user,
      role,
      updatedAt: new Date().toISOString()
    };

    await kv.set(['users', userId], updatedUser);

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
    const userId = c.req.param('id');
    const userEntry = await kv.get(['users', userId]);

    if (!userEntry.value) {
      return c.json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      }, 404);
    }

    const user = userEntry.value as any;
    
    if (user.emailVerified) {
      return c.json({
        error: {
          code: 'ALREADY_VERIFIED',
          message: 'Email is already verified'
        }
      }, 400);
    }

    const now = new Date().toISOString();
    const updatedUser = {
      ...user,
      emailVerified: true,
      emailVerifiedAt: now,
      updatedAt: now
    };

    await kv.set(['users', userId], updatedUser);

    const { password, ...userWithoutPassword } = updatedUser;

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
    const userId = c.req.param('id');
    const userEntry = await kv.get(['users', userId]);

    if (!userEntry.value) {
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

    const userEntry = await kv.get(['users', userId]);
    if (!userEntry.value) {
      return c.json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      }, 404);
    }

    const user = userEntry.value as any;

    // Delete user data atomically
    const atomic = kv.atomic();
    atomic.delete(['users', userId]);
    atomic.delete(['users_by_email', user.email]);
    
    const result = await atomic.commit();

    if (!result.ok) {
      return c.json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete user'
        }
      }, 500);
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
admin.get('/stats', async (c: Context) => {
  try {
    let totalUsers = 0;
    let verifiedUsers = 0;
    let adminUsers = 0;
    let recentSignups = 0;

    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const users = kv.list({ prefix: ['users'] });

    for await (const entry of users) {
      const user = entry.value as any;
      totalUsers++;
      
      if (user.emailVerified) {
        verifiedUsers++;
      }
      
      if (user.role === 'admin') {
        adminUsers++;
      }
      
      if (new Date(user.createdAt).getTime() > oneDayAgo) {
        recentSignups++;
      }
    }

    return c.json({
      data: {
        totalUsers,
        verifiedUsers,
        unverifiedUsers: totalUsers - verifiedUsers,
        adminUsers,
        regularUsers: totalUsers - adminUsers,
        recentSignups24h: recentSignups,
        verificationRate: totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0
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
