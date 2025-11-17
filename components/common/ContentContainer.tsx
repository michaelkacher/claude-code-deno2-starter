/**
 * Content Container Component
 * Reusable centered content wrapper
 */

import { JSX } from 'preact';

interface ContentContainerProps {
  children: JSX.Element | JSX.Element[];
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '7xl' | 'full';
  className?: string;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
};

export default function ContentContainer({ 
  children, 
  maxWidth = '7xl',
  className = '' 
}: ContentContainerProps) {
  return (
    <div class={`${maxWidthClasses[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      {children}
    </div>
  );
}

