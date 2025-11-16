/**
 * 401 Unauthorized Error Page
 * Displays when authentication is required but not provided
 */

import { PageProps } from "fresh";
import { Head } from "fresh/runtime";
import { siteConfig } from "../lib/config.ts";

export default function Error401(props: PageProps) {
  const url = new URL(props.url);
  const returnUrl = url.searchParams.get('return') || url.pathname;
  
  return (
    <>
      <Head>
        <title>401 - Authentication Required | {siteConfig.site.name}</title>
      </Head>
      
      <div class="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center px-4 py-12">
        <div class="max-w-lg w-full">
          {/* Error Code */}
          <div class="text-center mb-8">
            <h1 class="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              401
            </h1>
          </div>

          {/* Error Content Card */}
          <div class="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            {/* Icon */}
            <div class="flex justify-center">
              <div class="rounded-full bg-purple-50 p-4">
                <svg
                  class="h-16 w-16 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>

            {/* Message */}
            <div class="text-center space-y-2">
              <h2 class="text-3xl font-bold text-gray-900">Authentication Required</h2>
              <p class="text-gray-600">
                Please log in to access this page.
              </p>
            </div>

            {/* Info Box */}
            <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p class="text-sm text-purple-900 font-medium mb-1">
                🔒 This is a protected area
              </p>
              <p class="text-sm text-purple-800">
                You need to be logged in to view this content. If you don't have an account yet, you can sign up for free.
              </p>
            </div>

            {/* Actions */}
            <div class="flex flex-col gap-3">
              <a
                href={`/login?return=${encodeURIComponent(returnUrl)}`}
                class="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors font-medium text-center shadow-md"
              >
                Log In
              </a>
              <a
                href="/signup"
                class="w-full px-6 py-3 border-2 border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors font-medium text-center"
              >
                Create Account
              </a>
              <a
                href="/"
                class="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center"
              >
                ← Back to Home
              </a>
            </div>

            {/* Additional Help */}
            <div class="pt-4 border-t border-gray-200">
              <p class="text-center text-sm text-gray-600 mb-2">
                Having trouble logging in?
              </p>
              <div class="flex justify-center gap-4 text-sm">
                <a href="/forgot-password" class="text-purple-600 hover:text-purple-500 font-medium">
                  Reset Password
                </a>
                <span class="text-gray-400">•</span>
                <a href="/contact" class="text-purple-600 hover:text-purple-500 font-medium">
                  Get Help
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
