/**
 * Reset Password Page
 * Handles password reset with token from email link
 */

import { Handlers, PageProps } from "fresh";
import ResetPasswordForm from "../islands/ResetPasswordForm.tsx";

interface ResetData {
  tokenValid: boolean;
  reason?: string;
  token?: string;
}

export const handler: Handlers<ResetData> = {
  async GET(ctx) {
    const url = new URL(ctx.req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return ctx.render({ tokenValid: false, reason: 'missing' });
    }

    try {
      const baseUrl = new URL(ctx.req.url).origin;
      const response = await fetch(`${baseUrl}/api/auth/validate-reset-token?token=${token}`);
      const data = await response.json();

      return ctx.render({
        tokenValid: data.data.valid,
        reason: data.data.reason,
        token: token
      });
    } catch (error) {
      return ctx.render({ tokenValid: false, reason: 'error' });
    }
  },
};

export default function ResetPasswordPage({ data, url }: PageProps<ResetData>) {
  if (!data.tokenValid) {
    return (
      <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
            <svg class="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Invalid Reset Link</h1>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            {data.reason === 'expired' 
              ? 'This password reset link has expired. Reset links are valid for 1 hour.'
              : data.reason === 'missing'
              ? 'No reset token provided. Please use the link from your email.'
              : 'This password reset link is invalid or has already been used.'}
          </p>
          <div class="space-y-3">
            <a
              href="/forgot-password"
              class="block w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-md hover:from-purple-700 hover:to-blue-700 transition-colors font-medium"
            >
              Request New Reset Link
            </a>
            <a
              href="/login"
              class="block w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Back to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div class="text-center mb-8">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-900 mb-4">
            <svg class="h-8 w-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Reset Your Password</h1>
          <p class="text-gray-600 dark:text-gray-400">
            Enter your new password below.
          </p>
        </div>

        <ResetPasswordForm token={data.token!} />

        <div class="mt-6 text-center">
          <a
            href="/login"
            class="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
          >
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
