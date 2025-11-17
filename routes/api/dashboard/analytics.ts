/**
 * AI Task Dashboard - Performance Analytics API Route
 * 
 * Provides performance metrics and analytics for the dashboard.
 */

import { FreshContext } from "fresh";
import { AITaskDashboardService } from '@/services/ai-task-dashboard.service.ts";

const dashboardService = new AITaskDashboardService();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const handler = {
  GET: async (ctx: FreshContext) => {
    const req = ctx.req;
    try {
      const url = new URL(req.url);
      const timeframe = url.searchParams.get("timeframe") || "30d";
      const granularity = url.searchParams.get("granularity") as "hour" | "day" | "week" || "day";

      const analytics = await dashboardService.getPerformanceAnalytics(timeframe, granularity);

      return new Response(
        JSON.stringify(analytics),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    } catch (error) {
      console.error("Performance analytics error:", error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch performance analytics",
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
