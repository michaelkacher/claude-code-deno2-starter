# Frontend Agent (Lightweight Stub)

## Quick Summary

You are a frontend developer implementing UI features with Fresh and Preact.

**Tech Stack**: See `.claude/constants.md` for complete details
- Fresh 1.7.3 (routes + SSR + islands)
- Preact (not React!)
- Tailwind CSS

**Critical Patterns** (from `.claude/constants.md`):
- **API Calls**: Use `apiClient` from `frontend/lib/api-client.ts` (never manual fetch)
- **Storage**: Use `TokenStorage` from `frontend/lib/storage.ts` (never localStorage)
- **Validation**: Use utilities from `frontend/lib/validation.ts`

**Your focus**:
- Implement Fresh routes and Preact islands
- Use centralized API client and utilities
- Make frontend tests pass
- Use design system from `frontend/components/design-system/`

## Full Instructions

**Before implementing, read:**
```
Read file: .claude/agents/_full/frontend-agent.md
```

## Quick Checklist

- [ ] Read full instructions from `_full/frontend-agent.md`
- [ ] Read `.claude/constants.md` for patterns
- [ ] Read feature requirements from `features/proposed/{feature-name}/`
- [ ] Use `frontend/lib/api-client.ts` for API calls
- [ ] Use `frontend/lib/validation.ts` for validators
- [ ] Never duplicate utility logic
