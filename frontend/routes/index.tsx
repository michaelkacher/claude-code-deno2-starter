/**
 * Home Page - Project Overview
 * Provides navigation to design system and mockups (dev only)
 */

import { Head } from '$fresh/runtime.ts';
import { PageProps } from '$fresh/server.ts';
import { JSX } from 'preact';
import { ContentContainer, FeatureCard } from '../components/common/index.ts';

const isDevelopment = Deno.env.get("DENO_ENV") !== "production";

export default function Home(props: PageProps): JSX.Element {
  return (
    <>
      <Head>
        <title>Deno 2 Starter - Claude Code Template</title>
      </Head>
      <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <ContentContainer>
          <div>
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
          {isDevelopment ? (
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
          ) : null}

          {/* Quick Start */}
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <span class="text-3xl mr-3">🚀</span>
              Quick Start
            </h2>
            <div class="grid md:grid-cols-3 gap-6">
              <div>
                <div class="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-3">
                  <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    1. Create Mockups
                  </h3>
                  <code class="text-sm bg-blue-100 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded block">
                    /mockup
                  </code>
                </div>
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                  Generate visual prototypes to design and validate UI before implementation.
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
                  Start server in watch mode to view and iterate on mockups.
                </p>
              </div>

              <div>
                <div class="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 mb-3">
                  <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    3. Build Features
                  </h3>
                  <code class="text-sm bg-purple-100 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded block">
                    /new-feature
                  </code>
                </div>
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                  Create new features or convert mockups into features-- handle requirements, design, and tests.
                </p>
              </div>
            </div>
          </div>

          {/* Full Workflow */}
          <div class="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <span class="text-3xl mr-3">🔄</span>
              Full Workflow
            </h2>
            <div class="grid md:grid-cols-3 gap-4">
              <div>
                <div class="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4 mb-3">
                  <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">
                    1. Requirements
                  </h3>
                  <code class="text-xs bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-200 px-2 py-1 rounded block">
                    /requirements
                  </code>
                </div>
                <p class="text-gray-600 dark:text-gray-400 text-xs">
                  Document feature requirements and acceptance criteria.
                </p>
              </div>

              <div>
                <div class="bg-pink-50 dark:bg-pink-900/30 rounded-lg p-4 mb-3">
                  <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">
                    2. Customize
                  </h3>
                  <code class="text-xs bg-pink-100 dark:bg-pink-900 dark:text-pink-200 px-2 py-1 rounded block">
                    /customize
                  </code>
                </div>
                <p class="text-gray-600 dark:text-gray-400 text-xs">
                  Configure design system and component preferences.
                </p>
              </div>

              <div>
                <div class="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-3">
                  <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">
                    3. Mockup
                  </h3>
                  <code class="text-xs bg-blue-100 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded block">
                    /mockup
                  </code>
                </div>
                <p class="text-gray-600 dark:text-gray-400 text-xs">
                  Create visual prototypes for UI validation.
                </p>
              </div>

              <div>
                <div class="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 mb-3">
                  <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">
                    4. New Feature
                  </h3>
                  <code class="text-xs bg-purple-100 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded block">
                    /new-feature
                  </code>
                </div>
                <p class="text-gray-600 dark:text-gray-400 text-xs">
                  Build feature with tests and implementation.
                </p>
              </div>

              <div>
                <div class="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-4 mb-3">
                  <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">
                    5. Edit Feature
                  </h3>
                  <code class="text-xs bg-orange-100 dark:bg-orange-900 dark:text-orange-200 px-2 py-1 rounded block">
                    /edit-feature
                  </code>
                </div>
                <p class="text-gray-600 dark:text-gray-400 text-xs">
                  Modify existing features safely with regression testing.
                </p>
              </div>

              <div>
                <div class="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-4 mb-3">
                  <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">
                    6. Review
                  </h3>
                  <code class="text-xs bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-200 px-2 py-1 rounded block">
                    /review
                  </code>
                </div>
                <p class="text-gray-600 dark:text-gray-400 text-xs">
                  Validate code quality and test coverage.
                </p>
              </div>
            </div>
          </div>

          {/* Admin Features */}
          <div class="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <span class="text-3xl mr-3">⚙️</span>
              Admin Features
            </h2>
            <div class="grid md:grid-cols-3 gap-6">
              <div>
                <div class="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-4 mb-3">
                  <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    User Management
                  </h3>
                  <a href="/admin/users" class="text-sm text-amber-700 dark:text-amber-300 hover:underline">
                    /admin/users →
                  </a>
                </div>
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                  Manage users, roles, email verification, and active sessions.
                </p>
              </div>

              <div>
                <div class="bg-cyan-50 dark:bg-cyan-900/30 rounded-lg p-4 mb-3">
                  <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Background Jobs
                  </h3>
                  <a href="/admin/jobs" class="text-sm text-cyan-700 dark:text-cyan-300 hover:underline">
                    /admin/jobs →
                  </a>
                </div>
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                  Monitor job status, manage schedules, and view execution history.
                </p>
              </div>

              <div>
                <div class="bg-teal-50 dark:bg-teal-900/30 rounded-lg p-4 mb-3">
                  <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Data Browser
                  </h3>
                  <a href="/admin/data" class="text-sm text-teal-700 dark:text-teal-300 hover:underline">
                    /admin/data →
                  </a>
                </div>
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                  Browse and query Deno KV data with full CRUD operations.
                </p>
              </div>
            </div>
          </div>

          {/* Testing */}
          <div class="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <span class="text-3xl mr-3">🧪</span>
              Testing
            </h2>
            <div class="space-y-6">
              {/* Primary Test Commands */}
              <div class="grid md:grid-cols-3 gap-6">
                <div>
                  <div class="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-4 mb-3">
                    <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Unit & Integration
                    </h3>
                    <code class="text-sm bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-200 px-2 py-1 rounded block">
                      deno task test
                    </code>
                  </div>
                  <p class="text-gray-600 dark:text-gray-400 text-sm">
                    Run unit and integration tests with Deno's test runner.
                  </p>
                </div>

                <div>
                  <div class="bg-lime-50 dark:bg-lime-900/30 rounded-lg p-4 mb-3">
                    <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Watch Mode
                    </h3>
                    <code class="text-sm bg-lime-100 dark:bg-lime-900 dark:text-lime-200 px-2 py-1 rounded block">
                      deno task test:watch
                    </code>
                  </div>
                  <p class="text-gray-600 dark:text-gray-400 text-sm">
                    Run tests continuously on file changes for TDD workflow.
                  </p>
                </div>

                <div>
                  <div class="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 mb-3">
                    <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Coverage Report
                    </h3>
                    <code class="text-sm bg-green-100 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded block">
                      deno task test:coverage
                    </code>
                  </div>
                  <p class="text-gray-600 dark:text-gray-400 text-sm">
                    Generate coverage reports to track test completeness.
                  </p>
                </div>
              </div>

              {/* E2E Testing with Playwright */}
              <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <span class="mr-2">🎭</span>
                  End-to-End Testing (Playwright)
                </h3>
                <div class="grid md:grid-cols-4 gap-4">
                  <div>
                    <div class="bg-violet-50 dark:bg-violet-900/30 rounded-lg p-3 mb-2">
                      <code class="text-xs bg-violet-100 dark:bg-violet-900 dark:text-violet-200 px-2 py-1 rounded block">
                        npm run test:e2e
                      </code>
                    </div>
                    <p class="text-gray-600 dark:text-gray-400 text-xs">
                      Run all E2E tests
                    </p>
                  </div>

                  <div>
                    <div class="bg-fuchsia-50 dark:bg-fuchsia-900/30 rounded-lg p-3 mb-2">
                      <code class="text-xs bg-fuchsia-100 dark:bg-fuchsia-900 dark:text-fuchsia-200 px-2 py-1 rounded block">
                        npm run test:e2e:ui
                      </code>
                    </div>
                    <p class="text-gray-600 dark:text-gray-400 text-xs">
                      Interactive UI mode
                    </p>
                  </div>

                  <div>
                    <div class="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3 mb-2">
                      <code class="text-xs bg-purple-100 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded block">
                        npm run test:e2e:debug
                      </code>
                    </div>
                    <p class="text-gray-600 dark:text-gray-400 text-xs">
                      Debug mode
                    </p>
                  </div>

                  <div>
                    <div class="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-3 mb-2">
                      <code class="text-xs bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-200 px-2 py-1 rounded block">
                        npm run test:e2e:report
                      </code>
                    </div>
                    <p class="text-gray-600 dark:text-gray-400 text-xs">
                      View test report
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Deployment */}
          <div class="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <span class="text-3xl mr-3">🚀</span>
              Deployment
            </h2>
            <div class="grid md:grid-cols-3 gap-6">
              <div>
                <div class="bg-sky-50 dark:bg-sky-900/30 rounded-lg p-4 mb-3">
                  <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Build Production
                  </h3>
                  <code class="text-sm bg-sky-100 dark:bg-sky-900 dark:text-sky-200 px-2 py-1 rounded block">
                    deno task build
                  </code>
                </div>
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                  Build optimized production bundle with automatic code splitting.
                </p>
              </div>

              <div>
                <div class="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-3">
                  <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Preview Build
                  </h3>
                  <code class="text-sm bg-blue-100 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded block">
                    deno task preview
                  </code>
                </div>
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                  Test production build locally before deployment.
                </p>
              </div>

              <div>
                <div class="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4 mb-3">
                  <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Deploy to Edge
                  </h3>
                  <code class="text-sm bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-200 px-2 py-1 rounded block">
                    deno task deploy
                  </code>
                </div>
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                  Deploy to Deno Deploy's global edge network instantly.
                </p>
              </div>
            </div>
          </div>

          {/* Prerequisites */}
          <div class="mt-8 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl shadow-lg p-8 border border-orange-200 dark:border-orange-800">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <span class="text-3xl mr-3">📋</span>
              Prerequisites
            </h2>
            <div class="grid md:grid-cols-2 gap-6">
              <div class="space-y-4">
                <div class="flex items-start">
                  <span class="text-2xl mr-3">🦕</span>
                  <div>
                    <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-1">Deno 2 Runtime</h3>
                    <p class="text-gray-600 dark:text-gray-400 text-sm">
                      Install from <a href="https://deno.com" class="text-blue-600 dark:text-blue-400 hover:underline">deno.com</a> or via package manager
                    </p>
                  </div>
                </div>
                <div class="flex items-start">
                  <span class="text-2xl mr-3">🤖</span>
                  <div>
                    <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-1">AI Assistant</h3>
                    <p class="text-gray-600 dark:text-gray-400 text-sm">
                      Claude Code or GitHub Copilot for AI-powered development commands
                    </p>
                  </div>
                </div>
              </div>
              <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-orange-300 dark:border-orange-700">
                <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                  <span class="mr-2">🔑</span>
                  Auto-Created Admin Account
                </h3>
                <p class="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  On first run in development, an admin account is created:
                </p>
                <div class="space-y-2 text-sm">
                  <div class="flex items-center">
                    <span class="text-gray-500 dark:text-gray-400 w-20">Email:</span>
                    <code class="bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded text-orange-800 dark:text-orange-200">
                      admin@dev.local
                    </code>
                  </div>
                  <div class="flex items-center">
                    <span class="text-gray-500 dark:text-gray-400 w-20">Password:</span>
                    <code class="bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded text-orange-800 dark:text-orange-200">
                      admin123
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Architecture Overview */}
          <div class="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <span class="text-3xl mr-3">🏗️</span>
              Architecture
            </h2>
            <div class="mb-6">
              <div class="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-4">
                <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">Pure Fresh SSR - Single Server</h3>
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                  Everything runs on one Fresh server at <code class="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-sm">http://localhost:3000</code>
                </p>
              </div>
            </div>
            <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div class="text-2xl mb-2">📄</div>
                <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-sm">Server Routes</h4>
                <p class="text-gray-600 dark:text-gray-400 text-xs">
                  SSR pages in <code class="text-xs">routes/*.tsx</code>
                </p>
              </div>
              <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div class="text-2xl mb-2">🔌</div>
                <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-sm">API Endpoints</h4>
                <p class="text-gray-600 dark:text-gray-400 text-xs">
                  REST handlers in <code class="text-xs">routes/api/*.ts</code>
                </p>
              </div>
              <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div class="text-2xl mb-2">🏝️</div>
                <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-sm">Islands</h4>
                <p class="text-gray-600 dark:text-gray-400 text-xs">
                  Client components in <code class="text-xs">islands/*.tsx</code>
                </p>
              </div>
              <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div class="text-2xl mb-2">⚙️</div>
                <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-sm">Background Jobs</h4>
                <p class="text-gray-600 dark:text-gray-400 text-xs">
                  Queue & scheduler in <code class="text-xs">shared/</code>
                </p>
              </div>
            </div>
          </div>

          {/* Built-in Features */}
          <div class="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <span class="text-3xl mr-3">✨</span>
              Built-in Features
            </h2>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div class="flex items-start">
                <span class="text-xl mr-3">🔐</span>
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-gray-100 text-sm">Authentication</h4>
                  <p class="text-gray-600 dark:text-gray-400 text-xs">JWT-based auth with secure cookies</p>
                </div>
              </div>
              <div class="flex items-start">
                <span class="text-xl mr-3">👥</span>
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-gray-100 text-sm">User Management</h4>
                  <p class="text-gray-600 dark:text-gray-400 text-xs">Roles, sessions, email verification</p>
                </div>
              </div>
              <div class="flex items-start">
                <span class="text-xl mr-3">💾</span>
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-gray-100 text-sm">Deno KV Database</h4>
                  <p class="text-gray-600 dark:text-gray-400 text-xs">Fast key-value store with ACID transactions</p>
                </div>
              </div>
              <div class="flex items-start">
                <span class="text-xl mr-3">⏱️</span>
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-gray-100 text-sm">Background Jobs</h4>
                  <p class="text-gray-600 dark:text-gray-400 text-xs">Queue system with scheduling & retries</p>
                </div>
              </div>
              <div class="flex items-start">
                <span class="text-xl mr-3">🛡️</span>
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-gray-100 text-sm">Rate Limiting</h4>
                  <p class="text-gray-600 dark:text-gray-400 text-xs">Built-in API rate limiting protection</p>
                </div>
              </div>
              <div class="flex items-start">
                <span class="text-xl mr-3">📧</span>
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-gray-100 text-sm">Email System</h4>
                  <p class="text-gray-600 dark:text-gray-400 text-xs">Email verification & notifications</p>
                </div>
              </div>
              <div class="flex items-start">
                <span class="text-xl mr-3">🎨</span>
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-gray-100 text-sm">Design System</h4>
                  <p class="text-gray-600 dark:text-gray-400 text-xs">Complete component library with Tailwind</p>
                </div>
              </div>
              <div class="flex items-start">
                <span class="text-xl mr-3">📊</span>
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-gray-100 text-sm">Admin Dashboard</h4>
                  <p class="text-gray-600 dark:text-gray-400 text-xs">User, job, and data management UI</p>
                </div>
              </div>
              <div class="flex items-start">
                <span class="text-xl mr-3">🌙</span>
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-gray-100 text-sm">Dark Mode</h4>
                  <p class="text-gray-600 dark:text-gray-400 text-xs">Built-in dark mode support</p>
                </div>
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
          </div>
        </ContentContainer>
      </div>
    </>
  );
}
