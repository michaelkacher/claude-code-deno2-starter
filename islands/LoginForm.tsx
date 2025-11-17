/**
 * Login Form Island
 * Handles authentication and JWT token storage
 *
 * MIGRATED TO API CLIENT
 * REFACTORED: Uses centralized validation utilities
 */

import { useSignal } from '@preact/signals';
import { IS_BROWSER } from 'fresh/runtime';
import { authApi } from '../lib/api-client.ts';
import { TokenStorage } from '../lib/token-storage.ts';
import { setAccessToken, setUser } from '../lib/store.ts';
import { validateLoginForm } from '../lib/validation.ts';

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

    // Use centralized validation
    const validation = validateLoginForm({
      email: email.value,
      password: password.value,
    });

    if (!validation.isValid) {
      error.value = validation.error || 'Validation failed';
      return;
    }

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
      console.log('[LoginForm] Starting login API call...');
      // Use API client for login
      const data = await authApi.login(email.value, password.value);
      
      console.log('[LoginForm] Login API succeeded, response:', { hasData: !!data, hasAccessToken: !!data?.accessToken, hasUser: !!data?.user });

      // Store user session using storage abstraction
      if (IS_BROWSER) {
        TokenStorage.setUserSession({
          accessToken: data.accessToken,
          email: data.user.email,
          role: data.user.role,
          emailVerified: data.user.emailVerified,
        });

        // Update global state store
        setUser({
          email: data.user.email,
          role: data.user.role,
          emailVerified: data.user.emailVerified,
        });
        setAccessToken(data.accessToken);

        // Set auth_token cookie client-side
        // The cookie expires in 15 minutes to match the access token lifetime
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        document.cookie = `auth_token=${data.accessToken}; path=/; expires=${expiresAt.toUTCString()}; SameSite=Lax`;
        
        console.log('[LoginForm] Cookie set, all cookies:', document.cookie);
        console.log('[LoginForm] Access token stored in localStorage');
        
        // Redirect to intended page or home
        // Wait longer to ensure cookie is fully set
        console.log('[LoginForm] Redirecting to:', redirectTo);
        setTimeout(() => {
          console.log('[LoginForm] Executing redirect, cookies:', document.cookie);
          window.location.href = redirectTo;
        }, 500);
      }
    } catch (err) {
      console.error('[LoginForm] Login error:', err);
      console.error('[LoginForm] Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        type: typeof err,
        value: err
      });
      error.value = err instanceof Error ? err.message : 'Login failed';
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

