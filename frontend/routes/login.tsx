/**
 * Login Page
 * Provides email/password login form
 */

import { Head } from '$fresh/runtime.ts';
import { Handlers, PageProps } from '$fresh/server.ts';
import LoginForm from '../islands/LoginForm.tsx';

interface LoginData {
  error?: string;
  redirectTo?: string;
}

export const handler: Handlers<LoginData> = {
  GET(req, ctx) {
    // Get redirect URL and reason from query params
    const url = new URL(req.url);
    const redirectTo = url.searchParams.get('redirect') || '/';
    const reason = url.searchParams.get('reason');
    
    // If there's a reason (expired, invalid, error), show login with error message
    // Don't redirect even if token exists - user needs to re-authenticate
    let error: string | undefined;
    if (reason === 'expired') {
      error = 'Your session has expired. Please log in again.';
    } else if (reason === 'invalid_session' || reason === 'invalid') {
      error = 'Your session is invalid. Please log in again.';
    } else if (reason === 'error') {
      error = 'An error occurred. Please log in again.';
    }
    
    // If no error reason and user is already authenticated (from middleware), redirect
    // The middleware already validated the token, so we can trust ctx.state.user
    if (!reason && ctx.state.user) {
      return Response.redirect(new URL(redirectTo, url.origin).href, 302);
    }
    
    return ctx.render({ redirectTo, error });
  },
};

export default function Login({ data }: PageProps<LoginData>) {
  return (
    <>
      <Head>
        <title>Login - Deno 2 Starter</title>
      </Head>
      <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
        <div class="max-w-md w-full">
          <div class="text-center mb-8">
            <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Welcome Back
            </h1>
            <p class="text-gray-600 dark:text-gray-400">
              Sign in to your account to continue
            </p>
          </div>
          
          {data.error && (
            <div class="mb-6 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-lg text-sm">
              {data.error}
            </div>
          )}
          
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <LoginForm redirectTo={data.redirectTo} />
            
            <div class="mt-4 text-center">
              <a 
                href="/forgot-password" 
                f-client-nav={false}
                class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-medium inline-block cursor-pointer"
              >
                Forgot your password?
              </a>
            </div>
          </div>
          
          <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            Don't have an account?{' '}
            <a href="/signup" class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
