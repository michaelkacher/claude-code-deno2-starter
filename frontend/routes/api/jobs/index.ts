/**
 * GET /api/jobs - List jobs with optional filters
 * POST /api/jobs - Create a new background job
 */

import { Handlers } from "$fresh/server.ts";
import { z } from "zod";
import { JobRepository } from "../../../../shared/repositories/index.ts";
import {
  errorResponse,
  parseJsonBody,
  requireAdmin,
  successResponse,
  type AppState,
} from "../../../lib/fresh-helpers.ts";

const CreateJobSchema = z.object({
  name: z.string().min(1).max(100),
  data: z.record(z.any()),
  options: z
    .object({
      priority: z.number().min(1).max(10).optional(),
      delay: z.number().min(0).optional(),
      maxRetries: z.number().min(0).optional(),
    })
    .optional(),
});

export const handler: Handlers<unknown, AppState> = {
  async GET(req, ctx) {
    try {
      // Require admin role
      requireAdmin(ctx);

      // Parse query parameters
      const url = new URL(req.url);
      const status = url.searchParams.get("status") || undefined;
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const cursor = url.searchParams.get("cursor") || undefined;

      const jobRepo = new JobRepository();
      const result = await jobRepo.listJobs({
        status: status as any,
        limit,
        cursor,
      });

      return successResponse({
        jobs: result.items,
        cursor: result.cursor,
        hasMore: result.hasMore,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Admin access required") {
        return errorResponse("FORBIDDEN", "Admin access required", 403);
      }
      console.error("List jobs error:", error);
      return errorResponse("SERVER_ERROR", "Failed to list jobs", 500);
    }
  },

  async POST(req, ctx) {
    try {
      // Require admin role
      requireAdmin(ctx);

      // Parse and validate request body
      const body = await parseJsonBody(req);
      const validatedBody = CreateJobSchema.parse(body);

      const jobRepo = new JobRepository();

      // Create job
      const job = await jobRepo.create(
        validatedBody.name,
        validatedBody.data,
        validatedBody.options,
      );

      return successResponse(job, 201);
    } catch (error) {
      if (error instanceof Error && error.message === "Admin access required") {
        return errorResponse("FORBIDDEN", "Admin access required", 403);
      }
      if (error instanceof Error && error.name === "ZodError") {
        return errorResponse("VALIDATION_ERROR", "Invalid request body", 400);
      }
      console.error("Create job error:", error);
      return errorResponse("SERVER_ERROR", "Failed to create job", 500);
    }
  },
};
