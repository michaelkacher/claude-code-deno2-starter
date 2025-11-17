/**
 * Team Member Repository
 * 
 * Handles data access for team members in the development workflow.
 * Manages workload tracking, expertise matching, and performance metrics.
 */

import { BaseRepository } from "./base-repository.ts";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'developer' | 'reviewer' | 'tech_lead' | 'product_manager' | 'qa' | 'designer';
  
  // Skills and expertise
  expertise: string[]; // e.g., ["TypeScript", "React", "Deno", "AI/ML"]
  proficiencyLevel: 'junior' | 'mid' | 'senior' | 'expert';
  
  // Workload management
  currentWorkload: number; // 0-100 percentage
  maxCapacity: number; // Maximum concurrent tasks
  activeTaskIds: string[];
  
  // Availability
  isAvailable: boolean;
  timeZone: string;
  workingHours: {
    start: string; // "09:00"
    end: string;   // "17:00"
  };
  
  // Performance metrics
  averageReviewTime: number; // milliseconds
  tasksCompleted: number;
  tasksReviewed: number;
  qualityScore: number; // 0-100 based on peer reviews
  
  // Collaboration
  preferredCollaborators: string[]; // Team member IDs
  mentoring: string[]; // Team member IDs they mentor
  
  // Scheduling
  lastActiveAt: Date;
  onLeave?: {
    startDate: Date;
    endDate: Date;
    reason: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkloadDistribution {
  memberId: string;
  name: string;
  currentTasks: number;
  capacity: number;
  utilization: number; // percentage
  availability: 'available' | 'busy' | 'overloaded' | 'unavailable';
}

export interface ExpertiseMatch {
  memberId: string;
  name: string;
  matchScore: number; // 0-100 how well they match the required skills
  availability: number; // 0-100 how available they are
  overallScore: number; // Combined score for ranking
}

export class TeamMemberRepository extends BaseRepository<TeamMember> {
  constructor(options?: { kv?: Deno.Kv }) {
    super("team_member", options);
  }

  // Base CRUD operations
  async findById(id: string): Promise<TeamMember | null> {
    return await this.get(["team_members", id]);
  }

  async create(member: Omit<TeamMember, "id" | "createdAt" | "updatedAt">): Promise<TeamMember> {
    const id = crypto.randomUUID();
    const now = new Date();
    
    const newMember: TeamMember = {
      ...member,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await this.set(["team_members", id], newMember);
    return newMember;
  }

  async update(id: string, updates: Partial<Omit<TeamMember, "id" | "createdAt">>): Promise<TeamMember | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: TeamMember = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    await this.set(["team_members", id], updated);
    return updated;
  }

  async deleteMember(id: string): Promise<boolean> {
    const member = await this.findById(id);
    if (!member) return false;

    await this.delete(["team_members", id]);
    return true;
  }

  async findAll(): Promise<TeamMember[]> {
    const result = await this.list(["team_members"]);
    return result.items;
  }

  // Specialized query methods
  async findByRole(role: TeamMember['role']): Promise<TeamMember[]> {
    const members = await this.findAll();
    return members.filter(member => member.role === role);
  }

  async findByExpertise(skill: string): Promise<TeamMember[]> {
    const members = await this.findAll();
    return members.filter(member => 
      member.expertise.some(exp => 
        exp.toLowerCase().includes(skill.toLowerCase())
      )
    );
  }

  async findAvailableMembers(): Promise<TeamMember[]> {
    const members = await this.findAll();
    const now = new Date();
    
    return members.filter(member => {
      // Check if available
      if (!member.isAvailable) return false;
      
      // Check if on leave
      if (member.onLeave) {
        const { startDate, endDate } = member.onLeave;
        if (now >= startDate && now <= endDate) return false;
      }
      
      // Check current workload
      return member.currentWorkload < 90; // Less than 90% capacity
    });
  }

  async findMembersWithCapacity(requiredCapacity: number = 1): Promise<TeamMember[]> {
    const members = await this.findAvailableMembers();
    return members.filter(member => 
      member.activeTaskIds.length + requiredCapacity <= member.maxCapacity
    );
  }

  async getWorkloadDistribution(): Promise<WorkloadDistribution[]> {
    const members = await this.findAll();
    
    return members.map(member => {
      const utilization = (member.activeTaskIds.length / member.maxCapacity) * 100;
      
      let availability: WorkloadDistribution['availability'];
      if (!member.isAvailable || member.onLeave) {
        availability = 'unavailable';
      } else if (utilization >= 100) {
        availability = 'overloaded';
      } else if (utilization >= 80) {
        availability = 'busy';
      } else {
        availability = 'available';
      }

      return {
        memberId: member.id,
        name: member.name,
        currentTasks: member.activeTaskIds.length,
        capacity: member.maxCapacity,
        utilization: Math.round(utilization),
        availability
      };
    });
  }

  async findBestReviewer(requiredSkills: string[], excludeIds: string[] = []): Promise<ExpertiseMatch[]> {
    const members = await this.findAvailableMembers();
    const eligibleMembers = members.filter(member => 
      !excludeIds.includes(member.id) &&
      (member.role === 'reviewer' || member.role === 'tech_lead' || member.role === 'senior')
    );

    const matches: ExpertiseMatch[] = eligibleMembers.map(member => {
      // Calculate skill match score
      const memberSkills = member.expertise.map(skill => skill.toLowerCase());
      const requiredSkillsLower = requiredSkills.map(skill => skill.toLowerCase());
      
      const matchedSkills = requiredSkillsLower.filter(skill => 
        memberSkills.some(memberSkill => memberSkill.includes(skill))
      );
      
      const matchScore = requiredSkills.length > 0 
        ? (matchedSkills.length / requiredSkills.length) * 100 
        : 100;

      // Calculate availability score
      const utilizationScore = 100 - member.currentWorkload;
      const capacityScore = member.maxCapacity > member.activeTaskIds.length ? 100 : 0;
      const availability = (utilizationScore + capacityScore) / 2;

      // Combined score with weights
      const overallScore = (matchScore * 0.7) + (availability * 0.3);

      return {
        memberId: member.id,
        name: member.name,
        matchScore: Math.round(matchScore),
        availability: Math.round(availability),
        overallScore: Math.round(overallScore)
      };
    });

    // Sort by overall score descending
    return matches.sort((a, b) => b.overallScore - a.overallScore);
  }

  async assignTask(memberId: string, taskId: string): Promise<TeamMember | null> {
    const member = await this.findById(memberId);
    if (!member) return null;

    // Check capacity
    if (member.activeTaskIds.length >= member.maxCapacity) {
      throw new Error(`Team member ${member.name} is at capacity`);
    }

    const updatedMember = {
      ...member,
      activeTaskIds: [...member.activeTaskIds, taskId],
      currentWorkload: Math.min(100, member.currentWorkload + (100 / member.maxCapacity)),
      lastActiveAt: new Date(),
      updatedAt: new Date()
    };

    return await this.update(memberId, updatedMember);
  }

  async completeTask(memberId: string, taskId: string, qualityScore?: number): Promise<TeamMember | null> {
    const member = await this.findById(memberId);
    if (!member) return null;

    const activeTaskIds = member.activeTaskIds.filter(id => id !== taskId);
    const workloadReduction = 100 / member.maxCapacity;
    
    let updatedQualityScore = member.qualityScore;
    if (qualityScore !== undefined) {
      // Update quality score as rolling average
      const totalTasks = member.tasksCompleted + member.tasksReviewed;
      if (totalTasks > 0) {
        updatedQualityScore = ((member.qualityScore * totalTasks) + qualityScore) / (totalTasks + 1);
      } else {
        updatedQualityScore = qualityScore;
      }
    }

    const updatedMember = {
      ...member,
      activeTaskIds,
      currentWorkload: Math.max(0, member.currentWorkload - workloadReduction),
      tasksCompleted: member.tasksCompleted + 1,
      qualityScore: Math.round(updatedQualityScore),
      lastActiveAt: new Date(),
      updatedAt: new Date()
    };

    return await this.update(memberId, updatedMember);
  }

  async updateExpertise(memberId: string, newExpertise: string[]): Promise<TeamMember | null> {
    return await this.update(memberId, { 
      expertise: newExpertise,
      updatedAt: new Date()
    });
  }

  async setOnLeave(memberId: string, startDate: Date, endDate: Date, reason: string): Promise<TeamMember | null> {
    return await this.update(memberId, {
      onLeave: { startDate, endDate, reason },
      isAvailable: false,
      updatedAt: new Date()
    });
  }

  async returnFromLeave(memberId: string): Promise<TeamMember | null> {
    return await this.update(memberId, {
      onLeave: undefined,
      isAvailable: true,
      updatedAt: new Date()
    });
  }

  async getPerformanceMetrics(timeframe: string = '30d'): Promise<{
    memberId: string;
    name: string;
    tasksCompleted: number;
    averageReviewTime: number;
    qualityScore: number;
    utilizationRate: number;
  }[]> {
    const members = await this.findAll();
    
    return members.map(member => ({
      memberId: member.id,
      name: member.name,
      tasksCompleted: member.tasksCompleted,
      averageReviewTime: member.averageReviewTime,
      qualityScore: member.qualityScore,
      utilizationRate: member.currentWorkload
    }));
  }

  async getMentorshipNetwork(): Promise<{
    mentorId: string;
    mentorName: string;
    mentees: Array<{ id: string; name: string; }>;
  }[]> {
    const members = await this.findAll();
    
    return members
      .filter(member => member.mentoring.length > 0)
      .map(mentor => ({
        mentorId: mentor.id,
        mentorName: mentor.name,
        mentees: mentor.mentoring.map(menteeId => {
          const mentee = members.find(m => m.id === menteeId);
          return {
            id: menteeId,
            name: mentee?.name || 'Unknown'
          };
        })
      }));
  }

  async getTeamUtilization(): Promise<{
    totalMembers: number;
    activeMembers: number;
    averageUtilization: number;
    overloadedMembers: number;
    availableCapacity: number;
  }> {
    const workload = await this.getWorkloadDistribution();
    
    const activeMembers = workload.filter(w => w.availability !== 'unavailable').length;
    const totalUtilization = workload.reduce((sum, w) => sum + w.utilization, 0);
    const averageUtilization = workload.length > 0 ? totalUtilization / workload.length : 0;
    const overloadedMembers = workload.filter(w => w.availability === 'overloaded').length;
    
    const totalCapacity = workload.reduce((sum, w) => sum + w.capacity, 0);
    const usedCapacity = workload.reduce((sum, w) => sum + w.currentTasks, 0);
    const availableCapacity = totalCapacity - usedCapacity;
    
    return {
      totalMembers: workload.length,
      activeMembers,
      averageUtilization: Math.round(averageUtilization),
      overloadedMembers,
      availableCapacity
    };
  }

  async suggestTaskReassignment(): Promise<Array<{
    overloadedMember: string;
    suggestedReassignments: Array<{
      taskId: string;
      targetMember: string;
      reason: string;
    }>;
  }>> {
    const workload = await this.getWorkloadDistribution();
    const overloadedMembers = workload.filter(w => w.utilization > 90);
    const availableMembers = workload.filter(w => w.utilization < 70 && w.availability === 'available');
    
    const suggestions: Array<{
      overloadedMember: string;
      suggestedReassignments: Array<{
        taskId: string;
        targetMember: string;
        reason: string;
      }>;
    }> = [];
    
    for (const overloaded of overloadedMembers) {
      const member = await this.findById(overloaded.memberId);
      if (!member) continue;
      
      const reassignments: Array<{
        taskId: string;
        targetMember: string;
        reason: string;
      }> = [];
      
      // For each task, find best available member
      for (const taskId of member.activeTaskIds.slice(-2)) { // Last 2 tasks
        const bestMatch = availableMembers
          .sort((a, b) => a.utilization - b.utilization)[0];
          
        if (bestMatch) {
          reassignments.push({
            taskId,
            targetMember: bestMatch.name,
            reason: `Reduce workload from ${overloaded.utilization}% to ~${overloaded.utilization - 20}%`
          });
        }
      }
      
      if (reassignments.length > 0) {
        suggestions.push({
          overloadedMember: overloaded.name,
          suggestedReassignments: reassignments
        });
      }
    }
    
    return suggestions;
  }
}