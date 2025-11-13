# Import Path Quick Reference

**⚠️ CRITICAL: Use this reference BEFORE writing any import statements**

## 🎯 Quick Calculator

Run this command to get the exact import path:
```bash
deno run -A scripts/calculate-import-path.ts <from-file> <to-file>
```

Example:
```bash
deno run -A scripts/calculate-import-path.ts \
  frontend/routes/tasks/create.tsx \
  frontend/islands/TaskCreationWizard.tsx
```

---

## 📐 Common Import Patterns (Copy-Paste Ready)

### From Routes to Islands

| From File Location | To Islands | Import Path |
|-------------------|------------|-------------|
| `routes/*.tsx` | `islands/Component.tsx` | `../islands/Component.tsx` |
| `routes/tasks/*.tsx` | `islands/Component.tsx` | `../../islands/Component.tsx` |
| `routes/api/tasks/*.ts` | N/A (routes don't import islands) | N/A |

### From Routes to Lib

| From File Location | To Lib | Import Path |
|-------------------|--------|-------------|
| `routes/*.tsx` | `lib/helper.ts` | `../lib/helper.ts` |
| `routes/tasks/*.tsx` | `lib/helper.ts` | `../../lib/helper.ts` |
| `routes/api/tasks/*.ts` | `lib/fresh-helpers.ts` | `../../../lib/fresh-helpers.ts` |

### From API Routes to Shared

| From File Location | To Shared | Import Path |
|-------------------|-----------|-------------|
| `routes/api/tasks/index.ts` | `shared/services/task.service.ts` | `../../../../shared/services/task.service.ts` |
| `routes/api/tasks/[id].ts` | `shared/services/task.service.ts` | `../../../../shared/services/task.service.ts` |

### From Islands to Components

| From File Location | To Components | Import Path |
|-------------------|---------------|-------------|
| `islands/TaskCreator.tsx` | `components/design-system/Button.tsx` | `../components/design-system/Button.tsx` |
| `islands/TaskCreator.tsx` | `lib/api-client.ts` | `../lib/api-client.ts` |

### From Islands to Shared Types

| From File Location | To Shared Types | Import Path |
|-------------------|-----------------|-------------|
| `islands/TaskCreator.tsx` | `shared/types/task.types.ts` | `../../shared/types/task.types.ts` |

---

## 🔢 Counting Levels (When Calculator Not Available)

**Rule**: Count how many directories you need to go UP, then go DOWN to target.

Example: `routes/tasks/create.tsx` → `islands/TaskCreationWizard.tsx`

```
frontend/
├── routes/
│   └── tasks/
│       └── create.tsx          ← START HERE
└── islands/
    └── TaskCreationWizard.tsx  ← END HERE
```

**Steps:**
1. Count UP: `tasks/` → `routes/` (1 level) → `frontend/` (2 levels)
2. Count DOWN: `frontend/` → `islands/` → `TaskCreationWizard.tsx`
3. Result: `../../islands/TaskCreationWizard.tsx`

---

## ❌ Common Mistakes

### Mistake 1: Not enough `../`
```typescript
// ❌ WRONG (from routes/tasks/create.tsx)
import X from "../islands/TaskCreationWizard.tsx";
// This looks for: routes/islands/TaskCreationWizard.tsx (doesn't exist!)

// ✅ CORRECT
import X from "../../islands/TaskCreationWizard.tsx";
```

### Mistake 2: Too many `../`
```typescript
// ❌ WRONG (from routes/create.tsx)
import X from "../../islands/TaskCreationWizard.tsx";
// This looks for: parent-of-frontend/islands/TaskCreationWizard.tsx (doesn't exist!)

// ✅ CORRECT
import X from "../islands/TaskCreationWizard.tsx";
```

### Mistake 3: Using absolute paths
```typescript
// ❌ WRONG - Deno doesn't support this
import X from "/frontend/islands/TaskCreationWizard.tsx";

// ✅ CORRECT - Always use relative paths
import X from "../../islands/TaskCreationWizard.tsx";
```

---

## 🎓 When to Use What

| If you're creating... | Copy pattern from... | Depth |
|----------------------|---------------------|-------|
| New route file | Existing route at same level | Check sibling file |
| New island | Any existing island | 1 level from frontend/ |
| New API route | Existing API route in same folder | Usually 4 levels to shared/ |
| New service | Any existing service | N/A (services import repos) |

---

## 💡 Pro Tips

1. **Always check existing files first** - Find a similar file and copy its import pattern
2. **Use the calculator** - When in doubt, run `calculate-import-path.ts`
3. **Test immediately** - After creating the file, start the dev server to catch errors fast
4. **Look at fresh.gen.ts** - After server starts, check if your file is registered correctly

---

## 🆘 Troubleshooting

### Error: "Module not found"
1. Check the import path character by character
2. Count the `../` levels manually
3. Run the calculator script
4. Check fresh.gen.ts to see what path Fresh expects

### Error: "Cannot find module"
- Make sure you're using `.tsx` or `.ts` extension in the import
- Make sure the file actually exists at that path
- Restart the dev server (Fresh caches imports)

---

**Remember: When generating new files, ALWAYS use the calculator or copy from existing files at the same directory level!**
