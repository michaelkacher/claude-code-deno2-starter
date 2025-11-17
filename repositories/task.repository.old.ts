/**
 * Task Repository
 * 
 * Handles data access for tasks in the AI-first development workflow.
 * Stores tasks with their AI processing status, human review assignments,
 * and progress tracking information.
 */

import { BaseRepository } from "./base-repository.ts";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'ai_processing' | 'pending_review' | 'approved' | 'rejected' | 'completed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  aiAgent: string;
  assignedReviewer: string;
  progress: number;
  timeInStatus: Date;
  estimatedCompletion: Date;
  dependencies: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // Additional metadata for AI workflow
  requirementsApproved?: boolean;
  testLogicApproved?: boolean;
  approvalHistory?: ApprovalHistoryEntry[];
  aiGeneratedRequirements?: string;
  aiGeneratedTests?: string;
}

export interface ApprovalHistoryEntry {
  action: 'submitted' | 'assigned' | 'approved' | 'rejected' | 'updated';
  user: string;
  timestamp: Date;
  notes?: string;
}

export class TaskRepository extends BaseRepository<Task> {
  constructor(options?: { kv?: Deno.Kv }) {
    super("task", options);
  }

  async findByStatus(status: string): Promise<Task[]> {
    const tasks = await this.findAll();
    return tasks.filter(task => task.status === status);
  }

  async findByAssignee(assignee: string): Promise<Task[]> {
    const tasks = await this.findAll();
    return tasks.filter(task => task.assignedReviewer === assignee);
  }

  async findByPriority(priority: string): Promise<Task[]> {
    const tasks = await this.findAll();
    return tasks.filter(task => task.priority === priority);
  }

  async findByAIAgent(agentName: string): Promise<Task[]> {
    const tasks = await this.findAll();
    return tasks.filter(task => task.aiAgent === agentName);
  }

  async findPendingApproval(): Promise<Task[]> {
    return this.findByStatus('pending_review');
  }

  async findInProgress(): Promise<Task[]> {
    return this.findByStatus('ai_processing');
  }

  async updateStatus(id: string, newStatus: Task['status']): Promise<Task | null> {
    const task = await this.findById(id);
    if (!task) return null;

    const updatedTask = {
      ...task,
      status: newStatus,
      timeInStatus: new Date(),
      updatedAt: new Date()
    };

    await this.update(id, updatedTask);
    return updatedTask;
  }

  async updateProgress(id: string, progress: number): Promise<Task | null> {
    const task = await this.findById(id);
    if (!task) return null;

    const updatedTask = {
      ...task,
      progress: Math.max(0, Math.min(100, progress)),
      updatedAt: new Date()
    };

    await this.update(id, updatedTask);
    return updatedTask;
  }

  async addApprovalHistoryEntry(id: string, entry: ApprovalHistoryEntry): Promise<Task | null> {
    const task = await this.findById(id);
    if (!task) return null;

    const updatedTask = {
      ...task,
      approvalHistory: [...(task.approvalHistory || []), entry],
      updatedAt: new Date()
    };

    await this.update(id, updatedTask);
    return updatedTask;
  }

  async assignReviewer(id: string, reviewerName: string): Promise<Task | null> {
    const task = await this.findById(id);
    if (!task) return null;

    const updatedTask = {
      ...task,
      assignedReviewer: reviewerName,
      updatedAt: new Date()
    };

    // Add to approval history
    const historyEntry: ApprovalHistoryEntry = {
      action: 'assigned',
      user: 'System',
      timestamp: new Date(),
      notes: `Assigned to ${reviewerName}`
    };

    updatedTask.approvalHistory = [...(task.approvalHistory || []), historyEntry];

    await this.update(id, updatedTask);
    return updatedTask;
  }

  async getTasksByDateRange(startDate: Date, endDate: Date): Promise<Task[]> {
    const tasks = await this.findAll();
    return tasks.filter(task => 
      task.createdAt >= startDate && task.createdAt <= endDate
    );
  }

  async getCompletedTasksCount(date: Date = new Date()): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const completedTasks = await this.getTasksByDateRange(startOfDay, endOfDay);
    return completedTasks.filter(task => task.status === 'completed').length;
  }

  async getAverageCompletionTime(): Promise<number> {
    const completedTasks = await this.findByStatus('completed');
    
    if (completedTasks.length === 0) return 0;

    const completionTimes = completedTasks.map(task => 
      task.updatedAt.getTime() - task.createdAt.getTime()
    );

    return completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
  }

  async getTasksStuckInStatus(status: string, hoursThreshold: number = 24): Promise<Task[]> {
    const tasks = await this.findByStatus(status);
    const thresholdTime = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);

    return tasks.filter(task => task.timeInStatus < thresholdTime);
  }
}