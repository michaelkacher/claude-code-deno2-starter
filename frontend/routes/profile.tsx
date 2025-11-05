import { Handlers, PageProps } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";

interface ProfileData {
  user: {
    email: string;
    role: string;
    createdAt: string;
    emailVerified: boolean;
    twoFactorEnabled: boolean;
  } | null;
}

export const handler: Handlers<ProfileData> = {
  async GET(req, ctx) {
    const cookies = getCookies(req.headers);
    const authToken = cookies.auth_token || 
                     req.headers.get('authorization')?.replace('Bearer ', '');

    if (!authToken) {
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/login?redirect=' + encodeURIComponent(req.url)
        }
      });
    }

    try {
      // Get API URL from environment
      const apiUrl = Deno.env.get('API_URL') || 'http://localhost:8000/api';
      
      // Fetch user profile from backend
      const response = await fetch(`${apiUrl}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const user = await response.json();
        return ctx.render({ user });
      } else {
        // Auth failed, redirect to login
        return new Response(null, {
          status: 302,
          headers: {
            'Location': '/login?redirect=' + encodeURIComponent(req.url)
          }
        });
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      return ctx.render({ user: null });
    }
  },
};

export default function Profile({ data }: PageProps<ProfileData>) {
  const { user } = data;

  if (!user) {
    return (
      <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div class="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Unable to load profile
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Please try{' '}
            <a href="/login" class="font-medium text-blue-600 hover:text-blue-500">
              logging in again
            </a>
          </p>
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
                      href="/settings/two-factor"
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
                      href="/settings/two-factor"
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
                href="/settings/password"
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