/**
 * Login Page  
 * Provides email/password login form
 */

import { type PageProps } from "fresh";
import LoginForm from "../islands/LoginForm.tsx";

export default function Login(props: PageProps) {
  const url = new URL(props.url);
  const redirectTo = url.searchParams.get('redirect') || '/';
  
  return (
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
  );
}
