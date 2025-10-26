---
description: Orchestrate full feature development workflow from requirements to implementation
---

You will guide the user through the complete feature development workflow using specialized sub-agents.

## Workflow Steps

1. **Requirements Gathering**: Use the requirements-agent to understand the feature
2. **Update Architecture**: Use the architect-agent if architectural changes are needed
3. **API Design**: Use the api-designer-agent to design endpoints and contracts
4. **Database Design**: Use the database-designer-agent if new tables/schema changes are needed
5. **Write Tests**: Use the test-writer-agent to create tests (TDD Red phase)
6. **Implement Backend**: Use the backend-agent to implement server-side logic
7. **Implement Frontend**: Use the frontend-agent to build UI components
8. **Verify & Refactor**: Run tests, check coverage, refactor

## Instructions

Ask the user to describe the feature they want to build. Then:

1. First, launch the **requirements-agent** to gather detailed requirements for this specific feature
2. Ask if this feature requires architectural changes (new database tables, major new components, etc.)
   - If yes, launch the **architect-agent** to update architecture docs
   - If no, proceed to next step
3. Launch the **api-designer-agent** to design the API endpoints needed
4. Ask if this feature requires database schema changes (new tables, columns, relationships)
   - If yes, launch the **database-designer-agent** to design schema
   - If no, proceed to next step
5. Launch the **test-writer-agent** to write tests for the feature (TDD approach)
6. Launch the **backend-agent** to implement the backend logic
7. Launch the **frontend-agent** to implement the UI
8. Run tests to verify everything works

## Best Practices

- Each agent works independently but reads outputs from previous agents
- Agents should be launched sequentially (one after another)
- Each agent creates files that the next agent will read
- Keep the user informed about progress between agent launches

## Example Usage

User: `/new-feature` or `/new-feature add user profile editing`

Then you guide them through each step, launching the appropriate agents.
