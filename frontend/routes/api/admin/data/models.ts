/**
 * GET /api/admin/data/models
 * Get list of available KV models/collections
 */

import { Handlers } from "$fresh/server.ts";
import { getKv } from "../../../../../backend/lib/kv.ts";
import {
    errorResponse,
    requireAdmin,
    successResponse,
    type AppState,
} from "../../../../lib/fresh-helpers.ts";

// Known model prefixes in the database
const MODEL_PREFIXES = [
  "users",
  "users_by_email",
  "refresh_tokens",
  "token_blacklist",
  "password_reset",
  "email_verification",
  "notifications",
  "jobs",
];

export const handler: Handlers<unknown, AppState> = {
  async GET(req, ctx) {
    try {
      // Require admin role
      requireAdmin(ctx);

      const kv = await getKv();

      // Count entries for each model
      const models = await Promise.all(
        MODEL_PREFIXES.map(async (prefix) => {
          let count = 0;
          const entries = kv.list({ prefix: [prefix] });

          for await (const _entry of entries) {
            count++;
            if (count > 1000) break; // Limit count to prevent long queries
          }

          return {
            name: prefix,
            count,
          };
        }),
      );

      return successResponse({
        models: models.filter((m) => m.count > 0), // Only return models with data
      });
    } catch (error) {
      if (error.message === "Admin access required") {
        return errorResponse("FORBIDDEN", "Admin access required", 403);
      }
      console.error("Error fetching models:", error);
      return errorResponse("SERVER_ERROR", "Failed to fetch models", 500);
    }
  },
};
