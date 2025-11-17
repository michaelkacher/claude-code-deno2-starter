/**
 * Email Verification Page
 * Handles the verification token from email link
 */

import { Handlers, PageProps } from "fresh";

interface VerificationData {
  success: boolean;
  message: string;
  error?: string;
}

export const handler: Handlers<VerifyEmailData> = {
  async GET(ctx) {
    const url = new URL(ctx.req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return ctx.render({
        success: false,
        message: 'Verification token is missing',
        error: 'Please use the verification link from your email'
      });
    }

    try {
      // Call backend API to verify the token
      const baseUrl = new URL(req.url).origin;
      const response = await fetch(`${baseUrl}/api/auth/verify-email?token=${token}`);
      const data = await response.json();

      if (response.ok) {
        return ctx.render({
          success: true,
          message: data.data.message || 'Email verified successfully!',
        });
      } else {
        return ctx.render({
          success: false,
          message: 'Verification failed',
          error: data.error?.message || 'Invalid or expired verification token'
        });
      }
    } catch (error) {
      return ctx.render({
        success: false,
        message: 'Verification failed',
        error: 'Network error. Please try again later.'
      });
    }
  },
};

export default function VerifyEmailPage({ data }: PageProps<VerificationData>) {
  const { success, message, error } = data;

  return (
    <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div class="text-center">
          {success ? (
            <div>
              <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 class="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
              <p class="text-gray-600 mb-6">{message}</p>
              <div class="space-y-3">
                <a
                  href="/"
                  class="block w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-md hover:from-purple-700 hover:to-blue-700 transition-colors font-medium"
                >
                  Go to Home
                </a>
                <a
                  href="/login"
                  class="block w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors font-medium"
                >
                  Go to Login
                </a>
              </div>
            </div>
          ) : (
            <div>
              <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 class="text-2xl font-bold text-gray-900 mb-2">{message}</h1>
              <p class="text-gray-600 mb-6">{error}</p>
              <div class="space-y-3">
                <a
                  href="/resend-verification"
                  class="block w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-md hover:from-purple-700 hover:to-blue-700 transition-colors font-medium"
                >
                  Request New Verification Email
                </a>
                <a
                  href="/"
                  class="block w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors font-medium"
                >
                  Go to Home
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

