/**
 * Panel Component
 * Side panels and sliding drawers for additional content
 */

import { JSX } from 'preact';

type PanelPosition = 'left' | 'right';
type PanelSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface PanelProps {
  children: JSX.Element | JSX.Element[];
  isOpen: boolean;
  onClose: () => void;
  position?: PanelPosition;
  size?: PanelSize;
  title?: string;
  showOverlay?: boolean;
}

const sizeStyles: Record<PanelSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full',
};

export function Panel({
  children,
  isOpen,
  onClose,
  position = 'right',
  size = 'md',
  title,
  showOverlay = true,
}: PanelProps) {
  const positionStyles =
    position === 'right' ? 'right-0' : 'left-0';
  const translateStyle = isOpen
    ? 'translate-x-0'
    : position === 'right'
    ? 'translate-x-full'
    : '-translate-x-full';
  const sizeStyle = sizeStyles[size];

  if (!isOpen && !showOverlay) return null;

  return (
    <>
      {/* Overlay */}
      {showOverlay && (
        <div
          class={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300 z-40 ${
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        class={`fixed top-0 ${positionStyles} h-full ${sizeStyle} w-full bg-white shadow-2xl transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-50 ${translateStyle}`}
      >
        {/* Header */}
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          {title && <h2 class="text-2xl font-bold text-gray-900">{title}</h2>}
          <button
            type="button"
            onClick={onClose}
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close panel"
          >
            <svg
              class="w-6 h-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div class="p-6 overflow-y-auto h-[calc(100%-88px)]">
          {children}
        </div>
      </div>
    </>
  );
}

