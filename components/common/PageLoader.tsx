/**
 * Page Loader Component
 * 
 * Full-page loading overlay with spinner and optional message
 * Used for page transitions or major data loading
 * 
 * @example
 * ```tsx
 * {isLoading && <PageLoader message="Loading data..." />}
 * ```
 */

import LoadingSpinner from './LoadingSpinner.tsx';

interface PageLoaderProps {
  message?: string;
}

export default function PageLoader({ message = 'Loading...' }: PageLoaderProps) {
  return (
    <div class="fixed inset-0 bg-white dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center z-50">
      <div class="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p class="text-gray-700 dark:text-gray-300 text-lg font-medium">
          {message}
        </p>
      </div>
    </div>
  );
}

