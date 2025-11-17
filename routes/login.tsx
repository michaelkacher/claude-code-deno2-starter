/**
 * Login Page  
 * Provides email/password login form
 */

import type { Handlers, PageProps } from "fresh";
import { Head } from "fresh/runtime";
import LoginForm from "../islands/LoginForm.tsx";

interface LoginData {
  redirectTo: string;
}

export const handler: Handlers<LoginData> = {
  GET(ctx) {
    // If user is already authenticated, redirect to home
    if (ctx.state.user) {
      const url = new URL(ctx.req.url);
      const redirectTo = url.searchParams.get('redirect') || '/';
      return new Response(null, {
        status: 302,
        headers: { Location: redirectTo },
      });
    }

    // Get redirect URL from query params
    const url = new URL(ctx.req.url);
    const redirectTo = url.searchParams.get('redirect') || '/';
    
    return ctx.render({ redirectTo });
  },
};

export default function Login({ data }: PageProps<LoginData>) {
  const redirectTo = data?.redirectTo || '/';
  
  return (
    <>
      <Head>
        <title>Sign In - Deno 2 Starter</title>
      </Head>
      <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
          <div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
              Sign in to your account
            </h2>
            <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Or{' '}
              <a href="/signup" class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                create a new account
              </a>
            </p>
          </div>

          <div class="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <LoginForm redirectTo={redirectTo} />

            <div class="mt-6">
              <a
                href="/forgot-password"
                class="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                Forgot your password?
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
  );
}
