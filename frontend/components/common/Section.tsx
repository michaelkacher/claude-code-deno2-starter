/**
 * Section Component
 * Reusable section container with optional title
 */

import { JSX } from 'preact';

interface SectionProps {
  children: JSX.Element | JSX.Element[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function Section({ children, title, subtitle, className = '' }: SectionProps) {
  return (
    <section class={`mb-8 ${className}`}>
      {(title || subtitle) && (
        <div class="mb-6">
          {title && (
            <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
          )}
          {subtitle && (
            <p class="mt-1 text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
