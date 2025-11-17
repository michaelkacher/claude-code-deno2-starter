/**
 * Team Member Repository
 * 
 * Handles data access for team members in the AI-first development workflow.
 * Manages reviewer assignments, workload tracking, and expertise matching.
 */

import { BaseRepository } from "./base-repository.ts";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  expertise: string[]; // e.g., ["backend", "security", "api"]
  workload: number; // 0-100 percentage
  isAvailable: boolean;
  pendingReviews: number;
  completedToday: number;
  averageReviewTime: number; // milliseconds
  
  // Performance tracking
  totalReviewsCompleted: number;
  approvalRate: number; // percentage of reviews that were approved
  averageResponseTime: number; // time to first response
  
  // Availability and scheduling
  timezone: string;
  workingHours: {
    start: string; // "09:00"
    end: string;   // "17:00"
  };
  isOnline: boolean;
  lastSeen: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export class TeamMemberRepository extends BaseRepository<TeamMember> {
  constructor(options?: { kv?: Deno.Kv }) {
    super("team_member", options);
  }

  async findByRole(role: string): Promise<TeamMember[]> {
    const members = await this.findAll();
    return members.filter(member => member.role === role);
  }

  async findByExpertise(expertise: string): Promise<TeamMember[]> {
    const members = await this.findAll();
    return members.filter(member => member.expertise.includes(expertise));
  }

  async findAvailable(): Promise<TeamMember[]> {
    const members = await this.findAll();
    return members.filter(member => member.isAvailable && member.workload < 90);
  }

  async findByWorkloadRange(minWorkload: number, maxWorkload: number): Promise<TeamMember[]> {
    const members = await this.findAll();
    return members.filter(member => 
      member.workload >= minWorkload && member.workload <= maxWorkload
    );
  }

  async updateWorkload(id: string, workload: number): Promise<TeamMember | null> {
    const member = await this.findById(id);
    if (!member) return null;

    const updatedMember = {
      ...member,
      workload: Math.max(0, Math.min(100, workload)),
      updatedAt: new Date()
    };

    await this.update(id, updatedMember);
    return updatedMember;
  }

  async incrementPendingReviews(id: string): Promise<TeamMember | null> {
    const member = await this.findById(id);
    if (!member) return null;

    const updatedMember = {
      ...member,
      pendingReviews: member.pendingReviews + 1,
      updatedAt: new Date()
    };

    await this.update(id, updatedMember);
    return updatedMember;
  }

  async decrementPendingReviews(id: string): Promise<TeamMember | null> {
    const member = await this.findById(id);
    if (!member) return null;

    const updatedMember = {
      ...member,
      pendingReviews: Math.max(0, member.pendingReviews - 1),
      updatedAt: new Date()
    };

    await this.update(id, updatedMember);
    return updatedMember;
  }

  async recordReviewCompletion(id: string, approved: boolean, reviewTime: number): Promise<TeamMember | null> {
    const member = await this.findById(id);
    if (!member) return null;

    // Calculate new averages
    const totalReviews = member.totalReviewsCompleted + 1;
    const newAverageReviewTime = 
      ((member.averageReviewTime * member.totalReviewsCompleted) + reviewTime) / totalReviews;
    
    const approvedCount = Math.floor(member.approvalRate * member.totalReviewsCompleted / 100);
    const newApprovedCount = approved ? approvedCount + 1 : approvedCount;
    const newApprovalRate = (newApprovedCount / totalReviews) * 100;

    const updatedMember = {
      ...member,
      pendingReviews: Math.max(0, member.pendingReviews - 1),
      completedToday: member.completedToday + 1,
      totalReviewsCompleted: totalReviews,
      averageReviewTime: newAverageReviewTime,
      approvalRate: newApprovalRate,
      updatedAt: new Date()
    };

    await this.update(id, updatedMember);
    return updatedMember;
  }

  async resetDailyStats(): Promise<void> {
    const members = await this.findAll();
    
    for (const member of members) {
      const updatedMember = {
        ...member,
        completedToday: 0,
        updatedAt: new Date()
      };
      await this.update(member.id, updatedMember);
    }
  }

  async updateOnlineStatus(id: string, isOnline: boolean): Promise<TeamMember | null> {
    const member = await this.findById(id);
    if (!member) return null;

    const updatedMember = {
      ...member,
      isOnline,
      lastSeen: new Date(),
      updatedAt: new Date()
    };

    await this.update(id, updatedMember);
    return updatedMember;
  }

  async findBestReviewerForTask(expertise: string, priority: string = 'medium'): Promise<TeamMember | null> {
    const members = await this.findByExpertise(expertise);
    const availableMembers = members.filter(member => 
      member.isAvailable && member.workload < 85
    );

    if (availableMembers.length === 0) {
      // If no one is available, find the least busy expert
      return members.sort((a, b) => a.workload - b.workload)[0] || null;
    }

    // Score members based on expertise, workload, and performance
    const scoredMembers = availableMembers.map(member => {
      let score = 100;
      
      // Prefer lower workload
      score -= member.workload * 0.5;
      
      // Prefer faster review times
      if (member.averageReviewTime > 0) {
        const avgHours = member.averageReviewTime / (1000 * 60 * 60);
        score -= avgHours * 2;
      }
      
      // Prefer higher approval rate
      score += member.approvalRate * 0.2;
      
      // Boost for critical tasks if member has high approval rate
      if (priority === 'critical' && member.approvalRate > 90) {
        score += 15;
      }
      
      return { member, score };
    });

    scoredMembers.sort((a, b) => b.score - a.score);
    return scoredMembers[0]?.member || null;
  }

  async getTeamPerformanceMetrics(): Promise<{
    averageWorkload: number;
    totalPendingReviews: number;
    averageApprovalRate: number;
    averageResponseTime: number;
    activeMembers: number;
  }> {
    const members = await this.findAll();
    
    if (members.length === 0) {
      return {
        averageWorkload: 0,
        totalPendingReviews: 0,
        averageApprovalRate: 0,
        averageResponseTime: 0,
        activeMembers: 0
      };
    }

    const totalWorkload = members.reduce((sum, m) => sum + m.workload, 0);
    const totalPendingReviews = members.reduce((sum, m) => sum + m.pendingReviews, 0);
    const totalApprovalRate = members.reduce((sum, m) => sum + m.approvalRate, 0);
    const totalResponseTime = members.reduce((sum, m) => sum + m.averageResponseTime, 0);
    const activeMembers = members.filter(m => m.isAvailable).length;

    return {
      averageWorkload: totalWorkload / members.length,
      totalPendingReviews,
      averageApprovalRate: totalApprovalRate / members.length,
      averageResponseTime: totalResponseTime / members.length,
      activeMembers
    };
  }

  async getWorkloadDistribution(): Promise<{
    underloaded: TeamMember[]; // < 50%
    normal: TeamMember[];      // 50-80%
    overloaded: TeamMember[];  // > 80%
  }> {
    const members = await this.findAll();
    
    return {
      underloaded: members.filter(m => m.workload < 50),
      normal: members.filter(m => m.workload >= 50 && m.workload <= 80),
      overloaded: members.filter(m => m.workload > 80)
    };
  }
}