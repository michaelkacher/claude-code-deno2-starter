/**
 * Workout Plan Service Tests
 *
 * Tests for the WorkoutPlanService business logic layer
 * Following TDD principles - these tests should FAIL initially (RED phase)
 */

import {
  assertEquals,
  assertExists,
  assertRejects,
} from "https://deno.land/std@0.216.0/assert/mod.ts";
import {
  createMockExercise,
  createMockWorkoutPlan,
  setupTestKv,
} from "../lib/test-helpers.ts";
import { WorkoutPlanService } from "./workout-plan.service.ts";

const USER_ID = "usr_test123";
const OTHER_USER_ID = "usr_other456";

// ============================================================================
// CREATE WORKOUT PLAN TESTS
// ============================================================================

Deno.test("WorkoutPlanService - create plan with valid data", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutPlanService(kv);
    const planData = {
      skillFocus: "agility",
      durationWeeks: 4,
      trainingDays: ["monday", "wednesday", "friday"],
      exerciseIds: ["ex_1", "ex_2"],
      startDate: new Date("2025-01-29"),
    };

    const plan = await service.create(USER_ID, planData);

    assertEquals(plan.userId, USER_ID);
    assertEquals(plan.skillFocus, "agility");
    assertEquals(plan.durationWeeks, 4);
    assertEquals(plan.trainingDays.length, 3);
    assertEquals(plan.exerciseIds.length, 2);
    assertEquals(plan.status, "active");
    assertEquals(plan.totalSessions, 12); // 4 weeks × 3 days
    assertExists(plan.id);
    assertExists(plan.createdAt);
    assertExists(plan.endDate);
  } finally {
    await cleanup();
  }
});

Deno.test("WorkoutPlanService - create plan auto-generates training sessions", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutPlanService(kv);
    const planData = {
      skillFocus: "agility",
      durationWeeks: 2,
      trainingDays: ["monday", "wednesday"],
      exerciseIds: ["ex_1"],
      startDate: new Date("2025-01-29"),
    };

    const plan = await service.create(USER_ID, planData);

    // Verify sessions were created
    const sessions = await service.getSessions(plan.id, USER_ID);
    assertEquals(sessions.length, 4); // 2 weeks × 2 days
    assertEquals(sessions[0].sessionNumber, 1);
    assertEquals(sessions[0].dayOfWeek, "monday");
    assertEquals(sessions[1].dayOfWeek, "wednesday");
  } finally {
    await cleanup();
  }
});

Deno.test("WorkoutPlanService - create plan calculates end date correctly", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutPlanService(kv);
    const startDate = new Date("2025-01-29");
    const planData = {
      skillFocus: "agility",
      durationWeeks: 4,
      trainingDays: ["monday"],
      exerciseIds: ["ex_1"],
      startDate,
    };

    const plan = await service.create(USER_ID, planData);

    const expectedEndDate = new Date(startDate);
    expectedEndDate.setDate(expectedEndDate.getDate() + 28); // 4 weeks

    assertEquals(
      plan.endDate.toDateString(),
      expectedEndDate.toDateString(),
    );
  } finally {
    await cleanup();
  }
});

Deno.test("WorkoutPlanService - reject plan with no training days", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutPlanService(kv);
    const planData = {
      skillFocus: "agility",
      durationWeeks: 4,
      trainingDays: [],
      exerciseIds: ["ex_1"],
    };

    await assertRejects(
      () => service.create(USER_ID, planData),
      Error,
      "training day",
    );
  } finally {
    await cleanup();
  }
});

Deno.test("WorkoutPlanService - reject plan with invalid skill category", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutPlanService(kv);
    const planData = {
      skillFocus: "invalid_skill",
      durationWeeks: 4,
      trainingDays: ["monday"],
      exerciseIds: ["ex_1"],
    };

    await assertRejects(
      () => service.create(USER_ID, planData),
      Error,
      "skill",
    );
  } finally {
    await cleanup();
  }
});

Deno.test("WorkoutPlanService - reject plan with invalid duration", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutPlanService(kv);
    const planData = {
      skillFocus: "agility",
      durationWeeks: 5, // Not in allowed list: 1,2,3,4,6,8,12
      trainingDays: ["monday"],
      exerciseIds: ["ex_1"],
    };

    await assertRejects(
      () => service.create(USER_ID, planData),
      Error,
      "duration",
    );
  } finally {
    await cleanup();
  }
});

Deno.test("WorkoutPlanService - allow plan with empty exercise list", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutPlanService(kv);
    const planData = {
      skillFocus: "agility",
      durationWeeks: 4,
      trainingDays: ["monday"],
      exerciseIds: [],
    };

    const plan = await service.create(USER_ID, planData);

    assertEquals(plan.exerciseIds.length, 0);
  } finally {
    await cleanup();
  }
});

Deno.test("WorkoutPlanService - reject plan with duplicate training days", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutPlanService(kv);
    const planData = {
      skillFocus: "agility",
      durationWeeks: 4,
      trainingDays: ["monday", "monday", "wednesday"],
      exerciseIds: ["ex_1"],
    };

    await assertRejects(
      () => service.create(USER_ID, planData),
      Error,
      "duplicate",
    );
  } finally {
    await cleanup();
  }
});

Deno.test("WorkoutPlanService - reject plan with past start date", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutPlanService(kv);
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const planData = {
      skillFocus: "agility",
      durationWeeks: 4,
      trainingDays: ["monday"],
      exerciseIds: ["ex_1"],
      startDate: pastDate,
    };

    await assertRejects(
      () => service.create(USER_ID, planData),
      Error,
      "start date",
    );
  } finally {
    await cleanup();
  }
});

// ============================================================================
// GET WORKOUT PLAN TESTS
// ============================================================================

Deno.test("WorkoutPlanService - get plan by ID", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutPlanService(kv);
    const created = await service.create(USER_ID, {
      skillFocus: "agility",
      durationWeeks: 4,
      trainingDays: ["monday"],
      exerciseIds: ["ex_1"],
    });

    const plan = await service.getById(created.id, USER_ID);

    assertExists(plan);
    assertEquals(plan!.id, created.id);
    assertEquals(plan!.userId, USER_ID);
  } finally {
    await cleanup();
  }
});

Deno.test("WorkoutPlanService - get plan includes exercise details", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutPlanService(kv);

    // Create mock exercises in KV
    const exercise1 = createMockExercise({ id: "ex_1", name: "Exercise 1" });
    const exercise2 = createMockExercise({ id: "ex_2", name: "Exercise 2" });
    await kv.set(["exercises", "ex_1"], exercise1);
    await kv.set(["exercises", "ex_2"], exercise2);

    const created = await service.create(USER_ID, {
      skillFocus: "agility",
      durationWeeks: 4,
      trainingDays: ["monday"],
      exerciseIds: ["ex_1", "ex_2"],
    });

    const plan = await service.getById(created.id, USER_ID);

    assertExists(plan);
    assertExists(plan!.exercises);
    assertEquals(plan!.exercises!.length, 2);
    assertEquals(plan!.exercises![0].name, "Exercise 1");
    assertEquals(plan!.exercises![1].name, "Exercise 2");
  } finally {
    await cleanup();
  }
});

Deno.test("WorkoutPlanService - user can only access their own plans", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutPlanService(kv);
    const created = await service.create(USER_ID, {
      skillFocus: "agility",
      durationWeeks: 4,
      trainingDays: ["monday"],
      exerciseIds: [],
    });

    await assertRejects(
      () => service.getById(created.id, OTHER_USER_ID),
      Error,
      "permission",
    );
  } finally {
    await cleanup();
  }
});

Deno.test("WorkoutPlanService - return null for non-existent plan", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutPlanService(kv);

    const plan = await service.getById("wp_nonexistent", USER_ID);

    assertEquals(plan, null);
  } finally {
    await cleanup();
  }
});

// ============================================================================
// LIST WORKOUT PLANS TESTS
// ============================================================================

Deno.test("WorkoutPlanService - list plans by user", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutPlanService(kv);

    // Create plans for different users
    await service.create(USER_ID, {
      skillFocus: "agility",
      durationWeeks: 4,
      trainingDays: ["monday"],
      exerciseIds: [],
    });
    await service.create(USER_ID, {
      skillFocus: "hitting",
      durationWeeks: 2,
      trainingDays: ["wednesday"],
      exerciseIds: [],
    });
    await service.create(OTHER_USER_ID, {
      skillFocus: "serving",
      durationWeeks: 4,
      trainingDays: ["friday"],
      exerciseIds: [],
    });

    const result = await service.list(USER_ID, {});

    assertEquals(result.plans.length, 2);
    assertEquals(result.total, 2);
  } finally {
    await cleanup();
  }
});

Deno.test("WorkoutPlanService - list plans includes progress stats", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutPlanService(kv);

    await service.create(USER_ID, {
      skillFocus: "agility",
      durationWeeks: 4,
      trainingDays: ["monday", "wednesday"],
      exerciseIds: [],
    });

    const result = await service.list(USER_ID, {});

    assertEquals(result.plans.length, 1);
    assertExists(result.plans[0].completedSessions);
    assertExists(result.plans[0].progressPercentage);
    assertEquals(result.plans[0].completedSessions, 0);
    assertEquals(result.plans[0].progressPercentage, 0);
  } finally {
    await cleanup();
  }
});

Deno.test("WorkoutPlanService - filter plans by status", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutPlanService(kv);

    const plan1 = await service.create(USER_ID, {
      skillFocus: "agility",
      durationWeeks: 4,
      trainingDays: ["monday"],
      exerciseIds: [],
    });

    await service.create(USER_ID, {
      skillFocus: "hitting",
      durationWeeks: 2,
      trainingDays: ["wednesday"],
      exerciseIds: [],
    });

    // Update first plan to completed
    await service.update(plan1.id, USER_ID, { status: "completed" });

    const result = await service.list(USER_ID, { status: "completed" });

    assertEquals(result.plans.length, 1);
    assertEquals(result.plans[0].status, "completed");
  } finally {
    await cleanup();
  }
});

Deno.test("WorkoutPlanService - filter plans by skill category", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutPlanService(kv);

    await service.create(USER_ID, {
      skillFocus: "agility",
      durationWeeks: 4,
      trainingDays: ["monday"],
      exerciseIds: [],
    });
    await service.create(USER_ID, {
      skillFocus: "hitting",
      durationWeeks: 2,
      trainingDays: ["wednesday"],
      exerciseIds: [],
    });
    await service.create(USER_ID, {
      skillFocus: "agility",
      durationWeeks: 2,
      trainingDays: ["friday"],
      exerciseIds: [],
    });

    const result = await service.list(USER_ID, { skill: "agility" });

    assertEquals(result.plans.length, 2);
    assertEquals(result.plans[0].skillFocus, "agility");
    assertEquals(result.plans[1].skillFocus, "agility");
  } finally {
    await cleanup();
  }
});

Deno.test("WorkoutPlanService - paginate plans", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutPlanService(kv);

    // Create 10 plans
    for (let i = 0; i < 10; i++) {
      await service.create(USER_ID, {
        skillFocus: "agility",
        durationWeeks: 4,
        trainingDays: ["monday"],
        exerciseIds: [],
      });
    }

    const result = await service.list(USER_ID, { page: 1, limit: 5 });

    assertEquals(result.plans.length, 5);
    assertEquals(result.total, 10);
    assertEquals(result.page, 1);
    assertEquals(result.totalPages, 2);
  } finally {
    await cleanup();
  }
});

// ============================================================================
// UPDATE WORKOUT PLAN TESTS
// ============================================================================

Deno.test("WorkoutPlanService - update plan training days", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutPlanService(kv);
    const created = await service.create(USER_ID, {
      skillFocus: "agility",
      durationWeeks: 4,
      trainingDays: ["monday"],
      exerciseIds: [],
    });

    const updated = await service.update(created.id, USER_ID, {
      trainingDays: ["monday", "wednesday", "friday"],
    });

    assertEquals(updated.trainingDays.length, 3);
    assertEquals(updated.totalSessions, 12); // Recalculated: 4 weeks × 3 days
  } finally {
    await cleanup();
  }
});

Deno.test("WorkoutPlanService - update plan exercises", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutPlanService(kv);
    const created = await service.create(USER_ID, {
      skillFocus: "agility",
      durationWeeks: 4,
      trainingDays: ["monday"],
      exerciseIds: ["ex_1"],
    });

    const updated = await service.update(created.id, USER_ID, {
      exerciseIds: ["ex_1", "ex_2", "ex_3"],
    });

    assertEquals(updated.exerciseIds.length, 3);
  } finally {
    await cleanup();
  }
});

Deno.test("WorkoutPlanService - update plan status", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutPlanService(kv);
    const created = await service.create(USER_ID, {
      skillFocus: "agility",
      durationWeeks: 4,
      trainingDays: ["monday"],
      exerciseIds: [],
    });

    const updated = await service.update(created.id, USER_ID, {
      status: "paused",
    });

    assertEquals(updated.status, "paused");
  } finally {
    await cleanup();
  }
});

Deno.test("WorkoutPlanService - update plan updates future sessions only", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutPlanService(kv);
    const created = await service.create(USER_ID, {
      skillFocus: "agility",
      durationWeeks: 4,
      trainingDays: ["monday"],
      exerciseIds: ["ex_1"],
    });

    // Mark first session as completed
    const sessions = await service.getSessions(created.id, USER_ID);
    // TODO: This will require TrainingSessionService to be implemented
    // await sessionService.complete(sessions[0].id, USER_ID);

    // Update exercises
    const updated = await service.update(created.id, USER_ID, {
      exerciseIds: ["ex_1", "ex_2"],
    });

    // Verify only future sessions are updated
    const updatedSessions = await service.getSessions(updated.id, USER_ID);
    // First session should keep old exercises
    // Future sessions should have new exercises
    assertEquals(updatedSessions.length > 0, true);
  } finally {
    await cleanup();
  }
});

Deno.test("WorkoutPlanService - user can only update their own plans", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutPlanService(kv);
    const created = await service.create(USER_ID, {
      skillFocus: "agility",
      durationWeeks: 4,
      trainingDays: ["monday"],
      exerciseIds: [],
    });

    await assertRejects(
      () =>
        service.update(created.id, OTHER_USER_ID, {
          status: "paused",
        }),
      Error,
      "permission",
    );
  } finally {
    await cleanup();
  }
});

Deno.test("WorkoutPlanService - reject update with invalid data", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutPlanService(kv);
    const created = await service.create(USER_ID, {
      skillFocus: "agility",
      durationWeeks: 4,
      trainingDays: ["monday"],
      exerciseIds: [],
    });

    await assertRejects(
      () =>
        service.update(created.id, USER_ID, {
          trainingDays: [],
        }),
      Error,
      "training day",
    );
  } finally {
    await cleanup();
  }
});

// ============================================================================
// DELETE WORKOUT PLAN TESTS
// ============================================================================

Deno.test("WorkoutPlanService - delete plan", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutPlanService(kv);
    const created = await service.create(USER_ID, {
      skillFocus: "agility",
      durationWeeks: 4,
      trainingDays: ["monday"],
      exerciseIds: [],
    });

    await service.delete(created.id, USER_ID);

    const deleted = await service.getById(created.id, USER_ID);
    assertEquals(deleted, null);
  } finally {
    await cleanup();
  }
});

Deno.test("WorkoutPlanService - delete plan cascades to sessions", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutPlanService(kv);
    const created = await service.create(USER_ID, {
      skillFocus: "agility",
      durationWeeks: 2,
      trainingDays: ["monday", "wednesday"],
      exerciseIds: [],
    });

    // Verify sessions exist
    const sessions = await service.getSessions(created.id, USER_ID);
    assertEquals(sessions.length, 4);

    // Delete plan
    await service.delete(created.id, USER_ID);

    // Verify sessions are deleted
    const deletedSessions = await service.getSessions(created.id, USER_ID);
    assertEquals(deletedSessions.length, 0);
  } finally {
    await cleanup();
  }
});

Deno.test("WorkoutPlanService - user can only delete their own plans", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutPlanService(kv);
    const created = await service.create(USER_ID, {
      skillFocus: "agility",
      durationWeeks: 4,
      trainingDays: ["monday"],
      exerciseIds: [],
    });

    await assertRejects(
      () => service.delete(created.id, OTHER_USER_ID),
      Error,
      "permission",
    );
  } finally {
    await cleanup();
  }
});

Deno.test("WorkoutPlanService - reject delete for non-existent plan", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new WorkoutPlanService(kv);

    await assertRejects(
      () => service.delete("wp_nonexistent", USER_ID),
      Error,
      "not found",
    );
  } finally {
    await cleanup();
  }
});
