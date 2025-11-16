/**
 * Task Creation Wizard - Type Definitions
 * 
 * Defines interfaces for AI-powered task creation with human oversight.
 */

export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskCategory = "frontend" | "backend" | "api" | "database" | "integration" | "testing";
export type TaskStatus = "pending" | "in-progress" | "in-review" | "completed" | "rejected";
export type TaskComplexity = "simple" | "medium" | "complex";

export interface Task {
  id: string;
  title: string;
  description: string;
  successCriteria: string[];
  priority: TaskPriority;
  category: TaskCategory;
  aiAgentId: string;
  reviewerIds: string[];
  dependencyIds: string[];
  estimatedComplexity: TaskComplexity;
  tags: string[];
  status: TaskStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskData {
  title: string;
  description: string;
  successCriteria: string[];
  priority: TaskPriority;
  category: TaskCategory;
  aiAgentId: string;
  reviewerIds: string[];
  dependencyIds: string[];
  estimatedComplexity: TaskComplexity;
  tags: string[];
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  successCriteria?: string[];
  priority?: TaskPriority;
  category?: TaskCategory;
  aiAgentId?: string;
  reviewerIds?: string[];
  dependencyIds?: string[];
  estimatedComplexity?: TaskComplexity;
  tags?: string[];
  status?: TaskStatus;
}

export interface AIAgent {
  id: string;
  name: string;
  specialty: string;
  availability: "available" | "busy" | "offline";
  queueTime?: string;
}

export interface Reviewer {
  id: string;
  name: string;
  role: string;
  expertise: string[];
  workload: number;
  avatar: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  category: TaskCategory;
  successCriteria: string[];
  aiInstructions: string;
}
