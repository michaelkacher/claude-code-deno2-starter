/**
 * Task Repository
 * 
 * Handles data access for tasks in the AI development workflow.
 * Manages task lifecycle, status updates, approval history, and bottleneck detection.
 */

import { BaseRepository } from "./base-repository.ts";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'ai_processing' | 'pending_review' | 'in_progress' | 'completed' | 'blocked';
  priority: 'critical' | 'high' | 'medium' | 'low';
  
  // Assignment
  assignedReviewer: string;
  aiAgent?: string; // Name of AI agent processing this task
  
  // Workflow stages
  processingStage: string; // 'requirements', 'implementation', 'review', etc.
  needsApproval: boolean;
  approvalHistory: ApprovalStep[];
  
  // Progress tracking
  progress: number; // 0-100 percentage
  estimatedCompletion?: Date;
  
  // Timing
  timeInStatus: Date; // When task entered current status
  totalProcessingTime?: number; // milliseconds
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  
  // AI-specific data
  aiProcessingLogs?: AIProcessingLog[];
  qualityScore?: number; // 0-100 based on review
  
  // Dependencies
  blockedBy?: string[]; // Array of task IDs
  dependsOn?: string[]; // Array of task IDs
}

export interface ApprovalStep {
  id: string;
  reviewer: string;
  action: 'approved' | 'rejected' | 'requested_changes';
  comments?: string;
  timestamp: Date;
  duration?: number; // milliseconds to make decision
}

export interface AIProcessingLog {
  id: string;
  stage: string;
  agentName: string;
  startTime: Date;
  endTime?: Date;
  status: 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  outputSummary?: string;
}

export class TaskRepository extends BaseRepository<Task> {
  constructor(options?: { kv?: Deno.Kv }) {
    super("task", options);
  }

  // Base CRUD operations
  async findById(id: string): Promise<Task | null> {
    return await this.get(["tasks", id]);
  }

  async create(task: Omit<Task, "id" | "createdAt" | "updatedAt">): Promise<Task> {
    const id = crypto.randomUUID();
    const now = new Date();
    
    const newTask: Task = {
      ...task,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await this.set(["tasks", id], newTask);
    return newTask;
  }

  async update(id: string, updates: Partial<Omit<Task, "id" | "createdAt">>): Promise<Task | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: Task = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    await this.set(["tasks", id], updated);
    return updated;
  }

  async deleteTask(id: string): Promise<boolean> {
    const task = await this.findById(id);
    if (!task) return false;

    await this.delete(["tasks", id]);
    return true;
  }

  async findAll(): Promise<Task[]> {
    const result = await this.list(["tasks"]);
    return result.items;
  }

  // Specialized query methods
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

    return await this.update(id, updatedTask);
  }

  async addApprovalStep(taskId: string, approval: Omit<ApprovalStep, "id" | "timestamp">): Promise<Task | null> {
    const task = await this.findById(taskId);
    if (!task) return null;

    const approvalStep: ApprovalStep = {
      ...approval,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    const updatedTask = {
      ...task,
      approvalHistory: [...(task.approvalHistory || []), approvalStep],
      updatedAt: new Date()
    };

    return await this.update(taskId, updatedTask);
  }

  async updateProgress(id: string, progress: number): Promise<Task | null> {
    const task = await this.findById(id);
    if (!task) return null;

    const now = new Date();
    let estimatedCompletion: Date | undefined;
    
    // Calculate estimated completion based on progress rate
    if (progress > 0 && task.progress !== undefined && task.progress < progress) {
      const progressDelta = progress - task.progress;
      const timeDelta = now.getTime() - task.updatedAt.getTime();
      
      if (progressDelta > 0 && timeDelta > 0) {
        const remainingProgress = 100 - progress;
        const estimatedTimeRemaining = (remainingProgress / progressDelta) * timeDelta;
        estimatedCompletion = new Date(now.getTime() + estimatedTimeRemaining);
      }
    }

    return await this.update(id, {
      progress,
      estimatedCompletion,
      updatedAt: now
    });
  }

  async addAIProcessingLog(taskId: string, log: Omit<AIProcessingLog, "id">): Promise<Task | null> {
    const task = await this.findById(taskId);
    if (!task) return null;

    const processingLog: AIProcessingLog = {
      ...log,
      id: crypto.randomUUID()
    };

    const updatedTask = {
      ...task,
      aiProcessingLogs: [...(task.aiProcessingLogs || []), processingLog],
      updatedAt: new Date()
    };

    return await this.update(taskId, updatedTask);
  }

  async getTasksByDateRange(startDate: Date, endDate: Date): Promise<Task[]> {
    const tasks = await this.findAll();
    return tasks.filter(task => 
      task.createdAt >= startDate && task.createdAt <= endDate
    );
  }

  async getCompletedTasksInTimeframe(timeframe: string): Promise<Task[]> {
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const tasks = await this.findAll();
    return tasks.filter(task => 
      task.status === 'completed' && 
      task.completedAt &&
      task.completedAt >= startDate
    );
  }

  async getBottleneckAnalysis(): Promise<{
    stage: string;
    count: number;
    avgWaitTime: number;
  }[]> {
    const tasks = await this.findAll();
    const stageStats = new Map<string, { count: number; totalTime: number }>();

    tasks.forEach(task => {
      if (task.status !== 'completed') {
        const stage = task.processingStage;
        const waitTime = new Date().getTime() - task.timeInStatus.getTime();
        
        const current = stageStats.get(stage) || { count: 0, totalTime: 0 };
        stageStats.set(stage, {
          count: current.count + 1,
          totalTime: current.totalTime + waitTime
        });
      }
    });

    return Array.from(stageStats.entries()).map(([stage, stats]) => ({
      stage,
      count: stats.count,
      avgWaitTime: stats.totalTime / stats.count
    }));
  }

  async getAverageProcessingTime(timeframe: string = '30d'): Promise<number> {
    const completedTasks = await this.getCompletedTasksInTimeframe(timeframe);
    
    if (completedTasks.length === 0) return 0;
    
    const totalTime = completedTasks.reduce((sum, task) => {
      return sum + (task.totalProcessingTime || 0);
    }, 0);
    
    return totalTime / completedTasks.length;
  }

  async getTaskMetrics(timeframe: string = '24h'): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    pendingReview: number;
    blocked: number;
    averageCompletionTime: number;
  }> {
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const tasks = await this.findAll();
    const filteredTasks = tasks.filter(task => task.createdAt >= startDate);
    
    const completed = filteredTasks.filter(task => task.status === 'completed');
    const totalCompletionTime = completed.reduce((sum, task) => sum + (task.totalProcessingTime || 0), 0);
    
    return {
      total: filteredTasks.length,
      completed: completed.length,
      inProgress: filteredTasks.filter(task => ['ai_processing', 'in_progress'].includes(task.status)).length,
      pendingReview: filteredTasks.filter(task => task.status === 'pending_review').length,
      blocked: filteredTasks.filter(task => task.status === 'blocked').length,
      averageCompletionTime: completed.length > 0 ? totalCompletionTime / completed.length : 0
    };
  }

  async getTasksNeedingAttention(): Promise<Task[]> {
    const tasks = await this.findAll();
    const now = new Date();
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    
    return tasks.filter(task => {
      // Tasks stuck in same status for > 4 hours
      const stuckTooLong = task.timeInStatus < fourHoursAgo;
      
      // Critical tasks not in progress
      const criticalNotStarted = task.priority === 'critical' && task.status === 'pending';
      
      // High priority tasks in review too long
      const highPriorityStuck = task.priority === 'high' && 
                               task.status === 'pending_review' && 
                               task.timeInStatus < new Date(now.getTime() - 2 * 60 * 60 * 1000);
      
      return stuckTooLong || criticalNotStarted || highPriorityStuck;
    });
  }
}