/**
 * Loading Button Component
 * 
 * Button with integrated loading state
 * Disables interaction and shows spinner when loading
 * 
 * @example
 * ```tsx
 * <LoadingButton loading={isSubmitting} onClick={handleSubmit}>
 *   Submit
 * </LoadingButton>
 * ```
 */

import { ComponentChildren } from 'preact';
import LoadingSpinner from './LoadingSpinner.tsx';

interface LoadingButtonProps {
  loading: boolean;
  children: ComponentChildren;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
}

export default function LoadingButton({ 
  loading, 
  children, 
  disabled, 
  onClick, 
  type = 'button',
  className = '',
  variant = 'primary',
}: LoadingButtonProps) {
  const isDisabled = disabled || loading;

  const variantClasses = {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white',
    secondary: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  const baseClasses = 'relative px-4 py-2 rounded-lg font-medium transition-colors';
  const disabledClasses = isDisabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      class={`${baseClasses} ${variantClasses[variant]} ${disabledClasses} ${className}`}
      aria-busy={loading}
    >
      {loading && (
        <span class="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </span>
      )}
      <span class={loading ? 'invisible' : ''}>
        {children}
      </span>
    </button>
  );
}

