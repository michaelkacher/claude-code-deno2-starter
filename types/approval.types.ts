/**
 * Approval Gate Type Definitions
 * 
 * Types for the human approval workflow feature where team members
 * review and approve AI-generated requirements and test logic.
 */

/**
 * Approval request status
 */
export type ApprovalStatus = "pending" | "approved" | "rejected" | "changes_requested";

/**
 * Type of content being approved
 */
export type ApprovalType = "requirements" | "tests" | "both";

/**
 * Task priority levels
 */
export type Priority = "critical" | "high" | "medium" | "low";

/**
 * Approval decision types
 */
export type ApprovalDecision = "approve" | "reject" | "request_changes";

/**
 * Main approval request entity
 */
export interface ApprovalRequest {
  id: string;
  taskId: string; // Reference to related task
  type: ApprovalType; // What needs approval
  status: ApprovalStatus;
  priority: Priority;
  
  // Content to review
  originalRequirements: string;
  aiGeneratedRequirements: string;
  aiGeneratedTests?: string;
  
  // AI process info
  aiAgent: string; // Which AI agent generated this
  confidenceScore?: number; // AI's confidence (0-100)
  
  // Reviewer assignment
  assignedReviewer: string; // userId
  assignedBy: string; // Who assigned the reviewer
  assignedAt: string; // ISO timestamp
  
  // Decision tracking
  decision?: ApprovalDecision;
  feedback?: string;
  suggestions?: string[];
  decidedAt?: string;
  decidedBy?: string;
  
  // Metadata
  createdBy: string; // Usually the AI system
  createdAt: string;
  updatedAt: string;
  
  // Timeline
  dueDate?: string; // When review should be complete
  reviewStartedAt?: string; // When reviewer first viewed
}

/**
 * Data for creating a new approval request
 */
export interface CreateApprovalData {
  taskId: string;
  type: ApprovalType;
  // Alias maintained for backward compatibility with older tests/payloads
  approvalType?: ApprovalType; // deprecated: use `type`
  priority: Priority;
  originalRequirements: string;
  aiGeneratedRequirements: string;
  aiGeneratedTests?: string;
  aiAgent: string;
  confidenceScore?: number;
  assignedReviewer: string;
  assignedBy: string;
  createdBy: string; // Actor creating the approval (could be system or user)
  dueDate?: string;
}

// Legacy payload shape (backward compatibility for existing tests)
export interface LegacyCreateApprovalPayload {
  taskId: string;
  approvalType?: ApprovalType; // legacy alias
  originalRequirements: string;
  aiGeneratedRequirements: string;
  originalTests?: string; // unused now
  aiGeneratedTests?: string;
  assignedReviewer: string;
  priority?: Priority;
  context?: string; // legacy free-form context
  createdBy: string;
}

/**
 * Data for submitting an approval decision
 */
export interface SubmitDecisionData {
  decision: ApprovalDecision;
  feedback: string;
  suggestions?: string[];
}

/**
 * Filters for listing approvals
 */
export interface ApprovalFilters {
  status?: ApprovalStatus;
  assignedTo?: string;
  priority?: Priority;
  limit?: number;
  offset?: number;
}

/**
 * Approval history entry for audit trail
 */
export type ApprovalHistoryAction =
  | "created"
  | "assigned"
  | "reviewer_assigned"
  | "review_started"
  | "approved"
  | "rejected"
  | "changes_requested";

export interface ApprovalHistoryEntry {
  id: string;
  approvalId: string;
  action: ApprovalHistoryAction;
  actorId: string; // userId or "system"
  timestamp: string;
  details: ApprovalHistoryDetails;
}

export interface ApprovalHistoryDetails {
  note?: string;
  previousValue?: unknown;
  newValue?: unknown;
  previousReviewer?: string;
  newReviewer?: string;
  reason?: string;
  feedback?: string;
  suggestions?: string[];
}

// Zod Schemas (single source of truth for validation & generation)
import { z } from "zod";

export const approvalDecisionSchema = z.enum([
  "approve",
  "reject",
  "request_changes",
]);

export const approvalStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "changes_requested",
]);

export const approvalTypeSchema = z.enum(["requirements", "tests", "both"]);
export const prioritySchema = z.enum(["critical", "high", "medium", "low"]);

export const approvalHistoryActionSchema = z.enum([
  "created",
  "assigned",
  "reviewer_assigned",
  "review_started",
  "approved",
  "rejected",
  "changes_requested",
]);

export const approvalHistoryDetailsSchema = z.object({
  note: z.string().optional(),
  previousValue: z.unknown().optional(),
  newValue: z.unknown().optional(),
  previousReviewer: z.string().optional(),
  newReviewer: z.string().optional(),
  reason: z.string().optional(),
  feedback: z.string().optional(),
  suggestions: z.array(z.string()).optional(),
});

export const approvalHistoryEntrySchema = z.object({
  id: z.string().uuid(),
  approvalId: z.string().uuid(),
  action: approvalHistoryActionSchema,
  actorId: z.string(),
  timestamp: z.string(),
  details: approvalHistoryDetailsSchema,
});

export const createApprovalDataSchema = z.object({
  taskId: z.string(),
  type: approvalTypeSchema,
  approvalType: approvalTypeSchema.optional(),
  priority: prioritySchema,
  originalRequirements: z.string().min(1),
  aiGeneratedRequirements: z.string().min(1),
  aiGeneratedTests: z.string().optional(),
  aiAgent: z.string(),
  confidenceScore: z.number().min(0).max(100).optional(),
  assignedReviewer: z.string(),
  assignedBy: z.string(),
  createdBy: z.string(),
  dueDate: z.string().optional(),
});

export function normalizeCreateApproval(data: CreateApprovalData): CreateApprovalData {
  // Prefer explicit type; fall back to deprecated approvalType
  if (!data.type && data.approvalType) {
    (data as any).type = data.approvalType;
  }
  return data;
}

export function upgradeLegacyCreateApproval(data: LegacyCreateApprovalPayload | CreateApprovalData): CreateApprovalData {
  if ((data as any).type || (data as any).approvalType) {
    // Already close to new shape
    const base: any = {
      taskId: (data as any).taskId,
      type: (data as any).type || (data as any).approvalType,
      priority: (data as any).priority || 'medium',
      originalRequirements: (data as any).originalRequirements,
      aiGeneratedRequirements: (data as any).aiGeneratedRequirements,
      aiGeneratedTests: (data as any).aiGeneratedTests,
      aiAgent: (data as any).aiAgent || 'system',
      confidenceScore: (data as any).confidenceScore,
      assignedReviewer: (data as any).assignedReviewer,
      assignedBy: (data as any).assignedBy || (data as any).createdBy,
      createdBy: (data as any).createdBy,
      dueDate: (data as any).dueDate,
      approvalType: (data as any).approvalType,
    };
    return base as CreateApprovalData;
  }
  throw new Error('Invalid approval creation payload');
}

export const submitDecisionDataSchema = z.object({
  decision: approvalDecisionSchema,
  feedback: z.string().min(1),
  suggestions: z.array(z.string()).optional(),
});

/**
 * Update data for approval request (partial)
 */
export interface UpdateApprovalData {
  assignedReviewer?: string;
  assignedBy?: string;
  status?: ApprovalStatus;
  decision?: ApprovalDecision;
  feedback?: string;
  suggestions?: string[];
  decidedAt?: string;
  decidedBy?: string;
  reviewStartedAt?: string;
}
