/**
 * Task Creation Service
 * 
 * Business logic for creating and managing AI development tasks through the wizard.
 * Handles validation, task creation, updates, and lifecycle management.
 */

import { TaskRepository } from "../repositories/task.repository.ts";
import type {
    CreateTaskData,
    Task,
    UpdateTaskData,
} from "../types/task-creation.types.ts";

export class TaskCreationService {
  private repository: TaskRepository;

  constructor(kv: Deno.Kv) {
    this.repository = new TaskRepository({ kv });
  }

  /**
   * Create a new task with validation
   */
  async createTask(data: CreateTaskData, userId: string): Promise<Task> {
    // Validate required fields
    if (!data.title || data.title.trim() === "") {
      throw new Error("Title is required");
    }

    if (!data.successCriteria || data.successCriteria.length === 0) {
      throw new Error("At least one success criterion is required");
    }

    if (!data.aiAgentId || data.aiAgentId.trim() === "") {
      throw new Error("AI agent selection is required");
    }

    if (!data.reviewerIds || data.reviewerIds.length === 0) {
      throw new Error("At least one reviewer is required");
    }

    const now = new Date();

    // Create task in repository - it will generate the ID
    const repoTask = await this.repository.create({
      title: data.title.trim(),
      description: data.description.trim(),
      successCriteria: data.successCriteria,
      priority: data.priority as "critical" | "high" | "medium" | "low",
      category: data.category,
      aiAgentId: data.aiAgentId,
      reviewerIds: data.reviewerIds,
      dependencyIds: data.dependencyIds || [],
      dependsOn: data.dependencyIds || [],
      estimatedComplexity: data.estimatedComplexity,
      tags: data.tags || [],
      status: "pending" as const,
      createdBy: userId,
      // Map to existing repository structure
      assignedReviewer: data.reviewerIds[0], // Primary reviewer
      aiAgent: data.aiAgentId,
      processingStage: "requirements",
      needsApproval: true,
      approvalHistory: [],
      progress: 0,
      timeInStatus: now,
    });

    // Return task in task-creation format
    return {
      id: repoTask.id,
      title: repoTask.title,
      description: repoTask.description || "",
      successCriteria: data.successCriteria,
      priority: data.priority,
      category: data.category,
      aiAgentId: data.aiAgentId,
      reviewerIds: data.reviewerIds,
      dependencyIds: data.dependencyIds || [],
      estimatedComplexity: data.estimatedComplexity,
      tags: data.tags || [],
      status: "pending",
      createdBy: userId,
      createdAt: repoTask.createdAt.toISOString(),
      updatedAt: repoTask.updatedAt.toISOString(),
    };
  }

  /**
   * Get task by ID (user-scoped for security)
   */
  async getTaskById(id: string, userId: string): Promise<Task | null> {
    const task = await this.repository.findById(id);
    
    if (!task || task.createdBy !== userId) {
      return null;
    }

    return this.mapToTaskCreationType(task);
  }

  /**
   * List all tasks for a user
   */
  async listUserTasks(userId: string): Promise<Task[]> {
    const allTasks = await this.repository.findAll();
    const userTasks = allTasks.filter((t) => t.createdBy === userId);
    
    // Sort by creation date (oldest first)
    userTasks.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    return userTasks.map((t) => this.mapToTaskCreationType(t));
  }

  /**
   * Update task with partial data
   */
  async updateTask(
    id: string,
    updates: UpdateTaskData,
    userId: string,
  ): Promise<Task | null> {
    const existing = await this.getTaskById(id, userId);
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const updated: Task = {
      ...existing,
      ...updates,
      updatedAt: now,
    };

    await this.repository.update(id, {
      ...updates,
      assignedReviewer: updates.reviewerIds?.[0],
      aiAgent: updates.aiAgentId,
      updatedAt: new Date(now),
    });

    return updated;
  }

  /**
   * Delete task (user-scoped)
   */
  async deleteTask(id: string, userId: string): Promise<boolean> {
    const existing = await this.getTaskById(id, userId);
    if (!existing) {
      return false;
    }

    return await this.repository.deleteTask(id);
  }

  /**
   * Map repository task structure to task-creation types
   */
  private mapToTaskCreationType(repoTask: {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    assignedReviewer: string;
    aiAgent?: string;
    processingStage?: string;
    progress?: number;
    createdAt: Date;
    updatedAt: Date;
    blockedBy?: string[];
    dependsOn?: string[];
    [key: string]: unknown;
  }): Task {
    return {
      id: repoTask.id,
      title: repoTask.title,
      description: repoTask.description || "",
      successCriteria: (repoTask.successCriteria as string[]) || [],
      priority: repoTask.priority as Task["priority"],
      category: (repoTask.category as Task["category"]) || "backend",
      aiAgentId: repoTask.aiAgent || "",
      reviewerIds: (repoTask.reviewerIds as string[]) || [repoTask.assignedReviewer],
      dependencyIds: repoTask.dependsOn || [],
      estimatedComplexity: (repoTask.estimatedComplexity as Task["estimatedComplexity"]) || "medium",
      tags: (repoTask.tags as string[]) || [],
      status: this.mapStatus(repoTask.status),
      createdBy: (repoTask.createdBy as string) || "",
      createdAt: repoTask.createdAt.toISOString(),
      updatedAt: repoTask.updatedAt.toISOString(),
    };
  }

  /**
   * Map repository status to task-creation status
   */
  private mapStatus(repoStatus: string): Task["status"] {
    const statusMap: Record<string, Task["status"]> = {
      "pending": "pending",
      "ai_processing": "in-progress",
      "pending_review": "in-review",
      "in_progress": "in-progress",
      "completed": "completed",
      "blocked": "rejected",
    };

    return statusMap[repoStatus] || "pending";
  }
}
