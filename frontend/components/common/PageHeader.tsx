/**
 * Page Header Component
 * Reusable header with title, subtitle, and actions
 */

import { JSX } from 'preact';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: JSX.Element | JSX.Element[];
  className?: string;
}

export default function PageHeader({ title, subtitle, actions, className = '' }: PageHeaderProps) {
  return (
    <header class={`bg-white dark:bg-gray-800 shadow ${className}`}>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h1>
            {subtitle && (
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div class="flex gap-4">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
