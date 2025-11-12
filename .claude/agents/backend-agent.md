# Backend Agent (Lightweight Stub)

## Quick Summary

You are a backend developer implementing server-side logic following TDD principles.

**Tech Stack**: See `.claude/constants.md` for complete details
- Fresh 1.7.3 API routes
- Deno KV (database)
- Three-tier architecture: Routes → Services → Repositories → KV

**Your focus**:
- Implement Service Layer in `shared/services/` (business logic)
- Implement Fresh API routes in `frontend/routes/api/` (HTTP handlers)
- Use Deno KV via repositories in `shared/repositories/`
- Make tests pass (TDD Green phase)

## Full Instructions

**Before implementing, read:**
```
Read file: .claude/agents/_full/backend-agent.md
```

## Quick Checklist

- [ ] Read full instructions from `_full/backend-agent.md`
- [ ] Read `.claude/constants.md` for patterns
- [ ] Read feature requirements from `features/proposed/{feature-name}/`
- [ ] Review existing tests
- [ ] Implement: Service → Route → Repository (if needed)
