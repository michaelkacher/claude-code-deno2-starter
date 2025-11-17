/**
 * AI Task Dashboard Service
 * 
 * Provides business logic for the AI task dashboard, including:
 * - Real-time task status monitoring
 * - Team workload management
 * - AI agent status tracking
 * - Performance analytics and bottleneck detection
 */

import { TaskRepository, Task } from "../repositories/task.repository.ts";
import { TeamMemberRepository, TeamMember } from "../repositories/team-member.repository.ts";
import { AIAgentRepository, AIAgent } from "../repositories/ai-agent.repository.ts";
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
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  expertise: string[];
  workload: number;
  isAvailable: boolean;
  pendingReviews: number;
  completedToday: number;
  averageReviewTime: number;
}

export interface AIAgent {
  id: string;
  name: string;
  status: 'active' | 'processing' | 'idle' | 'error';
  specialty: string;
  currentTasks: string[];
  averageProcessingTime: number;
  successRate: number;
  isAvailable: boolean;
}

export interface DashboardOverview {
  taskStats: {
    aiProcessing: number;
    pendingReview: number;
    approved: number;
    rejected: number;
    completed: number;
    total: number;
  };
  teamStatus: TeamMember[];
  agentStatus: AIAgent[];
  lastUpdated: string;
}

export interface WorkflowVelocity {
  completionRate: number;
  averageTimeToComplete: number;
  tasksCompletedToday: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface Bottleneck {
  taskId: string;
  title: string;
  status: string;
  timeInStatus: number;
  priority: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface CompletionPrediction {
  taskId: string;
  estimatedCompletion: Date;
  confidence: number;
}

export interface StatusChangeEvent {
  type: 'task_status_changed';
  taskId: string;
  oldStatus: string;
  newStatus: string;
  timestamp: string;
}

export class AITaskDashboardService {
  constructor(
    private taskRepository: any,
    private teamMemberRepository: any,
    private aiAgentRepository: any
  ) {}

  async getDashboardOverview(): Promise<DashboardOverview> {
    const [tasks, teamMembers, agents] = await Promise.all([
      this.taskRepository.findAll(),
      this.teamMemberRepository.findAll(),
      this.aiAgentRepository.findAll()
    ]);

    const taskStats = this.calculateTaskStats(tasks);
    
    return {
      taskStats,
      teamStatus: teamMembers,
      agentStatus: agents,
      lastUpdated: new Date().toISOString()
    };
  }

  async getFilteredTasks(filters: {
    status?: string;
    priority?: string;
    assignee?: string;
    [key: string]: any;
  }): Promise<Task[]> {
    let tasks = await this.taskRepository.findAll();

    // Apply filters
    if (filters.status) {
      tasks = tasks.filter((task: Task) => task.status === filters.status);
    }

    if (filters.priority) {
      tasks = tasks.filter((task: Task) => task.priority === filters.priority);
    }

    if (filters.assignee) {
      tasks = tasks.filter((task: Task) => task.assignedReviewer === filters.assignee);
    }

    return tasks;
  }

  async getTeamWorkload(): Promise<TeamMember[]> {
    const teamMembers = await this.teamMemberRepository.findAll();
    
    // Sort by workload (highest first) to identify overloaded members
    return teamMembers.sort((a: TeamMember, b: TeamMember) => b.workload - a.workload);
  }

  async suggestReviewer(expertise: string): Promise<TeamMember | null> {
    const teamMembers = await this.teamMemberRepository.findAll();
    
    // Find available team members with relevant expertise
    const suitableReviewers = teamMembers
      .filter((member: TeamMember) => 
        member.expertise.includes(expertise) && member.workload < 90
      )
      .sort((a: TeamMember, b: TeamMember) => a.workload - b.workload);

    return suitableReviewers.length > 0 ? suitableReviewers[0] : null;
  }

  async getAIAgentStatus(): Promise<AIAgent[]> {
    return await this.aiAgentRepository.findAll();
  }

  async getAvailableAgents(): Promise<AIAgent[]> {
    const agents = await this.aiAgentRepository.findAll();
    return agents.filter((agent: AIAgent) => agent.status === 'idle');
  }

  async getAgentPerformanceMetrics(): Promise<{
    averageProcessingTime: number;
    overallSuccessRate: number;
    totalActiveTasks: number;
  }> {
    const agents = await this.aiAgentRepository.findAll();
    
    const totalProcessingTime = agents.reduce((sum: number, agent: AIAgent) => 
      sum + agent.averageProcessingTime, 0);
    const averageProcessingTime = agents.length > 0 ? totalProcessingTime / agents.length : 0;
    
    const totalSuccessRate = agents.reduce((sum: number, agent: AIAgent) => 
      sum + agent.successRate, 0);
    const overallSuccessRate = agents.length > 0 ? totalSuccessRate / agents.length : 0;
    
    const totalActiveTasks = agents.reduce((sum: number, agent: AIAgent) => 
      sum + agent.currentTasks.length, 0);

    return {
      averageProcessingTime,
      overallSuccessRate,
      totalActiveTasks
    };
  }

  async getWorkflowVelocity(): Promise<WorkflowVelocity> {
    const tasks = await this.taskRepository.findAll();
    const completedTasks = tasks.filter((task: Task) => task.status === 'completed');
    const totalTasks = tasks.length;
    
    const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
    
    // Calculate average completion time
    const completionTimes = completedTasks.map((task: Task) => 
      task.updatedAt.getTime() - task.createdAt.getTime()
    );
    const averageTimeToComplete = completionTimes.length > 0 
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
      : 0;

    // Count tasks completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tasksCompletedToday = completedTasks.filter((task: Task) => 
      task.updatedAt >= today
    ).length;

    return {
      completionRate,
      averageTimeToComplete,
      tasksCompletedToday,
      trend: 'stable' // This would be calculated based on historical data
    };
  }

  async identifyBottlenecks(): Promise<Bottleneck[]> {
    const tasks = await this.taskRepository.findAll();
    const now = new Date();
    
    const bottlenecks: Bottleneck[] = [];
    
    for (const task of tasks) {
      if (task.status === 'pending_review' || task.status === 'ai_processing') {
        const timeInStatus = now.getTime() - new Date(task.timeInStatus).getTime();
        const hoursInStatus = timeInStatus / (1000 * 60 * 60);
        
        // Consider it a bottleneck if stuck for more than 24 hours
        if (hoursInStatus > 24) {
          let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
          
          if (task.priority === 'critical') severity = 'critical';
          else if (task.priority === 'high' && hoursInStatus > 48) severity = 'high';
          else if (hoursInStatus > 72) severity = 'high';
          
          bottlenecks.push({
            taskId: task.id,
            title: task.title,
            status: task.status,
            timeInStatus: timeInStatus,
            priority: task.priority,
            severity
          });
        }
      }
    }
    
    // Sort by severity and time in status
    return bottlenecks.sort((a, b) => {
      const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      return severityDiff || b.timeInStatus - a.timeInStatus;
    });
  }

  async predictCompletionTimes(): Promise<CompletionPrediction[]> {
    const tasks = await this.taskRepository.findAll();
    const agents = await this.aiAgentRepository.findAll();
    const teamMembers = await this.teamMemberRepository.findAll();
    
    const predictions: CompletionPrediction[] = [];
    
    // Get average processing times
    const avgAgentProcessingTime = agents.reduce((sum, agent) => 
      sum + agent.averageProcessingTime, 0) / agents.length || 0;
    
    const avgReviewTime = teamMembers.reduce((sum, member) => 
      sum + (member.averageReviewTime || 0), 0) / teamMembers.length || 0;
    
    for (const task of tasks) {
      if (task.status !== 'completed' && task.status !== 'rejected') {
        let estimatedTime = 0;
        let confidence = 70; // Base confidence
        
        if (task.status === 'ai_processing') {
          // Estimate based on remaining progress and agent speed
          const remainingProgress = 100 - task.progress;
          estimatedTime = (remainingProgress / 100) * avgAgentProcessingTime;
          confidence = 85; // Higher confidence for AI processing
        } else if (task.status === 'pending_review') {
          // Estimate based on average review time and reviewer workload
          const reviewer = teamMembers.find(m => m.name === task.assignedReviewer);
          const workloadMultiplier = reviewer ? (reviewer.workload / 50) : 1;
          estimatedTime = avgReviewTime * workloadMultiplier;
          confidence = 75;
        } else if (task.status === 'approved') {
          // Implementation time estimation (simplified)
          estimatedTime = 4 * 60 * 60 * 1000; // 4 hours
          confidence = 60;
        }
        
        predictions.push({
          taskId: task.id,
          estimatedCompletion: new Date(Date.now() + estimatedTime),
          confidence
        });
      }
    }
    
    return predictions;
  }

  createStatusChangeEvent(task: Task, newStatus: string): StatusChangeEvent {
    return {
      type: 'task_status_changed',
      taskId: task.id,
      oldStatus: task.status,
      newStatus,
      timestamp: new Date().toISOString()
    };
  }

  private calculateTaskStats(tasks: Task[]) {
    const stats = {
      aiProcessing: 0,
      pendingReview: 0,
      approved: 0,
      rejected: 0,
      completed: 0,
      total: tasks.length
    };

    for (const task of tasks) {
      switch (task.status) {
        case 'ai_processing':
          stats.aiProcessing++;
          break;
        case 'pending_review':
          stats.pendingReview++;
          break;
        case 'approved':
          stats.approved++;
          break;
        case 'rejected':
          stats.rejected++;
          break;
        case 'completed':
          stats.completed++;
          break;
      }
    }

    return stats;
  }
}