/**
 * Design System Showcase
 * Interactive examples of all design system components
 */

import DesignSystemShowcase from '../islands/DesignSystemShowcase.tsx';
import { Head } from '$fresh/runtime.ts';
import { ContentContainer } from '../components/common/index.ts';

export default function DesignSystemPage() {
  return (
    <>
      <Head>
        <title>Design System - Component Library</title>
      </Head>
      <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <ContentContainer>
          <DesignSystemShowcase />
        </ContentContainer>
      </div>
    </>
  );
}
