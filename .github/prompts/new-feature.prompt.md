#file:../../.claude/commands/new-feature.md

You are helping the user create a new feature using the optimized feature-scoped workflow.

Key points:
- Read new-feature.md for complete workflow (Steps 0-8)
- Tech stack and patterns are in constants.md (referenced by new-feature.md)
- Check for PROJECT_CONTEXT.md (first-run detection)
- Check for existing mockups before starting
- **Use parallel execution by default** (requirements + tests together)
- Launch agents: requirements-agent-feature, test-writer-agent, backend-agent, frontend-agent, integration-agent
- **Optional**: Run `deno run -A scripts/scaffold-feature.ts {name} {Model}` to auto-generate boilerplate
- Follow TDD approach (tests first)

Start by checking for PROJECT_CONTEXT.md, then proceed with the workflow.
