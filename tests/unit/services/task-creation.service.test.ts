import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { TaskCreationService } from "../../../shared/services/task-creation.service.ts";
import type {
    CreateTaskData
} from "../../../shared/types/task-creation.types.ts";
import { setupTestKv } from "../../helpers/kv-test.ts";

describe("TaskCreationService", () => {
  let kv: Deno.Kv;
  let cleanup: () => Promise<void>;
  let service: TaskCreationService;
  const userId = "user-123";

  beforeEach(async () => {
    const setup = await setupTestKv();
    kv = setup.kv;
    cleanup = setup.cleanup;
    service = new TaskCreationService(kv);
  });

  afterEach(async () => {
    await cleanup();
  });

  describe("createTask", () => {
    const validTaskData: CreateTaskData = {
      title: "User Authentication System",
      description: "Build secure JWT-based authentication",
      successCriteria: [
        "Login response time < 200ms",
        "Zero security vulnerabilities",
      ],
      priority: "high",
      category: "backend",
      aiAgentId: "alpha-1",
      reviewerIds: ["sarah", "mike"],
      dependencyIds: [],
      estimatedComplexity: "medium",
      tags: ["auth", "security"],
    };

    it("should create a task successfully", async () => {
      const result = await service.createTask(validTaskData, userId);

      assertExists(result.id);
      assertEquals(result.title, validTaskData.title);
      assertEquals(result.description, validTaskData.description);
      assertEquals(result.successCriteria, validTaskData.successCriteria);
      assertEquals(result.priority, validTaskData.priority);
      assertEquals(result.category, validTaskData.category);
      assertEquals(result.aiAgentId, validTaskData.aiAgentId);
      assertEquals(result.reviewerIds, validTaskData.reviewerIds);
      assertEquals(result.estimatedComplexity, validTaskData.estimatedComplexity);
      assertEquals(result.tags, validTaskData.tags);
      assertEquals(result.status, "pending");
      assertEquals(result.createdBy, userId);
      assertExists(result.createdAt);
      assertExists(result.updatedAt);
    });

    it("should reject task with empty title", async () => {
      const invalidData = { ...validTaskData, title: "" };

      await assertRejects(
        async () => await service.createTask(invalidData, userId),
        Error,
        "Title is required",
      );
    });

    it("should reject task with no success criteria", async () => {
      const invalidData = { ...validTaskData, successCriteria: [] };

      await assertRejects(
        async () => await service.createTask(invalidData, userId),
        Error,
        "At least one success criterion is required",
      );
    });

    it("should reject task with no AI agent", async () => {
      const invalidData = { ...validTaskData, aiAgentId: "" };

      await assertRejects(
        async () => await service.createTask(invalidData, userId),
        Error,
        "AI agent selection is required",
      );
    });

    it("should reject task with no reviewers", async () => {
      const invalidData = { ...validTaskData, reviewerIds: [] };

      await assertRejects(
        async () => await service.createTask(invalidData, userId),
        Error,
        "At least one reviewer is required",
      );
    });

    it("should handle tasks with dependencies", async () => {
      const taskData = {
        ...validTaskData,
        dependencyIds: ["task-001", "task-002"],
      };

      const result = await service.createTask(taskData, userId);

      assertEquals(result.dependencyIds, ["task-001", "task-002"]);
    });

    it("should create task with minimal required fields", async () => {
      const minimalData: CreateTaskData = {
        title: "Minimal Task",
        description: "Basic task",
        successCriteria: ["Complete successfully"],
        priority: "low",
        category: "frontend",
        aiAgentId: "beta-1",
        reviewerIds: ["alex"],
        dependencyIds: [],
        estimatedComplexity: "simple",
        tags: [],
      };

      const result = await service.createTask(minimalData, userId);

      assertExists(result.id);
      assertEquals(result.tags, []);
      assertEquals(result.dependencyIds, []);
    });
  });

  describe("getTaskById", () => {
    it("should retrieve existing task", async () => {
      const taskData: CreateTaskData = {
        title: "Test Task",
        description: "Test description",
        successCriteria: ["Criterion 1"],
        priority: "medium",
        category: "api",
        aiAgentId: "alpha-1",
        reviewerIds: ["sarah"],
        dependencyIds: [],
        estimatedComplexity: "simple",
        tags: ["test"],
      };

      const created = await service.createTask(taskData, userId);
      const retrieved = await service.getTaskById(created.id, userId);

      assertExists(retrieved);
      assertEquals(retrieved?.id, created.id);
      assertEquals(retrieved?.title, created.title);
    });

    it("should return null for non-existent task", async () => {
      const result = await service.getTaskById("non-existent", userId);

      assertEquals(result, null);
    });

    it("should not retrieve task from different user", async () => {
      const taskData: CreateTaskData = {
        title: "User A Task",
        description: "Task for user A",
        successCriteria: ["Complete"],
        priority: "low",
        category: "testing",
        aiAgentId: "gamma-1",
        reviewerIds: ["emma"],
        dependencyIds: [],
        estimatedComplexity: "simple",
        tags: [],
      };

      const created = await service.createTask(taskData, userId);
      const result = await service.getTaskById(created.id, "different-user");

      assertEquals(result, null);
    });
  });

  describe("listUserTasks", () => {
    it("should return empty array when user has no tasks", async () => {
      const result = await service.listUserTasks(userId);

      assertEquals(result, []);
    });

    it("should list all tasks for a user", async () => {
      const task1Data: CreateTaskData = {
        title: "Task 1",
        description: "First task",
        successCriteria: ["Complete 1"],
        priority: "high",
        category: "backend",
        aiAgentId: "alpha-1",
        reviewerIds: ["sarah"],
        dependencyIds: [],
        estimatedComplexity: "medium",
        tags: ["tag1"],
      };

      const task2Data: CreateTaskData = {
        title: "Task 2",
        description: "Second task",
        successCriteria: ["Complete 2"],
        priority: "low",
        category: "frontend",
        aiAgentId: "beta-1",
        reviewerIds: ["alex"],
        dependencyIds: [],
        estimatedComplexity: "simple",
        tags: ["tag2"],
      };

      await service.createTask(task1Data, userId);
      await service.createTask(task2Data, userId);

      const result = await service.listUserTasks(userId);

      assertEquals(result.length, 2);
      assertEquals(result[0].title, "Task 1");
      assertEquals(result[1].title, "Task 2");
    });

    it("should only list tasks for the specified user", async () => {
      const user1Task: CreateTaskData = {
        title: "User 1 Task",
        description: "Task for user 1",
        successCriteria: ["Complete"],
        priority: "medium",
        category: "api",
        aiAgentId: "alpha-1",
        reviewerIds: ["mike"],
        dependencyIds: [],
        estimatedComplexity: "medium",
        tags: [],
      };

      const user2Task: CreateTaskData = {
        title: "User 2 Task",
        description: "Task for user 2",
        successCriteria: ["Complete"],
        priority: "low",
        category: "database",
        aiAgentId: "gamma-1",
        reviewerIds: ["sarah"],
        dependencyIds: [],
        estimatedComplexity: "simple",
        tags: [],
      };

      await service.createTask(user1Task, "user-1");
      await service.createTask(user2Task, "user-2");

      const user1Tasks = await service.listUserTasks("user-1");
      const user2Tasks = await service.listUserTasks("user-2");

      assertEquals(user1Tasks.length, 1);
      assertEquals(user2Tasks.length, 1);
      assertEquals(user1Tasks[0].title, "User 1 Task");
      assertEquals(user2Tasks[0].title, "User 2 Task");
    });
  });

  describe("updateTask", () => {
    it("should update task successfully", async () => {
      const initialData: CreateTaskData = {
        title: "Initial Title",
        description: "Initial description",
        successCriteria: ["Initial criterion"],
        priority: "low",
        category: "frontend",
        aiAgentId: "beta-1",
        reviewerIds: ["alex"],
        dependencyIds: [],
        estimatedComplexity: "simple",
        tags: [],
      };

      const created = await service.createTask(initialData, userId);

      const updateData = {
        title: "Updated Title",
        priority: "critical" as const,
        tags: ["updated", "modified"],
      };

      const updated = await service.updateTask(created.id, updateData, userId);

      assertExists(updated);
      assertEquals(updated?.title, "Updated Title");
      assertEquals(updated?.priority, "critical");
      assertEquals(updated?.tags, ["updated", "modified"]);
      // Unchanged fields should remain
      assertEquals(updated?.description, initialData.description);
      assertEquals(updated?.category, initialData.category);
    });

    it("should return null when updating non-existent task", async () => {
      const result = await service.updateTask(
        "non-existent",
        { title: "New Title" },
        userId,
      );

      assertEquals(result, null);
    });

    it("should not update task from different user", async () => {
      const taskData: CreateTaskData = {
        title: "Original Task",
        description: "User A task",
        successCriteria: ["Complete"],
        priority: "medium",
        category: "backend",
        aiAgentId: "alpha-1",
        reviewerIds: ["sarah"],
        dependencyIds: [],
        estimatedComplexity: "medium",
        tags: [],
      };

      const created = await service.createTask(taskData, userId);

      const result = await service.updateTask(
        created.id,
        { title: "Hacked Title" },
        "different-user",
      );

      assertEquals(result, null);

      // Verify original task unchanged
      const original = await service.getTaskById(created.id, userId);
      assertEquals(original?.title, "Original Task");
    });
  });

  describe("deleteTask", () => {
    it("should delete task successfully", async () => {
      const taskData: CreateTaskData = {
        title: "Task to Delete",
        description: "This will be deleted",
        successCriteria: ["Complete"],
        priority: "low",
        category: "testing",
        aiAgentId: "gamma-1",
        reviewerIds: ["emma"],
        dependencyIds: [],
        estimatedComplexity: "simple",
        tags: [],
      };

      const created = await service.createTask(taskData, userId);
      const deleted = await service.deleteTask(created.id, userId);

      assertEquals(deleted, true);

      // Verify task no longer exists
      const result = await service.getTaskById(created.id, userId);
      assertEquals(result, null);
    });

    it("should return false when deleting non-existent task", async () => {
      const result = await service.deleteTask("non-existent", userId);

      assertEquals(result, false);
    });

    it("should not delete task from different user", async () => {
      const taskData: CreateTaskData = {
        title: "Protected Task",
        description: "User A task",
        successCriteria: ["Complete"],
        priority: "high",
        category: "backend",
        aiAgentId: "alpha-1",
        reviewerIds: ["sarah"],
        dependencyIds: [],
        estimatedComplexity: "complex",
        tags: ["important"],
      };

      const created = await service.createTask(taskData, userId);
      const deleted = await service.deleteTask(created.id, "different-user");

      assertEquals(deleted, false);

      // Verify task still exists
      const result = await service.getTaskById(created.id, userId);
      assertExists(result);
    });
  });
});
