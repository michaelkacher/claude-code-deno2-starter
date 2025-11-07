/**
 * Error Page
 * Displays user-friendly error messages
 */

import { Head } from '$fresh/runtime.ts';
import { PageProps } from '$fresh/server.ts';

export default function ErrorPage(props: PageProps) {
  const url = new URL(props.url);
  const message = url.searchParams.get('message') || 'An unexpected error occurred';
  const returnUrl = url.searchParams.get('return') || '/';

  return (
    <>
      <Head>
        <title>Error - Deno 2 Starter</title>
      </Head>

      <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div class="sm:mx-auto sm:w-full sm:max-w-md">
          <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {/* Error Icon */}
            <div class="flex justify-center mb-6">
              <div class="rounded-full bg-red-100 p-3">
                <svg
                  class="h-12 w-12 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Error Message */}
            <div class="text-center">
              <h2 class="text-2xl font-bold text-gray-900 mb-4">
                Something went wrong
              </h2>
              <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <p class="text-sm text-red-800">{message}</p>
              </div>

              {/* Actions */}
              <div class="space-y-3">
                <a
                  href={returnUrl}
                  class="block w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center"
                >
                  Return
                </a>
                <a
                  href="/"
                  class="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-center"
                >
                  Go to Home
                </a>
              </div>

              {/* Support Link */}
              <p class="mt-6 text-xs text-gray-500">
                If this problem persists, please{' '}
                <a href="/contact" class="text-blue-600 hover:text-blue-500">
                  contact support
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
