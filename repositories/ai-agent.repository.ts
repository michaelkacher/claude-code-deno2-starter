/**
 * AI Agent Repository
 * 
 * Handles data access for AI agents in the development workflow.
 * Manages agent status, capabilities, performance metrics, and task assignments.
 */

import { BaseRepository } from "./base-repository.ts";

export interface AIAgent {
  id: string;
  name: string;
  status: 'active' | 'processing' | 'idle' | 'error' | 'maintenance';
  specialty: string; // e.g., "Backend & APIs", "Frontend & UI", "Security & Auth"
  capabilities: string[]; // Detailed list of what the agent can do
  currentTasks: string[]; // Task IDs currently being processed
  
  // Performance metrics
  averageProcessingTime: number; // milliseconds
  successRate: number; // 0-100 percentage
  totalTasksCompleted: number;
  totalTasksFailed: number;
  
  // Resource management
  maxConcurrentTasks: number;
  isAvailable: boolean;
  queueDepth: number;
  
  // Configuration
  model: string; // e.g., "gpt-4", "claude-3", etc.
  temperature: number; // AI temperature setting
  maxTokens: number;
  
  // Scheduling and availability
  lastActiveAt: Date;
  lastMaintenanceAt: Date;
  uptime: number; // percentage
  
  createdAt: Date;
  updatedAt: Date;
}

export class AIAgentRepository extends BaseRepository<AIAgent> {
  constructor(options?: { kv?: Deno.Kv }) {
    super("ai_agent", options);
  }

  // Base CRUD operations
  async findById(id: string): Promise<AIAgent | null> {
    return await this.get(["ai_agents", id]);
  }

  async create(agent: Omit<AIAgent, "id" | "createdAt" | "updatedAt">): Promise<AIAgent> {
    const id = crypto.randomUUID();
    const now = new Date();
    
    const newAgent: AIAgent = {
      ...agent,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await this.set(["ai_agents", id], newAgent);
    return newAgent;
  }

  async update(id: string, updates: Partial<Omit<AIAgent, "id" | "createdAt">>): Promise<AIAgent | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: AIAgent = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    await this.set(["ai_agents", id], updated);
    return updated;
  }

  async deleteAgent(id: string): Promise<boolean> {
    const agent = await this.findById(id);
    if (!agent) return false;

    await this.delete(["ai_agents", id]);
    return true;
  }

  async findAll(): Promise<AIAgent[]> {
    const result = await this.list(["ai_agents"]);
    return result.items;
  }

  // Specialized query methods
  async findByStatus(status: AIAgent['status']): Promise<AIAgent[]> {
    const agents = await this.findAll();
    return agents.filter(agent => agent.status === status);
  }

  async findBySpecialty(specialty: string): Promise<AIAgent[]> {
    const agents = await this.findAll();
    return agents.filter(agent => 
      agent.specialty.toLowerCase().includes(specialty.toLowerCase()) ||
      agent.capabilities.some(cap => cap.toLowerCase().includes(specialty.toLowerCase()))
    );
  }

  async findAvailable(): Promise<AIAgent[]> {
    const agents = await this.findAll();
    return agents.filter(agent => 
      agent.isAvailable && 
      agent.status === 'idle' && 
      agent.currentTasks.length < agent.maxConcurrentTasks
    );
  }

  async updateStatus(id: string, newStatus: AIAgent['status']): Promise<AIAgent | null> {
    const agent = await this.findById(id);
    if (!agent) return null;

    const updatedAgent = {
      ...agent,
      status: newStatus,
      lastActiveAt: new Date(),
      updatedAt: new Date()
    };

    return await this.update(id, updatedAgent);
  }

  async assignTask(agentId: string, taskId: string): Promise<AIAgent | null> {
    const agent = await this.findById(agentId);
    if (!agent) return null;

    // Check if agent can take more tasks
    if (agent.currentTasks.length >= agent.maxConcurrentTasks) {
      throw new Error(`Agent ${agent.name} is at capacity (${agent.maxConcurrentTasks} tasks)`);
    }

    const updatedAgent = {
      ...agent,
      currentTasks: [...agent.currentTasks, taskId],
      status: 'processing' as const,
      queueDepth: agent.currentTasks.length + 1,
      lastActiveAt: new Date(),
      updatedAt: new Date()
    };

    return await this.update(agentId, updatedAgent);
  }

  async completeTask(agentId: string, taskId: string, success: boolean, duration: number): Promise<AIAgent | null> {
    const agent = await this.findById(agentId);
    if (!agent) return null;

    const currentTasks = agent.currentTasks.filter(id => id !== taskId);
    
    // Update performance metrics
    const totalCompleted = agent.totalTasksCompleted + (success ? 1 : 0);
    const totalFailed = agent.totalTasksFailed + (success ? 0 : 1);
    const totalTasks = totalCompleted + totalFailed;
    
    const newAverageTime = totalTasks === 1 
      ? duration 
      : ((agent.averageProcessingTime * (totalTasks - 1)) + duration) / totalTasks;
    
    const newSuccessRate = totalTasks === 0 ? 0 : (totalCompleted / totalTasks) * 100;

    const updatedAgent = {
      ...agent,
      currentTasks,
      status: currentTasks.length > 0 ? 'processing' as const : 'idle' as const,
      queueDepth: currentTasks.length,
      totalTasksCompleted: totalCompleted,
      totalTasksFailed: totalFailed,
      averageProcessingTime: newAverageTime,
      successRate: newSuccessRate,
      lastActiveAt: new Date(),
      updatedAt: new Date()
    };

    return await this.update(agentId, updatedAgent);
  }

  async findBestAgentForTask(taskType: string, priority: string = 'medium'): Promise<AIAgent | null> {
    const agents = await this.findAvailable();
    
    if (agents.length === 0) {
      // If no agents available, find the least busy one
      const allAgents = await this.findAll();
      const workingAgents = allAgents.filter(a => a.status !== 'error' && a.status !== 'maintenance');
      return workingAgents.sort((a, b) => a.currentTasks.length - b.currentTasks.length)[0] || null;
    }

    // Score agents based on specialty, performance, and availability
    const scoredAgents = agents.map(agent => {
      let score = 50;
      
      // Specialty match
      if (agent.specialty.toLowerCase().includes(taskType.toLowerCase())) {
        score += 30;
      }
      
      // Capability match
      const capabilityMatch = agent.capabilities.some(cap => 
        cap.toLowerCase().includes(taskType.toLowerCase())
      );
      if (capabilityMatch) score += 20;
      
      // Performance boost
      score += agent.successRate * 0.2;
      
      // Prefer faster agents
      if (agent.averageProcessingTime > 0) {
        const avgMinutes = agent.averageProcessingTime / (1000 * 60);
        score -= avgMinutes * 0.1;
      }
      
      // Prefer less busy agents
      score -= agent.currentTasks.length * 5;
      
      // Priority boost for high-performing agents on critical tasks
      if (priority === 'critical' && agent.successRate > 95) {
        score += 15;
      }
      
      return { agent, score };
    });

    scoredAgents.sort((a, b) => b.score - a.score);
    return scoredAgents[0]?.agent || null;
  }

  async getAgentUtilization(): Promise<{
    agentId: string;
    name: string;
    utilization: number; // 0-100 percentage
    efficiency: number;  // tasks/hour
  }[]> {
    const agents = await this.findAll();
    
    return agents.map(agent => {
      const utilization = (agent.currentTasks.length / agent.maxConcurrentTasks) * 100;
      
      // Calculate efficiency as tasks completed per hour
      const avgHours = agent.averageProcessingTime / (1000 * 60 * 60);
      const efficiency = avgHours > 0 ? 1 / avgHours : 0;
      
      return {
        agentId: agent.id,
        name: agent.name,
        utilization,
        efficiency
      };
    });
  }

  async getFleetMetrics(): Promise<{
    totalAgents: number;
    activeAgents: number;
    averageSuccessRate: number;
    totalActiveTasks: number;
    averageProcessingTime: number;
    fleetUtilization: number;
  }> {
    const agents = await this.findAll();
    
    if (agents.length === 0) {
      return {
        totalAgents: 0,
        activeAgents: 0,
        averageSuccessRate: 0,
        totalActiveTasks: 0,
        averageProcessingTime: 0,
        fleetUtilization: 0
      };
    }

    const activeAgents = agents.filter(a => a.status === 'active' || a.status === 'processing');
    const totalSuccessRate = agents.reduce((sum, a) => sum + a.successRate, 0);
    const totalProcessingTime = agents.reduce((sum, a) => sum + a.averageProcessingTime, 0);
    const totalActiveTasks = agents.reduce((sum, a) => sum + a.currentTasks.length, 0);
    const totalCapacity = agents.reduce((sum, a) => sum + a.maxConcurrentTasks, 0);

    return {
      totalAgents: agents.length,
      activeAgents: activeAgents.length,
      averageSuccessRate: totalSuccessRate / agents.length,
      totalActiveTasks,
      averageProcessingTime: totalProcessingTime / agents.length,
      fleetUtilization: totalCapacity > 0 ? (totalActiveTasks / totalCapacity) * 100 : 0
    };
  }

  async scheduleMaintenanceMode(agentId: string, duration: number = 3600000): Promise<AIAgent | null> {
    const agent = await this.findById(agentId);
    if (!agent) return null;

    const updatedAgent = {
      ...agent,
      status: 'maintenance' as const,
      isAvailable: false,
      lastMaintenanceAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.update(agentId, updatedAgent);

    // In production, this would use a job queue instead of setTimeout
    setTimeout(async () => {
      await this.updateStatus(agentId, 'idle');
      const restoredAgent = await this.findById(agentId);
      if (restoredAgent) {
        await this.update(agentId, { ...restoredAgent, isAvailable: true });
      }
    }, duration);

    return result;
  }
}