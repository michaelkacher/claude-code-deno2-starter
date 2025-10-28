/**
 * Exercise Service Tests
 *
 * Tests for the ExerciseService business logic layer
 * Following TDD principles - these tests should FAIL initially (RED phase)
 */

import {
  assertEquals,
  assertExists,
  assertRejects,
} from "https://deno.land/std@0.216.0/assert/mod.ts";
import { createMockExercise, setupTestKv } from "../lib/test-helpers.ts";
import { ExerciseService } from "./exercise.service.ts";

// ============================================================================
// CREATE EXERCISE TESTS
// ============================================================================

Deno.test("ExerciseService - create exercise with valid data", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new ExerciseService(kv);
    const exerciseData = {
      name: "Ladder Drills - Basic",
      description: "Footwork fundamentals using agility ladder",
      durationMinutes: 15,
      difficulty: "easy" as const,
      skillCategories: ["agility"],
      instructions: "Set up ladder on court and perform drills",
      videoUrl: "https://example.com/video",
    };

    const exercise = await service.create(exerciseData);

    assertEquals(exercise.name, exerciseData.name);
    assertEquals(exercise.description, exerciseData.description);
    assertEquals(exercise.durationMinutes, 15);
    assertEquals(exercise.difficulty, "easy");
    assertEquals(exercise.skillCategories.length, 1);
    assertExists(exercise.id);
    assertExists(exercise.createdAt);
  } finally {
    await cleanup();
  }
});

Deno.test("ExerciseService - create exercise with multiple skill categories", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new ExerciseService(kv);
    const exerciseData = {
      name: "Wall Touches",
      description: "Quick explosive movements and touches",
      durationMinutes: 10,
      difficulty: "easy" as const,
      skillCategories: ["agility", "blocking"],
    };

    const exercise = await service.create(exerciseData);

    assertEquals(exercise.skillCategories.length, 2);
    assertEquals(exercise.skillCategories, ["agility", "blocking"]);
  } finally {
    await cleanup();
  }
});

Deno.test("ExerciseService - reject exercise with empty name", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new ExerciseService(kv);
    const exerciseData = {
      name: "",
      description: "Test description that is long enough",
      durationMinutes: 15,
      difficulty: "easy" as const,
      skillCategories: ["agility"],
    };

    await assertRejects(
      () => service.create(exerciseData),
      Error,
      "name",
    );
  } finally {
    await cleanup();
  }
});

Deno.test("ExerciseService - reject exercise with short description", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new ExerciseService(kv);
    const exerciseData = {
      name: "Valid Name",
      description: "Short",
      durationMinutes: 15,
      difficulty: "easy" as const,
      skillCategories: ["agility"],
    };

    await assertRejects(
      () => service.create(exerciseData),
      Error,
      "description",
    );
  } finally {
    await cleanup();
  }
});

Deno.test("ExerciseService - reject exercise with no skill categories", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new ExerciseService(kv);
    const exerciseData = {
      name: "Valid Name",
      description: "Valid description that is long enough",
      durationMinutes: 15,
      difficulty: "easy" as const,
      skillCategories: [],
    };

    await assertRejects(
      () => service.create(exerciseData),
      Error,
      "skill",
    );
  } finally {
    await cleanup();
  }
});

Deno.test("ExerciseService - reject exercise with invalid difficulty", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new ExerciseService(kv);
    const exerciseData = {
      name: "Valid Name",
      description: "Valid description that is long enough",
      durationMinutes: 15,
      difficulty: "super-hard" as any,
      skillCategories: ["agility"],
    };

    await assertRejects(
      () => service.create(exerciseData),
      Error,
      "difficulty",
    );
  } finally {
    await cleanup();
  }
});

Deno.test("ExerciseService - reject exercise with invalid duration (too short)", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new ExerciseService(kv);
    const exerciseData = {
      name: "Valid Name",
      description: "Valid description that is long enough",
      durationMinutes: 0,
      difficulty: "easy" as const,
      skillCategories: ["agility"],
    };

    await assertRejects(
      () => service.create(exerciseData),
      Error,
      "duration",
    );
  } finally {
    await cleanup();
  }
});

Deno.test("ExerciseService - reject exercise with invalid duration (too long)", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new ExerciseService(kv);
    const exerciseData = {
      name: "Valid Name",
      description: "Valid description that is long enough",
      durationMinutes: 200,
      difficulty: "easy" as const,
      skillCategories: ["agility"],
    };

    await assertRejects(
      () => service.create(exerciseData),
      Error,
      "duration",
    );
  } finally {
    await cleanup();
  }
});

// ============================================================================
// LIST EXERCISES TESTS
// ============================================================================

Deno.test("ExerciseService - list all exercises", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new ExerciseService(kv);

    // Create multiple exercises
    await service.create(createMockExercise({ name: "Exercise 1" }));
    await service.create(createMockExercise({ name: "Exercise 2" }));
    await service.create(createMockExercise({ name: "Exercise 3" }));

    const result = await service.list({});

    assertEquals(result.exercises.length, 3);
    assertEquals(result.total, 3);
  } finally {
    await cleanup();
  }
});

Deno.test("ExerciseService - filter exercises by skill category", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new ExerciseService(kv);

    // Create exercises with different skills
    await service.create(
      createMockExercise({ skillCategories: ["agility"] }),
    );
    await service.create(
      createMockExercise({ skillCategories: ["hitting"] }),
    );
    await service.create(
      createMockExercise({ skillCategories: ["agility"] }),
    );

    const result = await service.list({ skill: "agility" });

    assertEquals(result.exercises.length, 2);
    assertEquals(result.total, 2);
  } finally {
    await cleanup();
  }
});

Deno.test("ExerciseService - filter exercises by difficulty", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new ExerciseService(kv);

    // Create exercises with different difficulties
    await service.create(createMockExercise({ difficulty: "easy" }));
    await service.create(createMockExercise({ difficulty: "medium" }));
    await service.create(createMockExercise({ difficulty: "easy" }));

    const result = await service.list({ difficulty: "easy" });

    assertEquals(result.exercises.length, 2);
    assertEquals(result.total, 2);
  } finally {
    await cleanup();
  }
});

Deno.test("ExerciseService - filter exercises by skill and difficulty", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new ExerciseService(kv);

    // Create exercises with different combinations
    await service.create(
      createMockExercise({ skillCategories: ["agility"], difficulty: "easy" }),
    );
    await service.create(
      createMockExercise({ skillCategories: ["agility"], difficulty: "hard" }),
    );
    await service.create(
      createMockExercise({ skillCategories: ["hitting"], difficulty: "easy" }),
    );

    const result = await service.list({ skill: "agility", difficulty: "easy" });

    assertEquals(result.exercises.length, 1);
    assertEquals(result.total, 1);
  } finally {
    await cleanup();
  }
});

Deno.test("ExerciseService - paginate exercises", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new ExerciseService(kv);

    // Create 10 exercises
    for (let i = 0; i < 10; i++) {
      await service.create(createMockExercise({ name: `Exercise ${i}` }));
    }

    const result = await service.list({ page: 1, limit: 5 });

    assertEquals(result.exercises.length, 5);
    assertEquals(result.total, 10);
    assertEquals(result.page, 1);
    assertEquals(result.totalPages, 2);
  } finally {
    await cleanup();
  }
});

// ============================================================================
// GET EXERCISE BY ID TESTS
// ============================================================================

Deno.test("ExerciseService - get exercise by ID", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new ExerciseService(kv);
    const created = await service.create(createMockExercise());

    const exercise = await service.getById(created.id);

    assertExists(exercise);
    assertEquals(exercise!.id, created.id);
    assertEquals(exercise!.name, created.name);
  } finally {
    await cleanup();
  }
});

Deno.test("ExerciseService - return null for non-existent exercise", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new ExerciseService(kv);

    const exercise = await service.getById("ex_nonexistent");

    assertEquals(exercise, null);
  } finally {
    await cleanup();
  }
});

// ============================================================================
// UPDATE EXERCISE TESTS
// ============================================================================

Deno.test("ExerciseService - update exercise name", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new ExerciseService(kv);
    const created = await service.create(createMockExercise());

    const updated = await service.update(created.id, {
      name: "Updated Exercise Name",
    });

    assertEquals(updated.name, "Updated Exercise Name");
    assertEquals(updated.id, created.id);
    assertEquals(updated.description, created.description);
  } finally {
    await cleanup();
  }
});

Deno.test("ExerciseService - update exercise difficulty", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new ExerciseService(kv);
    const created = await service.create(
      createMockExercise({ difficulty: "easy" }),
    );

    const updated = await service.update(created.id, {
      difficulty: "hard",
    });

    assertEquals(updated.difficulty, "hard");
  } finally {
    await cleanup();
  }
});

Deno.test("ExerciseService - update multiple fields", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new ExerciseService(kv);
    const created = await service.create(createMockExercise());

    const updated = await service.update(created.id, {
      name: "New Name",
      durationMinutes: 30,
      difficulty: "hard",
    });

    assertEquals(updated.name, "New Name");
    assertEquals(updated.durationMinutes, 30);
    assertEquals(updated.difficulty, "hard");
  } finally {
    await cleanup();
  }
});

Deno.test("ExerciseService - reject update with invalid data", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new ExerciseService(kv);
    const created = await service.create(createMockExercise());

    await assertRejects(
      () => service.update(created.id, { durationMinutes: 0 }),
      Error,
      "duration",
    );
  } finally {
    await cleanup();
  }
});

Deno.test("ExerciseService - reject update for non-existent exercise", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new ExerciseService(kv);

    await assertRejects(
      () => service.update("ex_nonexistent", { name: "New Name" }),
      Error,
      "not found",
    );
  } finally {
    await cleanup();
  }
});

// ============================================================================
// DELETE EXERCISE TESTS
// ============================================================================

Deno.test("ExerciseService - delete exercise", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new ExerciseService(kv);
    const created = await service.create(createMockExercise());

    await service.delete(created.id);

    const deleted = await service.getById(created.id);
    assertEquals(deleted, null);
  } finally {
    await cleanup();
  }
});

Deno.test("ExerciseService - reject delete for non-existent exercise", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new ExerciseService(kv);

    await assertRejects(
      () => service.delete("ex_nonexistent"),
      Error,
      "not found",
    );
  } finally {
    await cleanup();
  }
});

Deno.test("ExerciseService - prevent delete if used in active plans", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new ExerciseService(kv);
    const created = await service.create(createMockExercise());

    // TODO: This will require WorkoutPlanService to be implemented
    // For now, this test documents the expected behavior
    // Should check if exercise is referenced in any active workout plans
    // and reject deletion if it is

    await assertRejects(
      () => service.delete(created.id, { checkReferences: true }),
      Error,
      "in use",
    );
  } finally {
    await cleanup();
  }
});

// ============================================================================
// ADMIN AUTHORIZATION TESTS
// ============================================================================

Deno.test("ExerciseService - create requires admin role", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new ExerciseService(kv);
    const userId = "usr_test123";
    const userRole = "user";

    await assertRejects(
      () =>
        service.create(createMockExercise(), { userId, role: userRole }),
      Error,
      "admin",
    );
  } finally {
    await cleanup();
  }
});

Deno.test("ExerciseService - update requires admin role", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new ExerciseService(kv);
    const created = await service.create(
      createMockExercise(),
      { userId: "admin", role: "admin" },
    );

    await assertRejects(
      () =>
        service.update(
          created.id,
          { name: "New Name" },
          { userId: "user", role: "user" },
        ),
      Error,
      "admin",
    );
  } finally {
    await cleanup();
  }
});

Deno.test("ExerciseService - delete requires admin role", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new ExerciseService(kv);
    const created = await service.create(
      createMockExercise(),
      { userId: "admin", role: "admin" },
    );

    await assertRejects(
      () => service.delete(created.id, { userId: "user", role: "user" }),
      Error,
      "admin",
    );
  } finally {
    await cleanup();
  }
});

Deno.test("ExerciseService - list does not require admin role", async () => {
  const { kv, cleanup } = await setupTestKv();
  try {
    const service = new ExerciseService(kv);
    await service.create(
      createMockExercise(),
      { userId: "admin", role: "admin" },
    );

    const result = await service.list({}, { userId: "user", role: "user" });

    assertEquals(result.exercises.length, 1);
  } finally {
    await cleanup();
  }
});
