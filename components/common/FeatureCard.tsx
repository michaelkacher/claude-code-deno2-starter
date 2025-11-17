/**
 * Feature Card Component
 * Reusable card for features, actions, or navigation
 */

import { JSX } from 'preact';

interface FeatureCardProps {
  href?: string;
  title: string;
  subtitle?: string;
  description: string;
  icon?: string | JSX.Element;
  iconBgColor?: string;
  borderColor?: string;
  hoverBorderColor?: string;
  onClick?: () => void;
  className?: string;
}

export default function FeatureCard({
  href,
  title,
  subtitle,
  description,
  icon,
  iconBgColor = 'bg-blue-100 dark:bg-blue-900',
  borderColor = 'border-gray-200 dark:border-gray-700',
  hoverBorderColor = 'hover:border-blue-300 dark:hover:border-blue-600',
  onClick,
  className = '',
}: FeatureCardProps) {
  const content = (
    <>
      <div class="flex items-center mb-4">
        {icon && (
          <div class={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center text-2xl mr-4`}>
            {typeof icon === 'string' ? icon : icon}
          </div>
        )}
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          {subtitle && (
            <p class="text-gray-600 dark:text-gray-400 text-sm">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <p class="text-gray-700 dark:text-gray-300 mb-4">
        {description}
      </p>
    </>
  );

  const baseClasses = `block bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow p-8 border ${borderColor} ${hoverBorderColor} ${className}`;

  if (href) {
    return (
      <a href={href} class={baseClasses}>
        {content}
      </a>
    );
  }

  return (
    <div class={baseClasses} onClick={onClick} style={onClick ? { cursor: 'pointer' } : {}}>
      {content}
    </div>
  );
}

