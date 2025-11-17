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

export interface DashboardOverview {
  taskStats: {
    aiProcessing: number;
    pendingReview: number;
    approved: number;
    rejected: number;
    completed: number;
    total: number;
  };
  teamStats: {
    totalMembers: number;
    availableMembers: number;
    averageWorkload: number;
    overloadedMembers: number;
  };
  aiAgentStats: {
    totalAgents: number;
    activeAgents: number;
    averageSuccessRate: number;
    totalActiveTasks: number;
  };
  bottlenecks: Array<{
    stage: string;
    count: number;
    avgWaitTime: number;
  }>;
  averageProcessingTime: number;
  timeframe: string;
}

export interface FilteredTasksResult {
  tasks: Task[];
  totalCount: number;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    currentPage: number;
    totalPages: number;
  };
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  assignee?: string;
  aiAgent?: string;
  needsApproval?: boolean;
}

export interface TaskQueryParams {
  filters: TaskFilters;
  pagination: {
    page: number;
    limit: number;
  };
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  search?: string;
}

export interface TeamWorkloadData {
  members: Array<{
    id: string;
    name: string;
    currentTasks: number;
    capacity: number;
    utilization: number;
    status: 'available' | 'busy' | 'overloaded' | 'unavailable';
    expertise: string[];
    averageReviewTime: number;
  }>;
  aiAgents: Array<{
    id: string;
    name: string;
    currentTasks: number;
    capacity: number;
    utilization: number;
    status: string;
    specialty: string;
    successRate: number;
  }>;
  recommendations: Array<{
    type: 'rebalance' | 'escalate' | 'prioritize';
    message: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    affectedMembers: string[];
  }>;
}

export interface PerformanceAnalytics {
  throughput: {
    tasksPerDay: number;
    tasksPerWeek: number;
    trend: 'up' | 'down' | 'stable';
    trendPercentage: number;
  };
  timing: {
    averageTaskDuration: number;
    medianTaskDuration: number;
    averageReviewTime: number;
    averageAIProcessingTime: number;
  };
  quality: {
    aiSuccessRate: number;
    humanApprovalRate: number;
    rejectionRate: number;
    qualityTrend: 'improving' | 'declining' | 'stable';
  };
  bottleneckAnalysis: {
    stages: Array<{
      name: string;
      avgDuration: number;
      taskCount: number;
      efficiency: number; // 0-100 score
    }>;
    criticalPath: string[];
    recommendations: string[];
  };
  timeSeriesData: Array<{
    timestamp: string;
    tasksCompleted: number;
    avgProcessingTime: number;
    successRate: number;
  }>;
}

export interface AIAgentStatusData {
  fleetOverview: {
    totalAgents: number;
    activeAgents: number;
    processingAgents: number;
    idleAgents: number;
    errorAgents: number;
    fleetUtilization: number;
    averageSuccessRate: number;
  };
  agents: Array<{
    id: string;
    name: string;
    status: string;
    specialty: string;
    currentTasks: string[];
    queueDepth: number;
    averageProcessingTime: number;
    successRate: number;
    uptime: number;
    lastActiveAt: Date;
    performance: {
      tasksCompleted: number;
      tasksFailed: number;
      efficiency: number;
      qualityScore: number;
    };
  }>;
  recommendations: Array<{
    agentId: string;
    recommendation: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    estimatedImpact: string;
  }>;
}

export class AITaskDashboardService {
  private taskRepo: TaskRepository;
  private teamMemberRepo: TeamMemberRepository;
  private aiAgentRepo: AIAgentRepository;

  constructor(options?: { kv?: Deno.Kv }) {
    this.taskRepo = new TaskRepository(options);
    this.teamMemberRepo = new TeamMemberRepository(options);
    this.aiAgentRepo = new AIAgentRepository(options);
  }

  /**
   * Get comprehensive dashboard overview
   */
  async getDashboardOverview(timeframe: string = '24h'): Promise<DashboardOverview> {
    // Get task metrics
    const taskMetrics = await this.taskRepo.getTaskMetrics(timeframe);
    
    // Get team utilization
    const teamUtilization = await this.teamMemberRepo.getTeamUtilization();
    
    // Get AI agent fleet metrics
    const agentMetrics = await this.aiAgentRepo.getFleetMetrics();
    
    // Get bottleneck analysis
    const bottlenecks = await this.taskRepo.getBottleneckAnalysis();
    
    // Get average processing time
    const averageProcessingTime = await this.taskRepo.getAverageProcessingTime(timeframe);

    return {
      taskStats: {
        aiProcessing: taskMetrics.inProgress,
        pendingReview: taskMetrics.pendingReview,
        approved: taskMetrics.completed,
        rejected: taskMetrics.blocked,
        completed: taskMetrics.completed,
        total: taskMetrics.total
      },
      teamStats: {
        totalMembers: teamUtilization.totalMembers,
        availableMembers: teamUtilization.activeMembers,
        averageWorkload: teamUtilization.averageUtilization,
        overloadedMembers: teamUtilization.overloadedMembers
      },
      aiAgentStats: {
        totalAgents: agentMetrics.totalAgents,
        activeAgents: agentMetrics.activeAgents,
        averageSuccessRate: agentMetrics.averageSuccessRate,
        totalActiveTasks: agentMetrics.totalActiveTasks
      },
      bottlenecks,
      averageProcessingTime,
      timeframe
    };
  }

  /**
   * Get filtered and paginated tasks
   */
  async getFilteredTasks(params: TaskQueryParams): Promise<FilteredTasksResult> {
    let tasks = await this.taskRepo.findAll();
    
    // Apply filters
    if (params.filters.status) {
      tasks = tasks.filter(task => task.status === params.filters.status);
    }
    
    if (params.filters.priority) {
      tasks = tasks.filter(task => task.priority === params.filters.priority);
    }
    
    if (params.filters.assignee) {
      tasks = tasks.filter(task => task.assignedReviewer === params.filters.assignee);
    }
    
    if (params.filters.aiAgent) {
      tasks = tasks.filter(task => task.aiAgent === params.filters.aiAgent);
    }
    
    if (params.filters.needsApproval !== undefined) {
      tasks = tasks.filter(task => task.needsApproval === params.filters.needsApproval);
    }

    // Apply search
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      tasks = tasks.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower) ||
        task.assignedReviewer.toLowerCase().includes(searchLower) ||
        (task.aiAgent && task.aiAgent.toLowerCase().includes(searchLower))
      );
    }

    // Sort tasks
    tasks.sort((a, b) => {
      let aValue: any = a[params.sortBy as keyof Task];
      let bValue: any = b[params.sortBy as keyof Task];
      
      // Handle date fields
      if (aValue instanceof Date) aValue = aValue.getTime();
      if (bValue instanceof Date) bValue = bValue.getTime();
      
      if (params.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Pagination
    const totalCount = tasks.length;
    const totalPages = Math.ceil(totalCount / params.pagination.limit);
    const startIndex = (params.pagination.page - 1) * params.pagination.limit;
    const endIndex = startIndex + params.pagination.limit;
    const paginatedTasks = tasks.slice(startIndex, endIndex);

    return {
      tasks: paginatedTasks,
      totalCount,
      pageInfo: {
        hasNextPage: params.pagination.page < totalPages,
        hasPreviousPage: params.pagination.page > 1,
        currentPage: params.pagination.page,
        totalPages
      }
    };
  }

  /**
   * Get team workload distribution
   */
  async getTeamWorkload(timeframe: string = '7d', includeAI: boolean = true): Promise<TeamWorkloadData> {
    // Get team member workload
    const workloadDistribution = await this.teamMemberRepo.getWorkloadDistribution();
    const teamMembers = await this.teamMemberRepo.findAll();
    
    const members = workloadDistribution.map(wd => {
      const member = teamMembers.find(m => m.id === wd.memberId);
      return {
        id: wd.memberId,
        name: wd.name,
        currentTasks: wd.currentTasks,
        capacity: wd.capacity,
        utilization: wd.utilization,
        status: wd.availability,
        expertise: member?.expertise || [],
        averageReviewTime: member?.averageReviewTime || 0
      };
    });

    // Get AI agent utilization if requested
    let aiAgents: TeamWorkloadData['aiAgents'] = [];
    if (includeAI) {
      const agentUtilization = await this.aiAgentRepo.getAgentUtilization();
      const allAgents = await this.aiAgentRepo.findAll();
      
      aiAgents = agentUtilization.map(au => {
        const agent = allAgents.find(a => a.id === au.agentId);
        return {
          id: au.agentId,
          name: au.name,
          currentTasks: agent?.currentTasks.length || 0,
          capacity: agent?.maxConcurrentTasks || 0,
          utilization: au.utilization,
          status: agent?.status || 'unknown',
          specialty: agent?.specialty || '',
          successRate: agent?.successRate || 0
        };
      });
    }

    // Generate recommendations
    const recommendations: TeamWorkloadData['recommendations'] = [];
    
    // Check for overloaded members
    const overloaded = members.filter(m => m.utilization > 90);
    if (overloaded.length > 0) {
      recommendations.push({
        type: 'rebalance',
        message: `${overloaded.length} team member(s) are overloaded. Consider redistributing tasks.`,
        urgency: 'high',
        affectedMembers: overloaded.map(m => m.id)
      });
    }

    // Check for idle resources
    const idle = members.filter(m => m.utilization < 30 && m.status === 'available');
    if (idle.length > 0) {
      recommendations.push({
        type: 'prioritize',
        message: `${idle.length} team member(s) have low utilization. Consider assigning priority tasks.`,
        urgency: 'medium',
        affectedMembers: idle.map(m => m.id)
      });
    }

    return {
      members,
      aiAgents,
      recommendations
    };
  }

  /**
   * Get performance analytics
   */
  async getPerformanceAnalytics(timeframe: string = '30d', granularity: 'hour' | 'day' | 'week' = 'day'): Promise<PerformanceAnalytics> {
    // Get basic metrics
    const taskMetrics = await this.taskRepo.getTaskMetrics(timeframe);
    const averageProcessingTime = await this.taskRepo.getAverageProcessingTime(timeframe);
    const completedTasks = await this.taskRepo.getCompletedTasksInTimeframe(timeframe);
    const fleetMetrics = await this.aiAgentRepo.getFleetMetrics();
    
    // Calculate throughput
    const now = new Date();
    const daysInTimeframe = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30;
    const tasksPerDay = completedTasks.length / daysInTimeframe;
    const tasksPerWeek = tasksPerDay * 7;

    // Calculate quality metrics
    const totalApprovals = completedTasks.filter(task => 
      task.approvalHistory && task.approvalHistory.some(approval => approval.action === 'approved')
    ).length;
    const totalRejections = completedTasks.filter(task =>
      task.approvalHistory && task.approvalHistory.some(approval => approval.action === 'rejected')
    ).length;
    
    const approvalRate = completedTasks.length > 0 ? (totalApprovals / completedTasks.length) * 100 : 0;
    const rejectionRate = completedTasks.length > 0 ? (totalRejections / completedTasks.length) * 100 : 0;

    // Generate time series data (simplified for this example)
    const timeSeriesData = this.generateTimeSeriesData(completedTasks, granularity);

    return {
      throughput: {
        tasksPerDay,
        tasksPerWeek,
        trend: 'stable', // Would calculate from historical data
        trendPercentage: 0
      },
      timing: {
        averageTaskDuration: averageProcessingTime,
        medianTaskDuration: averageProcessingTime, // Simplified
        averageReviewTime: 0, // Would calculate from team metrics
        averageAIProcessingTime: fleetMetrics.averageProcessingTime
      },
      quality: {
        aiSuccessRate: fleetMetrics.averageSuccessRate,
        humanApprovalRate: approvalRate,
        rejectionRate: rejectionRate,
        qualityTrend: 'stable'
      },
      bottleneckAnalysis: {
        stages: [],
        criticalPath: ['requirements', 'implementation', 'review', 'approval'],
        recommendations: []
      },
      timeSeriesData
    };
  }

  /**
   * Get AI agent status information
   */
  async getAIAgentStatus(includeMetrics: boolean = true): Promise<AIAgentStatusData> {
    const fleetMetrics = await this.aiAgentRepo.getFleetMetrics();
    const agents = await this.aiAgentRepo.findAll();

    const agentDetails = agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      status: agent.status,
      specialty: agent.specialty,
      currentTasks: agent.currentTasks,
      queueDepth: agent.queueDepth,
      averageProcessingTime: agent.averageProcessingTime,
      successRate: agent.successRate,
      uptime: agent.uptime,
      lastActiveAt: agent.lastActiveAt,
      performance: {
        tasksCompleted: agent.totalTasksCompleted,
        tasksFailed: agent.totalTasksFailed,
        efficiency: agent.successRate, // Simplified metric
        qualityScore: agent.successRate // Simplified metric
      }
    }));

    const recommendations = this.generateAgentRecommendations(agents);

    return {
      fleetOverview: {
        totalAgents: fleetMetrics.totalAgents,
        activeAgents: fleetMetrics.activeAgents,
        processingAgents: agents.filter(a => a.status === 'processing').length,
        idleAgents: agents.filter(a => a.status === 'idle').length,
        errorAgents: agents.filter(a => a.status === 'error').length,
        fleetUtilization: fleetMetrics.fleetUtilization,
        averageSuccessRate: fleetMetrics.averageSuccessRate
      },
      agents: agentDetails,
      recommendations
    };
  }

  /**
   * Get a specific task by ID (helper method for WebSocket updates)
   */
  async getTaskById(id: string): Promise<Task | null> {
    return await this.taskRepo.findById(id);
  }

  // Private helper methods

  private generateTimeSeriesData(completedTasks: Task[], granularity: 'hour' | 'day' | 'week'): Array<{
    timestamp: string;
    tasksCompleted: number;
    avgProcessingTime: number;
    successRate: number;
  }> {
    // Simplified implementation - in production would group by time intervals
    const now = new Date();
    const data = [];
    
    for (let i = 0; i < 10; i++) {
      const timestamp = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000)).toISOString();
      data.unshift({
        timestamp,
        tasksCompleted: Math.floor(Math.random() * 20) + 5,
        avgProcessingTime: Math.floor(Math.random() * 3600000) + 300000, // 5min to 1hr
        successRate: Math.floor(Math.random() * 20) + 80 // 80-100%
      });
    }
    
    return data;
  }

  private generateAgentRecommendations(agents: AIAgent[]): Array<{
    agentId: string;
    recommendation: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    estimatedImpact: string;
  }> {
    const recommendations = [];
    
    for (const agent of agents) {
      if (agent.status === 'error') {
        recommendations.push({
          agentId: agent.id,
          recommendation: `Agent ${agent.name} is in error state and requires investigation`,
          priority: 'critical' as const,
          estimatedImpact: 'High - Blocking task completion'
        });
      }
      
      if (agent.successRate < 80 && agent.totalTasksCompleted > 5) {
        recommendations.push({
          agentId: agent.id,
          recommendation: `Agent ${agent.name} has low success rate (${agent.successRate}%) - consider retraining`,
          priority: 'high' as const,
          estimatedImpact: 'Medium - Reducing quality'
        });
      }
      
      if (agent.currentTasks.length >= agent.maxConcurrentTasks) {
        recommendations.push({
          agentId: agent.id,
          recommendation: `Agent ${agent.name} is at capacity - consider scaling up`,
          priority: 'medium' as const,
          estimatedImpact: 'Medium - Increasing wait times'
        });
      }
    }
    
    return recommendations;
  }
}