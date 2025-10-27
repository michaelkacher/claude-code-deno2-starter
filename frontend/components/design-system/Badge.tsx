/**
 * Badge Component
 * Small status indicators and labels
 */

import { JSX } from 'preact';

type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info';

type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: JSX.Element | string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  pill?: boolean;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: 'bg-blue-100/80 text-blue-700 border-blue-200/50 hover:bg-blue-100',
  secondary: 'bg-gray-100/80 text-gray-700 border-gray-200/50 hover:bg-gray-100',
  success: 'bg-green-100/80 text-green-700 border-green-200/50 hover:bg-green-100',
  danger: 'bg-red-100/80 text-red-700 border-red-200/50 hover:bg-red-100',
  warning: 'bg-orange-100/80 text-orange-700 border-orange-200/50 hover:bg-orange-100',
  info: 'bg-purple-100/80 text-purple-700 border-purple-200/50 hover:bg-purple-100',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

const dotColors: Record<BadgeVariant, string> = {
  primary: 'bg-blue-500',
  secondary: 'bg-gray-500',
  success: 'bg-green-500',
  danger: 'bg-red-500',
  warning: 'bg-orange-500',
  info: 'bg-purple-500',
};

export function Badge({
  children,
  variant = 'primary',
  size = 'md',
  pill = true,
  dot = false,
  className = '',
}: BadgeProps) {
  const baseStyles =
    'inline-flex items-center gap-1.5 font-bold border backdrop-blur-sm transition-all duration-200';
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const shapeStyle = pill ? 'rounded-full' : 'rounded-lg';
  const dotColor = dotColors[variant];

  return (
    <span
      class={`${baseStyles} ${variantStyle} ${sizeStyle} ${shapeStyle} ${className}`}
    >
      {dot && <span class={`w-2 h-2 rounded-full ${dotColor} animate-pulse`}></span>}
      {children}
    </span>
  );
}
