/**
 * Stat Card Component
 * Reusable statistics display card
 */

import { JSX } from 'preact';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  valueColor?: 'default' | 'green' | 'blue' | 'purple' | 'red' | 'yellow';
  icon?: JSX.Element;
  className?: string;
}

const colorClasses = {
  default: 'text-gray-900 dark:text-gray-100',
  green: 'text-green-600 dark:text-green-400',
  blue: 'text-blue-600 dark:text-blue-400',
  purple: 'text-purple-600 dark:text-purple-400',
  red: 'text-red-600 dark:text-red-400',
  yellow: 'text-yellow-600 dark:text-yellow-400',
};

export default function StatCard({ 
  label, 
  value, 
  subtitle, 
  valueColor = 'default',
  icon,
  className = '' 
}: StatCardProps) {
  return (
    <div class={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">
            {label}
          </h3>
          <p class={`mt-2 text-3xl font-bold ${colorClasses[valueColor]}`}>
            {value}
          </p>
          {subtitle && (
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div class="ml-4">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
