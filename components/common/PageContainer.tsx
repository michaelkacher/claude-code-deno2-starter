/**
 * Page Container Component
 * Reusable full-page layout wrapper
 */

import { JSX } from 'preact';

interface PageContainerProps {
  children: JSX.Element | JSX.Element[];
  className?: string;
}

export default function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div class={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {children}
    </div>
  );
}

