/**
 * Input Component
 * Form input fields with validation states
 */

import { JSX } from 'preact';

type InputSize = 'sm' | 'md' | 'lg';
type InputVariant = 'default' | 'error' | 'success';

interface InputProps {
  type?: string;
  value?: string;
  placeholder?: string;
  label?: string;
  helperText?: string;
  errorText?: string;
  size?: InputSize;
  variant?: InputVariant;
  fullWidth?: boolean;
  disabled?: boolean;
  leftIcon?: JSX.Element;
  rightIcon?: JSX.Element;
  onChange?: (e: Event) => void;
  onBlur?: (e: Event) => void;
  className?: string;
}

const sizeStyles: Record<InputSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-3 text-lg',
};

const variantStyles: Record<InputVariant, string> = {
  default:
    'border-gray-200 focus:border-blue-500 focus:ring-blue-100/50 bg-white hover:border-gray-300',
  error:
    'border-red-300 focus:border-red-500 focus:ring-red-100/50 bg-red-50/50',
  success:
    'border-green-300 focus:border-green-500 focus:ring-green-100/50 bg-green-50/50',
};

export function Input({
  type = 'text',
  value,
  placeholder,
  label,
  helperText,
  errorText,
  size = 'md',
  variant = 'default',
  fullWidth = false,
  disabled = false,
  leftIcon,
  rightIcon,
  onChange,
  onBlur,
  className = '',
}: InputProps) {
  const baseStyles =
    'border-2 rounded-xl transition-all duration-300 ease-out focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-gray-400 font-medium';
  const sizeStyle = sizeStyles[size];
  const variantStyle = variantStyles[variant];
  const widthStyle = fullWidth ? 'w-full' : '';
  const actualVariant = errorText ? 'error' : variant;

  return (
    <div class={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label class="block text-sm font-bold text-gray-800 mb-2">
          {label}
        </label>
      )}

      <div class="relative">
        {leftIcon && (
          <div class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors">
            {leftIcon}
          </div>
        )}

        <input
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={onChange}
          onBlur={onBlur}
          class={`${baseStyles} ${sizeStyle} ${variantStyles[actualVariant]} ${widthStyle} ${
            leftIcon ? 'pl-10' : ''
          } ${rightIcon ? 'pr-10' : ''}`}
        />

        {rightIcon && (
          <div class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>

      {errorText && (
        <p class="mt-1 text-sm text-red-600 flex items-center gap-1">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
          {errorText}
        </p>
      )}

      {helperText && !errorText && (
        <p class="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

interface SelectProps {
  value?: string;
  options: { value: string; label: string }[];
  label?: string;
  placeholder?: string;
  size?: InputSize;
  fullWidth?: boolean;
  disabled?: boolean;
  onChange?: (e: Event) => void;
  className?: string;
}

export function Select({
  value,
  options,
  label,
  placeholder,
  size = 'md',
  fullWidth = false,
  disabled = false,
  onChange,
  className = '',
}: SelectProps) {
  const baseStyles =
    'border-2 border-gray-200 rounded-xl transition-all duration-300 ease-out focus:outline-none focus:ring-4 focus:border-blue-500 focus:ring-blue-100/50 disabled:opacity-50 disabled:cursor-not-allowed appearance-none bg-white hover:border-gray-300 font-medium cursor-pointer';
  const sizeStyle = sizeStyles[size];
  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <div class={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label class="block text-sm font-bold text-gray-800 mb-2">
          {label}
        </label>
      )}

      <div class="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={onChange}
          class={`${baseStyles} ${sizeStyle} ${widthStyle} pr-10`}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <svg
          class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}
