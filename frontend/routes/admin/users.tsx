/**
 * Admin Users Page
 * Displays all registered users with management capabilities
 */

import { Handlers, PageProps } from '$fresh/server.ts';
import {
  ContentContainer,
  PageContainer,
  PageHeader,
  StatCard
} from '../../components/common/index.ts';
import AdminHeaderActions from '../../islands/AdminHeaderActions.tsx';
import AdminUserTable from '../../islands/AdminUserTable.tsx';
import {
  handleApiFetch,
  hasRole,
  logError,
  withErrorHandler,
} from '../../lib/error-handler.ts';
import { AuthorizationError, getUserMessage } from '../../lib/errors.ts';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  emailVerified: boolean;
  emailVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminUsersData {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: {
    totalUsers: number;
    verifiedUsers: number;
    unverifiedUsers: number;
    adminUsers: number;
    regularUsers: number;
    recentSignups24h: number;
    verificationRate: number;
  };
  currentUser: User;
  error?: string;
}

const defaultData: AdminUsersData = {
  users: [],
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  stats: {
    totalUsers: 0,
    verifiedUsers: 0,
    unverifiedUsers: 0,
    adminUsers: 0,
    regularUsers: 0,
    recentSignups24h: 0,
    verificationRate: 0,
  },
  currentUser: {} as User,
};

export const handler: Handlers<AdminUsersData> = {
  GET: withErrorHandler(async (req, ctx) => {
    // User data is injected by middleware - guaranteed to be admin
    const currentUser = ctx.state.user as User;
    const token = ctx.state.token as string;

    // Double-check admin role
    if (!hasRole(currentUser?.role, 'admin')) {
      // Throw AuthorizationError - withErrorHandler will handle redirect
      throw new AuthorizationError(
        'Admin access required',
        'admin',
        currentUser?.role,
        {
          userId: currentUser?.id,
          email: currentUser?.email,
          attemptedPath: new URL(req.url).pathname,
        }
      );
    }

    const apiUrl = Deno.env.get('API_URL') || 'http://localhost:8000/api';

    // Get query params for filtering/pagination
    const url = new URL(req.url);
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '50';
    const search = url.searchParams.get('search') || '';
    const role = url.searchParams.get('role') || '';
    const verified = url.searchParams.get('verified') || '';

    // Build query string
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(search && { search }),
      ...(role && { role }),
      ...(verified && { verified }),
    });

    // Fetch users list and stats in parallel with error handling
    const [usersResult, statsResult] = await Promise.all([
      handleApiFetch<{ users: User[]; pagination: AdminUsersData['pagination'] }>(
        `${apiUrl}/admin/users?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      ),
      handleApiFetch<AdminUsersData['stats']>(
        `${apiUrl}/admin/stats`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      ),
    ]);

    // Check for errors
    if (usersResult.error || statsResult.error) {
      const error = usersResult.error || statsResult.error;
      
      if (error) {
        logError(error, {
          context: 'admin_users_page',
          usersError: usersResult.error?.message,
          statsError: statsResult.error?.message,
        });

        return ctx.render({
          ...defaultData,
          currentUser,
          error: getUserMessage(error),
        });
      }
    }

    // Success - return data
    return ctx.render({
      users: usersResult.data?.users || [],
      pagination: usersResult.data?.pagination || defaultData.pagination,
      stats: statsResult.data || defaultData.stats,
      currentUser,
    });
  }),
};

export default function AdminUsersPage({ data }: PageProps<AdminUsersData>) {
  if (data.error) {
    return (
      <div class="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 dark:from-purple-900 dark:to-blue-900 flex items-center justify-center p-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 class="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h1>
          <p class="text-gray-700 dark:text-gray-300 mb-6">{data.error}</p>
          <a
            href="/"
            class="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  const { users, pagination, stats, currentUser } = data;

  return (
    <PageContainer>
      <PageHeader
        title="Admin Panel"
        subtitle={`Logged in as ${currentUser.name} (${currentUser.email})`}
        actions={<AdminHeaderActions currentPage="users" />}
      />

      <ContentContainer>
        {/* Stats Dashboard */}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            label="Total Users"
            value={stats.totalUsers}
          />
          <StatCard
            label="Verified"
            value={stats.verifiedUsers}
            valueColor="green"
            subtitle={`${stats.verificationRate}% rate`}
          />
          <StatCard
            label="Admins"
            value={stats.adminUsers}
            valueColor="purple"
          />
          <StatCard
            label="Recent (24h)"
            value={stats.recentSignups24h}
            valueColor="blue"
          />
        </div>

        {/* User Table */}
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
          <AdminUserTable
            users={users}
            pagination={pagination}
            currentUserId={currentUser.id}
          />
        </div>
      </ContentContainer>
    </PageContainer>
  );
}
