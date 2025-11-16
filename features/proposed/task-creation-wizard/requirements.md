# Feature: Task Creation Wizard

## Summary
A multi-step wizard that guides users through creating new AI-powered development tasks with comprehensive requirement specifications, success criteria, AI agent assignments, human reviewer selection, and dependency management.

## Project Alignment
**How this feature supports the project:**
- Serves: AI-enabled development teams, product managers, and technical leads
- Solves: Lack of structured workflow for specifying AI development tasks with proper human oversight
- Contributes to: Creating the standard platform for managing AI-driven development projects with human verification gates

## User Story
As a product manager or tech lead, I want to create well-defined AI development tasks through a guided wizard so that AI agents have clear requirements and success criteria, and appropriate human reviewers are assigned to maintain quality control.

## Core Functionality

### What It Does
- Guides users through a 5-step wizard for task creation
- Collects task requirements including title, description, and success criteria
- Allows selection from task templates for common scenarios (Auth, API, Dashboard)
- Configures AI processing parameters (category, complexity, agent assignment)
- Assigns human reviewers based on expertise and workload
- Sets task priority and dependencies
- Provides comprehensive review before submission
- Displays real-time AI agent availability status
- Tracks reviewer workload to prevent over-assignment
- Supports flexible tagging for organization

### What It Doesn't Do (Out of Scope)
- Execute AI tasks (handled by separate task execution system)
- Manage reviewer schedules or calendars
- Send email notifications (will be separate feature)
- Track time estimates (only complexity levels)
- Provide task analytics or reporting

## API Endpoints Needed
- `POST /api/tasks` - Create new task with all wizard data
- `GET /api/ai-agents` - Get list of available AI agents with status
- `GET /api/reviewers` - Get list of potential reviewers with expertise and workload
- `GET /api/task-templates` - Get predefined task templates
- `GET /api/tasks/dependencies` - Get list of tasks that can be dependencies

## Data Requirements

### New Models/Types
```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  successCriteria: string[];
  priority: "critical" | "high" | "medium" | "low";
  category: "frontend" | "backend" | "api" | "database" | "integration" | "testing";
  aiAgentId: string;
  reviewerIds: string[];
  dependencyIds: string[];
  estimatedComplexity: "simple" | "medium" | "complex";
  tags: string[];
  status: "pending" | "in-progress" | "in-review" | "completed" | "rejected";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface AIAgent {
  id: string;
  name: string;
  specialty: string;
  availability: "available" | "busy" | "offline";
  queueTime?: string; // e.g., "2h queue"
}

interface Reviewer {
  id: string;
  name: string;
  role: string;
  expertise: string[]; // e.g., ["backend", "api", "database"]
  workload: number; // 0-100 percentage
  avatar: string;
}

interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  category: "frontend" | "backend" | "api" | "database" | "integration" | "testing";
  successCriteria: string[];
  aiInstructions: string;
}
```

### Existing Models Modified
- None (this is a new feature)

### Shared Models
- `Task` - Will be shared with:
  - ai-task-dashboard (displays tasks)
  - approval-gate (processes task approvals)
  - Fields used by this feature: all fields
  - Fields used by related features: id, title, status, reviewerIds, successCriteria
- `Reviewer` - Will be shared with:
  - approval-gate (shows reviewer information)
  - Fields used by this feature: all fields
  - Fields used by related features: id, name, expertise

### Model Impact Analysis
**Shared models require careful coordination:**
- Changes to `Task` model will impact: ai-task-dashboard, approval-gate
- Breaking changes require updating: All task-related features
- Migration strategy: Add new fields as optional, deprecate old fields gradually, use versioned API responses

## UI Components Needed
- `TaskCreationWizard` (Island) - Main wizard container with step management
- `ProgressBar` (Component) - Visual step indicator
- `StepRequirements` (Component) - Step 1: Task requirements form
- `StepAIConfig` (Component) - Step 2: AI configuration options
- `StepReviewers` (Component) - Step 3: Reviewer selection
- `StepDependencies` (Component) - Step 4: Dependencies and priority
- `StepReview` (Component) - Step 5: Final review summary
- `TemplateSelector` (Component) - Quick start with predefined templates
- `ReviewerCard` (Component) - Display reviewer with expertise and workload
- `AIAgentSelector` (Component) - Radio list with availability status
- Use existing design system: Button, Input, Card, Panel, Badge, Avatar

## Acceptance Criteria
- [ ] Users can navigate through all 5 wizard steps sequentially
- [ ] Users can go back to previous steps to edit
- [ ] Template selection auto-fills form fields appropriately
- [ ] Success criteria can be added/removed dynamically
- [ ] Tags can be added/removed with validation (no duplicates)
- [ ] Recommended reviewers are filtered by category expertise
- [ ] Reviewer workload status is displayed (high/medium/available)
- [ ] AI agent availability status is accurate and real-time
- [ ] Priority selection displays with color-coded badges
- [ ] Final review step shows complete summary of all data
- [ ] Form validation prevents submission with incomplete required fields
- [ ] Task creation succeeds and returns task ID
- [ ] All tests pass
- [ ] Error handling for network failures
- [ ] API documented with request/response schemas

## Technical Notes

### Wizard State Management
- Use Preact signals for form state
- Maintain all form data across steps
- Validate required fields before allowing "Next"
- Support browser back button (save state)

### Performance Considerations
- Load AI agents and reviewers on wizard mount
- Cache template data
- Debounce auto-save functionality (future)

### Security
- Authenticate user before creating tasks (requireUser)
- Validate all input on backend (Zod schemas)
- Ensure user can only assign active reviewers
- Prevent assignment to non-existent AI agents

### Related Features Integration
- Task data must be compatible with ai-task-dashboard display
- Reviewer IDs must match approval-gate expectations
- AI agent IDs must be valid in task execution system

## Related Features
- ai-task-dashboard (implemented) - Displays created tasks
  - Shares: Task model
  - Depends on: Task.id, Task.title, Task.status, Task.priority
  - Impact: Changes to Task model require dashboard updates
- approval-gate (proposed) - Processes task approvals
  - Shares: Task model, Reviewer model
  - Depends on: Task.reviewerIds, Task.successCriteria, Task.status
  - Impact: Status workflow changes require approval-gate updates
- task-creation-wizard mockup (mockup) - Design reference for this feature
  - Shares: UI layout and component structure
  - Depends on: None
  - Impact: Converting mockup to functional feature
