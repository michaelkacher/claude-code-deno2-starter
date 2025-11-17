/**
 * Signup Page
 * User registration form
 */

import type { Handlers, PageProps } from 'fresh';
import { Head } from 'fresh/runtime';
import SignupForm from '../islands/SignupForm.tsx';

interface SignupData {
  redirectTo?: string;
}

export const handler: Handlers<SignupData> = {
  GET(ctx) {
    // Get redirect URL from query params
    const url = new URL(ctx.req.url);
    const redirectTo = url.searchParams.get('redirect') || '/';
    
    return ctx.render({ redirectTo });
  },
};

export default function Signup({ data }: PageProps<SignupData>) {
  const { redirectTo } = data;
  return (
    <>
      <Head>
        <title>Sign Up - Deno 2 Starter</title>
      </Head>
      <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
        <div class="max-w-md w-full">
          <div class="text-center mb-8">
            <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Create Account
            </h1>
            <p class="text-gray-600 dark:text-gray-400">
              Join us and start building amazing things
            </p>
          </div>
          
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <SignupForm redirectTo={redirectTo} />
          </div>
          
          <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            Already have an account?{' '}
            <a href="/login" class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

