/**
 * Signup Form Island
 * Handles user registration with validation
 *
 * MIGRATED TO API CLIENT
 * REFACTORED: Uses centralized validation utilities
 */

import { IS_BROWSER } from '$fresh/runtime.ts';
import { useSignal } from '@preact/signals';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter.tsx';
import { authApi } from '../lib/api-client.ts';
import { TokenStorage } from '../lib/storage.ts';
import { setAccessToken, setUser } from '../lib/store.ts';
import { validateSignupForm } from '../lib/validation.ts';

interface SignupFormProps {
  redirectTo?: string;
}

export default function SignupForm({ redirectTo = '/' }: SignupFormProps) {
  const email = useSignal('');
  const password = useSignal('');
  const confirmPassword = useSignal('');
  const name = useSignal('');
  const error = useSignal('');
  const success = useSignal(false);
  const successMessage = useSignal('');
  const isLoading = useSignal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    error.value = '';

    // Use centralized validation
    const validation = validateSignupForm({
      name: name.value,
      email: email.value,
      password: password.value,
      confirmPassword: confirmPassword.value,
    });

    if (!validation.isValid) {
      error.value = validation.error || 'Validation failed';
      return;
    }

    isLoading.value = true;

    try {
      // Use API client for signup
      const data = await authApi.signup(email.value, password.value, name.value);

      // Store access token in localStorage (refresh token is in httpOnly cookie)
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

        // Also set access token in cookie for server-side auth check (15 minutes expiry)
        const expiryDate = new Date();
        expiryDate.setMinutes(expiryDate.getMinutes() + 15);
        document.cookie = `auth_token=${data.accessToken}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;

        // Check for success message (email verification notice)
        // Note: We need to adjust API to return message, for now show generic message
        success.value = true;
        successMessage.value = 'Please check your email to verify your account.';
        isLoading.value = false;

        // Redirect to intended page after 3 seconds
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 3000);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Signup failed';
      isLoading.value = false;
    }
  };

  // If signup was successful, show success message
  if (success.value) {
    return (
      <div class="space-y-6">
        <div class="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-900 rounded-lg p-6">
          <div class="flex items-start gap-3">
            <svg class="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">Account Created Successfully!</h3>
              <p class="text-green-800 dark:text-green-200 mb-4">
                {successMessage.value}
              </p>
              <p class="text-sm text-green-700 dark:text-green-300">
                Redirecting you to the app in 3 seconds...
              </p>
            </div>
          </div>
        </div>

        <div class="flex justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} class="space-y-6">
      {error.value && (
        <div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg text-sm">
          {error.value}
        </div>
      )}

      <div>
        <label htmlFor="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Full Name
        </label>
        <input
          type="text"
          id="name"
          value={name.value}
          onInput={(e) => name.value = (e.target as HTMLInputElement).value}
          required
          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="John Doe"
          disabled={isLoading.value}
        />
      </div>

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
          minLength={8}
          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="••••••••"
          disabled={isLoading.value}
        />
        <PasswordStrengthMeter password={password.value} />
      </div>

      <div>
        <label htmlFor="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword.value}
          onInput={(e) => confirmPassword.value = (e.target as HTMLInputElement).value}
          required
          minLength={8}
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
        {isLoading.value ? 'Creating Account...' : 'Sign Up'}
      </button>
    </form>
  );
}
