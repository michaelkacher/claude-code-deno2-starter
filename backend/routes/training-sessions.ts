/**
 * Training Session Routes
 *
 * HTTP handlers for training session tracking and exercise completion
 */

import { Hono } from "hono";
import { TrainingSessionService } from "../services/training-session.service.ts";
import type {
  ExerciseCompletionCreate,
  ExerciseCompletionUpdate,
  TrainingSessionUpdate,
} from "../types/volleyball.ts";

const app = new Hono();

/**
 * GET /api/training-sessions/:id
 * Get a single training session with exercise details
 */
app.get("/:id", async (c) => {
  try {
    const kv = c.get("kv") as Deno.Kv;
    const user = c.get("user");
    const service = new TrainingSessionService(kv);
    const id = c.req.param("id");

    if (!user) {
      return c.json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      }, 401);
    }

    const session = await service.getById(id, user.userId);

    if (!session) {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Training session not found",
        },
      }, 404);
    }

    return c.json({ data: session });
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
 * PUT /api/training-sessions/:id
 * Update training session (mark as complete, add duration, etc.)
 */
app.put("/:id", async (c) => {
  try {
    const kv = c.get("kv") as Deno.Kv;
    const user = c.get("user");
    const service = new TrainingSessionService(kv);
    const id = c.req.param("id");

    if (!user) {
      return c.json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      }, 401);
    }

    const body = await c.req.json() as TrainingSessionUpdate;
    const session = await service.updateCompletion(id, user.userId, body);

    return c.json({ data: session });
  } catch (error) {
    if (error.message === "Training session not found") {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Training session not found",
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
 * GET /api/training-sessions/:id/completions
 * Get exercise completions for a training session
 */
app.get("/:id/completions", async (c) => {
  try {
    const kv = c.get("kv") as Deno.Kv;
    const user = c.get("user");
    const service = new TrainingSessionService(kv);
    const id = c.req.param("id");

    if (!user) {
      return c.json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      }, 401);
    }

    const completions = await service.getExerciseCompletions(id, user.userId);

    return c.json({ data: completions });
  } catch (error) {
    if (error.message === "Training session not found") {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Training session not found",
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
 * POST /api/training-sessions/:id/completions
 * Mark an exercise as complete within a session
 */
app.post("/:id/completions", async (c) => {
  try {
    const kv = c.get("kv") as Deno.Kv;
    const user = c.get("user");
    const service = new TrainingSessionService(kv);
    const id = c.req.param("id");

    if (!user) {
      return c.json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      }, 401);
    }

    const body = await c.req.json() as ExerciseCompletionCreate;
    const completion = await service.markExerciseComplete(id, user.userId, body);

    return c.json({ data: completion }, 201);
  } catch (error) {
    if (error.message === "Training session not found") {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Training session not found",
        },
      }, 404);
    }

    if (error.message === "Exercise not in session") {
      return c.json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Exercise not in session",
        },
      }, 400);
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
 * PUT /api/exercise-completions/:id
 * Update an existing exercise completion (toggle, add notes)
 */
app.put("/exercise-completions/:id", async (c) => {
  try {
    const kv = c.get("kv") as Deno.Kv;
    const user = c.get("user");
    const service = new TrainingSessionService(kv);
    const id = c.req.param("id");

    if (!user) {
      return c.json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      }, 401);
    }

    const body = await c.req.json() as ExerciseCompletionUpdate;
    const completion = await service.updateExerciseCompletion(id, user.userId, body);

    return c.json({ data: completion });
  } catch (error) {
    if (error.message === "Exercise completion not found") {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Exercise completion not found",
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

export default app;
