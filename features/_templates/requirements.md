# Feature: {Feature Name}

## Summary
{1-2 sentence description of what this feature does and why it's needed}

## User Story
As a {type of user}, I want to {action} so that {benefit}.

## Core Functionality

### What It Does
- {Key capability 1}
- {Key capability 2}
- {Key capability 3}

### What It Doesn't Do (Out of Scope)
- {Explicitly not included 1}
- {Explicitly not included 2}

## API Endpoints Needed
- `POST /api/resource` - Create resource
- `GET /api/resource/:id` - Get resource by ID
- `PUT /api/resource/:id` - Update resource
- `DELETE /api/resource/:id` - Delete resource

## Data Requirements

### New Models/Types
```typescript
interface Resource {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
```

### Existing Models Modified
- `User`: Add `resourceIds: string[]` field

### Shared Models (if applicable)
- `{ModelName}` - Shared with: {feature-1}, {feature-2}
  - Fields used by this feature: {list fields}
  - Fields used by related features: {list fields}
- None (if this feature doesn't share models)

### Model Impact Analysis
**If this feature's models are shared:**
- Changes to `{ModelName}` will impact: {list of features}
- Breaking changes require updating: {list affected features}
- Migration strategy: {describe how to handle changes}

**If no shared models:**
- This feature's models are isolated and can be changed independently

## UI Components Needed
- {Component 1} - {Purpose}
- {Component 2} - {Purpose}

## Acceptance Criteria
- [ ] {Criterion 1}
- [ ] {Criterion 2}
- [ ] {Criterion 3}
- [ ] All tests pass
- [ ] Error handling implemented
- [ ] API documented

## Technical Notes
{Any important technical considerations, constraints, or dependencies}

## Related Features
- {Feature name} ({status: proposed/implemented/mockup}) - {Relationship description}
  - Shares: {Model names or "None"}
  - Depends on: {Specific fields, endpoints, or "None"}
  - Impact: {What happens if this feature changes shared resources}
- None (if this feature is standalone)
