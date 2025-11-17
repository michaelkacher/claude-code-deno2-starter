/**
 * Skeleton Loader Component
 * 
 * Placeholder UI for loading content
 * Shows animated pulse effect while data is being fetched
 * 
 * @example
 * ```tsx
 * <Skeleton className="h-8 w-64" />
 * <Skeleton variant="circle" className="h-12 w-12" />
 * <Skeleton variant="text" lines={3} />
 * ```
 */

interface SkeletonProps {
  variant?: 'rect' | 'circle' | 'text';
  lines?: number;
  className?: string;
}

export default function Skeleton({ variant = 'rect', lines = 1, className = '' }: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700';

  if (variant === 'circle') {
    return (
      <div class={`${baseClasses} rounded-full ${className}`}></div>
    );
  }

  if (variant === 'text') {
    return (
      <div class="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i}
            class={`${baseClasses} h-4 rounded ${i === lines - 1 ? 'w-3/4' : 'w-full'} ${className}`}
          ></div>
        ))}
      </div>
    );
  }

  return (
    <div class={`${baseClasses} rounded ${className}`}></div>
  );
}

