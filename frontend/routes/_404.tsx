/**
 * 404 Error Page
 * Displays when a page is not found
 */

import { Head } from "$fresh/runtime.ts";
import { siteConfig } from "../lib/config.ts";

export default function Error404() {
  return (
    <>
      <Head>
        <title>404 - Page Not Found | {siteConfig.site.name}</title>
      </Head>
      
      <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-12">
        <div class="max-w-lg w-full">
          {/* Error Code */}
          <div class="text-center mb-8">
            <h1 class="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              404
            </h1>
          </div>

          {/* Error Content Card */}
          <div class="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            {/* Icon */}
            <div class="flex justify-center">
              <div class="rounded-full bg-blue-50 p-4">
                <svg
                  class="h-16 w-16 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Message */}
            <div class="text-center space-y-2">
              <h2 class="text-3xl font-bold text-gray-900">Page Not Found</h2>
              <p class="text-gray-600">
                The page you're looking for doesn't exist or has been moved.
              </p>
            </div>

            {/* Suggestions */}
            <div class="bg-gray-50 rounded-lg p-4">
              <p class="text-sm text-gray-700 font-medium mb-2">Try these instead:</p>
              <ul class="space-y-1 text-sm text-gray-600">
                <li>• Check the URL for typos</li>
                <li>• Use the search feature</li>
                <li>• Go back to the previous page</li>
                <li>• Visit our home page</li>
              </ul>
            </div>

            {/* Actions */}
            <div class="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => window.history.back()}
                class="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center"
              >
                ← Go Back
              </button>
              <a
                href="/"
                class="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-medium text-center shadow-md"
              >
                Home Page
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
