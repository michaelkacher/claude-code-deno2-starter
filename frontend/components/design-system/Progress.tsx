/**
 * Progress Components
 * Progress bars and loading indicators
 */

import { JSX } from 'preact';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const sizeStyles = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const variantColors = {
  primary: 'from-blue-500 to-blue-600',
  success: 'from-green-500 to-green-600',
  warning: 'from-orange-500 to-orange-600',
  danger: 'from-red-500 to-red-600',
};

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  variant = 'primary',
  showLabel = false,
  label,
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const sizeStyle = sizeStyles[size];
  const colorStyle = variantColors[variant];

  return (
    <div class={className}>
      {(showLabel || label) && (
        <div class="flex items-center justify-between mb-2">
          {label && <span class="text-sm font-medium text-gray-700">{label}</span>}
          {showLabel && (
            <span class="text-sm font-semibold text-gray-900">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div class={`w-full bg-gray-200/50 rounded-full overflow-hidden ${sizeStyle} shadow-inner`}>
        <div
          class={`${sizeStyle} bg-gradient-to-r ${colorStyle} rounded-full transition-all duration-700 ease-out shadow-lg relative overflow-hidden`}
          style={{ width: `${percentage}%` }}
        >
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'white';
  className?: string;
}

const spinnerSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const spinnerColors = {
  primary: 'text-blue-500',
  white: 'text-white',
};

export function Spinner({
  size = 'md',
  variant = 'primary',
  className = '',
}: SpinnerProps) {
  const sizeStyle = spinnerSizes[size];
  const colorStyle = spinnerColors[variant];

  return (
    <svg
      class={`animate-spin ${sizeStyle} ${colorStyle} ${className}`}
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
  );
}

interface StepsProps {
  steps: Array<{ label: string; description?: string }>;
  currentStep: number;
  className?: string;
}

export function Steps({ steps, currentStep, className = '' }: StepsProps) {
  return (
    <div class={`flex items-center justify-center ${className}`}>
      {steps.map((step, index) => (
        <div key={index} class="flex items-center">
          <div class="flex flex-col items-center">
            <div
              class={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                index < currentStep
                  ? 'bg-green-500 text-white'
                  : index === currentStep
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {index < currentStep
                ? (
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                )
                : index + 1}
            </div>
            <div class="mt-2 text-center hidden sm:block">
              <p
                class={`text-sm font-semibold ${
                  index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {step.label}
              </p>
              {step.description && (
                <p class="text-xs text-gray-500">{step.description}</p>
              )}
            </div>
          </div>

          {index < steps.length - 1 && (
            <div
              class={`w-16 sm:w-24 h-1 mx-2 rounded transition-all ${
                index < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
