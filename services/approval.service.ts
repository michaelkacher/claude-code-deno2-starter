/**
 * Approval Service
 * 
 * Business logic for the approval gate feature.
 * Handles validation, authorization, and approval workflow.
 */

import { ApprovalRepository } from "../repositories/approval.repository.ts";
import type {
  ApprovalFilters,
  ApprovalHistoryEntry,
  ApprovalRequest,
  CreateApprovalData,
  LegacyCreateApprovalPayload,
  SubmitDecisionData,
} from "../types/approval.types.ts";
import { normalizeCreateApproval, upgradeLegacyCreateApproval } from "../types/approval.types.ts";
import { buildError } from "./approval/errors.ts";

export class ApprovalService {
  private repository: ApprovalRepository;

  constructor(kv: Deno.Kv) {
    this.repository = new ApprovalRepository({ kv });
  }

  /**
   * Create a new approval request with validation
   */
  async createApprovalRequest(
    data: CreateApprovalData | LegacyCreateApprovalPayload
  ): Promise<ApprovalRequest> {
  // Backward compatibility normalization (approvalType alias)
    const upgraded = upgradeLegacyCreateApproval(data as any);
    const dataNorm = normalizeCreateApproval(upgraded);

  // Validate required fields
    if (!dataNorm.originalRequirements || dataNorm.originalRequirements.trim() === "") {
      throw buildError('APPROVAL_ORIGINAL_REQ_REQUIRED');
    }

    if (!dataNorm.aiGeneratedRequirements || dataNorm.aiGeneratedRequirements.trim() === "") {
      throw buildError('APPROVAL_AI_REQ_REQUIRED');
    }

    if (!dataNorm.assignedReviewer || dataNorm.assignedReviewer.trim() === "") {
      throw buildError('APPROVAL_ASSIGNED_REVIEWER_REQUIRED');
    }

    // Check for duplicate approval for this task
  const existing = await this.repository.findByTaskId(dataNorm.taskId);
    if (existing) {
      throw buildError('APPROVAL_DUPLICATE_TASK', data.taskId);
    }

    const now = new Date();

    // Create approval request in repository
    // Provide sensible fallbacks for fields that older payloads may omit
  const aiAgent = dataNorm.aiAgent || "system";
  const assignedBy = dataNorm.assignedBy || dataNorm.createdBy;

    // Build create payload without undefined optional fields (for exactOptionalPropertyTypes)
    const createPayload: any = {
      taskId: dataNorm.taskId,
      type: dataNorm.type,
      status: "pending",
      priority: dataNorm.priority,
      originalRequirements: dataNorm.originalRequirements.trim(),
      aiGeneratedRequirements: dataNorm.aiGeneratedRequirements.trim(),
      aiAgent,
      confidenceScore: dataNorm.confidenceScore,
      assignedReviewer: dataNorm.assignedReviewer,
      assignedBy,
      assignedAt: now.toISOString(),
      createdBy: dataNorm.createdBy,
      dueDate: dataNorm.dueDate,
    };
    if (dataNorm.aiGeneratedTests && dataNorm.aiGeneratedTests.trim()) {
      createPayload.aiGeneratedTests = dataNorm.aiGeneratedTests.trim();
    }
    const repoApproval = await this.repository.create(createPayload);

    // Record history entry
    await this.repository.addHistoryEntry({
      approvalId: repoApproval.id,
      action: "created",
  actorId: data.createdBy,
      timestamp: now.toISOString(),
      details: {
        note: "Approval request created",
      },
    });

    return repoApproval;
  }

  /**
   * Get approval by ID (with authorization check)
   */
  async getApprovalById(id: string, userId: string): Promise<ApprovalRequest | null> {
    const approval = await this.repository.findById(id);
    
    if (!approval) {
      return null;
    }

    // Authorization: only reviewer or creator can view
    if (approval.assignedReviewer !== userId && approval.createdBy !== userId) {
      return null;
    }

    return approval;
  }

  /**
   * List approvals with filters
   */
  async listApprovals(filters: ApprovalFilters): Promise<ApprovalRequest[]> {
    if (filters.assignedTo) {
      return await this.repository.findByReviewer(
        filters.assignedTo,
        filters.status
      );
    }

    // If no assignedTo filter, return empty (for security)
    // In real implementation, might allow admins to see all
    return [];
  }

  /**
   * Submit approval decision
   */
  async submitDecision(
    id: string,
    data: SubmitDecisionData,
    userId: string
  ): Promise<ApprovalRequest> {
    const approval = await this.repository.findById(id);
    
    if (!approval) {
      throw buildError('APPROVAL_NOT_FOUND');
    }

    // Authorization check
    if (approval.assignedReviewer !== userId) {
      throw buildError('APPROVAL_UNAUTHORIZED_REVIEWER');
    }

    // Check if already decided
    if (approval.status !== "pending") {
      throw buildError('APPROVAL_ALREADY_DECIDED');
    }

    // Validate feedback requirements
    if ((data.decision === "reject" || data.decision === "request_changes") &&
        (!data.feedback || data.feedback.trim() === "")) {
      // Use generic message for test expectations
      throw buildError('APPROVAL_FEEDBACK_REQUIRED');
    }

    const now = new Date();

    // Map decision to status
    const statusMap = {
      approve: "approved" as const,
      reject: "rejected" as const,
      request_changes: "changes_requested" as const,
    };

    // Update approval
    const updatePayload: any = {
      status: statusMap[data.decision],
      decision: data.decision,
      feedback: data.feedback,
      decidedAt: now.toISOString(),
      decidedBy: userId,
      updatedAt: now.toISOString(),
    };
    if (data.suggestions) updatePayload.suggestions = data.suggestions;
    const updated = await this.repository.update(id, updatePayload);

    if (!updated) {
      throw buildError('APPROVAL_UPDATE_FAILED');
    }

    // Record history entry
    const decisionDetails: any = { feedback: data.feedback };
    if (data.suggestions) decisionDetails.suggestions = data.suggestions;
    await this.repository.addHistoryEntry({
      approvalId: id,
      action: statusMap[data.decision],
      actorId: userId,
      timestamp: now.toISOString(),
      details: decisionDetails,
    });

    return updated;
  }

  /**
   * Assign or reassign reviewer
   */
  async assignReviewer(
    id: string,
    reviewerId: string,
    userId: string,
    reason?: string
  ): Promise<ApprovalRequest | null> {
    const approval = await this.repository.findById(id);
    
    if (!approval) {
      return null;
    }

    // Authorization: only creator can reassign
    if (approval.createdBy !== userId) {
      throw buildError('APPROVAL_CREATOR_ONLY_REASSIGN');
    }

    const now = new Date();
    const previousReviewer = approval.assignedReviewer;

    const updated = await this.repository.update(id, {
      assignedReviewer: reviewerId,
      assignedBy: userId,
      updatedAt: now.toISOString(),
    });

    if (!updated) {
      return null;
    }

    // Record history entry
    const reassignmentDetails: any = { previousReviewer, newReviewer: reviewerId };
    if (reason) reassignmentDetails.reason = reason;
    await this.repository.addHistoryEntry({
      approvalId: id,
      action: "reviewer_assigned",
      actorId: userId,
      timestamp: now.toISOString(),
      details: reassignmentDetails,
    });

    return updated;
  }

  /**
   * Get approval history
   */
  async getApprovalHistory(id: string): Promise<ApprovalHistoryEntry[]> {
    return await this.repository.getHistory(id);
  }
}
