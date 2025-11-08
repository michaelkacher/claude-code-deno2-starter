/**
 * 403 Forbidden Error Page
 * Displays when user doesn't have permission to access a resource
 */

import { Head } from "$fresh/runtime.ts";
import { PageProps } from "$fresh/server.ts";
import { siteConfig } from "../lib/config.ts";

export default function Error403(props: PageProps) {
  const url = new URL(props.url);
  const returnUrl = url.searchParams.get('return') || '/';
  
  return (
    <>
      <Head>
        <title>403 - Access Forbidden | {siteConfig.site.name}</title>
      </Head>
      
      <div class="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center px-4 py-12">
        <div class="max-w-lg w-full">
          {/* Error Code */}
          <div class="text-center mb-8">
            <h1 class="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-600">
              403
            </h1>
          </div>

          {/* Error Content Card */}
          <div class="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            {/* Icon */}
            <div class="flex justify-center">
              <div class="rounded-full bg-orange-50 p-4">
                <svg
                  class="h-16 w-16 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>

            {/* Message */}
            <div class="text-center space-y-2">
              <h2 class="text-3xl font-bold text-gray-900">Access Forbidden</h2>
              <p class="text-gray-600">
                You don't have permission to access this resource.
              </p>
            </div>

            {/* Reasons */}
            <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p class="text-sm text-orange-900 font-medium mb-2">This might be because:</p>
              <ul class="space-y-1 text-sm text-orange-800">
                <li>• You're not logged in</li>
                <li>• You don't have the required role or permissions</li>
                <li>• This resource is restricted to certain users</li>
                <li>• Your account needs verification</li>
              </ul>
            </div>

            {/* What to do */}
            <div class="bg-gray-50 rounded-lg p-4">
              <p class="text-sm text-gray-700 font-medium mb-2">What you can do:</p>
              <ul class="space-y-1 text-sm text-gray-600">
                <li>• Log in with an authorized account</li>
                <li>• Request access from an administrator</li>
                <li>• Verify your account if needed</li>
                <li>• Contact support for help</li>
              </ul>
            </div>

            {/* Actions */}
            <div class="flex flex-col sm:flex-row gap-3">
              <a
                href="/login"
                class="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center"
              >
                🔐 Log In
              </a>
              <a
                href="/"
                class="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-yellow-600 text-white rounded-lg hover:from-orange-700 hover:to-yellow-700 transition-colors font-medium text-center shadow-md"
              >
                Home Page
              </a>
            </div>

            {/* Support Link */}
            <p class="text-center text-sm text-gray-500">
              Need access?{' '}
              <a href="/contact" class="text-orange-600 hover:text-orange-500 font-medium">
                Contact an Administrator
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
