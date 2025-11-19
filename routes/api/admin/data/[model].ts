/**
 * GET /api/admin/data/:model
 * Get data for a specific KV model with pagination and filtering
 *
 * REFACTORED: Uses withErrorHandler pattern
 */

import { BadRequestError } from "@/lib/errors.ts";
import {
  requireAdmin,
  successResponse,
  withErrorHandler,
  type AppState,
} from "@/lib/fresh-helpers.ts";
import { getKv } from "@/lib/kv.ts";
import { Handlers } from "fresh";

// Known model prefixes
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
  GET: withErrorHandler(async (ctx) => {
    const req = ctx.req;
    // Require admin access (throws AuthorizationError if not admin)
    requireAdmin(ctx);

    const model = ctx.params["model"];
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const filterProperty = url.searchParams.get("filterProperty") || undefined;
    const filterValue = url.searchParams.get("filterValue") || undefined;

    // Validate model exists
    if (!model || !MODEL_PREFIXES.includes(model)) {
      throw new BadRequestError("Invalid model name");
    }

    const kv = await getKv();
    const entries = kv.list({ prefix: [model] });
    const data: Array<Record<string, unknown>> = [];
    const allProperties = new Set<string>();
    let totalCount = 0;
    let skipped = 0;
    const skip = (page - 1) * limit;

    for await (const entry of entries) {
      totalCount++;

      // Apply filtering if specified
      if (filterProperty && filterValue && entry.value) {
        const value = entry.value as Record<string, unknown>;
        const propValue = String(value[filterProperty] || "");
        if (!propValue.toLowerCase().includes(filterValue.toLowerCase())) {
          continue;
        }
      }

      // Skip entries for pagination
      if (skipped < skip) {
        skipped++;
        continue;
      }

      // Collect data
      if (data.length < limit) {
        const item: Record<string, unknown> = {
          _key: entry.key,
          _versionstamp: entry.versionstamp,
        };

        // Handle different value types
        if (entry.value && typeof entry.value === "object") {
          Object.assign(item, entry.value);

          // Collect all property names for schema
          Object.keys(entry.value as object).forEach((key) => {
            allProperties.add(key);
          });

          // Mask sensitive fields
          if (item["password"]) {
            item["password"] = "••••••••";
          }
          if (item["twoFactorSecret"]) {
            item["twoFactorSecret"] = "••••••••";
          }
        } else {
          item["_value"] = entry.value;
        }

        data.push(item);
      }

      // Stop if we have enough data
      if (data.length >= limit) {
        break;
      }
    }

    const properties = [
      "_key",
      "_versionstamp",
      ...Array.from(allProperties).sort(),
    ];

    return successResponse({
      model,
      properties,
      items: data,
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore: data.length === limit,
      },
    });
  }),
};
