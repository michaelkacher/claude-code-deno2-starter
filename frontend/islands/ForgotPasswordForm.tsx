/**
 * Forgot Password Form Island
 * 
 * Interactive form for requesting password reset emails.
 * Handles form submission, validation, and error/success messages.
 * 
 * MIGRATED TO API CLIENT
 * REFACTORED: Uses centralized validation utilities
 */

import { useRef, useState } from 'preact/hooks';
import { authApi } from '../lib/api-client.ts';
import { validateEmailForm } from '../lib/validation.ts';

interface FormState {
  isSubmitting: boolean;
  message: { type: 'success' | 'error'; content: string } | null;
}

export default function ForgotPasswordForm() {
  const [state, setState] = useState<FormState>({
    isSubmitting: false,
    message: null,
  });
  const emailRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    const email = emailRef.current?.value || '';

    // Use centralized validation
    const validation = validateEmailForm(email);
    if (!validation.isValid) {
      setState({
        isSubmitting: false,
        message: {
          type: 'error',
          content: validation.error || 'Validation failed',
        },
      });
      return;
    }

    setState({ isSubmitting: true, message: null });

    try {
      // Use API client for forgot password
      await authApi.forgotPassword(email);
      
      setState({
        isSubmitting: false,
        message: {
          type: 'success',
          content: 'Password reset email sent! If you don\'t receive an email within a few minutes, please check your spam folder.',
        },
      });
      
      // Reset form on success
      if (emailRef.current) {
        emailRef.current.value = '';
      }
    } catch (error) {
      setState({
        isSubmitting: false,
        message: {
          type: 'error',
          content: error instanceof Error ? error.message : 'Failed to send reset email',
        },
      });
    }
  };

  return (
    <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div class="text-center mb-8">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-900 mb-4">
            <svg class="h-8 w-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Forgot Password?</h1>
          <p class="text-gray-600 dark:text-gray-400">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {state.message && (
          <div class={`mb-4 p-3 rounded-md ${
            state.message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}>
            {state.message.type === 'success' ? (
              <>
                <strong class="font-medium">Check your email!</strong>
                <p class="mt-1 text-sm">{state.message.content}</p>
              </>
            ) : (
              <>
                <strong class="font-medium">Error</strong>
                <p class="mt-1 text-sm">{state.message.content}</p>
              </>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              ref={emailRef}
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={state.isSubmitting}
            class="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-md hover:from-purple-700 hover:to-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div class="mt-6 text-center space-y-2">
          <a
            href="/login"
            class="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium block"
          >
            ← Back to Login
          </a>
          <a
            href="/signup"
            class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 block"
          >
            Don't have an account? Sign up
          </a>
        </div>
      </div>
    </div>
  );
}
