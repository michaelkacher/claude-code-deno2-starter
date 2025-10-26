---
description: Automated feature development with intelligent orchestration (Advanced)
---

**⚠️ ADVANCED FEATURE**

This command uses the orchestrator-agent for fully automated feature development.

## When to Use

Use `/auto-feature` when:
- Working on complex projects with many components
- You want maximum automation
- Project state management is important
- You trust the orchestrator to make decisions

## When NOT to Use

Use `/new-feature` instead if:
- Learning the workflow
- Want manual control over steps
- Working on simple features
- Small project or proof of concept

## How It Works

The orchestrator will:
1. Analyze your request and current project state
2. Create an execution plan
3. Present plan for your approval
4. Automatically invoke required agents in sequence
5. Validate outputs at each step
6. Handle errors and retries
7. Report final status

## Usage

Simply describe your feature after running this command.

Example:
```
/auto-feature

> "Add user authentication with email/password and JWT tokens"
```

The orchestrator will then:
- Detect existing architecture
- Plan required changes
- Invoke agents automatically
- Validate at each step
- Report progress and completion

## Comparison with /new-feature

| Feature | `/new-feature` | `/auto-feature` |
|---------|----------------|-----------------|
| Control | You approve each agent | Orchestrator decides |
| Steps | Sequential, manual | Automated |
| Validation | Manual | Automatic |
| Error Handling | You decide | Automatic retry |
| Best for | Most projects | Complex projects |
| Token Usage | Lower | Higher |
| Transparency | High | Medium |

## For Most Users

**We recommend starting with `/new-feature`** and only using `/auto-feature` if you find yourself:
- Building many features repeatedly
- Wanting more automation
- Managing complex project state

Ready to proceed with automated orchestration?
