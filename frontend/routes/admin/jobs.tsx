/**
 * Admin Jobs Dashboard Page
 * Protected route for managing background jobs and schedules
 */

import { PageProps } from '$fresh/server.ts';
import JobDashboard from '../../islands/admin/JobDashboard.tsx';

export default function AdminJobsPage(props: PageProps) {
  return (
    <div class="min-h-screen bg-gray-50">
      {/* Header */}
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">
                Background Jobs
              </h1>
              <p class="mt-1 text-sm text-gray-500">
                Monitor and manage background jobs and scheduled tasks
              </p>
            </div>
            <div class="flex gap-4">
              <a
                href="/admin/users"
                class="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Users
              </a>
              <a
                href="/admin/data"
                class="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Data
              </a>
              <a
                href="/"
                class="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                ← Back to Home
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
        <JobDashboard />
      </div>
    </div>
  );
}
