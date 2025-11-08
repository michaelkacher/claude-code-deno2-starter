/**
 * Login Form Island
 * Handles authentication and JWT token storage
 *
 * MIGRATED TO PREACT SIGNALS
 */

import { IS_BROWSER } from '$fresh/runtime.ts';
import { useSignal } from '@preact/signals';
import { TokenStorage } from '../lib/storage.ts';
import { setUser, setAccessToken } from '../lib/store.ts';

interface LoginFormProps {
  redirectTo?: string;
}

export default function LoginForm({ redirectTo = '/' }: LoginFormProps) {
  const email = useSignal('');
  const password = useSignal('');
  const error = useSignal('');
  const isLoading = useSignal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    error.value = '';
    isLoading.value = true;

    // Clear any existing auth cookies before logging in
    // This prevents issues with stale/expired tokens
    if (IS_BROWSER) {
      console.log('🧹 [Login] Clearing existing auth cookies');
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
      document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict';
      TokenStorage.clearAuth();
    }

    try {
      // Get CSRF token first
      const csrfResponse = await fetch(`/api/auth/csrf-token`, {
        credentials: 'include',
      });
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.data.csrfToken;

      const response = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ email: email.value, password: password.value }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle rate limiting specifically
        if (response.status === 429) {
          const retryAfter = data.error?.retryAfter;
          const retryMessage = retryAfter
            ? `Too many attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`
            : data.error?.message || 'Too many attempts. Please try again later.';
          error.value = retryMessage;
        } else {
          error.value = data.error?.message || 'Login failed';
        }
        isLoading.value = false;
        return;
      }

      // Store user session using storage abstraction
      if (IS_BROWSER) {
        TokenStorage.setUserSession({
          accessToken: data.data.accessToken,
          email: data.data.user.email,
          role: data.data.user.role,
          emailVerified: data.data.user.emailVerified,
        });

        // Update global state store
        setUser({
          email: data.data.user.email,
          role: data.data.user.role,
          emailVerified: data.data.user.emailVerified,
        });
        setAccessToken(data.data.accessToken);

        // Also set access token in cookie for server-side auth check (15 minutes expiry)
        const expiryDate = new Date();
        expiryDate.setMinutes(expiryDate.getMinutes() + 15);
        document.cookie = `auth_token=${data.data.accessToken}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;

        // Redirect to intended page or home
        window.location.href = redirectTo;
      }
    } catch (err) {
      error.value = 'Network error. Please try again.';
      isLoading.value = false;
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-6">
      {error.value && (
        <div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg text-sm">
          {error.value}
        </div>
      )}

      <div>
        <label htmlFor="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          value={email.value}
          onInput={(e) => email.value = (e.target as HTMLInputElement).value}
          required
          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="you@example.com"
          disabled={isLoading.value}
        />
      </div>

      <div>
        <label htmlFor="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password.value}
          onInput={(e) => password.value = (e.target as HTMLInputElement).value}
          required
          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="••••••••"
          disabled={isLoading.value}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading.value}
        class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
      >
        {isLoading.value ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
