/**
 * AI Task Dashboard - AI Agents Status API Route
 * 
 * Provides AI agent status, metrics, and fleet management information.
 */

import { FreshContext } from "fresh";
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
      const includeMetrics = url.searchParams.get("includeMetrics") !== "false";

      const agentStatus = await dashboardService.getAIAgentStatus(includeMetrics);

      return new Response(
        JSON.stringify(agentStatus),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    } catch (error) {
      console.error("AI agent status error:", error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch AI agent status",
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