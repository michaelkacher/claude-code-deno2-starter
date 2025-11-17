/**
 * Modal Component
 * Centered dialog overlays
 */

import { JSX } from 'preact';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalProps {
  children: JSX.Element | JSX.Element[];
  isOpen: boolean;
  onClose: () => void;
  size?: ModalSize;
  title?: string;
  showClose?: boolean;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4',
};

export function Modal({
  children,
  isOpen,
  onClose,
  size = 'md',
  title,
  showClose = true,
}: ModalProps) {
  const sizeStyle = sizeStyles[size];

  if (!isOpen) return null;

  return (
    <div class="fixed inset-0 z-50 overflow-y-auto animate-fadeIn">
      {/* Overlay */}
      <div
        class="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-all duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div class="flex min-h-full items-center justify-center p-4">
        <div
          class={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl ${sizeStyle} w-full transform transition-all duration-300 ease-out animate-scaleIn`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showClose) && (
            <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              {title && (
                <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
              )}
              {showClose && (
                <button
                  type="button"
                  onClick={onClose}
                  class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-auto"
                  aria-label="Close modal"
                >
                  <svg
                    class="w-6 h-6 text-gray-600 dark:text-gray-400"
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
              )}
            </div>
          )}

          {/* Content */}
          <div class="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

