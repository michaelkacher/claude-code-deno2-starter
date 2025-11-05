/**
 * Admin Data Browser Page
 * Protected route for viewing Deno KV storage models
 */

import { PageProps } from '$fresh/server.ts';
import AdminDataBrowser from '../../islands/AdminDataBrowser.tsx';

export default function AdminDataPage(props: PageProps) {
  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header class="bg-white dark:bg-gray-800 shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Data Browser</h1>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                View and filter all models in Deno KV storage
              </p>
            </div>
            <div class="flex gap-4">
              <a
                href="/admin/users"
                class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Users
              </a>
              <a
                href="/admin/jobs"
                class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Jobs
              </a>
              
              <button
                onClick="document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; localStorage.clear(); window.location.href = '/login';"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminDataBrowser />
      </div>
    </div>
  );
}
