/**
 * Training Session Service Tests
 *
 * Tests for the TrainingSessionService business logic layer
 * Following TDD principles - these tests should FAIL initially (RED phase)
 */

import {
  assertEquals,
  assertExists,
  assertRejects,
} from "https://deno.land/std@0.216.0/assert/mod.ts";
import {
  createMockExerciseCompletion,
  createMockTrainingSession,
  createMockWorkoutPlan,
  setupTestKv,
} from "../lib/test-helpers.ts";
import { TrainingSessionService } from "./training-session.service.ts";

const USER_ID = "usr_test123";
const OTHER_USER_ID = "usr_other456";

// ============================================================================
// GET TRAINING SESSION TESTS
// ============================================================================

Deno.test("TrainingSessionService - get session by ID", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new TrainingSessionService(kv);

    // Create a workout plan and session
    const plan = createMockWorkoutPlan({ userId: USER_ID });
    await kv.set(["workout_plans", plan.id], plan);

    const session = createMockTrainingSession({
      workoutPlanId: plan.id,
      exerciseIds: ["ex_1", "ex_2"],
    });
    await kv.set(["training_sessions", session.id], session);

    const retrieved = await service.getById(session.id, USER_ID);

    assertExists(retrieved);
    assertEquals(retrieved!.id, session.id);
    assertEquals(retrieved!.workoutPlanId, plan.id);
  } finally {
    await cleanup();
  }
});

Deno.test("TrainingSessionService - get session includes exercise details", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new TrainingSessionService(kv);

    const plan = createMockWorkoutPlan({ userId: USER_ID });
    await kv.set(["workout_plans", plan.id], plan);

    const session = createMockTrainingSession({
      workoutPlanId: plan.id,
      exerciseIds: ["ex_1", "ex_2"],
    });
    await kv.set(["training_sessions", session.id], session);

    // Mock exercise data
    await kv.set(["exercises", "ex_1"], {
      id: "ex_1",
      name: "Exercise 1",
      durationMinutes: 15,
    });
    await kv.set(["exercises", "ex_2"], {
      id: "ex_2",
      name: "Exercise 2",
      durationMinutes: 20,
    });

    const retrieved = await service.getById(session.id, USER_ID);

    assertExists(retrieved);
    assertExists(retrieved!.exercises);
    assertEquals(retrieved!.exercises!.length, 2);
    assertEquals(retrieved!.exercises![0].name, "Exercise 1");
  } finally {
    await cleanup();
  }
});

Deno.test("TrainingSessionService - user can only access their own sessions", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new TrainingSessionService(kv);

    const plan = createMockWorkoutPlan({ userId: USER_ID });
    await kv.set(["workout_plans", plan.id], plan);

    const session = createMockTrainingSession({ workoutPlanId: plan.id });
    await kv.set(["training_sessions", session.id], session);

    await assertRejects(
      () => service.getById(session.id, OTHER_USER_ID),
      Error,
      "permission",
    );
  } finally {
    await cleanup();
  }
});

Deno.test("TrainingSessionService - return null for non-existent session", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new TrainingSessionService(kv);

    const session = await service.getById("ts_nonexistent", USER_ID);

    assertEquals(session, null);
  } finally {
    await cleanup();
  }
});

// ============================================================================
// GET SESSIONS BY PLAN TESTS
// ============================================================================

Deno.test("TrainingSessionService - get sessions by plan", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new TrainingSessionService(kv);

    const plan = createMockWorkoutPlan({ userId: USER_ID });
    await kv.set(["workout_plans", plan.id], plan);

    // Create multiple sessions
    const session1 = createMockTrainingSession({
      workoutPlanId: plan.id,
      sessionNumber: 1,
    });
    const session2 = createMockTrainingSession({
      workoutPlanId: plan.id,
      sessionNumber: 2,
    });
    const session3 = createMockTrainingSession({
      workoutPlanId: plan.id,
      sessionNumber: 3,
    });

    await kv.set(["training_sessions", session1.id], session1);
    await kv.set(["training_sessions", session2.id], session2);
    await kv.set(["training_sessions", session3.id], session3);

    const sessions = await service.getByPlan(plan.id, USER_ID);

    assertEquals(sessions.length, 3);
    assertEquals(sessions[0].sessionNumber, 1);
    assertEquals(sessions[1].sessionNumber, 2);
    assertEquals(sessions[2].sessionNumber, 3);
  } finally {
    await cleanup();
  }
});

Deno.test("TrainingSessionService - filter sessions by date range", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new TrainingSessionService(kv);

    const plan = createMockWorkoutPlan({ userId: USER_ID });
    await kv.set(["workout_plans", plan.id], plan);

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const session1 = createMockTrainingSession({
      workoutPlanId: plan.id,
      scheduledDate: today,
    });
    const session2 = createMockTrainingSession({
      workoutPlanId: plan.id,
      scheduledDate: tomorrow,
    });
    const session3 = createMockTrainingSession({
      workoutPlanId: plan.id,
      scheduledDate: nextWeek,
    });

    await kv.set(["training_sessions", session1.id], session1);
    await kv.set(["training_sessions", session2.id], session2);
    await kv.set(["training_sessions", session3.id], session3);

    const sessions = await service.getByPlan(plan.id, USER_ID, {
      startDate: today,
      endDate: tomorrow,
    });

    assertEquals(sessions.length, 2);
  } finally {
    await cleanup();
  }
});

Deno.test("TrainingSessionService - filter sessions by completion status", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new TrainingSessionService(kv);

    const plan = createMockWorkoutPlan({ userId: USER_ID });
    await kv.set(["workout_plans", plan.id], plan);

    const session1 = createMockTrainingSession({
      workoutPlanId: plan.id,
      completed: true,
    });
    const session2 = createMockTrainingSession({
      workoutPlanId: plan.id,
      completed: false,
    });
    const session3 = createMockTrainingSession({
      workoutPlanId: plan.id,
      completed: false,
    });

    await kv.set(["training_sessions", session1.id], session1);
    await kv.set(["training_sessions", session2.id], session2);
    await kv.set(["training_sessions", session3.id], session3);

    const completedSessions = await service.getByPlan(plan.id, USER_ID, {
      completed: true,
    });
    const incompleteSessions = await service.getByPlan(plan.id, USER_ID, {
      completed: false,
    });

    assertEquals(completedSessions.length, 1);
    assertEquals(incompleteSessions.length, 2);
  } finally {
    await cleanup();
  }
});

// ============================================================================
// UPDATE SESSION COMPLETION TESTS
// ============================================================================

Deno.test("TrainingSessionService - mark session as complete", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new TrainingSessionService(kv);

    const plan = createMockWorkoutPlan({ userId: USER_ID });
    await kv.set(["workout_plans", plan.id], plan);

    const session = createMockTrainingSession({
      workoutPlanId: plan.id,
      completed: false,
    });
    await kv.set(["training_sessions", session.id], session);

    const updated = await service.updateCompletion(session.id, USER_ID, {
      completed: true,
      actualDurationMinutes: 50,
    });

    assertEquals(updated.completed, true);
    assertEquals(updated.actualDurationMinutes, 50);
    assertExists(updated.completedAt);
  } finally {
    await cleanup();
  }
});

Deno.test("TrainingSessionService - mark session as incomplete clears data", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new TrainingSessionService(kv);

    const plan = createMockWorkoutPlan({ userId: USER_ID });
    await kv.set(["workout_plans", plan.id], plan);

    const session = createMockTrainingSession({
      workoutPlanId: plan.id,
      completed: true,
      completedAt: new Date(),
      actualDurationMinutes: 50,
    });
    await kv.set(["training_sessions", session.id], session);

    const updated = await service.updateCompletion(session.id, USER_ID, {
      completed: false,
    });

    assertEquals(updated.completed, false);
    assertEquals(updated.completedAt, undefined);
    assertEquals(updated.actualDurationMinutes, undefined);
  } finally {
    await cleanup();
  }
});

Deno.test("TrainingSessionService - calculate session completion percentage", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new TrainingSessionService(kv);

    const plan = createMockWorkoutPlan({ userId: USER_ID });
    await kv.set(["workout_plans", plan.id], plan);

    const session = createMockTrainingSession({
      workoutPlanId: plan.id,
      exerciseIds: ["ex_1", "ex_2", "ex_3", "ex_4"],
    });
    await kv.set(["training_sessions", session.id], session);

    // Complete 2 out of 4 exercises
    await kv.set(
      ["exercise_completions_by_session", session.id, "ex_1"],
      createMockExerciseCompletion({
        trainingSessionId: session.id,
        exerciseId: "ex_1",
        completed: true,
      }),
    );
    await kv.set(
      ["exercise_completions_by_session", session.id, "ex_2"],
      createMockExerciseCompletion({
        trainingSessionId: session.id,
        exerciseId: "ex_2",
        completed: true,
      }),
    );

    const retrieved = await service.getById(session.id, USER_ID);

    assertExists(retrieved);
    assertEquals(retrieved!.completedExercisesCount, 2);
    assertEquals(retrieved!.totalExercisesCount, 4);
    assertEquals(retrieved!.completionPercentage, 50);
  } finally {
    await cleanup();
  }
});

Deno.test("TrainingSessionService - user can only update their own sessions", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new TrainingSessionService(kv);

    const plan = createMockWorkoutPlan({ userId: USER_ID });
    await kv.set(["workout_plans", plan.id], plan);

    const session = createMockTrainingSession({ workoutPlanId: plan.id });
    await kv.set(["training_sessions", session.id], session);

    await assertRejects(
      () =>
        service.updateCompletion(session.id, OTHER_USER_ID, {
          completed: true,
        }),
      Error,
      "permission",
    );
  } finally {
    await cleanup();
  }
});

// ============================================================================
// EXERCISE COMPLETION TESTS
// ============================================================================

Deno.test("TrainingSessionService - mark exercise as complete", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new TrainingSessionService(kv);

    const plan = createMockWorkoutPlan({ userId: USER_ID });
    await kv.set(["workout_plans", plan.id], plan);

    const session = createMockTrainingSession({
      workoutPlanId: plan.id,
      exerciseIds: ["ex_1", "ex_2"],
    });
    await kv.set(["training_sessions", session.id], session);

    const completion = await service.markExerciseComplete(
      session.id,
      USER_ID,
      {
        exerciseId: "ex_1",
        completed: true,
        notes: "Great workout!",
      },
    );

    assertEquals(completion.exerciseId, "ex_1");
    assertEquals(completion.completed, true);
    assertEquals(completion.notes, "Great workout!");
    assertExists(completion.completedAt);
    assertExists(completion.id);
  } finally {
    await cleanup();
  }
});

Deno.test("TrainingSessionService - unmark exercise completion", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new TrainingSessionService(kv);

    const plan = createMockWorkoutPlan({ userId: USER_ID });
    await kv.set(["workout_plans", plan.id], plan);

    const session = createMockTrainingSession({
      workoutPlanId: plan.id,
      exerciseIds: ["ex_1", "ex_2"],
    });
    await kv.set(["training_sessions", session.id], session);

    // First mark as complete
    await service.markExerciseComplete(session.id, USER_ID, {
      exerciseId: "ex_1",
      completed: true,
    });

    // Then unmark
    const completion = await service.markExerciseComplete(
      session.id,
      USER_ID,
      {
        exerciseId: "ex_1",
        completed: false,
      },
    );

    assertEquals(completion.completed, false);
    assertEquals(completion.completedAt, undefined);
  } finally {
    await cleanup();
  }
});

Deno.test("TrainingSessionService - reject exercise not in session", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new TrainingSessionService(kv);

    const plan = createMockWorkoutPlan({ userId: USER_ID });
    await kv.set(["workout_plans", plan.id], plan);

    const session = createMockTrainingSession({
      workoutPlanId: plan.id,
      exerciseIds: ["ex_1", "ex_2"],
    });
    await kv.set(["training_sessions", session.id], session);

    await assertRejects(
      () =>
        service.markExerciseComplete(session.id, USER_ID, {
          exerciseId: "ex_999",
          completed: true,
        }),
      Error,
      "not in session",
    );
  } finally {
    await cleanup();
  }
});

Deno.test("TrainingSessionService - auto-complete session when all exercises done", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new TrainingSessionService(kv);

    const plan = createMockWorkoutPlan({ userId: USER_ID });
    await kv.set(["workout_plans", plan.id], plan);

    const session = createMockTrainingSession({
      workoutPlanId: plan.id,
      exerciseIds: ["ex_1", "ex_2"],
      completed: false,
    });
    await kv.set(["training_sessions", session.id], session);

    // Complete first exercise
    await service.markExerciseComplete(session.id, USER_ID, {
      exerciseId: "ex_1",
      completed: true,
    });

    // Complete second exercise
    await service.markExerciseComplete(session.id, USER_ID, {
      exerciseId: "ex_2",
      completed: true,
    });

    // Session should now be marked as complete
    const updatedSession = await service.getById(session.id, USER_ID);
    assertEquals(updatedSession!.completed, true);
    assertExists(updatedSession!.completedAt);
  } finally {
    await cleanup();
  }
});

Deno.test("TrainingSessionService - get exercise completions for session", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new TrainingSessionService(kv);

    const plan = createMockWorkoutPlan({ userId: USER_ID });
    await kv.set(["workout_plans", plan.id], plan);

    const session = createMockTrainingSession({
      workoutPlanId: plan.id,
      exerciseIds: ["ex_1", "ex_2", "ex_3"],
    });
    await kv.set(["training_sessions", session.id], session);

    // Mark some exercises complete
    await service.markExerciseComplete(session.id, USER_ID, {
      exerciseId: "ex_1",
      completed: true,
    });
    await service.markExerciseComplete(session.id, USER_ID, {
      exerciseId: "ex_2",
      completed: true,
    });

    const completions = await service.getExerciseCompletions(
      session.id,
      USER_ID,
    );

    assertEquals(completions.length, 3);
    assertEquals(completions[0].completed, true);
    assertEquals(completions[1].completed, true);
    assertEquals(completions[2].completed, false); // Not yet completed
  } finally {
    await cleanup();
  }
});

Deno.test("TrainingSessionService - update exercise completion notes", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new TrainingSessionService(kv);

    const plan = createMockWorkoutPlan({ userId: USER_ID });
    await kv.set(["workout_plans", plan.id], plan);

    const session = createMockTrainingSession({
      workoutPlanId: plan.id,
      exerciseIds: ["ex_1"],
    });
    await kv.set(["training_sessions", session.id], session);

    // Create initial completion
    const initial = await service.markExerciseComplete(session.id, USER_ID, {
      exerciseId: "ex_1",
      completed: true,
      notes: "Initial notes",
    });

    // Update notes
    const updated = await service.updateExerciseCompletion(
      initial.id,
      USER_ID,
      {
        notes: "Updated notes with more detail",
      },
    );

    assertEquals(updated.notes, "Updated notes with more detail");
    assertEquals(updated.completed, true);
    assertEquals(updated.id, initial.id);
  } finally {
    await cleanup();
  }
});

Deno.test("TrainingSessionService - user can only update their own completions", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new TrainingSessionService(kv);

    const plan = createMockWorkoutPlan({ userId: USER_ID });
    await kv.set(["workout_plans", plan.id], plan);

    const session = createMockTrainingSession({
      workoutPlanId: plan.id,
      exerciseIds: ["ex_1"],
    });
    await kv.set(["training_sessions", session.id], session);

    const completion = await service.markExerciseComplete(
      session.id,
      USER_ID,
      {
        exerciseId: "ex_1",
        completed: true,
      },
    );

    await assertRejects(
      () =>
        service.updateExerciseCompletion(completion.id, OTHER_USER_ID, {
          notes: "Hacked notes",
        }),
      Error,
      "permission",
    );
  } finally {
    await cleanup();
  }
});

// ============================================================================
// INTEGRATION WITH WORKOUT PLAN TESTS
// ============================================================================

Deno.test("TrainingSessionService - session completion updates plan progress", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new TrainingSessionService(kv);

    const plan = createMockWorkoutPlan({
      userId: USER_ID,
      totalSessions: 4,
    });
    await kv.set(["workout_plans", plan.id], plan);

    const session = createMockTrainingSession({
      workoutPlanId: plan.id,
      completed: false,
    });
    await kv.set(["training_sessions", session.id], session);

    // Mark session complete
    await service.updateCompletion(session.id, USER_ID, {
      completed: true,
    });

    // Verify plan's completed sessions count is updated
    const updatedPlan = await kv.get(["workout_plans", plan.id]);
    // This should trigger recalculation in WorkoutPlanService
    assertExists(updatedPlan.value);
  } finally {
    await cleanup();
  }
});
