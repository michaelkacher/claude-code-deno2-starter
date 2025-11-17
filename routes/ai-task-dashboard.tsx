/**
 * AI Task Dashboard - Main Route
 * 
 * Real-time dashboard for monitoring AI task processing, human approval queues,
 * and team workload distribution. Built using the mockup design as reference.
 */

import { PageProps } from 'fresh';
import { Head } from 'fresh/runtime';
import AITaskDashboardIsland from "../islands/AITaskDashboard.tsx";

export default function AITaskDashboardPage(props: PageProps) {
  return (
    <>
      <Head>
        <title>AI Task Dashboard</title>
        <meta name="description" content="Real-time monitoring of AI task processing and human approval queues" />
      </Head>
      
      <div class="min-h-screen bg-gray-50">
        <div class="py-6">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="mb-6">
              <h1 class="text-3xl font-bold text-gray-900">AI Task Dashboard</h1>
              <p class="mt-2 text-gray-600">
                Monitor AI processing, approval queues, and team workload in real-time
              </p>
            </div>
            
            <AITaskDashboardIsland />
          </div>
        </div>
      </div>
    </>
  );
}
