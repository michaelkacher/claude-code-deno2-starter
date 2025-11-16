# Approval Gate Feature Requirements

## Overview

The **Approval Gate** feature provides a critical human verification interface where team members review and approve AI-generated requirements and test logic before implementation proceeds. This is the core differentiator of the AI-first task tracking system, ensuring human oversight at critical decision points.

## Feature Purpose

Enable structured approval workflows for AI-generated work, maintaining quality control while preserving development velocity. This feature bridges the gap between AI efficiency and human judgment in software development.

## User Stories

### Primary User Story
**As a** technical lead or product manager  
**I want to** review AI-generated requirements and test specifications in a structured interface  
**So that** I can approve/reject AI work with feedback before implementation begins

### Supporting User Stories

1. **As a** reviewer  
   **I want to** see side-by-side comparison of original requirements vs AI interpretation  
   **So that** I can quickly identify discrepancies or improvements

2. **As a** team lead  
   **I want to** assign specific reviewers to approval tasks  
   **So that** the right expertise reviews the right work

3. **As a** compliance officer  
   **I want to** access complete approval history with audit trails  
   **So that** I can verify proper oversight of AI-generated work

4. **As a** developer  
   **I want to** receive real-time notifications when assigned approval tasks  
   **So that** I can review promptly and avoid blocking the AI pipeline

## Related Features

- **task-creation-wizard**: Tasks created here flow to approval-gate when AI processing completes
- **ai-task-dashboard**: Dashboard shows tasks pending approval, approved, or rejected
- **Future: notification-system**: Will notify reviewers of pending approvals

## API Endpoints

### GET /api/approvals
**Purpose**: List all approval requests (filterable by status, reviewer, priority)

**Query Parameters**:
- `status?: "pending" | "approved" | "rejected" | "changes_requested"`
- `assignedTo?: string` (userId)
- `priority?: "critical" | "high" | "medium" | "low"`
- `limit?: number` (default: 20)
- `offset?: number` (default: 0)

**Response** (200):
```typescript
{
  approvals: ApprovalRequest[];
  total: number;
  hasMore: boolean;
}
```

**Authentication**: Required (any authenticated user)

---

### GET /api/approvals/:id
**Purpose**: Get detailed approval request with full AI-generated content

**Path Parameters**:
- `id: string` (approval request ID)

**Response** (200):
```typescript
{
  approval: ApprovalRequest;
  task: Task; // Related task info
  history: ApprovalHistoryEntry[];
}
```

**Response** (404): Approval not found  
**Response** (403): User not assigned as reviewer

**Authentication**: Required (must be assigned reviewer or admin)

---

### POST /api/approvals/:id/decision
**Purpose**: Submit approval decision (approve/reject/request changes)

**Path Parameters**:
- `id: string` (approval request ID)

**Request Body**:
```typescript
{
  decision: "approve" | "reject" | "request_changes";
  feedback: string; // Required for reject/request_changes
  suggestions?: string[]; // Optional improvement suggestions
}
```

**Response** (200):
```typescript
{
  approval: ApprovalRequest; // Updated with decision
  nextStep: {
    action: "proceed_to_implementation" | "back_to_ai" | "closed";
    message: string;
  };
}
```

**Response** (400): Invalid decision or missing feedback  
**Response** (403): User not assigned as reviewer  
**Response** (409): Already decided

**Authentication**: Required (must be assigned reviewer)

---

### PUT /api/approvals/:id/assign
**Purpose**: Assign or reassign reviewer for approval request

**Path Parameters**:
- `id: string` (approval request ID)

**Request Body**:
```typescript
{
  reviewerId: string;
  reason?: string; // Why this reviewer was chosen
}
```

**Response** (200):
```typescript
{
  approval: ApprovalRequest; // Updated with new reviewer
  notificationSent: boolean;
}
```

**Response** (403): User not authorized (requires admin or task owner)  
**Response** (404): Reviewer user not found

**Authentication**: Required (admin or task creator only)

---

### GET /api/approvals/:id/history
**Purpose**: Get complete approval history and audit trail

**Path Parameters**:
- `id: string` (approval request ID)

**Response** (200):
```typescript
{
  history: ApprovalHistoryEntry[];
  auditLog: {
    createdAt: string;
    createdBy: string;
    assignedAt?: string;
    assignedBy?: string;
    decidedAt?: string;
    decidedBy?: string;
    decision?: string;
  };
}
```

**Authentication**: Required (assigned reviewer or admin)

## Data Models

### ApprovalRequest

**Purpose**: Represents a single approval request for AI-generated work

```typescript
interface ApprovalRequest {
  id: string;
  taskId: string; // Reference to related task
  type: "requirements" | "tests" | "both"; // What needs approval
  status: "pending" | "approved" | "rejected" | "changes_requested";
  priority: "critical" | "high" | "medium" | "low";
  
  // Content to review
  originalRequirements: string;
  aiGeneratedRequirements: string;
  aiGeneratedTests?: string;
  
  // AI process info
  aiAgent: string; // Which AI agent generated this
  confidenceScore?: number; // AI's confidence in its work (0-100)
  
  // Reviewer assignment
  assignedReviewer: string; // userId
  assignedBy: string; // Who assigned the reviewer
  assignedAt: string; // ISO timestamp
  
  // Decision tracking
  decision?: "approve" | "reject" | "request_changes";
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
```

**Relationships**:
- `taskId` → `Task` (one-to-one)
- `assignedReviewer` → `User`
- `createdBy` → `User`

**Indexes**:
- `status, assignedReviewer` (for reviewer's queue)
- `status, priority, createdAt` (for priority sorting)
- `taskId` (for task lookup)

---

### ApprovalHistoryEntry

**Purpose**: Audit trail entry for approval lifecycle events

```typescript
interface ApprovalHistoryEntry {
  id: string;
  approvalId: string;
  action: "created" | "assigned" | "reassigned" | "review_started" | "approved" | "rejected" | "changes_requested";
  performedBy: string; // userId or "system"
  timestamp: string;
  metadata: {
    note?: string;
    previousValue?: any; // For changes (e.g., previous reviewer)
    newValue?: any;
    feedback?: string;
  };
}
```

**Relationships**:
- `approvalId` → `ApprovalRequest`
- `performedBy` → `User`

**Indexes**:
- `approvalId, timestamp` (for chronological history)

---

### ApprovalDecision

**Purpose**: Structured decision record (embedded in ApprovalRequest or separate)

```typescript
interface ApprovalDecision {
  decision: "approve" | "reject" | "request_changes";
  feedback: string; // Required justification
  suggestions?: string[]; // Actionable improvements
  decidedAt: string;
  decidedBy: string;
  
  // For "request_changes"
  specificChanges?: {
    section: string; // Which part needs changes
    issue: string;
    suggestion: string;
  }[];
}
```

## Shared Models Analysis

### Existing Models Used

1. **Task** (from task-creation-wizard)
   - Already has `status` field - add new states: `pending_requirements_approval`, `pending_test_approval`, `changes_requested`
   - Add `approvalId?: string` field to link to approval request

2. **User** (existing auth system)
   - Use for `assignedReviewer`, `createdBy`, `decidedBy` fields
   - May need new role: `reviewer` or permission: `can_approve_tasks`

### New Models Created

1. **ApprovalRequest** - Core model for this feature
2. **ApprovalHistoryEntry** - Audit trail
3. **ApprovalDecision** - Structured decision data

### Model Impact Analysis

**Changes to existing `Task` model**:
```typescript
interface Task {
  // ... existing fields ...
  
  // NEW: Approval tracking
  approvalId?: string; // Link to approval request
  approvalStatus?: "not_required" | "pending" | "approved" | "rejected";
  
  // MODIFIED: Add new status values
  status: 
    | "pending" 
    | "pending_requirements_approval" // NEW
    | "pending_test_approval" // NEW
    | "changes_requested" // NEW
    | "in_progress" 
    | "in_review" 
    | "completed" 
    | "rejected";
}
```

**Impact**: Low - Adding optional fields is backward compatible

## Business Logic

### Approval Workflow

1. **Task Creation** → AI processes task → Generates requirements/tests
2. **Auto-create ApprovalRequest** when AI completes generation
3. **Assign Reviewer** (based on task category, expertise, or manual assignment)
4. **Notification** sent to reviewer
5. **Review Process**:
   - Reviewer views side-by-side comparison
   - Can approve, reject, or request changes
   - Must provide feedback for non-approval decisions
6. **Post-Decision**:
   - If approved → Task proceeds to implementation
   - If rejected → Task returns to requirements phase
   - If changes requested → AI regenerates with feedback
7. **Audit Trail** records every action

### Validation Rules

**ApprovalRequest Creation**:
- ✅ Must have valid `taskId`
- ✅ Must have `originalRequirements` and `aiGeneratedRequirements`
- ✅ Must have `assignedReviewer` (can be assigned at creation or later)
- ✅ Cannot create duplicate approval for same task

**Decision Submission**:
- ✅ Only assigned reviewer can submit decision
- ✅ Feedback required for "reject" and "request_changes"
- ✅ Cannot change decision once submitted (immutable)
- ✅ Must be in "pending" status to accept decision

**Reviewer Assignment**:
- ✅ Only admin or task creator can assign/reassign
- ✅ Reviewer must be active user
- ✅ Cannot assign to user who created the task (separation of duties)

### Authorization Rules

- **List approvals**: Any authenticated user (but filtered to their assigned approvals)
- **View approval**: Assigned reviewer, task creator, or admin
- **Submit decision**: Only assigned reviewer
- **Assign reviewer**: Only admin or task creator
- **View history**: Assigned reviewer or admin

## Frontend Components

### Routes

1. **`/approvals`** - List view of all approval requests (filterable by status, priority)
2. **`/approvals/:id`** - Detailed approval review interface with side-by-side comparison
3. **`/approvals/:id/history`** - Full audit trail view

### Islands

1. **ApprovalGate.tsx** (main approval interface)
   - Side-by-side comparison panel
   - Approve/Reject/Request Changes buttons
   - Feedback form
   - Syntax highlighting for requirements/tests
   - Diff highlighting (original vs AI-generated)

2. **ApprovalList.tsx**
   - Filterable table of approval requests
   - Priority indicators
   - Status badges
   - Assigned reviewer avatars
   - Quick actions (assign, view)

3. **ApprovalHistory.tsx**
   - Timeline view of all actions
   - User avatars and timestamps
   - Expandable details for each event

### Components

1. **ComparisonPanel.tsx** - Reusable side-by-side view
2. **FeedbackForm.tsx** - Modal for approval decision feedback
3. **ReviewerSelector.tsx** - Dropdown for assigning reviewers
4. **PriorityBadge.tsx** - Visual priority indicator

## Integration Points

### Integration with task-creation-wizard

**Trigger**: When task status changes to `ai_processing_complete`
**Action**: Create ApprovalRequest automatically
**Data Flow**: Task → ApprovalRequest (copy requirements, AI output)

### Integration with ai-task-dashboard

**Display**: Show approval status on dashboard
**Filter**: Allow filtering by "Pending My Approval"
**Navigation**: Click to go to approval interface

### Future: notification-system

**Trigger**: Reviewer assigned, decision needed, decision made
**Recipients**: Assigned reviewer, task creator, stakeholders
**Channels**: In-app notifications, email (optional)

## Testing Strategy

### Unit Tests

**Service Tests** (approval.service.test.ts):
- ✅ Create approval request with validation
- ✅ Assign reviewer (authorization checks)
- ✅ Submit decision (validation, authorization)
- ✅ List approvals (filtering, pagination)
- ✅ Get approval by ID (user scoping)
- ✅ Record history entries correctly
- ✅ Prevent duplicate approvals for same task
- ✅ Enforce immutable decisions

### Integration Tests

**API Tests** (approval.api.test.ts):
- ✅ GET /api/approvals with filters
- ✅ GET /api/approvals/:id (authorized)
- ✅ POST /api/approvals/:id/decision (all decision types)
- ✅ PUT /api/approvals/:id/assign (authorization)
- ✅ Error handling (404, 403, 400, 409)

### Manual Testing Checklist

- [ ] Create approval from completed AI task
- [ ] Assign reviewer and verify notification
- [ ] Review interface shows side-by-side comparison
- [ ] Approve decision proceeds to implementation
- [ ] Reject decision returns to requirements
- [ ] Request changes triggers AI regeneration
- [ ] History shows complete audit trail
- [ ] Unauthorized users cannot submit decisions
- [ ] Cannot change decision after submission
- [ ] Priority and status badges display correctly

## Success Criteria

**Primary**:
- ✅ Reviewers can approve/reject AI work in < 5 minutes
- ✅ 100% audit trail coverage for compliance
- ✅ Zero unauthorized decision submissions
- ✅ Approval workflow doesn't block AI pipeline (async)

**Secondary**:
- ✅ Average approval turnaround < 24 hours
- ✅ > 80% approval rate on first AI attempt
- ✅ Clear visual diff between original and AI-generated content
- ✅ Mobile-responsive approval interface

## Future Enhancements

1. **AI-Suggested Reviewers** - ML model recommends best reviewer based on expertise
2. **Bulk Approval** - Approve multiple low-risk requests at once
3. **Approval Templates** - Pre-defined decision templates for common scenarios
4. **Collaborative Review** - Multiple reviewers can comment before final decision
5. **Metrics Dashboard** - Track approval rates, turnaround time, quality trends
6. **Integration Testing** - AI runs tests before requesting approval

## Notes

- This feature is critical path for the AI-first value proposition
- Focus on clean, intuitive UX - this is where human judgment happens
- Audit trail is essential for enterprise adoption and compliance
- Consider performance for teams with 100+ pending approvals
- Real-time updates would greatly improve collaboration experience
