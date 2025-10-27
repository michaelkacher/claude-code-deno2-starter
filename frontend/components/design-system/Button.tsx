/**
 * Button Component
 * Comprehensive button component with multiple variants and sizes
 */

import { JSX } from 'preact';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'ghost'
  | 'outline'
  | 'link';

type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps {
  children: JSX.Element | JSX.Element[] | string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: JSX.Element;
  rightIcon?: JSX.Element;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl hover:shadow-blue-500/50',
  secondary:
    'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md',
  success:
    'bg-gradient-to-r from-green-500 via-green-600 to-green-700 text-white hover:from-green-600 hover:via-green-700 hover:to-green-800 shadow-lg hover:shadow-xl hover:shadow-green-500/50',
  danger:
    'bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white hover:from-red-600 hover:via-red-700 hover:to-red-800 shadow-lg hover:shadow-xl hover:shadow-red-500/50',
  warning:
    'bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 text-white hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 shadow-lg hover:shadow-xl hover:shadow-orange-500/50',
  ghost: 'bg-transparent hover:bg-gray-100/80 text-gray-700 hover:text-gray-900',
  outline:
    'bg-transparent border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600',
  link: 'bg-transparent text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  onClick,
  type = 'button',
  className = '',
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-300 ease-out focus:outline-none focus:ring-4 focus:ring-blue-100/50 transform';
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const widthStyle = fullWidth ? 'w-full' : '';
  const disabledStyle = disabled || loading
    ? 'opacity-60 cursor-not-allowed'
    : 'hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      class={`${baseStyles} ${variantStyle} ${sizeStyle} ${widthStyle} ${disabledStyle} ${className}`}
    >
      {loading && (
        <svg
          class="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          >
          </circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          >
          </path>
        </svg>
      )}
      {!loading && leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
