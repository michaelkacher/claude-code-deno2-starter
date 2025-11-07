import { Handlers, PageProps } from "$fresh/server.ts";
import {
  extractAuthToken,
  handleApiFetch,
  logError,
  withErrorHandler
} from "../lib/error-handler.ts";
import { AuthenticationError, getUserMessage } from "../lib/errors.ts";

interface ProfileData {
  user: {
    email: string;
    role: string;
    createdAt: string;
    emailVerified: boolean;
    twoFactorEnabled: boolean;
  } | null;
  error?: string;
}

export const handler: Handlers<ProfileData> = {
  GET: withErrorHandler(async (req, ctx) => {
    const authToken = extractAuthToken(req);

    if (!authToken) {
      throw new AuthenticationError('Authentication required', 'missing_token');
    }

    // Fetch user profile from Fresh API with error handling
    const { data, error } = await handleApiFetch<{ user: ProfileData['user'] }>(
      `/api/auth/me`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    if (error) {
      logError(error, {
        context: 'profile_fetch',
        url: req.url,
      });

      // If auth error, throw to be handled by withErrorHandler
      if (error instanceof AuthenticationError) {
        throw error;
      }

      // Otherwise render with error message
      return ctx.render({ user: null, error: getUserMessage(error) });
    }

    return ctx.render({ user: data?.user || null });
  }),
};

export default function Profile({ data }: PageProps<ProfileData>) {
  const { user, error } = data;

  if (!user) {
    return (
      <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div class="sm:mx-auto sm:w-full sm:max-w-md">
          <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div class="text-center">
              <svg class="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 class="mt-4 text-center text-2xl font-bold text-gray-900">
                Unable to load profile
              </h2>
              {error && (
                <div class="mt-3 bg-red-50 border border-red-200 rounded-md p-3">
                  <p class="text-sm text-red-800">{error}</p>
                </div>
              )}
              <p class="mt-4 text-center text-sm text-gray-600">
                Please try{' '}
                <a href="/login" class="font-medium text-blue-600 hover:text-blue-500">
                  logging in again
                </a>
                {' or '}
                <a href="/" class="font-medium text-blue-600 hover:text-blue-500">
                  return home
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto">
        {/* Header */}
        <div class="bg-white shadow rounded-lg mb-6">
          <div class="px-6 py-4 border-b border-gray-200">
            <h1 class="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p class="mt-1 text-sm text-gray-600">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        {/* Profile Information */}
        <div class="bg-white shadow rounded-lg mb-6">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-medium text-gray-900">Account Information</h2>
          </div>
          <div class="px-6 py-4 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Email</label>
                <p class="mt-1 text-sm text-gray-900">{user.email}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Role</label>
                <p class="mt-1 text-sm text-gray-900 capitalize">{user.role}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Member Since</label>
                <p class="mt-1 text-sm text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Email Status</label>
                <div class="mt-1 flex items-center">
                  {user.emailVerified ? (
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Verified
                    </span>
                  ) : (
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      ⚠ Unverified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div class="bg-white shadow rounded-lg mb-6">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-medium text-gray-900">Security Settings</h2>
          </div>
          <div class="px-6 py-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-gray-900">Two-Factor Authentication</h3>
                <p class="text-sm text-gray-600">
                  {user.twoFactorEnabled 
                    ? 'Extra security for your account is enabled' 
                    : 'Add an extra layer of security to your account'
                  }
                </p>
              </div>
              <div class="flex items-center">
                {user.twoFactorEnabled ? (
                  <>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-3">
                      ✓ Enabled
                    </span>
                    <a
                      href="/2fa/setup"
                      class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Manage
                    </a>
                  </>
                ) : (
                  <>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-3">
                      Disabled
                    </span>
                    <a
                      href="/2fa/setup"
                      class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Enable
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div class="bg-white shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-medium text-gray-900">Quick Actions</h2>
          </div>
          <div class="px-6 py-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <a
                href="/forgot-password"
                class="border border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div class="text-lg">🔒</div>
                <h3 class="text-sm font-medium text-gray-900 mt-2">Change Password</h3>
                <p class="text-xs text-gray-600 mt-1">Update your account password</p>
              </a>
              
              <a
                href="/notifications"
                class="border border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div class="text-lg">🔔</div>
                <h3 class="text-sm font-medium text-gray-900 mt-2">Notifications</h3>
                <p class="text-xs text-gray-600 mt-1">Manage your notification preferences</p>
              </a>
              
              {user.role === 'admin' && (
                <a
                  href="/admin/users"
                  class="border border-gray-300 rounded-lg p-4 hover:border-purple-500 hover:bg-purple-50 transition-colors"
                >
                  <div class="text-lg">🛠️</div>
                  <h3 class="text-sm font-medium text-gray-900 mt-2">Admin Panel</h3>
                  <p class="text-xs text-gray-600 mt-1">Manage users and system settings</p>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}