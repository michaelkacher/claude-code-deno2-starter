/**
 * Approval Feature Integration Tests
 * 
 * Tests the complete approval workflow from creation through decision
 */

import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { withTestKv } from "../helpers/kv.ts";

const testUserId = "user_123";
const reviewerId = "reviewer_456";

describe("Approval Feature Integration", () => {

  describe("Complete Approval Workflow", () => {
    it("should handle full approval lifecycle: create → review → approve", async () => {
      // Step 1: Create approval request via API
      const createPayload = {
        taskId: "task_001",
        approvalType: "both" as const,
        originalRequirements: "Original: User login with email",
        aiGeneratedRequirements: "AI: User authentication system with email/password, OAuth support, and session management",
        originalTests: "Test: User can login",
        aiGeneratedTests: `
          describe('User Authentication', () => {
            it('should login with valid credentials');
            it('should reject invalid credentials');
            it('should support OAuth login');
          });
        `,
        assignedReviewer: reviewerId,
        priority: "high" as const,
        context: "Initial task creation for user authentication feature",
        createdBy: testUserId,
      };

      await withTestKv(async (kv) => {
        const { ApprovalService } = await import("../../shared/services/approval.service.ts");
        const service = new ApprovalService(kv);

      // Create approval
  const approval = await service.createApprovalRequest(createPayload);
      assertExists(approval);
      assertExists(approval.id);
      assertEquals(approval.status, "pending");
      assertEquals(approval.taskId, "task_001");

      // Step 2: Reviewer retrieves approval
      const retrieved = await service.getApprovalById(approval.id, reviewerId);
      assertExists(retrieved);
      assertEquals(retrieved?.originalRequirements, createPayload.originalRequirements);
      assertEquals(retrieved?.aiGeneratedRequirements, createPayload.aiGeneratedRequirements);

      // Step 3: Reviewer submits approval decision
      const decision = {
        decision: "approve" as const,
        feedback: "AI-generated requirements are comprehensive and well-structured. The OAuth support is a great addition. Tests cover the main scenarios. Approved for implementation.",
        suggestions: [
          "Consider adding 2FA support in future iteration",
          "Add rate limiting for login attempts",
        ],
      };

      const approved = await service.submitDecision(approval.id, decision, reviewerId);
      assertExists(approved);
      assertEquals(approved.status, "approved");
      assertEquals(approved.feedback, decision.feedback);
      assertEquals(approved.suggestions, decision.suggestions);
      assertExists(approved.decidedAt);
      assertEquals(approved.decidedBy, reviewerId);

      // Step 4: Verify history
      const history = await service.getApprovalHistory(approval.id);
      assertEquals(history.length >= 2, true); // created + approved
      
      const createdEvent = history.find(h => h.action === "created");
      assertExists(createdEvent);
      assertEquals(createdEvent?.actorId, testUserId);

      const approvedEvent = history.find(h => h.action === "approved");
      assertExists(approvedEvent);
      assertEquals(approvedEvent?.actorId, reviewerId);
      assertEquals(approvedEvent?.details?.feedback, decision.feedback);

      // Step 5: Verify decision is immutable
      await assertRejects(
        async () => {
          await service.submitDecision(approval.id, {
            decision: "reject",
            feedback: "Changed my mind",
          }, reviewerId);
        },
        Error,
        "Decision already submitted"
      );
    });
    });

    it("should handle request for changes workflow", async () => {
      await withTestKv(async (kv) => {
        const { ApprovalService } = await import("../../shared/services/approval.service.ts");
        const service = new ApprovalService(kv);

      // Create approval
      const approval = await service.createApprovalRequest({
        taskId: "task_002",
        approvalType: "requirements" as const,
        originalRequirements: "Add user profile",
        aiGeneratedRequirements: "User profile management system",
        assignedReviewer: reviewerId,
        createdBy: testUserId,
      });

      // Request changes
      const decision = {
        decision: "request_changes" as const,
        feedback: "Requirements are too vague. Need more details about profile fields, privacy settings, and edit capabilities.",
        suggestions: [
          "Specify all profile fields (name, bio, avatar, etc.)",
          "Define privacy levels for each field",
          "Add avatar upload requirements",
        ],
      };

  const updated = await service.submitDecision(approval.id, decision, reviewerId);
      assertEquals(updated.status, "changes_requested");
      assertEquals(updated.suggestions?.length, 3);

      // Verify history includes the feedback
      const history = await service.getApprovalHistory(approval.id);
      const changesEvent = history.find(h => h.action === "changes_requested");
      assertEquals(changesEvent?.details?.suggestions, decision.suggestions);
    });
    });

    it("should handle reviewer reassignment", async () => {
      await withTestKv(async (kv) => {
        const { ApprovalService } = await import("../../shared/services/approval.service.ts");
        const service = new ApprovalService(kv);

      // Create approval
      const approval = await service.createApprovalRequest({
        taskId: "task_003",
        approvalType: "tests" as const,
        originalRequirements: "N/A",
        aiGeneratedRequirements: "N/A",
        originalTests: "Basic tests",
        aiGeneratedTests: "Comprehensive test suite",
        assignedReviewer: reviewerId,
        createdBy: testUserId,
      });

      const newReviewerId = "reviewer_789";

      // Reassign reviewer (only creator can do this)
  const reassigned = await service.assignReviewer(
        approval.id,
        newReviewerId,
        testUserId,
        "Original reviewer is on vacation"
      );

      assertEquals(reassigned?.assignedReviewer, newReviewerId);

      // Verify history
      const history = await service.getApprovalHistory(approval.id);
      const assignEvent = history.find(h => h.action === "reviewer_assigned");
      assertEquals(assignEvent?.details?.previousReviewer, reviewerId);
      assertEquals(assignEvent?.details?.newReviewer, newReviewerId);
      assertEquals(assignEvent?.details?.reason, "Original reviewer is on vacation");

      // Old reviewer cannot submit decision
      await assertRejects(
        async () => {
          await service.submitDecision(approval.id, {
            decision: "approve",
            feedback: "Looks good",
          }, reviewerId);
        },
        Error,
        "Only assigned reviewer"
      );

      // New reviewer can submit decision
  const approved = await service.submitDecision(approval.id, {
        decision: "approve",
        feedback: "Tests are comprehensive",
      }, newReviewerId);
      assertEquals(approved.status, "approved");
    });
    });

    it("should prevent duplicate approvals for same task", async () => {
      await withTestKv(async (kv) => {
        const { ApprovalService } = await import("../../shared/services/approval.service.ts");
        const service = new ApprovalService(kv);

      const payload = {
        taskId: "task_004",
        approvalType: "both" as const,
        originalRequirements: "Feature X",
        aiGeneratedRequirements: "Detailed Feature X",
        assignedReviewer: reviewerId,
        createdBy: testUserId,
      };

      // First approval succeeds
  const first = await service.createApprovalRequest(payload);
      assertExists(first);

      // Second approval for same task fails
  await assertRejects(
        async () => {
          await service.createApprovalRequest(payload);
        },
        Error,
        "Approval request already exists for task task_004"
      );
    });
    });

    it("should enforce authorization rules", async () => {
      await withTestKv(async (kv) => {
        const { ApprovalService } = await import("../../shared/services/approval.service.ts");
        const service = new ApprovalService(kv);

  const approval = await service.createApprovalRequest({
        taskId: "task_005",
        approvalType: "requirements" as const,
        originalRequirements: "Req",
        aiGeneratedRequirements: "AI Req",
        assignedReviewer: reviewerId,
        createdBy: testUserId,
      });

      const unauthorizedUser = "user_999";

      // Unauthorized user cannot view approval
  const retrieved = await service.getApprovalById(approval.id, unauthorizedUser);
      assertEquals(retrieved, null);

      // Unauthorized user cannot submit decision
  await assertRejects(
        async () => {
          await service.submitDecision(approval.id, {
            decision: "approve",
            feedback: "Unauthorized approval",
          }, unauthorizedUser);
        },
        Error,
        "Only assigned reviewer"
      );

      // Non-creator cannot reassign reviewer
  await assertRejects(
        async () => {
          await service.assignReviewer(approval.id, "new_reviewer", reviewerId);
        },
        Error,
        "Only task creator"
      );
    });
    });

    it("should require feedback for reject and request_changes", async () => {
      await withTestKv(async (kv) => {
        const { ApprovalService } = await import("../../shared/services/approval.service.ts");
        const service = new ApprovalService(kv);

  const approval = await service.createApprovalRequest({
        taskId: "task_006",
        approvalType: "both" as const,
        originalRequirements: "Req",
        aiGeneratedRequirements: "AI Req",
        assignedReviewer: reviewerId,
        createdBy: testUserId,
      });

      // Reject without feedback fails
  await assertRejects(
        async () => {
          await service.submitDecision(approval.id, {
            decision: "reject",
            feedback: "",
          }, reviewerId);
        },
        Error,
        "Feedback is required"
      );

      // Request changes without feedback fails
  await assertRejects(
        async () => {
          await service.submitDecision(approval.id, {
            decision: "request_changes",
            feedback: "   ",
          }, reviewerId);
        },
        Error,
        "Feedback is required"
      );

      // Approve can work with minimal feedback
  const approved = await service.submitDecision(approval.id, {
        decision: "approve",
        feedback: "OK",
      }, reviewerId);
      assertEquals(approved.status, "approved");
    });
    });
  });

  describe("Filtering and Listing", () => {
    it("should filter approvals by status and reviewer", async () => {
      await withTestKv(async (kv) => {
        const { ApprovalService } = await import("../../shared/services/approval.service.ts");
        const service = new ApprovalService(kv);

      // Create multiple approvals
  const approval1 = await service.createApprovalRequest({
        taskId: "task_101",
        approvalType: "requirements" as const,
        originalRequirements: "R1",
        aiGeneratedRequirements: "AI R1",
        assignedReviewer: reviewerId,
        createdBy: testUserId,
      });

  const approval2 = await service.createApprovalRequest({
        taskId: "task_102",
        approvalType: "tests" as const,
        originalRequirements: "R2",
        aiGeneratedRequirements: "AI R2",
        assignedReviewer: reviewerId,
        createdBy: testUserId,
      });

  await service.createApprovalRequest({
        taskId: "task_103",
        approvalType: "both" as const,
        originalRequirements: "R3",
        aiGeneratedRequirements: "AI R3",
        assignedReviewer: "other_reviewer",
        createdBy: testUserId,
      });

      // Approve one
  await service.submitDecision(approval1.id, {
        decision: "approve",
        feedback: "Good",
      }, reviewerId);

      // List pending for reviewer
  const pending = await service.listApprovals({
        assignedTo: reviewerId,
        status: "pending",
      });
      assertEquals(pending.length, 1);
  assertEquals(pending[0]!.id, approval2.id);

      // List approved for reviewer
  const approved = await service.listApprovals({
        assignedTo: reviewerId,
        status: "approved",
      });
      assertEquals(approved.length, 1);
  assertEquals(approved[0]!.id, approval1.id);

      // List all for reviewer
  const all = await service.listApprovals({
        assignedTo: reviewerId,
      });
      assertEquals(all.length, 2);
    });
    });
  });
});
