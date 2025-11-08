/**
 * Home Page - Project Overview
 * Provides navigation to design system and mockups (dev only)
 */

import { Head } from '$fresh/runtime.ts';
import { PageProps } from '$fresh/server.ts';
import { ContentContainer, FeatureCard } from '../components/common/index.ts';

const isDevelopment = Deno.env.get("DENO_ENV") !== "production";

export default function Home(props: PageProps) {
  return (
    <>
      <Head>
        <title>Deno 2 Starter - Claude Code Template</title>
      </Head>
      <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <ContentContainer>
          {/* Hero Section */}
          <div class="text-center mb-16">
            <h1 class="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Deno 2 + Claude Code Starter
            </h1>
            <p class="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Build production-ready web applications with AI-powered development,
              TDD workflows, and token-optimized agents
            </p>
            <div class="flex gap-4 justify-center mt-6">
              <span class="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm font-medium">
                Deno 2
              </span>
              <span class="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full text-sm font-medium">
                Fresh + Preact
              </span>
              <span class="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full text-sm font-medium">
                Deno KV
              </span>
            </div>
          </div>

          {/* Quick Actions - Development Only */}
          {isDevelopment && (
            <div class="grid md:grid-cols-2 gap-6 mb-16">
              <FeatureCard
                href="/design-system"
                title="Design System"
                subtitle="Component Library & Examples"
                description="Explore the complete design system with pre-built components: Buttons, Cards, Forms, Modals, and more. All components are production-ready and optimized for token efficiency."
                icon="🎨"
                iconBgColor="bg-blue-100 dark:bg-blue-900"
              />

              <FeatureCard
                href="/mockups"
                title="UI Mockups"
                subtitle="Visual Prototypes & Designs"
                description="Browse UI mockups for rapid prototyping. Create visual prototypes before building features with /mockup command."
                icon="🖼️"
                iconBgColor="bg-purple-100 dark:bg-purple-900"
                borderColor="border-gray-200 dark:border-gray-700"
                hoverBorderColor="hover:border-purple-300 dark:hover:border-purple-600"
              />
            </div>
          )}

          {/* Getting Started */}
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <span class="text-3xl mr-3">🚀</span>
              Getting Started
            </h2>
            <div class="grid md:grid-cols-3 gap-6">
              <div>
                <div class="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-3">
                  <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    1. Start Building
                  </h3>
                  <code class="text-sm bg-blue-100 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded block">
                    /new-feature
                  </code>
                </div>
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                  Jump straight to building your first feature. The command
                  handles requirements, API design, tests, and implementation.
                </p>
              </div>

              <div>
                <div class="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 mb-3">
                  <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    2. Run Development Server
                  </h3>
                  <code class="text-sm bg-green-100 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded block">
                    deno task dev
                  </code>
                </div>
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                  Start the Fresh server (port 3000) in watch mode for hot reloading.
                </p>
              </div>

              <div>
                <div class="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 mb-3">
                  <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    3. Run Tests
                  </h3>
                  <code class="text-sm bg-purple-100 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded block">
                    deno test
                  </code>
                </div>
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                  Execute all tests with Deno's built-in test runner.
                  Supports TDD workflow with watch mode.
                </p>
              </div>
            </div>
          </div>

          {/* Key Features */}
          <div class="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="text-center">
              <div class="text-4xl mb-3">⚡</div>
              <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">Token Optimized</h3>
              <p class="text-gray-600 dark:text-gray-400 text-sm">
                53-64% reduction in tokens with feature-scoped workflows
              </p>
            </div>

            <div class="text-center">
              <div class="text-4xl mb-3">🧪</div>
              <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">TDD First</h3>
              <p class="text-gray-600 dark:text-gray-400 text-sm">
                Write tests before code with automated workflows
              </p>
            </div>

            <div class="text-center">
              <div class="text-4xl mb-3">🤖</div>
              <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">AI Agents</h3>
              <p class="text-gray-600 dark:text-gray-400 text-sm">
                7 specialized agents for complete development lifecycle
              </p>
            </div>

            <div class="text-center">
              <div class="text-4xl mb-3">🌐</div>
              <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">Edge Ready</h3>
              <p class="text-gray-600 dark:text-gray-400 text-sm">
                Deploy to Deno Deploy's global edge network
              </p>
            </div>
          </div>

          {/* Footer Links */}
          <div class="mt-16 text-center border-t border-gray-200 dark:border-gray-700 pt-8">
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              📚 Learn more about this template
            </p>
            <div class="flex gap-4 justify-center flex-wrap">
              <a href="https://github.com/michaelkacher/claude-code-deno2-starter" class="text-blue-600 dark:text-blue-400 hover:underline">
                GitHub Repository
              </a>
            </div>
          </div>
        </ContentContainer>
      </div>
    </>
  );
}
