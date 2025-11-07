/**
 * POST /api/jobs
 * Create a new background job
 */

import { Handlers } from "$fresh/server.ts";
import { z } from "zod";
import { JobRepository } from "../../../../backend/repositories/index.ts";
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
  async POST(req, ctx) {
    try {
      // Require admin role
      requireAdmin(ctx);

      // Parse and validate request body
      const body = await parseJsonBody(req, CreateJobSchema);

      const jobRepo = new JobRepository();

      // Create job
      const job = await jobRepo.create(body.name, body.data, body.options);

      return successResponse(job, 201);
    } catch (error) {
      if (error.message === "Admin access required") {
        return errorResponse("FORBIDDEN", "Admin access required", 403);
      }
      if (error.name === "ZodError") {
        return errorResponse("VALIDATION_ERROR", "Invalid request body", 400);
      }
      console.error("Create job error:", error);
      return errorResponse("SERVER_ERROR", "Failed to create job", 500);
    }
  },
};
