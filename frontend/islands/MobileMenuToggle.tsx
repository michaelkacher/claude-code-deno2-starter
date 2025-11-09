/**
 * Mobile Menu Toggle Island
 *
 * MIGRATED TO PREACT SIGNALS
 */

import { IS_BROWSER } from '$fresh/runtime.ts';
import { useSignal } from '@preact/signals';

interface MobileMenuToggleProps {
  children: preact.ComponentChildren;
}

export default function MobileMenuToggle({ children }: MobileMenuToggleProps) {
  const isMobileMenuOpen = useSignal(false);

  const toggleMobileMenu = () => {
    if (!IS_BROWSER) return;
    isMobileMenuOpen.value = !isMobileMenuOpen.value;
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={toggleMobileMenu}
        class="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
      >
        <span class="sr-only">Open main menu</span>
        {/* Hamburger icon */}
        <svg
          class={`h-6 w-6 ${isMobileMenuOpen.value ? 'hidden' : 'block'}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        {/* Close icon */}
        <svg
          class={`h-6 w-6 ${isMobileMenuOpen.value ? 'block' : 'hidden'}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Mobile menu */}
      {isMobileMenuOpen.value && (
        <div class="md:hidden absolute top-16 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
            {children}
          </div>
        </div>
      )}
    </>
  );
}
