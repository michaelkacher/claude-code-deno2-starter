/**
 * Avatar Component
 * User profile images and placeholders
 */

import { JSX } from 'preact';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  status?: 'online' | 'offline' | 'away' | 'busy';
  className?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-3xl',
};

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
};

const statusSizes: Record<AvatarSize, string> = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-4 h-4',
  '2xl': 'w-6 h-6',
};

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  status,
  className = '',
}: AvatarProps) {
  const sizeStyle = sizeStyles[size];

  return (
    <div class={`relative inline-block ${className}`}>
      <div
        class={`${sizeStyle} rounded-full overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 flex items-center justify-center text-white font-bold ring-2 ring-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl`}
      >
        {src
          ? (
            <img
              src={src}
              alt={alt || name || 'Avatar'}
              class="w-full h-full object-cover"
            />
          )
          : (
            <span>{name ? getInitials(name) : '?'}</span>
          )}
      </div>

      {status && (
        <span
          class={`absolute bottom-0 right-0 ${statusSizes[size]} ${statusColors[status]} rounded-full border-2 border-white shadow-md ${
            status === 'online' ? 'animate-pulse' : ''
          }`}
        />
      )}
    </div>
  );
}

interface AvatarGroupProps {
  avatars: Array<{ src?: string; name?: string; alt?: string }>;
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export function AvatarGroup({
  avatars,
  max = 4,
  size = 'md',
  className = '',
}: AvatarGroupProps) {
  const displayAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div class={`flex -space-x-2 ${className}`}>
      {displayAvatars.map((avatar, index) => (
        <div key={index} class="ring-2 ring-white rounded-full">
          <Avatar {...avatar} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div
          class={`${sizeStyles[size]} rounded-full bg-gray-200 text-gray-600 font-bold flex items-center justify-center ring-2 ring-white`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}

