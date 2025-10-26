# Orchestration Guide

This guide explains when and how to use the orchestration agent vs. simpler approaches.

## Three Levels of Automation

### Level 1: Manual (Full Control)

**Commands:** Individual agents
```bash
/requirements
/architect
/design-api
/write-tests
/implement-backend
/implement-frontend
```

**Pros:**
- ✅ Full control over each step
- ✅ Easy to understand and debug
- ✅ Great for learning
- ✅ Lowest token usage
- ✅ Can customize workflow

**Cons:**
- ❌ More commands to run
- ❌ You manage dependencies
- ❌ Manual validation needed

**Best for:**
- Learning the workflow
- Small projects
- Experimentation
- When you want full control

---

### Level 2: Command Orchestration (Recommended)

**Command:** `/new-feature`

**How it works:**
- Main Claude instance follows command instructions
- Launches agents sequentially with your guidance
- You approve major steps
- Semi-automated workflow

**Pros:**
- ✅ Balanced automation and control
- ✅ Clear what's happening
- ✅ Easy to customize
- ✅ Good token efficiency
- ✅ Built-in workflow

**Cons:**
- ❌ Still requires some interaction
- ❌ Less intelligent than full orchestration

**Best for:**
- Most projects (80% of use cases)
- Standard feature development
- Teams learning TDD
- Production work

---

### Level 3: Intelligent Orchestration (Advanced)

**Command:** `/auto-feature`

**How it works:**
- Dedicated orchestrator agent analyzes project
- Makes intelligent decisions about workflow
- Automatically validates outputs
- Handles errors and retries
- Full automation

**Pros:**
- ✅ Maximum automation
- ✅ Intelligent decision-making
- ✅ State management across sessions
- ✅ Error recovery
- ✅ Validation built-in
- ✅ Can run parallel tasks

**Cons:**
- ❌ Higher token usage
- ❌ Less transparent
- ❌ More complex to debug
- ❌ Overkill for simple tasks

**Best for:**
- Complex multi-feature projects
- Large teams
- Repeated similar features
- Advanced users
- Projects with many dependencies

## Decision Matrix

| Project Type | Recommended Level | Why |
|-------------|-------------------|-----|
| Learning/Tutorial | Level 1 (Manual) | Understand each step |
| Small app (< 10 features) | Level 2 (Commands) | Balance of speed and control |
| Medium app (10-50 features) | Level 2 or 3 | Commands for most, orchestration for complex |
| Large app (50+ features) | Level 3 (Orchestration) | Automation saves time |
| Proof of concept | Level 1 or 2 | Quick iteration |
| Production app | Level 2 | Reliability and control |
| Microservices | Level 3 | Complex dependencies |

## When to Use Each

### Use Manual (Level 1) when:
```
- "I'm new to this workflow"
- "I want to experiment with different approaches"
- "My feature doesn't fit the standard workflow"
- "I need to debug a specific step"
- "Token usage is critical"
```

### Use Commands (Level 2) when:
```
- "I want to build a standard feature"
- "I need good balance of speed and control"
- "This is a production project"
- "I want to see what's happening"
- "Team members need to understand the process"
```

### Use Orchestration (Level 3) when:
```
- "I'm building many similar features"
- "Project has complex state to track"
- "I need automated validation"
- "Team needs maximum automation"
- "Error handling is critical"
```

## Example Scenarios

### Scenario 1: First Project
**Situation:** New to the template, building a todo app

**Recommendation:** Level 1 (Manual)
```bash
/requirements
# Review docs/requirements.md

/architect
# Review docs/architecture.md

/design-api
# Review docs/api-spec.md

# etc...
```

**Why:** Learning, understanding each step

---

### Scenario 2: Production E-commerce Site
**Situation:** Building checkout flow for existing site

**Recommendation:** Level 2 (Commands)
```bash
/new-feature
> "Add checkout flow with payment processing"
```

**Why:** Standard workflow, need reliability, team collaboration

---

### Scenario 3: SaaS Platform with 20 Microservices
**Situation:** Adding feature across multiple services

**Recommendation:** Level 3 (Orchestration)
```bash
/auto-feature
> "Add usage analytics across all services"
```

**Why:** Complex dependencies, state management, automation needed

---

## Migration Path

Start simple, increase automation as needed:

```
Week 1-2: Manual (Level 1)
└─> Learn the workflow, understand each agent

Week 3-4: Commands (Level 2)
└─> Faster development, familiar with patterns

Month 2+: Orchestration (Level 3) - Only if needed
└─> Complex projects, automation benefits clear
```

## Token Usage Comparison

Approximate token usage for "Add user login feature":

| Level | Token Usage | Time |
|-------|-------------|------|
| Manual | ~20K tokens | 15 min |
| Commands | ~25K tokens | 10 min |
| Orchestration | ~35K tokens | 5 min |

**Note:** Orchestration is fastest but uses most tokens due to validation and state management overhead.

## Customizing Orchestration

If using Level 3, you can configure the orchestrator:

Create `.claude/orchestrator.config.json`:
```json
{
  "autoValidate": true,        // Validate after each agent
  "parallelExecution": true,   // Run independent tasks in parallel
  "autoRetry": true,           // Retry failed agents once
  "maxRetries": 1,             // Max retry attempts
  "skipOptionalSteps": true,   // Skip non-critical steps if possible
  "verboseLogging": false      // Detailed progress logs
}
```

## Troubleshooting

### "Orchestration is too opaque"
→ Drop down to Level 2 (Commands) for more visibility

### "Too many manual steps"
→ Move up to Level 2 (Commands) if using Manual

### "Orchestrator made wrong decision"
→ Override by using manual commands, or adjust config

### "Can't debug what went wrong"
→ Check agent outputs in `docs/` directory
→ Consider dropping to Level 2 for better visibility

## Recommendation

**For 80% of users and projects:**
Use Level 2 (`/new-feature`) as your default.

Only use orchestration (Level 3) when project complexity clearly demands it.

## Quick Reference

```bash
# Level 1: Full control
/requirements → /architect → /design-api → /write-tests → /implement-backend → /implement-frontend

# Level 2: Balanced (RECOMMENDED)
/new-feature

# Level 3: Full automation (Advanced only)
/auto-feature
```

Start with Level 2 and adjust based on your needs!
