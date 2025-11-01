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
    // Get redirect URL from query params
    const url = new URL(req.url);
    const redirectTo = url.searchParams.get('redirect') || '/';
    
    return ctx.render({ redirectTo });
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
          
          <div class="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <LoginForm redirectTo={data.redirectTo} />
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
