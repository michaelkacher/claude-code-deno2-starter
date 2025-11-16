/**
 * AI Task Dashboard Service Tests
 * 
 * Tests for the dashboard service that provides real-time task monitoring,
 * team workload management, and AI agent status tracking.
 * 
 * Run with: deno test --no-check tests/unit/services/ai-task-dashboard.service.test.ts -A
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { AIAgentRepository } from "../../../shared/repositories/ai-agent.repository.ts";
import { TaskRepository } from "../../../shared/repositories/task.repository.ts";
import { TeamMemberRepository } from "../../../shared/repositories/team-member.repository.ts";
import { AITaskDashboardService } from "../../../shared/services/ai-task-dashboard.service.ts";

// Mock KV implementation for tests
const mockKv = {
  get: () => Promise.resolve({ value: null }),
  set: () => Promise.resolve({ ok: true }),
  delete: () => Promise.resolve(),
  list: () => ({ next: () => Promise.resolve({ value: [], done: true }) }),
  close: () => Promise.resolve(),
};

// Mock repositories
class MockTaskRepository extends TaskRepository {
  private tasks: any[] = [];

  constructor() {
    super(mockKv as any);
  }

  async findByStatus(status: string): Promise<any[]> {
    return this.tasks.filter(task => task.status === status);
  }

  async findAll(): Promise<any[]> {
    return this.tasks;
  }

  setMockTasks(tasks: any[]): void {
    this.tasks = tasks;
  }
}

class MockTeamMemberRepository extends TeamMemberRepository {
  private members: any[] = [];

  constructor() {
    super(mockKv as any);
  }

  async findAll(): Promise<any[]> {
    return this.members;
  }

  setMockMembers(members: any[]): void {
    this.members = members;
  }
}

class MockAIAgentRepository extends AIAgentRepository {
  private agents: any[] = [];

  constructor() {
    super(mockKv as any);
  }

  async findAll(): Promise<any[]> {
    return this.agents;
  }

  setMockAgents(agents: any[]): void {
    this.agents = agents;
  }
}

// Test setup
const mockTaskRepo = new MockTaskRepository();
const mockTeamRepo = new MockTeamMemberRepository();
const mockAgentRepo = new MockAIAgentRepository();
const dashboardService = new AITaskDashboardService(mockTaskRepo, mockTeamRepo, mockAgentRepo);

Deno.test("AITaskDashboardService - Dashboard Overview", async (t) => {
  
  await t.step("should return complete dashboard overview", async () => {
    // Arrange
    mockTaskRepo.setMockTasks([
      { id: "1", status: "ai_processing", priority: "high", title: "Auth System" },
      { id: "2", status: "pending_review", priority: "critical", title: "Payment API" },
      { id: "3", status: "approved", priority: "medium", title: "Dashboard UI" },
    ]);

    mockTeamRepo.setMockMembers([
      { id: "u1", name: "Sarah Chen", workload: 75, pendingReviews: 2 },
      { id: "u2", name: "Mike Johnson", workload: 60, pendingReviews: 1 },
    ]);

    mockAgentRepo.setMockAgents([
      { id: "a1", name: "Alpha-1", status: "active", specialty: "Backend" },
      { id: "a2", name: "Beta-1", status: "processing", specialty: "Frontend" },
    ]);

    // Act
    const overview = await dashboardService.getDashboardOverview();

    // Assert
    assertExists(overview);
    assertExists(overview.taskStats);
    assertExists(overview.teamStatus);
    assertExists(overview.agentStatus);
    
    assertEquals(overview.taskStats.aiProcessing, 1);
    assertEquals(overview.taskStats.pendingReview, 1);
    assertEquals(overview.taskStats.approved, 1);
    assertEquals(overview.teamStatus.length, 2);
    assertEquals(overview.agentStatus.length, 2);
  });

  await t.step("should calculate correct task statistics", async () => {
    // Arrange
    mockTaskRepo.setMockTasks([
      { status: "ai_processing" },
      { status: "ai_processing" },
      { status: "pending_review" },
      { status: "approved" },
      { status: "rejected" },
      { status: "completed" },
    ]);

    // Act
    const overview = await dashboardService.getDashboardOverview();

    // Assert
    assertEquals(overview.taskStats.aiProcessing, 2);
    assertEquals(overview.taskStats.pendingReview, 1);
    assertEquals(overview.taskStats.approved, 1);
    assertEquals(overview.taskStats.rejected, 1);
    assertEquals(overview.taskStats.completed, 1);
    assertEquals(overview.taskStats.total, 6);
  });

  await t.step("should handle empty data gracefully", async () => {
    // Arrange
    mockTaskRepo.setMockTasks([]);
    mockTeamRepo.setMockMembers([]);
    mockAgentRepo.setMockAgents([]);

    // Act
    const overview = await dashboardService.getDashboardOverview();

    // Assert
    assertEquals(overview.taskStats.total, 0);
    assertEquals(overview.teamStatus.length, 0);
    assertEquals(overview.agentStatus.length, 0);
  });
});

Deno.test("AITaskDashboardService - Task Filtering", async (t) => {

  await t.step("should filter tasks by status", async () => {
    // Arrange
    mockTaskRepo.setMockTasks([
      { id: "1", status: "ai_processing", priority: "high" },
      { id: "2", status: "pending_review", priority: "critical" },
      { id: "3", status: "ai_processing", priority: "low" },
    ]);

    // Act
    const processingTasks = await dashboardService.getFilteredTasks({ status: "ai_processing" });

    // Assert
    assertEquals(processingTasks.length, 2);
    assertEquals(processingTasks[0].status, "ai_processing");
    assertEquals(processingTasks[1].status, "ai_processing");
  });

  await t.step("should filter tasks by priority", async () => {
    // Arrange  
    mockTaskRepo.setMockTasks([
      { id: "1", status: "pending_review", priority: "critical" },
      { id: "2", status: "ai_processing", priority: "high" },
      { id: "3", status: "pending_review", priority: "critical" },
    ]);

    // Act
    const criticalTasks = await dashboardService.getFilteredTasks({ priority: "critical" });

    // Assert
    assertEquals(criticalTasks.length, 2);
    assert(criticalTasks.every(task => task.priority === "critical"));
  });

  await t.step("should filter tasks by assignee", async () => {
    // Arrange
    mockTaskRepo.setMockTasks([
      { id: "1", assignedReviewer: "Sarah Chen", status: "pending_review" },
      { id: "2", assignedReviewer: "Mike Johnson", status: "pending_review" },
      { id: "3", assignedReviewer: "Sarah Chen", status: "approved" },
    ]);

    // Act
    const sarahTasks = await dashboardService.getFilteredTasks({ assignee: "Sarah Chen" });

    // Assert
    assertEquals(sarahTasks.length, 2);
    assert(sarahTasks.every(task => task.assignedReviewer === "Sarah Chen"));
  });

  await t.step("should combine multiple filters", async () => {
    // Arrange
    mockTaskRepo.setMockTasks([
      { id: "1", status: "pending_review", priority: "critical", assignedReviewer: "Sarah" },
      { id: "2", status: "pending_review", priority: "high", assignedReviewer: "Sarah" },
      { id: "3", status: "approved", priority: "critical", assignedReviewer: "Sarah" },
    ]);

    // Act
    const filteredTasks = await dashboardService.getFilteredTasks({ 
      status: "pending_review", 
      priority: "critical" 
    });

    // Assert
    assertEquals(filteredTasks.length, 1);
    assertEquals(filteredTasks[0].id, "1");
  });
});

Deno.test("AITaskDashboardService - Team Workload", async (t) => {

  await t.step("should calculate team workload distribution", async () => {
    // Arrange
    mockTeamRepo.setMockMembers([
      { 
        id: "1", 
        name: "Sarah Chen", 
        workload: 85, 
        pendingReviews: 3,
        completedToday: 2,
        expertise: ["backend", "security"]
      },
      { 
        id: "2", 
        name: "Mike Johnson", 
        workload: 45, 
        pendingReviews: 1,
        completedToday: 4,
        expertise: ["frontend", "ui"]
      },
    ]);

    // Act
    const workload = await dashboardService.getTeamWorkload();

    // Assert
    assertEquals(workload.length, 2);
    assertEquals(workload[0].workload, 85);
    assertEquals(workload[1].workload, 45);
    
    // Should be sorted by workload (highest first)
    assert(workload[0].workload >= workload[1].workload);
  });

  await t.step("should identify overloaded team members", async () => {
    // Arrange
    mockTeamRepo.setMockMembers([
      { id: "1", name: "Overloaded", workload: 95, pendingReviews: 5 },
      { id: "2", name: "Normal", workload: 60, pendingReviews: 2 },
      { id: "3", name: "Available", workload: 30, pendingReviews: 1 },
    ]);

    // Act
    const workload = await dashboardService.getTeamWorkload();
    const overloaded = workload.filter(member => member.workload > 90);
    const available = workload.filter(member => member.workload < 50);

    // Assert
    assertEquals(overloaded.length, 1);
    assertEquals(available.length, 1);
    assertEquals(overloaded[0].name, "Overloaded");
  });

  await t.step("should suggest optimal reviewer assignment", async () => {
    // Arrange
    mockTeamRepo.setMockMembers([
      { 
        id: "1", 
        name: "Expert", 
        workload: 40, 
        expertise: ["backend", "api"],
        pendingReviews: 1
      },
      { 
        id: "2", 
        name: "Busy Expert", 
        workload: 90, 
        expertise: ["backend", "api"],
        pendingReviews: 5
      },
      { 
        id: "3", 
        name: "Wrong Expertise", 
        workload: 30, 
        expertise: ["frontend"],
        pendingReviews: 0
      },
    ]);

    // Act
    const suggestion = await dashboardService.suggestReviewer("backend");

    // Assert
    assertExists(suggestion);
    assertEquals(suggestion.name, "Expert"); // Best match: low workload + right expertise
  });
});

Deno.test("AITaskDashboardService - AI Agent Monitoring", async (t) => {

  await t.step("should return AI agent status", async () => {
    // Arrange
    mockAgentRepo.setMockAgents([
      { 
        id: "a1", 
        name: "Alpha-1", 
        status: "active",
        specialty: "Backend",
        currentTasks: ["task1", "task2"],
        averageProcessingTime: 300000 // 5 minutes
      },
      { 
        id: "a2", 
        name: "Beta-1", 
        status: "processing",
        specialty: "Frontend", 
        currentTasks: ["task3"],
        averageProcessingTime: 240000 // 4 minutes
      },
    ]);

    // Act
    const agentStatus = await dashboardService.getAIAgentStatus();

    // Assert
    assertEquals(agentStatus.length, 2);
    assertEquals(agentStatus[0].status, "active");
    assertEquals(agentStatus[1].status, "processing");
    assertEquals(agentStatus[0].currentTasks.length, 2);
    assertEquals(agentStatus[1].currentTasks.length, 1);
  });

  await t.step("should identify available agents", async () => {
    // Arrange
    mockAgentRepo.setMockAgents([
      { id: "a1", status: "idle", currentTasks: [] },
      { id: "a2", status: "processing", currentTasks: ["task1"] },
      { id: "a3", status: "error", currentTasks: [] },
    ]);

    // Act
    const available = await dashboardService.getAvailableAgents();

    // Assert
    assertEquals(available.length, 1);
    assertEquals(available[0].status, "idle");
  });

  await t.step("should calculate agent performance metrics", async () => {
    // Arrange
    mockAgentRepo.setMockAgents([
      { 
        id: "a1", 
        averageProcessingTime: 300000, // 5 minutes
        successRate: 95.5,
        currentTasks: ["t1", "t2"]
      },
    ]);

    // Act
    const metrics = await dashboardService.getAgentPerformanceMetrics();

    // Assert
    assertExists(metrics);
    assertExists(metrics.averageProcessingTime);
    assertExists(metrics.overallSuccessRate);
    assertExists(metrics.totalActiveTasks);
  });
});

Deno.test("AITaskDashboardService - Performance Analytics", async (t) => {

  await t.step("should calculate workflow velocity", async () => {
    // Arrange
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    mockTaskRepo.setMockTasks([
      { status: "completed", updatedAt: now, createdAt: yesterday },
      { status: "completed", updatedAt: now, createdAt: yesterday },
      { status: "pending_review", createdAt: yesterday },
    ]);

    // Act
    const velocity = await dashboardService.getWorkflowVelocity();

    // Assert
    assertExists(velocity);
    assertExists(velocity.completionRate);
    assertExists(velocity.averageTimeToComplete);
    assert(velocity.completionRate <= 100);
  });

  await t.step("should identify bottlenecks", async () => {
    // Arrange
    const longTime = new Date(Date.now() - 48 * 60 * 60 * 1000); // 2 days ago
    
    mockTaskRepo.setMockTasks([
      { status: "pending_review", timeInStatus: longTime, priority: "critical" },
      { status: "ai_processing", timeInStatus: longTime, priority: "high" },
      { status: "pending_review", timeInStatus: new Date(), priority: "low" },
    ]);

    // Act
    const bottlenecks = await dashboardService.identifyBottlenecks();

    // Assert
    assertExists(bottlenecks);
    assert(bottlenecks.length > 0);
    
    // Should prioritize critical tasks that have been waiting longest
    const criticalBottleneck = bottlenecks.find(b => b.priority === "critical");
    assertExists(criticalBottleneck);
  });

  await t.step("should predict completion times", async () => {
    // Arrange
    mockTaskRepo.setMockTasks([
      { status: "ai_processing", progress: 75, priority: "high" },
      { status: "pending_review", timeInStatus: new Date(), priority: "medium" },
    ]);

    mockAgentRepo.setMockAgents([
      { averageProcessingTime: 600000 }, // 10 minutes average
    ]);

    mockTeamRepo.setMockMembers([
      { averageReviewTime: 1800000 }, // 30 minutes average
    ]);

    // Act
    const predictions = await dashboardService.predictCompletionTimes();

    // Assert
    assertExists(predictions);
    assert(predictions.length > 0);
    assert(predictions.every(p => p.estimatedCompletion instanceof Date));
  });
});

Deno.test("AITaskDashboardService - Real-time Updates", async (t) => {

  await t.step("should generate task status change events", async () => {
    // Arrange
    const task = { id: "1", status: "ai_processing", title: "Test Task" };

    // Act
    const event = dashboardService.createStatusChangeEvent(task, "pending_review");

    // Assert
    assertExists(event);
    assertEquals(event.type, "task_status_changed");
    assertEquals(event.taskId, "1");
    assertEquals(event.oldStatus, "ai_processing");
    assertEquals(event.newStatus, "pending_review");
    assertExists(event.timestamp);
  });

  await t.step("should validate event data structure", async () => {
    // Act
    const event = dashboardService.createStatusChangeEvent(
      { id: "test", status: "approved" }, 
      "completed"
    );

    // Assert
    assertExists(event.type);
    assertExists(event.taskId);
    assertExists(event.timestamp);
    assert(typeof event.timestamp === "string" || event.timestamp instanceof Date);
  });
});

Deno.test("AITaskDashboardService - Error Handling", async (t) => {

  await t.step("should handle repository errors gracefully", async () => {
    // Arrange
    const failingRepo = {
      findAll: () => Promise.reject(new Error("Database connection failed"))
    };
    
    const service = new AITaskDashboardService(failingRepo as any, mockTeamRepo, mockAgentRepo);

    // Act & Assert
    try {
      await service.getDashboardOverview();
      assert(false, "Should have thrown an error");
    } catch (error) {
      assert(error instanceof Error);
      assert(error.message.includes("Database") || error.message.includes("failed"));
    }
  });

  await t.step("should handle invalid filter parameters", async () => {
    // Act
    const result = await dashboardService.getFilteredTasks({ invalidFilter: "test" } as any);

    // Assert
    // Should return all tasks when invalid filters are provided
    assertExists(result);
    assert(Array.isArray(result));
  });

  await t.step("should handle missing team member for suggestion", async () => {
    // Arrange
    mockTeamRepo.setMockMembers([]);

    // Act
    const suggestion = await dashboardService.suggestReviewer("nonexistent-expertise");

    // Assert
    // Should return null or empty result when no suitable reviewer found
    assert(suggestion === null || suggestion === undefined);
  });
});