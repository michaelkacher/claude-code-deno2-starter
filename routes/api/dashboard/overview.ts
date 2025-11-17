/**
 * AI Task Dashboard API Routes
 * 
 * Provides RESTful endpoints for the AI task dashboard functionality.
 * Integrates with the AITaskDashboardService to provide real-time task monitoring.
 */

import { FreshContext } from "fresh";
import { AITaskDashboardService } from '@/services/ai-task-dashboard.service.ts";

const dashboardService = new AITaskDashboardService();

// CORS headers for API responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * Dashboard Overview Endpoint
 * GET /api/dashboard/overview
 */
export const handler = {
  GET: async (ctx: FreshContext) => {
    const req = ctx.req;
    try {
      const url = new URL(req.url);
      const timeframe = url.searchParams.get("timeframe") || "24h";

      const overview = await dashboardService.getDashboardOverview(timeframe);

      return new Response(
        JSON.stringify(overview),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    } catch (error) {
      console.error("Dashboard overview error:", error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch dashboard overview",
          details: error.message 
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
  },

  OPTIONS: () => {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  },
};
