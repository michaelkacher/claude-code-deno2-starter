/**
 * Layout Components
 * Page layouts and containers
 */

import { JSX } from 'preact';

interface PageLayoutProps {
  children: JSX.Element | JSX.Element[];
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  centered?: boolean;
  className?: string;
}

const maxWidthStyles = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
};

export function PageLayout({
  children,
  maxWidth = 'xl',
  centered = true,
  className = '',
}: PageLayoutProps) {
  const widthStyle = maxWidthStyles[maxWidth];
  const centerStyle = centered ? 'mx-auto' : '';

  return (
    <div
      class={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative ${className}`}
    >
      {/* Decorative background elements */}
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 dark:bg-blue-900/20 rounded-full blur-3xl" />
        <div class="absolute top-1/2 -left-40 w-96 h-96 bg-purple-400/10 dark:bg-purple-900/20 rounded-full blur-3xl" />
        <div class="absolute -bottom-40 right-1/3 w-96 h-96 bg-pink-400/10 dark:bg-pink-900/20 rounded-full blur-3xl" />
      </div>

      <div class={`${widthStyle} ${centerStyle} px-4 sm:px-6 lg:px-8 py-8 relative z-10`}>
        {children}
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: JSX.Element;
  backButton?: boolean;
  onBack?: () => void;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  action,
  backButton = false,
  onBack,
  className = '',
}: PageHeaderProps) {
  return (
    <div class={`mb-8 ${className}`}>
      {backButton && (
        <button
          onClick={onBack}
          class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4 group transition-all"
        >
          <svg
            class="w-5 h-5 group-hover:-translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>
      )}

      <div class="flex items-start justify-between gap-4">
        <div class="flex-1">
          <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {title}
          </h1>
          {subtitle && (
            <p class="text-lg text-gray-600 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
        {action && <div class="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}

interface GridProps {
  children: JSX.Element | JSX.Element[];
  cols?: 1 | 2 | 3 | 4 | 6;
  gap?: number;
  className?: string;
}

const colStyles = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
};

export function Grid({
  children,
  cols = 3,
  gap = 4,
  className = '',
}: GridProps) {
  const colStyle = colStyles[cols];
  const gapStyle = `gap-${gap}`;

  return (
    <div class={`grid ${colStyle} ${gapStyle} ${className}`}>
      {children}
    </div>
  );
}

interface StackProps {
  children: JSX.Element | JSX.Element[];
  spacing?: number;
  direction?: 'vertical' | 'horizontal';
  className?: string;
}

export function Stack({
  children,
  spacing = 4,
  direction = 'vertical',
  className = '',
}: StackProps) {
  const directionStyle = direction === 'vertical' ? 'flex-col' : 'flex-row';
  const spacingStyle = `gap-${spacing}`;

  return (
    <div class={`flex ${directionStyle} ${spacingStyle} ${className}`}>
      {children}
    </div>
  );
}

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Divider({
  orientation = 'horizontal',
  className = '',
}: DividerProps) {
  const orientationStyle = orientation === 'horizontal'
    ? 'w-full h-px'
    : 'w-px h-full';

  return (
    <div
      class={`bg-gray-200 ${orientationStyle} ${className}`}
    />
  );
}
