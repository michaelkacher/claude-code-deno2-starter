/**
 * Exercise Routes
 *
 * HTTP handlers for exercise CRUD operations
 */

import { Hono } from "hono";
import { ExerciseService } from "../services/exercise.service.ts";
import type { ExerciseCreate, ExerciseUpdate } from "../types/volleyball.ts";

const app = new Hono();

/**
 * GET /api/exercises
 * List all exercises with optional filtering
 */
app.get("/", async (c) => {
  try {
    const kv = c.get("kv") as Deno.Kv;
    const service = new ExerciseService(kv);

    const filters = {
      skill: c.req.query("skill") as any,
      difficulty: c.req.query("difficulty") as any,
      page: parseInt(c.req.query("page") || "1"),
      limit: Math.min(parseInt(c.req.query("limit") || "50"), 100),
    };

    const result = await service.list(filters);

    return c.json({
      data: result.exercises,
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
 * GET /api/exercises/:id
 * Get a single exercise by ID
 */
app.get("/:id", async (c) => {
  try {
    const kv = c.get("kv") as Deno.Kv;
    const service = new ExerciseService(kv);
    const id = c.req.param("id");

    const exercise = await service.getById(id);

    if (!exercise) {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Exercise not found",
        },
      }, 404);
    }

    return c.json({ data: exercise });
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
 * POST /api/exercises
 * Create a new exercise (admin only)
 */
app.post("/", async (c) => {
  try {
    const kv = c.get("kv") as Deno.Kv;
    const user = c.get("user");
    const service = new ExerciseService(kv);

    // Check admin permission
    if (!user || user.role !== "admin") {
      return c.json({
        error: {
          code: "FORBIDDEN",
          message: "Only admin users can create exercises",
        },
      }, 403);
    }

    const body = await c.req.json() as ExerciseCreate;
    const exercise = await service.create(body, {
      userId: user.userId,
      role: user.role,
    });

    return c.json({ data: exercise }, 201);
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

    return c.json({
      error: {
        code: "INTERNAL_ERROR",
        message: error.message,
      },
    }, 500);
  }
});

/**
 * PUT /api/exercises/:id
 * Update an existing exercise (admin only)
 */
app.put("/:id", async (c) => {
  try {
    const kv = c.get("kv") as Deno.Kv;
    const user = c.get("user");
    const service = new ExerciseService(kv);
    const id = c.req.param("id");

    // Check admin permission
    if (!user || user.role !== "admin") {
      return c.json({
        error: {
          code: "FORBIDDEN",
          message: "Only admin users can update exercises",
        },
      }, 403);
    }

    const body = await c.req.json() as ExerciseUpdate;
    const exercise = await service.update(id, body, {
      userId: user.userId,
      role: user.role,
    });

    return c.json({ data: exercise });
  } catch (error) {
    if (error.message === "Exercise not found") {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Exercise not found",
        },
      }, 404);
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
 * DELETE /api/exercises/:id
 * Delete an exercise (admin only)
 */
app.delete("/:id", async (c) => {
  try {
    const kv = c.get("kv") as Deno.Kv;
    const user = c.get("user");
    const service = new ExerciseService(kv);
    const id = c.req.param("id");

    // Check admin permission
    if (!user || user.role !== "admin") {
      return c.json({
        error: {
          code: "FORBIDDEN",
          message: "Only admin users can delete exercises",
        },
      }, 403);
    }

    await service.delete(id, {
      userId: user.userId,
      role: user.role,
      checkReferences: true,
    });

    return c.json({
      data: {
        message: "Exercise deleted successfully",
      },
    });
  } catch (error) {
    if (error.message === "Exercise not found") {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Exercise not found",
        },
      }, 404);
    }

    if (error.message.includes("in use")) {
      return c.json({
        error: {
          code: "CONFLICT",
          message: error.message,
        },
      }, 409);
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
