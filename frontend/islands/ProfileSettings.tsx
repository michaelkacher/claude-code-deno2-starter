/**
 * Profile Settings Island
 *
 * MIGRATED TO PREACT SIGNALS
 */

import { IS_BROWSER } from "$fresh/runtime.ts";
import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { TokenStorage } from "../lib/storage.ts";

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  createdAt: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
}

export default function ProfileSettings() {
  const user = useSignal<User | null>(null);
  const error = useSignal<string | null>(null);
  const loading = useSignal(true);

  useEffect(() => {
    if (!IS_BROWSER) return;

    async function fetchProfile() {
      try {
        const token = TokenStorage.getAccessToken();
        if (!token) {
          window.location.href = "/login?redirect=/profile";
          return;
        }

        const response = await fetch("/api/auth/me", {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            TokenStorage.removeAccessToken();
            window.location.href = "/login?redirect=/profile";
            return;
          }
          throw new Error("Failed to load profile");
        }

        const data = await response.json();
        user.value = data.data;
      } catch (err) {
        console.error("Profile fetch error:", err);
        error.value = "Unable to load profile. Please try again.";
      } finally {
        loading.value = false;
      }
    }

    fetchProfile();
  }, []);

  if (!IS_BROWSER) {
    return <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div class="text-gray-600 dark:text-gray-300">Loading...</div>
    </div>;
  }

  if (loading.value) {
    return (
      <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-4 text-gray-600 dark:text-gray-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error.value || !user.value) {
    return (
      <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div class="sm:mx-auto sm:w-full sm:max-w-md">
          <div class="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div class="text-center">
              <svg class="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 class="mt-4 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
                Unable to load profile
              </h2>
              {error.value && (
                <div class="mt-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-3">
                  <p class="text-sm text-red-800 dark:text-red-200">{error.value}</p>
                </div>
              )}
              <p class="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                Please try{' '}
                <a href="/login" class="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                  logging in again
                </a>
                {' or '}
                <a href="/" class="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
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
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto">
        {/* Header */}
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Profile Settings</h1>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        {/* Profile Information */}
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-lg font-medium text-gray-900 dark:text-gray-100">Account Information</h2>
          </div>
          <div class="px-6 py-4 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">{user.value.email}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                <p class="mt-1 text-sm text-gray-900 dark:text-gray-100 capitalize">{user.value.role}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Member Since</label>
                <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {new Date(user.value.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Status</label>
                <div class="mt-1 flex items-center">
                  {user.value.emailVerified ? (
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      ✓ Verified
                    </span>
                  ) : (
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                      ⚠ Unverified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-lg font-medium text-gray-900 dark:text-gray-100">Security Settings</h2>
          </div>
          <div class="px-6 py-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100">Two-Factor Authentication</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {user.value.twoFactorEnabled
                    ? 'Extra security for your account is enabled'
                    : 'Add an extra layer of security to your account'
                  }
                </p>
              </div>
              <div class="flex items-center">
                {user.value.twoFactorEnabled ? (
                  <>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 mr-3">
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
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 mr-3">
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
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-lg font-medium text-gray-900 dark:text-gray-100">Quick Actions</h2>
          </div>
          <div class="px-6 py-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <a
                href="/forgot-password"
                class="border border-gray-300 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
              >
                <div class="text-lg">🔒</div>
                <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 mt-2">Change Password</h3>
                <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Update your account password</p>
              </a>
              
              <a
                href="/notifications"
                class="border border-gray-300 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
              >
                <div class="text-lg">🔔</div>
                <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 mt-2">Notifications</h3>
                <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Manage your notification preferences</p>
              </a>
              
              {user.value.role === 'admin' && (
                <a
                  href="/admin/users"
                  class="border border-gray-300 dark:border-gray-700 rounded-lg p-4 hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900 transition-colors"
                >
                  <div class="text-lg">🛠️</div>
                  <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 mt-2">Admin Panel</h3>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Manage users and system settings</p>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
