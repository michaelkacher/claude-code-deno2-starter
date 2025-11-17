/**
 * Error Page
 * Displays user-friendly error messages for general errors
 */

import { PageProps } from 'fresh';
import { Head } from 'fresh/runtime';
import { siteConfig } from '../lib/config.ts';

export default function ErrorPage(props: PageProps) {
  const url = new URL(props.url);
  const message = url.searchParams.get('message') || 'An unexpected error occurred';
  const code = url.searchParams.get('code') || 'ERROR';
  const returnUrl = url.searchParams.get('return') || '/';

  return (
    <>
      <Head>
        <title>Error - {siteConfig.site.name}</title>
      </Head>

      <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-12">
        <div class="max-w-lg w-full">
          {/* Error Code */}
          {code !== 'ERROR' && (
            <div class="text-center mb-8">
              <h1 class="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
                {code}
              </h1>
            </div>
          )}

          {/* Error Content Card */}
          <div class="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            {/* Icon */}
            <div class="flex justify-center">
              <div class="rounded-full bg-red-50 p-4">
                <svg
                  class="h-16 w-16 text-red-600"
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
            <div class="text-center space-y-2">
              <h2 class="text-3xl font-bold text-gray-900">
                Something Went Wrong
              </h2>
              <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <p class="text-sm text-red-800">{message}</p>
              </div>
            </div>

            {/* What to do */}
            <div class="bg-gray-50 rounded-lg p-4">
              <p class="text-sm text-gray-700 font-medium mb-2">What you can try:</p>
              <ul class="space-y-1 text-sm text-gray-600">
                <li>• Refresh the page and try again</li>
                <li>• Go back to the previous page</li>
                <li>• Return to the home page</li>
                <li>• Contact support if the issue persists</li>
              </ul>
            </div>

            {/* Actions */}
            <div class="flex flex-col sm:flex-row gap-3">
              <a
                href={returnUrl}
                class="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center"
              >
                ← Return
              </a>
              <a
                href="/"
                class="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 transition-colors font-medium text-center shadow-md"
              >
                Home Page
              </a>
            </div>

            {/* Support Link */}
            <p class="text-center text-sm text-gray-500">
              If this problem persists, please{' '}
              <a href="/contact" class="text-red-600 hover:text-red-500 font-medium">
                contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

