/**
 * Signup Page
 * User registration form
 */

import { Head } from '$fresh/runtime.ts';
import { Handlers, PageProps } from '$fresh/server.ts';
import SignupForm from '../islands/SignupForm.tsx';

interface SignupData {
  redirectTo?: string;
}

export const handler: Handlers<SignupData> = {
  GET(req, ctx) {
    // Get redirect URL from query params
    const url = new URL(req.url);
    const redirectTo = url.searchParams.get('redirect') || '/';
    
    return ctx.render({ redirectTo });
  },
};

export default function Signup({ data }: PageProps<SignupData>) {
  return (
    <>
      <Head>
        <title>Sign Up - Deno 2 Starter</title>
      </Head>
      <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center px-4">
        <div class="max-w-md w-full">
          <div class="text-center mb-8">
            <h1 class="text-4xl font-bold text-gray-900 mb-2">
              Create Account
            </h1>
            <p class="text-gray-600">
              Join us and start building amazing things
            </p>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <SignupForm redirectTo={data.redirectTo} />
          </div>
          
          <p class="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <a href="/login" class="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
