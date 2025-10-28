/**
 * Workout Plan Routes
 *
 * HTTP handlers for workout plan CRUD operations
 */

import { Hono } from "hono";
import { WorkoutPlanService } from "../services/workout-plan.service.ts";
import type { WorkoutPlanCreate, WorkoutPlanUpdate } from "../types/volleyball.ts";

const app = new Hono();

/**
 * GET /api/workout-plans
 * List all workout plans for the authenticated user
 */
app.get("/", async (c) => {
  try {
    const kv = c.get("kv") as Deno.Kv;
    const user = c.get("user");
    const service = new WorkoutPlanService(kv);

    if (!user) {
      return c.json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      }, 401);
    }

    const filters = {
      status: c.req.query("status") as any,
      skill: c.req.query("skill") as any,
      page: parseInt(c.req.query("page") || "1"),
      limit: Math.min(parseInt(c.req.query("limit") || "50"), 100),
      sort: c.req.query("sort") || "createdAt",
      order: c.req.query("order") || "desc",
    };

    const result = await service.list(user.userId, filters);

    return c.json({
      data: result.plans,
      meta: {
        page: result.page,
        limit: filters.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    return c.json({
      error: {
        code: "INTERNAL_ERROR",
        message: error.message,
      },
    }, 500);
  }
});

/**
 * GET /api/workout-plans/:id
 * Get a single workout plan with full details
 */
app.get("/:id", async (c) => {
  try {
    const kv = c.get("kv") as Deno.Kv;
    const user = c.get("user");
    const service = new WorkoutPlanService(kv);
    const id = c.req.param("id");

    if (!user) {
      return c.json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      }, 401);
    }

    const plan = await service.getById(id, user.userId);

    if (!plan) {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Workout plan not found",
        },
      }, 404);
    }

    return c.json({ data: plan });
  } catch (error) {
    if (error.message.includes("permission")) {
      return c.json({
        error: {
          code: "FORBIDDEN",
          message: error.message,
        },
      }, 403);
    }

    return c.json({
      error: {
        code: "INTERNAL_ERROR",
        message: error.message,
      },
    }, 500);
  }
});

/**
 * POST /api/workout-plans
 * Create a new workout plan
 */
app.post("/", async (c) => {
  try {
    const kv = c.get("kv") as Deno.Kv;
    const user = c.get("user");
    const service = new WorkoutPlanService(kv);

    if (!user) {
      return c.json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      }, 401);
    }

    const body = await c.req.json() as WorkoutPlanCreate;
    const plan = await service.create(user.userId, body);

    return c.json({ data: plan }, 201);
  } catch (error) {
    if (error.name === "ZodError") {
      return c.json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
          details: error.errors,
        },
      }, 400);
    }

    if (error.message.includes("Start date")) {
      return c.json({
        error: {
          code: "VALIDATION_ERROR",
          message: error.message,
        },
      }, 400);
    }

    return c.json({
      error: {
        code: "INTERNAL_ERROR",
        message: error.message,
      },
    }, 500);
  }
});

/**
 * PUT /api/workout-plans/:id
 * Update an existing workout plan
 */
app.put("/:id", async (c) => {
  try {
    const kv = c.get("kv") as Deno.Kv;
    const user = c.get("user");
    const service = new WorkoutPlanService(kv);
    const id = c.req.param("id");

    if (!user) {
      return c.json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      }, 401);
    }

    const body = await c.req.json() as WorkoutPlanUpdate;
    const plan = await service.update(id, user.userId, body);

    return c.json({ data: plan });
  } catch (error) {
    if (error.message === "Workout plan not found") {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Workout plan not found",
        },
      }, 404);
    }

    if (error.message.includes("permission")) {
      return c.json({
        error: {
          code: "FORBIDDEN",
          message: error.message,
        },
      }, 403);
    }

    if (error.name === "ZodError") {
      return c.json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
          details: error.errors,
        },
      }, 400);
    }

    return c.json({
      error: {
        code: "INTERNAL_ERROR",
        message: error.message,
      },
    }, 500);
  }
});

/**
 * DELETE /api/workout-plans/:id
 * Delete a workout plan and all associated sessions
 */
app.delete("/:id", async (c) => {
  try {
    const kv = c.get("kv") as Deno.Kv;
    const user = c.get("user");
    const service = new WorkoutPlanService(kv);
    const id = c.req.param("id");

    if (!user) {
      return c.json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      }, 401);
    }

    await service.delete(id, user.userId);

    return c.json({
      data: {
        message: "Workout plan and all sessions deleted successfully",
      },
    });
  } catch (error) {
    if (error.message === "Workout plan not found") {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Workout plan not found",
        },
      }, 404);
    }

    if (error.message.includes("permission")) {
      return c.json({
        error: {
          code: "FORBIDDEN",
          message: error.message,
        },
      }, 403);
    }

    return c.json({
      error: {
        code: "INTERNAL_ERROR",
        message: error.message,
      },
    }, 500);
  }
});

/**
 * GET /api/workout-plans/:id/sessions
 * Get all training sessions for a workout plan
 */
app.get("/:id/sessions", async (c) => {
  try {
    const kv = c.get("kv") as Deno.Kv;
    const user = c.get("user");
    const service = new WorkoutPlanService(kv);
    const id = c.req.param("id");

    if (!user) {
      return c.json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      }, 401);
    }

    const sessions = await service.getSessions(id, user.userId);

    // Calculate stats
    const total = sessions.length;
    const completed = sessions.filter(s => s.completed).length;
    const incomplete = total - completed;

    return c.json({
      data: sessions,
      meta: {
        total,
        completed,
        incomplete,
      },
    });
  } catch (error) {
    if (error.message === "Workout plan not found") {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Workout plan not found",
        },
      }, 404);
    }

    if (error.message.includes("permission")) {
      return c.json({
        error: {
          code: "FORBIDDEN",
          message: error.message,
        },
      }, 403);
    }

    return c.json({
      error: {
        code: "INTERNAL_ERROR",
        message: error.message,
      },
    }, 500);
  }
});

export default app;
