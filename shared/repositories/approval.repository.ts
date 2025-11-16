/**
 * Approval Repository
 * 
 * Data access layer for approval requests and history.
 * Extends BaseRepository for standard CRUD operations.
 */

import type {
    ApprovalHistoryEntry,
    ApprovalRequest,
    ApprovalStatus,
} from "../types/approval.types.ts";
import { BaseRepository } from "./base-repository.ts";

export class ApprovalRepository extends BaseRepository<ApprovalRequest> {
  constructor(options: { kv: Deno.Kv }) {
    super("approvals", options);
  }

  // Base CRUD operations
  async findById(id: string): Promise<ApprovalRequest | null> {
    return await this.get(["approvals", id]);
  }

  async create(approval: Omit<ApprovalRequest, "id" | "createdAt" | "updatedAt">): Promise<ApprovalRequest> {
    const id = crypto.randomUUID();
    const now = new Date();
    
    const newApproval: ApprovalRequest = {
      ...approval,
      id,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await this.set(["approvals", id], newApproval);
    return newApproval;
  }

  async update(id: string, updates: Partial<Omit<ApprovalRequest, "id" | "createdAt">>): Promise<ApprovalRequest | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: ApprovalRequest = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.set(["approvals", id], updated);
    return updated;
  }

  async deleteApproval(id: string): Promise<boolean> {
    const approval = await this.findById(id);
    if (!approval) return false;

    await this.delete(["approvals", id]);
    return true;
  }

  async findAll(): Promise<ApprovalRequest[]> {
    const result = await this.list(["approvals"]);
    return result.items;
  }

  /**
   * Find approval by task ID
   */
  async findByTaskId(taskId: string): Promise<ApprovalRequest | null> {
    const kv = await this.getKv();
    const entries = kv.list<ApprovalRequest>({ prefix: ["approvals"] });
    
    for await (const entry of entries) {
      if (entry.value.taskId === taskId) {
        return entry.value;
      }
    }
    
    return null;
  }

  /**
   * List approvals assigned to a specific reviewer
   */
  async findByReviewer(
    reviewerId: string,
    status?: ApprovalStatus
  ): Promise<ApprovalRequest[]> {
    const approvals: ApprovalRequest[] = [];
    const kv = await this.getKv();
    const entries = kv.list<ApprovalRequest>({ prefix: ["approvals"] });
    
    for await (const entry of entries) {
      const approval = entry.value;
      if (approval.assignedReviewer === reviewerId) {
        if (!status || approval.status === status) {
          approvals.push(approval);
        }
      }
    }
    
    // Sort by priority (critical > high > medium > low) then by creation date
    const priorityOrder: Record<string, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    
    return approvals.sort((a, b) => {
      const aKey = (a.priority ?? 'medium') as 'critical' | 'high' | 'medium' | 'low';
      const bKey = (b.priority ?? 'medium') as 'critical' | 'high' | 'medium' | 'low';
      const priorityDiff = (priorityOrder[aKey] ?? 2) - (priorityOrder[bKey] ?? 2);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  /**
   * Store approval history entry
   */
  async addHistoryEntry(entry: Omit<ApprovalHistoryEntry, "id">): Promise<ApprovalHistoryEntry> {
    const id = crypto.randomUUID();
    const historyEntry: ApprovalHistoryEntry = { ...entry, id };
    
    const kv = await this.getKv();
    const key = ["approval_history", entry.approvalId, id];
    await kv.set(key, historyEntry);
    
    return historyEntry;
  }

  /**
   * Get approval history
   */
  async getHistory(approvalId: string): Promise<ApprovalHistoryEntry[]> {
    const history: ApprovalHistoryEntry[] = [];
    const kv = await this.getKv();
    const entries = kv.list<ApprovalHistoryEntry>({
      prefix: ["approval_history", approvalId],
    });
    
    for await (const entry of entries) {
      history.push(entry.value);
    }
    
    // Sort by timestamp
    return history.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }
}
