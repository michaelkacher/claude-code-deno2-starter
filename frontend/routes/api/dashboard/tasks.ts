/**
 * AI Task Dashboard - Tasks API Route
 * 
 * Handles task filtering, searching, and pagination for the dashboard.
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
      
      // Parse query parameters
      const filters = {
        status: url.searchParams.get("status") || undefined,
        priority: url.searchParams.get("priority") || undefined,
        assignee: url.searchParams.get("assignee") || undefined,
        aiAgent: url.searchParams.get("aiAgent") || undefined,
        needsApproval: url.searchParams.get("needsApproval") === "true" ? true : 
                      url.searchParams.get("needsApproval") === "false" ? false : undefined,
      };

      const pagination = {
        page: parseInt(url.searchParams.get("page") || "1"),
        limit: parseInt(url.searchParams.get("limit") || "20"),
      };

      const sortBy = url.searchParams.get("sortBy") || "updatedAt";
      const sortOrder = url.searchParams.get("sortOrder") as "asc" | "desc" || "desc";
      const search = url.searchParams.get("search") || undefined;

      const tasks = await dashboardService.getFilteredTasks({
        filters,
        pagination,
        sortBy,
        sortOrder,
        search,
      });

      return new Response(
        JSON.stringify(tasks),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    } catch (error) {
      console.error("Dashboard tasks error:", error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch dashboard tasks",
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