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
    
    let error: string | undefined;
    if (reason === 'expired') {
      error = 'Your session has expired. Please log in again.';
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
      <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center px-4">
        <div class="max-w-md w-full">
          <div class="text-center mb-8">
            <h1 class="text-4xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p class="text-gray-600">
              Sign in to your account to continue
            </p>
          </div>
          
          {data.error && (
            <div class="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
              {data.error}
            </div>
          )}
          
          <div class="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <LoginForm redirectTo={data.redirectTo} />
            
            <div class="mt-4 text-center">
              <a href="/forgot-password" class="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Forgot your password?
              </a>
            </div>
          </div>
          
          <p class="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{' '}
            <a href="/signup" class="text-blue-600 hover:text-blue-700 font-medium">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
