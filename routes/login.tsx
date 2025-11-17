/**
 * Login Page  
 * Provides email/password login form
 */

import type { PageProps } from "fresh";
import { Head } from "fresh/runtime";
import LoginForm from "../islands/LoginForm.tsx";

export default function Login(props: PageProps) {
  const url = new URL(props.url);
  const redirectTo = url.searchParams.get('redirect') || '/';
  
  return (
    <>
      <Head>
        <title>Sign In - Deno 2 Starter</title>
      </Head>
      <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
        <div class="max-w-md w-full">
          <div class="text-center mb-8">
            <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Sign In
            </h1>
            <p class="text-gray-600 dark:text-gray-400">
              Welcome back! Please sign in to continue
            </p>
          </div>
          
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <LoginForm redirectTo={redirectTo} />
          </div>
          
          <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            Don't have an account?{' '}
            <a href="/signup" class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
              Create one
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

