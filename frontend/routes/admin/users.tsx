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

export const handler: Handlers<AdminUsersData> = {
  async GET(req, ctx) {
    // User data is injected by middleware - guaranteed to be admin
    const currentUser = ctx.state.user as User;
    const token = ctx.state.token as string;

    const apiUrl = Deno.env.get('API_URL') || 'http://localhost:8000/api';

    try {

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

      // Fetch users list
      const [usersResponse, statsResponse] = await Promise.all([
        fetch(`${apiUrl}/admin/users?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch(`${apiUrl}/admin/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
      ]);

      if (!usersResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch admin data');
      }

      const usersData = await usersResponse.json();
      const statsData = await statsResponse.json();

      return ctx.render({
        users: usersData.data.users,
        pagination: usersData.data.pagination,
        stats: statsData.data,
        currentUser,
      });
    } catch (error) {
      console.error('Admin page error:', error);
      return ctx.render({
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
        error: 'Failed to load admin data',
      });
    }
  },
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
