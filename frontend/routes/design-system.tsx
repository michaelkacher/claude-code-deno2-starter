/**
 * Design System Showcase
 * Interactive examples of all design system components
 */

import DesignSystemShowcase from '../islands/DesignSystemShowcase.tsx';
import { Head } from '$fresh/runtime.ts';

export default function DesignSystemPage() {
  return (
    <>
      <Head>
        <title>Design System - Component Library</title>
        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }

          .animate-scaleIn {
            animation: scaleIn 0.3s ease-out;
          }

          .animate-slideUp {
            animation: slideUp 0.4s ease-out;
          }
        `}</style>
      </Head>
      <DesignSystemShowcase />
    </>
  );
}
