/**
 * Admin Data Sync Page
 * UI for managing markdown-to-KV data synchronization
 */

import { Head } from '$fresh/runtime.ts';
import DataSyncManager from '../../islands/AdminDataSyncManager.tsx';

export default function AdminDataSyncPage() {
  return (
    <>
      <Head>
        <title>Data Sync - Admin</title>
      </Head>
      <div class="min-h-screen bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div class="mb-8">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-3xl font-bold text-gray-900">Data Sync Management</h1>
                <p class="mt-2 text-gray-600">
                  Deploy markdown content to production database
                </p>
              </div>
              <a
                href="/admin"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                ← Back to Admin
              </a>
            </div>
          </div>

          {/* Info Banner */}
          <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-blue-800">Deployment Workflow</h3>
                <div class="mt-2 text-sm text-blue-700">
                  <ol class="list-decimal list-inside space-y-1">
                    <li><strong>Validate</strong> - Check markdown files for errors</li>
                    <li><strong>Preview</strong> - See what will change (dry run)</li>
                    <li><strong>Deploy</strong> - Apply changes to production database</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Sync Manager Island */}
          <DataSyncManager />
        </div>
      </div>
    </>
  );
}
