/**
 * Card Component
 * Versatile container component with multiple variants
 */

import { JSX } from 'preact';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'flat' | 'gradient';
type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface CardProps {
  children: JSX.Element | JSX.Element[];
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

interface CardHeaderProps {
  children: JSX.Element | JSX.Element[];
  className?: string;
}

interface CardBodyProps {
  children: JSX.Element | JSX.Element[];
  className?: string;
}

interface CardFooterProps {
  children: JSX.Element | JSX.Element[];
  className?: string;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-md',
  elevated: 'bg-white shadow-lg hover:shadow-2xl',
  outlined: 'bg-white border-2 border-gray-200 hover:border-gray-300',
  flat: 'bg-gray-50/50 backdrop-blur-sm',
  gradient: 'bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 text-white shadow-2xl hover:shadow-blue-500/25',
};

const paddingStyles: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8',
  xl: 'p-8 sm:p-10',
};

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
  hover = false,
}: CardProps) {
  const baseStyles = 'rounded-2xl transition-all duration-300 ease-out overflow-hidden';
  const variantStyle = variantStyles[variant];
  const paddingStyle = paddingStyles[padding];
  const hoverStyle = hover ? 'hover:-translate-y-1 hover:scale-[1.02] cursor-pointer transform' : '';
  const clickableStyle = onClick ? 'cursor-pointer active:scale-[0.98]' : '';

  return (
    <div
      class={`${baseStyles} ${variantStyle} ${paddingStyle} ${hoverStyle} ${clickableStyle} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div class={`mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return (
    <div class={className}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div class={`mt-6 pt-4 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
}
