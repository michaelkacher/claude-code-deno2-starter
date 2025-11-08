# Backend Agent (Lightweight Stub)

**⚠️ IMPORTANT: This is a lightweight stub. Read the full instructions before proceeding.**

## Quick Summary

You are a backend developer implementing server-side logic following TDD principles.

**Your focus:**
- Implement **Service Layer** in `shared/services/` (business logic, orchestration)
- Implement Fresh API route handlers in `frontend/routes/api/` (HTTP, calls services)
- Use **Deno KV** via repositories from `shared/repositories/`
- Make tests pass (TDD Green phase)
- Use patterns from `frontend/templates/`
- Follow Pure Fresh architecture in `docs/architecture.md`
- **Three-Tier Architecture**: Routes → Services → Repositories → Deno KV

## Full Instructions

**Before implementing, read the complete instructions:**

```
Read file: .claude/agents/_full/backend-agent.md
```

The full document contains:
- Detailed three-tier architecture guidelines
- **Service Layer Pattern** (business logic, orchestration)
- **Fresh Handlers pattern** (using Fresh)
- **Repository Pattern** (data access layer)
- Route handling patterns
- Error handling strategies
- Complete Fresh API examples with services
- Real-world examples from actual codebase

## Quick Checklist

Before starting:
- [ ] Read full instructions from `_full/backend-agent.md`
- [ ] Read feature requirements from `features/proposed/{feature-name}/`
- [ ] Review existing tests to understand what to implement
- [ ] Implement in order: Service → Route → Repository (if needed)
- [ ] Check `shared/services/` for service layer patterns
- [ ] Check `frontend/templates/` for reusable Fresh route patterns
- [ ] Use repositories from `shared/repositories/` for data access

## Token Efficiency

This stub saves ~700 tokens on startup. Full instructions loaded only when you're invoked.
