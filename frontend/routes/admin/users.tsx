/**
 * Admin Users Page
 * Displays all registered users with management capabilities
 */

import { Handlers, PageProps } from '$fresh/server.ts';
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
    // Check if user is authenticated and is admin
    const token = req.headers.get('cookie')?.split('; ')
      .find((c) => c.startsWith('auth_token='))
      ?.split('=')[1];

    if (!token) {
      // Not logged in - redirect to login
      return new Response(null, {
        status: 302,
        headers: { location: '/login?redirect=/admin/users' },
      });
    }

    const apiUrl = Deno.env.get('API_URL') || 'http://localhost:8000/api';

    try {
      // Fetch current user to verify admin status
      const userResponse = await fetch(`${apiUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!userResponse.ok) {
        // Invalid token - redirect to login
        return new Response(null, {
          status: 302,
          headers: { location: '/login?redirect=/admin/users' },
        });
      }

      const userData = await userResponse.json();
      const currentUser = userData.data.user;

      // Check if user is admin
      if (currentUser.role !== 'admin') {
        // Not an admin - redirect to home with error
        return new Response(null, {
          status: 302,
          headers: { location: '/?error=unauthorized' },
        });
      }

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
      <div class="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center p-4">
        <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 class="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p class="text-gray-700 mb-6">{data.error}</p>
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
    <div class="min-h-screen bg-gray-50">
      {/* Header */}
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p class="mt-1 text-sm text-gray-500">
                Logged in as {currentUser.name} ({currentUser.email})
              </p>
            </div>
            <div class="flex gap-4">
              <a
                href="/admin/data"
                class="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Data Browser
              </a>
              <a
                href="/"
                class="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                ← Back to Home
              </a>
              <button
                onClick={() => {
                  document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                  localStorage.clear();
                  window.location.href = '/login';
                }}
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Dashboard */}
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-sm font-medium text-gray-500 uppercase">Total Users</h3>
            <p class="mt-2 text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-sm font-medium text-gray-500 uppercase">Verified</h3>
            <p class="mt-2 text-3xl font-bold text-green-600">{stats.verifiedUsers}</p>
            <p class="mt-1 text-sm text-gray-500">{stats.verificationRate}% rate</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-sm font-medium text-gray-500 uppercase">Admins</h3>
            <p class="mt-2 text-3xl font-bold text-purple-600">{stats.adminUsers}</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-sm font-medium text-gray-500 uppercase">Recent (24h)</h3>
            <p class="mt-2 text-3xl font-bold text-blue-600">{stats.recentSignups24h}</p>
          </div>
        </div>

        {/* User Table */}
        <div class="bg-white rounded-lg shadow">
          <AdminUserTable
            users={users}
            pagination={pagination}
            currentUserId={currentUser.id}
          />
        </div>
      </div>
    </div>
  );
}
