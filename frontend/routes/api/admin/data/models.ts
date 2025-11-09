/**
 * GET /api/admin/data/models
 * Get list of available KV models/collections
 *
 * REFACTORED: Uses withErrorHandler pattern
 */

import { Handlers } from "$fresh/server.ts";
import { getKv } from "../../../../../shared/lib/kv.ts";
import {
    requireAdmin,
    successResponse,
    withErrorHandler,
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
  GET: withErrorHandler(async (_req, ctx) => {
    // Require admin access (throws AuthorizationError if not admin)
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
  }),
};
