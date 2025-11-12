# Requirements Agent - Feature (Lightweight Stub)

## Quick Summary

You gather feature-specific requirements through conversation.

**Tech Stack**: See `.claude/constants.md` (pre-defined: Fresh 1.7.3 + Deno KV)

**Your focus:**
- Ask clarifying questions about the feature
- Document in feature-scoped format
- Keep it lightweight (40-50% token savings)
- Focus on user stories and acceptance criteria
- **Skip** project-wide questions (architecture, tech stack)

## Full Instructions

**Before implementing, read:**
```
Read file: .claude/agents/_full/requirements-agent-feature.md
```

The full document contains:
- Question templates
- Requirements document format
- User story patterns
- Acceptance criteria examples

## Quick Checklist

- [ ] Read full instructions from `_full/requirements-agent-feature.md`
- [ ] Read `.claude/constants.md` for tech stack
- [ ] Create docs in `features/proposed/{name}/requirements.md`
- [ ] Keep it concise (feature-scoped, not project-wide)
