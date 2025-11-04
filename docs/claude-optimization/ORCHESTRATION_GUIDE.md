# Orchestration Guide

This guide explains when and how to use the orchestration agent vs. simpler approaches.

## Three Levels of Automation

### Level 1: Guided Workflow (Recommended)

**Commands:** `/new-feature`
```bash
/new-feature
> "Add user authentication"
```

**Pros:**
- ✅ Semi-automated with guided steps
- ✅ User approval at key decision points
- ✅ Handles most projects (80% of use cases)
- ✅ Good balance of control and automation
- ✅ Clear progress tracking

**Cons:**
- ❌ Less control than manual approach
- ❌ May ask questions you want to skip

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

**Recommendation:** Level 1 (Guided)
```bash
/new-feature
> "Add shopping cart feature"
```

**Why:** Learning, understanding each step

---

### Scenario 2: Production E-commerce Site
**Situation:** Building checkout flow for existing site

**Recommendation:** Level 1 (Guided)
```bash
/new-feature
> "Add checkout flow with payment processing"
```

**Why:** Standard workflow, need reliability, team collaboration

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



## Troubleshooting

### "I don't know where to start"
→ Use `/new-feature` - it guides you through the process

### "I need to update architecture first"
→ Run `/requirements` then `/architect`, then `/new-feature`

### "The workflow isn't working for my use case"
→ Check `features/` directory for feature-specific documentation
→ Review the agents in `.claude/agents/` and customize if needed

## Recommendation

**For all users and projects:**
Use `/new-feature` as your default workflow.

## Quick Reference

```bash
# Recommended: Complete feature workflow
/new-feature

# Optional: Initial setup
/requirements → /architect
```

Start with `/new-feature` for all features!
