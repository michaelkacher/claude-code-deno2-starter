# Frontend Templates

Token-efficient templates for Fresh + Preact frontend implementation.

## Quick Reference

| Template | Use For | Tokens Saved |
|----------|---------|--------------|
| `route-list.template.tsx` | Resource listing page | ~500-700 |
| `FRONTEND_PATTERNS.md` | Patterns reference | ~400-600 |
| Design system components | Reusable UI | ~100/component |

## Usage

### Simple CRUD UI

1. **List page**: Copy `route-list.template.tsx` → `frontend/routes/users/index.tsx`
2. **Replace placeholders**: `[Resource]` → `User`, `[resources]` → `users`
3. **Form island**: Reference `FRONTEND_PATTERNS.md` > `CRUD_FORM_ISLAND`
4. **Detail page**: Reference `FRONTEND_PATTERNS.md` > `CRUD_DETAIL_ROUTE`
5. **Use design system**: Import from `components/design-system/`

**Result**: Complete CRUD UI in ~800 tokens (vs ~2500 from scratch)

## Token Savings

**Per CRUD feature**:
- List route: ~500-700 tokens saved
- Form island: ~600-800 tokens saved
- Design system usage: ~300-400 tokens saved
- **Total: ~1400-1900 tokens saved (55-60% reduction)**

## Design System

Already available in `frontend/components/design-system/`:
- Button, Card, Input, Modal, Panel
- Badge, Avatar, Progress, Layout

**Import and use** instead of creating custom components!

See `docs/FRONTEND_OPTIMIZATION_GUIDE.md` for details.
