/**
 * Approval Service Tests (TDD Red Phase)
 * 
 * Tests the business logic for the approval gate feature.
 * Following updated test-writer-agent guidance:
 * - Focus on service layer (business logic)
 * - Repository will be created and will extend BaseRepository
 * - Use --unstable-kv flag when running
 */

import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { ApprovalService } from "../../../shared/services/approval.service.ts";
import type {
    CreateApprovalData,
    SubmitDecisionData
} from "../../../shared/types/approval.types.ts";
import { setupTestKv } from "../../helpers/kv-test.ts";

describe("ApprovalService", () => {
  let kv: Deno.Kv;
  let cleanup: () => Promise<void>;
  let service: ApprovalService;
  const userId = "user-123";
  const reviewerId = "reviewer-456";
  const taskId = "task-789";

  beforeEach(async () => {
    const setup = await setupTestKv();
    kv = setup.kv;
    cleanup = setup.cleanup;
    service = new ApprovalService(kv);
  });

  afterEach(async () => {
    await cleanup();
  });

  describe("createApprovalRequest", () => {
    it("should create approval request successfully", async () => {
      const data: CreateApprovalData = {
        taskId,
        type: "requirements",
        priority: "high",
        originalRequirements: "Original requirements text",
        aiGeneratedRequirements: "AI-generated requirements text",
        assignedReviewer: reviewerId,
        assignedBy: userId,
        aiAgent: "alpha-1",
      };

      const approval = await service.createApprovalRequest(data, userId);

      assertExists(approval.id);
      assertEquals(approval.taskId, taskId);
      assertEquals(approval.type, "requirements");
      assertEquals(approval.status, "pending");
      assertEquals(approval.assignedReviewer, reviewerId);
      assertEquals(approval.createdBy, userId);
      assertExists(approval.createdAt);
      assertExists(approval.updatedAt);
    });

    it("should reject approval with missing originalRequirements", async () => {
      const data: CreateApprovalData = {
        taskId,
        type: "requirements",
        priority: "high",
        originalRequirements: "",
        aiGeneratedRequirements: "AI-generated requirements",
        assignedReviewer: reviewerId,
        assignedBy: userId,
        aiAgent: "alpha-1",
      };

      await assertRejects(
        () => service.createApprovalRequest(data, userId),
        Error,
        "Original requirements are required"
      );
    });

    it("should reject approval with missing aiGeneratedRequirements", async () => {
      const data: CreateApprovalData = {
        taskId,
        type: "requirements",
        priority: "high",
        originalRequirements: "Original requirements",
        aiGeneratedRequirements: "",
        assignedReviewer: reviewerId,
        assignedBy: userId,
        aiAgent: "alpha-1",
      };

      await assertRejects(
        () => service.createApprovalRequest(data, userId),
        Error,
        "AI-generated requirements are required"
      );
    });

    it("should reject approval with missing assignedReviewer", async () => {
      const data: CreateApprovalData = {
        taskId,
        type: "requirements",
        priority: "high",
        originalRequirements: "Original requirements",
        aiGeneratedRequirements: "AI-generated requirements",
        assignedReviewer: "",
        assignedBy: userId,
        aiAgent: "alpha-1",
      };

      await assertRejects(
        () => service.createApprovalRequest(data, userId),
        Error,
        "Assigned reviewer is required"
      );
    });

    it("should create approval with tests included", async () => {
      const data: CreateApprovalData = {
        taskId,
        type: "both",
        priority: "critical",
        originalRequirements: "Original requirements",
        aiGeneratedRequirements: "AI-generated requirements",
        aiGeneratedTests: "AI-generated test specifications",
        assignedReviewer: reviewerId,
        assignedBy: userId,
        aiAgent: "alpha-1",
        confidenceScore: 95,
      };

      const approval = await service.createApprovalRequest(data, userId);

      assertEquals(approval.type, "both");
      assertEquals(approval.aiGeneratedTests, "AI-generated test specifications");
      assertEquals(approval.confidenceScore, 95);
    });

    it("should prevent duplicate approval for same task", async () => {
      const data: CreateApprovalData = {
        taskId,
        type: "requirements",
        priority: "high",
        originalRequirements: "Original requirements",
        aiGeneratedRequirements: "AI-generated requirements",
        assignedReviewer: reviewerId,
        assignedBy: userId,
        aiAgent: "alpha-1",
      };

      await service.createApprovalRequest(data, userId);

      await assertRejects(
        () => service.createApprovalRequest(data, userId),
        Error,
        "Approval request already exists for this task"
      );
    });
  });

  describe("getApprovalById", () => {
    it("should retrieve existing approval", async () => {
      const data: CreateApprovalData = {
        taskId,
        type: "requirements",
        priority: "high",
        originalRequirements: "Original requirements",
        aiGeneratedRequirements: "AI-generated requirements",
        assignedReviewer: reviewerId,
        assignedBy: userId,
        aiAgent: "alpha-1",
      };

      const created = await service.createApprovalRequest(data, userId);
      const retrieved = await service.getApprovalById(created.id, reviewerId);

      assertExists(retrieved);
      assertEquals(retrieved!.id, created.id);
      assertEquals(retrieved!.taskId, taskId);
    });

    it("should return null for non-existent approval", async () => {
      const result = await service.getApprovalById("non-existent", reviewerId);
      assertEquals(result, null);
    });

    it("should enforce authorization (only reviewer or creator can view)", async () => {
      const data: CreateApprovalData = {
        taskId,
        type: "requirements",
        priority: "high",
        originalRequirements: "Original requirements",
        aiGeneratedRequirements: "AI-generated requirements",
        assignedReviewer: reviewerId,
        assignedBy: userId,
        aiAgent: "alpha-1",
      };

      const created = await service.createApprovalRequest(data, userId);
      
      // Different user (not reviewer or creator)
      const result = await service.getApprovalById(created.id, "other-user");
      assertEquals(result, null);
    });
  });

  describe("listApprovals", () => {
    it("should return empty array when no approvals exist", async () => {
      const result = await service.listApprovals({ assignedTo: reviewerId });
      assertEquals(result.length, 0);
    });

    it("should list all approvals for a reviewer", async () => {
      const data1: CreateApprovalData = {
        taskId: "task-1",
        type: "requirements",
        priority: "high",
        originalRequirements: "Requirements 1",
        aiGeneratedRequirements: "AI Requirements 1",
        assignedReviewer: reviewerId,
        assignedBy: userId,
        aiAgent: "alpha-1",
      };

      const data2: CreateApprovalData = {
        taskId: "task-2",
        type: "tests",
        priority: "medium",
        originalRequirements: "Requirements 2",
        aiGeneratedRequirements: "AI Requirements 2",
        assignedReviewer: reviewerId,
        assignedBy: userId,
        aiAgent: "alpha-1",
      };

      await service.createApprovalRequest(data1, userId);
      await service.createApprovalRequest(data2, userId);

      const result = await service.listApprovals({ assignedTo: reviewerId });
      assertEquals(result.length, 2);
    });

    it("should filter approvals by status", async () => {
      const data1: CreateApprovalData = {
        taskId: "task-1",
        type: "requirements",
        priority: "high",
        originalRequirements: "Requirements 1",
        aiGeneratedRequirements: "AI Requirements 1",
        assignedReviewer: reviewerId,
        assignedBy: userId,
        aiAgent: "alpha-1",
      };

      const approval = await service.createApprovalRequest(data1, userId);

      // Approve it
      await service.submitDecision(
        approval.id,
        { decision: "approve", feedback: "Looks good" },
        reviewerId
      );

      const pending = await service.listApprovals({ 
        assignedTo: reviewerId,
        status: "pending" 
      });
      assertEquals(pending.length, 0);

      const approved = await service.listApprovals({ 
        assignedTo: reviewerId,
        status: "approved" 
      });
      assertEquals(approved.length, 1);
    });

    it("should only list approvals for specified reviewer", async () => {
      const data1: CreateApprovalData = {
        taskId: "task-1",
        type: "requirements",
        priority: "high",
        originalRequirements: "Requirements 1",
        aiGeneratedRequirements: "AI Requirements 1",
        assignedReviewer: reviewerId,
        assignedBy: userId,
        aiAgent: "alpha-1",
      };

      const data2: CreateApprovalData = {
        taskId: "task-2",
        type: "requirements",
        priority: "high",
        originalRequirements: "Requirements 2",
        aiGeneratedRequirements: "AI Requirements 2",
        assignedReviewer: "other-reviewer",
        assignedBy: userId,
        aiAgent: "alpha-1",
      };

      await service.createApprovalRequest(data1, userId);
      await service.createApprovalRequest(data2, userId);

      const result = await service.listApprovals({ assignedTo: reviewerId });
      assertEquals(result.length, 1);
      assertEquals(result[0].assignedReviewer, reviewerId);
    });
  });

  describe("submitDecision", () => {
    it("should approve successfully with feedback", async () => {
      const data: CreateApprovalData = {
        taskId,
        type: "requirements",
        priority: "high",
        originalRequirements: "Original requirements",
        aiGeneratedRequirements: "AI-generated requirements",
        assignedReviewer: reviewerId,
        assignedBy: userId,
        aiAgent: "alpha-1",
      };

      const approval = await service.createApprovalRequest(data, userId);

      const decision: SubmitDecisionData = {
        decision: "approve",
        feedback: "Requirements look comprehensive and well-structured",
      };

      const updated = await service.submitDecision(approval.id, decision, reviewerId);

      assertEquals(updated.status, "approved");
      assertEquals(updated.decision, "approve");
      assertEquals(updated.feedback, decision.feedback);
      assertEquals(updated.decidedBy, reviewerId);
      assertExists(updated.decidedAt);
    });

    it("should reject with feedback", async () => {
      const data: CreateApprovalData = {
        taskId,
        type: "requirements",
        priority: "high",
        originalRequirements: "Original requirements",
        aiGeneratedRequirements: "AI-generated requirements",
        assignedReviewer: reviewerId,
        assignedBy: userId,
        aiAgent: "alpha-1",
      };

      const approval = await service.createApprovalRequest(data, userId);

      const decision: SubmitDecisionData = {
        decision: "reject",
        feedback: "Missing critical security requirements",
        suggestions: ["Add authentication flow", "Add authorization rules"],
      };

      const updated = await service.submitDecision(approval.id, decision, reviewerId);

      assertEquals(updated.status, "rejected");
      assertEquals(updated.decision, "reject");
      assertEquals(updated.suggestions?.length, 2);
    });

    it("should request changes with feedback", async () => {
      const data: CreateApprovalData = {
        taskId,
        type: "requirements",
        priority: "high",
        originalRequirements: "Original requirements",
        aiGeneratedRequirements: "AI-generated requirements",
        assignedReviewer: reviewerId,
        assignedBy: userId,
        aiAgent: "alpha-1",
      };

      const approval = await service.createApprovalRequest(data, userId);

      const decision: SubmitDecisionData = {
        decision: "request_changes",
        feedback: "Needs more detail on error handling",
      };

      const updated = await service.submitDecision(approval.id, decision, reviewerId);

      assertEquals(updated.status, "changes_requested");
    });

    it("should require feedback for reject decision", async () => {
      const data: CreateApprovalData = {
        taskId,
        type: "requirements",
        priority: "high",
        originalRequirements: "Original requirements",
        aiGeneratedRequirements: "AI-generated requirements",
        assignedReviewer: reviewerId,
        assignedBy: userId,
        aiAgent: "alpha-1",
      };

      const approval = await service.createApprovalRequest(data, userId);

      await assertRejects(
        () => service.submitDecision(
          approval.id,
          { decision: "reject", feedback: "" },
          reviewerId
        ),
        Error,
        "Feedback is required for reject decisions"
      );
    });

    it("should require feedback for request_changes decision", async () => {
      const data: CreateApprovalData = {
        taskId,
        type: "requirements",
        priority: "high",
        originalRequirements: "Original requirements",
        aiGeneratedRequirements: "AI-generated requirements",
        assignedReviewer: reviewerId,
        assignedBy: userId,
        aiAgent: "alpha-1",
      };

      const approval = await service.createApprovalRequest(data, userId);

      await assertRejects(
        () => service.submitDecision(
          approval.id,
          { decision: "request_changes", feedback: "" },
          reviewerId
        ),
        Error,
        "Feedback is required for request_changes decisions"
      );
    });

    it("should enforce authorization (only reviewer can decide)", async () => {
      const data: CreateApprovalData = {
        taskId,
        type: "requirements",
        priority: "high",
        originalRequirements: "Original requirements",
        aiGeneratedRequirements: "AI-generated requirements",
        assignedReviewer: reviewerId,
        assignedBy: userId,
        aiAgent: "alpha-1",
      };

      const approval = await service.createApprovalRequest(data, userId);

      await assertRejects(
        () => service.submitDecision(
          approval.id,
          { decision: "approve", feedback: "OK" },
          "unauthorized-user"
        ),
        Error,
        "Only assigned reviewer can submit decision"
      );
    });

    it("should prevent changing decision after submission", async () => {
      const data: CreateApprovalData = {
        taskId,
        type: "requirements",
        priority: "high",
        originalRequirements: "Original requirements",
        aiGeneratedRequirements: "AI-generated requirements",
        assignedReviewer: reviewerId,
        assignedBy: userId,
        aiAgent: "alpha-1",
      };

      const approval = await service.createApprovalRequest(data, userId);

      await service.submitDecision(
        approval.id,
        { decision: "approve", feedback: "Good" },
        reviewerId
      );

      await assertRejects(
        () => service.submitDecision(
          approval.id,
          { decision: "reject", feedback: "Changed my mind" },
          reviewerId
        ),
        Error,
        "Decision already submitted"
      );
    });
  });

  describe("assignReviewer", () => {
    it("should assign reviewer successfully", async () => {
      const data: CreateApprovalData = {
        taskId,
        type: "requirements",
        priority: "high",
        originalRequirements: "Original requirements",
        aiGeneratedRequirements: "AI-generated requirements",
        assignedReviewer: reviewerId,
        assignedBy: userId,
        aiAgent: "alpha-1",
      };

      const approval = await service.createApprovalRequest(data, userId);
      const newReviewer = "new-reviewer-789";

      const updated = await service.assignReviewer(
        approval.id,
        newReviewer,
        userId,
        "Reassigning to specialist"
      );

      assertEquals(updated.assignedReviewer, newReviewer);
      assertEquals(updated.assignedBy, userId);
    });

    it("should enforce authorization (only creator or admin)", async () => {
      const data: CreateApprovalData = {
        taskId,
        type: "requirements",
        priority: "high",
        originalRequirements: "Original requirements",
        aiGeneratedRequirements: "AI-generated requirements",
        assignedReviewer: reviewerId,
        assignedBy: userId,
        aiAgent: "alpha-1",
      };

      const approval = await service.createApprovalRequest(data, userId);

      await assertRejects(
        () => service.assignReviewer(
          approval.id,
          "new-reviewer",
          "unauthorized-user"
        ),
        Error,
        "Only task creator can assign reviewer"
      );
    });

    it("should return null for non-existent approval", async () => {
      const result = await service.assignReviewer(
        "non-existent",
        reviewerId,
        userId
      );
      assertEquals(result, null);
    });
  });

  describe("getApprovalHistory", () => {
    it("should return history for approval", async () => {
      const data: CreateApprovalData = {
        taskId,
        type: "requirements",
        priority: "high",
        originalRequirements: "Original requirements",
        aiGeneratedRequirements: "AI-generated requirements",
        assignedReviewer: reviewerId,
        assignedBy: userId,
        aiAgent: "alpha-1",
      };

      const approval = await service.createApprovalRequest(data, userId);

      const history = await service.getApprovalHistory(approval.id);

      assertExists(history);
      assertEquals(history.length >= 1, true); // At least creation event
    });

    it("should track all lifecycle events", async () => {
      const data: CreateApprovalData = {
        taskId,
        type: "requirements",
        priority: "high",
        originalRequirements: "Original requirements",
        aiGeneratedRequirements: "AI-generated requirements",
        assignedReviewer: reviewerId,
        assignedBy: userId,
        aiAgent: "alpha-1",
      };

      const approval = await service.createApprovalRequest(data, userId);
      
      await service.submitDecision(
        approval.id,
        { decision: "approve", feedback: "Good" },
        reviewerId
      );

      const history = await service.getApprovalHistory(approval.id);

      assertEquals(history.length >= 2, true); // Creation + decision
    });
  });
});
