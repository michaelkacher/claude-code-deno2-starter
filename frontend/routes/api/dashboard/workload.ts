/**
 * AI Task Dashboard - Team Workload API Route
 * 
 * Provides team workload distribution and performance analytics.
 */

import { FreshContext } from 'fresh';
import { AITaskDashboardService } from "../../../../shared/services/ai-task-dashboard.service.ts";

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
      const timeframe = url.searchParams.get("timeframe") || "7d";
      const includeAI = url.searchParams.get("includeAI") !== "false";

      const workload = await dashboardService.getTeamWorkload(timeframe, includeAI);

      return new Response(
        JSON.stringify(workload),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    } catch (error) {
      console.error("Team workload error:", error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch team workload",
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