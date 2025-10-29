/**
 * Home Page - Project Overview
 * Provides navigation to design system and mockups (dev only)
 */

import { Head } from '$fresh/runtime.ts';
import { PageProps } from '$fresh/server.ts';

const isDevelopment = Deno.env.get("DENO_ENV") !== "production";

export default function Home(props: PageProps) {
  return (
    <>
      <Head>
        <title>Deno 2 Starter - Claude Code Template</title>
      </Head>
      <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        {/* Hero Section */}
        <div class="max-w-7xl mx-auto px-6 py-16">
          <div class="text-center mb-16">
            <h1 class="text-5xl font-bold text-gray-900 mb-4">
              Deno 2 + Claude Code Starter
            </h1>
            <p class="text-xl text-gray-600 max-w-2xl mx-auto">
              Build production-ready web applications with AI-powered development,
              TDD workflows, and token-optimized agents
            </p>
            <div class="flex gap-4 justify-center mt-6">
              <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Deno 2
              </span>
              <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Hono
              </span>
              <span class="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                Fresh + Preact
              </span>
              <span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                Deno KV
              </span>
            </div>
          </div>

          {/* Quick Actions - Development Only */}
          {isDevelopment && (
            <div class="grid md:grid-cols-2 gap-6 mb-16">
              {/* Design System Card */}
              <a
                href="/design-system"
                class="block bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-8 border border-gray-200 hover:border-blue-300"
              >
                <div class="flex items-center mb-4">
                  <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl mr-4">
                    🎨
                  </div>
                  <div>
                    <h2 class="text-2xl font-bold text-gray-900">
                      Design System
                    </h2>
                    <p class="text-gray-600 text-sm">
                      Component Library & Examples
                    </p>
                  </div>
                </div>
                <p class="text-gray-700 mb-4">
                  Explore the complete design system with pre-built components:
                  Buttons, Cards, Forms, Modals, and more. All components are
                  production-ready and optimized for token efficiency.
                </p>
                <div class="flex items-center text-blue-600 font-medium">
                  View Design Gallery
                  <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </a>

              {/* Mockups Card */}
              <a
                href="/mockups"
                class="block bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-8 border border-gray-200 hover:border-purple-300"
              >
                <div class="flex items-center mb-4">
                  <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl mr-4">
                    🖼️
                  </div>
                  <div>
                    <h2 class="text-2xl font-bold text-gray-900">
                      UI Mockups
                    </h2>
                    <p class="text-gray-600 text-sm">
                      Visual Prototypes & Designs
                    </p>
                  </div>
                </div>
                <p class="text-gray-700 mb-4">
                  Browse UI mockups for rapid prototyping. Create visual prototypes
                  before building features with <code class="bg-gray-100 px-2 py-1 rounded text-sm">/mockup</code> command.
                </p>
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p class="text-yellow-800 text-sm">
                    <strong>📝 No mockups yet!</strong> Run <code class="bg-yellow-100 px-2 py-0.5 rounded">/mockup</code> in Claude Code to create your first UI prototype.
                  </p>
                </div>
                <div class="flex items-center text-purple-600 font-medium">
                  View Mockups
                  <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </a>
            </div>
          )}

          {/* Getting Started */}
          <div class="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span class="text-3xl mr-3">🚀</span>
              Getting Started
            </h2>
            <div class="grid md:grid-cols-3 gap-6">
              <div>
                <div class="bg-blue-50 rounded-lg p-4 mb-3">
                  <h3 class="font-semibold text-gray-900 mb-2">
                    1. Start Building
                  </h3>
                  <code class="text-sm bg-blue-100 px-2 py-1 rounded block">
                    /new-feature
                  </code>
                </div>
                <p class="text-gray-600 text-sm">
                  Jump straight to building your first feature. The command
                  handles requirements, API design, tests, and implementation.
                </p>
              </div>

              <div>
                <div class="bg-green-50 rounded-lg p-4 mb-3">
                  <h3 class="font-semibold text-gray-900 mb-2">
                    2. Run Development Server
                  </h3>
                  <code class="text-sm bg-green-100 px-2 py-1 rounded block">
                    deno task dev
                  </code>
                </div>
                <p class="text-gray-600 text-sm">
                  Start both backend (port 8000) and frontend (port 3000)
                  servers in watch mode for hot reloading.
                </p>
              </div>

              <div>
                <div class="bg-purple-50 rounded-lg p-4 mb-3">
                  <h3 class="font-semibold text-gray-900 mb-2">
                    3. Run Tests
                  </h3>
                  <code class="text-sm bg-purple-100 px-2 py-1 rounded block">
                    deno test
                  </code>
                </div>
                <p class="text-gray-600 text-sm">
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
              <h3 class="font-semibold text-gray-900 mb-2">Token Optimized</h3>
              <p class="text-gray-600 text-sm">
                53-64% reduction in tokens with feature-scoped workflows
              </p>
            </div>

            <div class="text-center">
              <div class="text-4xl mb-3">🧪</div>
              <h3 class="font-semibold text-gray-900 mb-2">TDD First</h3>
              <p class="text-gray-600 text-sm">
                Write tests before code with automated workflows
              </p>
            </div>

            <div class="text-center">
              <div class="text-4xl mb-3">🤖</div>
              <h3 class="font-semibold text-gray-900 mb-2">AI Agents</h3>
              <p class="text-gray-600 text-sm">
                7 specialized agents for complete development lifecycle
              </p>
            </div>

            <div class="text-center">
              <div class="text-4xl mb-3">🌐</div>
              <h3 class="font-semibold text-gray-900 mb-2">Edge Ready</h3>
              <p class="text-gray-600 text-sm">
                Deploy to Deno Deploy's global edge network
              </p>
            </div>
          </div>

          {/* Footer Links */}
          <div class="mt-16 text-center border-t border-gray-200 pt-8">
            <p class="text-gray-600 mb-4">
              📚 Learn more about this template
            </p>
            <div class="flex gap-4 justify-center flex-wrap">
              <a href="https://github.com" class="text-blue-600 hover:underline">
                README.md
              </a>
              <a href="https://github.com" class="text-blue-600 hover:underline">
                QUICKSTART.md
              </a>
              <a href="https://github.com" class="text-blue-600 hover:underline">
                Token Optimization Guide
              </a>
              <a href="https://github.com" class="text-blue-600 hover:underline">
                Orchestration Guide
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
