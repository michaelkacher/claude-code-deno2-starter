/**
 * Mockup Index Page
 * Lists all available UI mockups for review
 */

import { PageProps } from '$fresh/server.ts';

export default function MockupsIndex(props: PageProps) {
  return (
    <div class="min-h-screen bg-gray-50">
      {/* Header */}
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-6 py-4">
          <h1 class="text-3xl font-bold text-gray-900">UI Mockups</h1>
          <p class="text-gray-600 mt-1">
            Visual prototypes for design review and iteration
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div class="bg-blue-50 border-b border-blue-200 px-6 py-4">
        <div class="max-w-7xl mx-auto">
          <h2 class="text-blue-900 font-semibold mb-2">
            ℹ️ About Mockups
          </h2>
          <p class="text-blue-800 text-sm">
            Mockups are non-functional UI prototypes for design exploration.
            They use mock data and buttons don't perform real actions.
            Use{' '}
            <code class="bg-blue-100 px-2 py-1 rounded">
              /mockup
            </code>{' '}
            to create new mockups or{' '}
            <code class="bg-blue-100 px-2 py-1 rounded">
              /new-feature
            </code>{' '}
            to convert approved mockups to full features.
          </p>
        </div>
      </div>

      {/* Content */}
      <div class="max-w-7xl mx-auto px-6 py-8">
        {/* No mockups yet */}
        <div class="bg-white rounded-lg shadow p-12 text-center">
          <div class="text-6xl mb-4">🎨</div>
          <h2 class="text-2xl font-semibold text-gray-900 mb-2">
            No Mockups Yet
          </h2>
          <p class="text-gray-600 mb-6">
            Create your first UI mockup to start visualizing your ideas
          </p>

          <div class="bg-gray-50 rounded-lg p-6 max-w-md mx-auto text-left">
            <h3 class="font-semibold text-gray-900 mb-3">
              Quick Start:
            </h3>
            <ol class="space-y-2 text-sm text-gray-700">
              <li class="flex items-start">
                <span class="font-mono bg-gray-200 px-2 py-0.5 rounded mr-2 text-xs">
                  1
                </span>
                <span>
                  Run <code class="bg-gray-200 px-2 py-0.5 rounded">/mockup</code> in Claude Code
                </span>
              </li>
              <li class="flex items-start">
                <span class="font-mono bg-gray-200 px-2 py-0.5 rounded mr-2 text-xs">
                  2
                </span>
                <span>Describe the screen you want to mockup</span>
              </li>
              <li class="flex items-start">
                <span class="font-mono bg-gray-200 px-2 py-0.5 rounded mr-2 text-xs">
                  3
                </span>
                <span>Review the mockup at /mockups/[name]</span>
              </li>
              <li class="flex items-start">
                <span class="font-mono bg-gray-200 px-2 py-0.5 rounded mr-2 text-xs">
                  4
                </span>
                <span>
                  Convert to feature with <code class="bg-gray-200 px-2 py-0.5 rounded">/new-feature</code>
                </span>
              </li>
            </ol>
          </div>
        </div>

        {/* Example mockups section (uncomment when you have mockups) */}
        {/*
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <a
            href="/mockups/user-profile"
            class="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
          >
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-semibold text-gray-900">
                User Profile
              </h3>
              <span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                Mockup
              </span>
            </div>
            <p class="text-gray-600 text-sm">
              User profile page with avatar, bio, and edit functionality
            </p>
            <p class="text-blue-500 text-sm mt-4 hover:underline">
              View mockup →
            </p>
          </a>

          <a
            href="/mockups/task-list"
            class="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
          >
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-semibold text-gray-900">
                Task List
              </h3>
              <span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                Mockup
              </span>
            </div>
            <p class="text-gray-600 text-sm">
              Task management interface with status and priority
            </p>
            <p class="text-blue-500 text-sm mt-4 hover:underline">
              View mockup →
            </p>
          </a>
        </div>
        */}
      </div>

      {/* Footer */}
      <div class="max-w-7xl mx-auto px-6 py-8 border-t border-gray-200 mt-12">
        <div class="text-center text-sm text-gray-600">
          <p>
            💡 <strong>Tip:</strong> Mockups are temporary. Delete them after
            converting to full features.
          </p>
          <p class="mt-2">
            See{' '}
            <a
              href="https://github.com"
              class="text-blue-500 hover:underline"
            >
              features/mockups/README.md
            </a>{' '}
            for more information.
          </p>
        </div>
      </div>
    </div>
  );
}
