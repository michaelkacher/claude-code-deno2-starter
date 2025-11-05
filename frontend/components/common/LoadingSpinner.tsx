/**
 * Loading Spinner Component
 * 
 * Animated spinner for indicating loading states
 * Supports multiple sizes and can be used inline or centered
 * 
 * @example
 * ```tsx
 * <LoadingSpinner size="md" />
 * <LoadingSpinner size="sm" className="ml-2" />
 * ```
 */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-4',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div class={`inline-block ${className}`}>
      <div 
        class={`${sizeClasses[size]} border-purple-200 dark:border-purple-800 border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      >
        <span class="sr-only">Loading...</span>
      </div>
    </div>
  );
}
