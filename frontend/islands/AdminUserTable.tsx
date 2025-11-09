/**
 * Admin User Table Island
 * Interactive table for managing users with filtering, sorting, and actions
 */

import { useSignal } from '@preact/signals';

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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface Props {
  users: User[];
  pagination: Pagination;
  currentUserId: string;
}

export default function AdminUserTable({ users: initialUsers, pagination: initialPagination, currentUserId }: Props) {
  const users = useSignal<User[]>(initialUsers);
  const pagination = useSignal<Pagination>(initialPagination);
  const search = useSignal('');
  const roleFilter = useSignal('');
  const verifiedFilter = useSignal('');
  const loading = useSignal(false);
  const error = useSignal('');
  const success = useSignal('');

  // Get token from cookie
  const getToken = () => {
    const token = document.cookie.split('; ')
      .find((c) => c.startsWith('auth_token='))
      ?.split('=')[1];
    return token;
  };

  // Fetch users with filters
  const fetchUsers = async (page = 1) => {
    loading.value = true;
    error.value = '';

    try {
      const apiUrl = window.location.origin;
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.value.limit.toString(),
      });

      if (search.value) params.append('search', search.value);
      if (roleFilter.value) params.append('role', roleFilter.value);
      if (verifiedFilter.value) params.append('verified', verifiedFilter.value);

      const token = getToken();
      const response = await fetch(`${apiUrl}/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      users.value = data.data.users;
      pagination.value = data.data.pagination;

      // Update URL without reload
      const newUrl = `/admin/users?${params}`;
      window.history.pushState({}, '', newUrl);
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Change user role
  const changeRole = async (userId: string, newRole: 'admin' | 'user') => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    loading.value = true;
    error.value = '';
    success.value = '';

    try {
      const apiUrl = window.location.origin;
      const token = getToken();
      const response = await fetch(`${apiUrl}/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to change user role');
      }

      success.value = `User role changed to ${newRole}`;
      await fetchUsers(pagination.value.page);
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Verify email
  const verifyEmail = async (userId: string) => {
    if (!confirm('Manually verify this user\'s email?')) {
      return;
    }

    loading.value = true;
    error.value = '';
    success.value = '';

    try {
      const apiUrl = window.location.origin;
      const token = getToken();
      const response = await fetch(`${apiUrl}/api/admin/users/${userId}/verify-email`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to verify email');
      }

      success.value = 'Email verified successfully';
      await fetchUsers(pagination.value.page);
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Revoke all sessions
  const revokeSessions = async (userId: string) => {
    if (!confirm('Revoke all active sessions for this user? They will be logged out.')) {
      return;
    }

    loading.value = true;
    error.value = '';
    success.value = '';

    try {
      const apiUrl = window.location.origin;
      const token = getToken();
      const response = await fetch(`${apiUrl}/api/admin/users/${userId}/revoke-sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to revoke sessions');
      }

      success.value = 'All sessions revoked successfully';
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Delete user
  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete this user? This action cannot be undone.`)) {
      return;
    }

    loading.value = true;
    error.value = '';
    success.value = '';

    try {
      const apiUrl = window.location.origin;
      const token = getToken();
      const response = await fetch(`${apiUrl}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to delete user');
      }

      success.value = `User "${userName}" deleted successfully`;
      await fetchUsers(pagination.value.page);
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div class="p-6">
      {/* Messages */}
      {error.value && (
        <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-800">{error.value}</p>
        </div>
      )}
      {success.value && (
        <div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p class="text-green-800">{success.value}</p>
        </div>
      )}

      {/* Filters */}
      <div class="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
          <input
            type="text"
            placeholder="Name, email, or ID..."
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={search.value}
            onInput={(e) => search.value = (e.target as HTMLInputElement).value}
            onKeyPress={(e) => e.key === 'Enter' && fetchUsers(1)}
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
          <select
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={roleFilter.value}
            onChange={(e) => {
              roleFilter.value = (e.target as HTMLSelectElement).value;
              fetchUsers(1);
            }}
          >
            <option value="">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Status</label>
          <select
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={verifiedFilter.value}
            onChange={(e) => {
              verifiedFilter.value = (e.target as HTMLSelectElement).value;
              fetchUsers(1);
            }}
          >
            <option value="">All Users</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
        </div>
      </div>

      <div class="mb-4 flex justify-between items-center">
        <button
          type="button"
          onClick={() => fetchUsers(pagination.value.page)}
          class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          disabled={loading.value}
        >
          {loading.value ? 'Loading...' : 'Apply Filters'}
        </button>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Showing {users.value.length} of {pagination.value.total} users
        </p>
      </div>

      {/* Table */}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                User
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Role
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Email Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Created
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {users.value.map((user) => (
              <tr key={user.id} class={user.id === currentUserId ? 'bg-purple-50 dark:bg-purple-900/20' : ''}>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.name}
                      {user.id === currentUserId && (
                        <span class="ml-2 px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">You</span>
                      )}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                    <div class="text-xs text-gray-400 dark:text-gray-500 font-mono">{user.id.slice(0, 8)}...</div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class={`px-2 py-1 text-xs font-semibold rounded ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class={`px-2 py-1 text-xs font-semibold rounded ${
                    user.emailVerified
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                  }`}>
                    {user.emailVerified ? '✓ Verified' : '⚠ Unverified'}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(user.createdAt)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <div class="flex gap-2">
                    {/* Role Toggle */}
                    {user.id !== currentUserId && (
                      <button
                        type="button"
                        onClick={() => changeRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                        class="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300"
                        title={user.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                      >
                        {user.role === 'admin' ? '↓' : '↑'}
                      </button>
                    )}

                    {/* Verify Email */}
                    {!user.emailVerified && (
                      <button
                        type="button"
                        onClick={() => verifyEmail(user.id)}
                        class="text-green-600 hover:text-green-900"
                        title="Verify email"
                      >
                        ✓
                      </button>
                    )}

                    {/* Revoke Sessions */}
                    <button
                      type="button"
                      onClick={() => revokeSessions(user.id)}
                      class="text-orange-600 hover:text-orange-900"
                      title="Revoke all sessions"
                    >
                      🔒
                    </button>

                    {/* Delete User */}
                    {user.id !== currentUserId && (
                      <button
                        type="button"
                        onClick={() => deleteUser(user.id, user.name)}
                        class="text-red-600 hover:text-red-900"
                        title="Delete user"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.value.totalPages > 1 && (
        <div class="mt-6 flex justify-between items-center">
          <button
            type="button"
            onClick={() => fetchUsers(pagination.value.page - 1)}
            disabled={!pagination.value.hasPrev || loading.value}
            class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <span class="text-sm text-gray-600 dark:text-gray-400">
            Page {pagination.value.page} of {pagination.value.totalPages}
          </span>
          <button
            type="button"
            onClick={() => fetchUsers(pagination.value.page + 1)}
            disabled={!pagination.value.hasNext || loading.value}
            class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
