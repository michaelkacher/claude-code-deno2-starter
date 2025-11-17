# Frontend Patterns Reference

Standard Fresh + Preact patterns for token-efficient frontend implementation.

## Pattern Selection Guide

| Pattern | Use When | Token Savings | Template File |
|---------|----------|---------------|---------------|
| `CRUD_LIST_ROUTE` | Resource listing page | ~500-700 | `route-list.template.tsx` |
| `CRUD_DETAIL_ROUTE` | Single resource view | ~300-400 | `route-detail.template.tsx` |
| `CRUD_FORM_ISLAND` | Create/edit form | ~600-800 | `island-form.template.tsx` |
| `API_CLIENT` | Backend integration | ~200-300 | `api-client.template.ts` |

## Route Patterns (Server-Side Rendered)

### Pattern: `CRUD_LIST_ROUTE`

List page with server-side data fetching and pagination.

**Structure** (Fresh 2):
```typescript
// frontend/routes/resources/index.tsx
import { Handlers, PageProps } from "fresh";
import type { FreshContext } from "fresh";

interface Data {
  resources: Resource[];
  cursor: string | null;
}

// Fresh 2: Single argument (ctx), access request via ctx.req
export const handler: Handlers<Data> = {
  async GET(ctx: FreshContext) {
    // Fetch from backend
    const url = new URL(ctx.req.url);
    const cursor = url.searchParams.get("cursor");

    const res = await fetch(`${API_BASE}/resources?cursor=${cursor || ""}`);
    const data = await res.json();

    return ctx.render({ resources: data.data, cursor: data.cursor });
  },
};

export default function ResourcesPage({ data }: PageProps<Data>) {
  return (
    <div class="container mx-auto p-6">
      <h1>Resources</h1>
      {data.resources.map(r => <ResourceCard key={r.id} resource={r} />)}
      {data.cursor && <a href={`?cursor=${data.cursor}`}>Next →</a>}
    </div>
  );
}
```

---

### Pattern: `CRUD_DETAIL_ROUTE`

Detail page for viewing single resource.

**Structure** (Fresh 2):
```typescript
// frontend/routes/resources/[id].tsx
import { Handlers, PageProps } from "fresh";
import type { FreshContext } from "fresh";

interface Data {
  resource: Resource | null;
}

// Fresh 2: Single argument (ctx)
export const handler: Handlers<Data> = {
  async GET(ctx: FreshContext) {
    const { id } = ctx.params;

    const res = await fetch(`${API_BASE}/resources/${id}`);
    if (!res.ok) return ctx.render({ resource: null });

    const data = await res.json();
    return ctx.render({ resource: data.data });
  },
};

export default function ResourceDetailPage({ data }: PageProps<Data>) {
  if (!data.resource) return <div>Not found</div>;

  return (
    <div class="container mx-auto p-6">
      <h1>{data.resource.name}</h1>
      {/* Resource details */}
    </div>
  );
}
```

---

## Island Patterns (Client-Side Interactive)

### Pattern: `CRUD_FORM_ISLAND`

Interactive form with validation and API integration.

**Structure** (Preact Signals - SSR Safe):
```typescript
// frontend/islands/ResourceForm.tsx
import { useSignal } from "@preact/signals";

export default function ResourceForm({ initialData, onSuccess }) {
  const name = useSignal(initialData?.name || "");
  const isSubmitting = useSignal(false);
  const error = useSignal("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    isSubmitting.value = true;
    error.value = "";

    try {
      const res = await fetch(`${API_BASE}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.value }),
      });

      if (!res.ok) throw new Error("Failed");

      onSuccess?.();
    } catch (err) {
      error.value = err.message;
    } finally {
      isSubmitting.value = false;
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ✅ Pass signal directly in JSX - Preact handles subscription */}
      <input value={name} onInput={(e) => name.value = e.currentTarget.value} />
      
      {/* ✅ Conditional rendering with signal.value in JSX is safe */}
      {error.value && <div class="error">{error}</div>}
      
      <button disabled={isSubmitting.value}>Submit</button>
    </form>
  );
}
```

---

### Pattern: `STATE_MANAGEMENT`

Global state with Preact Signals.

```typescript
// frontend/lib/store.ts
import { signal, computed } from "@preact/signals";
import { IS_BROWSER } from "fresh/runtime";

export const user = signal<User | null>(null);
export const token = signal<string | null>(null);
export const isAuthenticated = computed(() => user.value !== null);

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  user.value = data.user;
  token.value = data.token;
  
  // Guard browser-only APIs
  if (IS_BROWSER) {
    localStorage.setItem("token", data.token);
  }
}
```

---

### Pattern: `SIGNALS_SSR_SAFE`

**CRITICAL**: Proper signal usage for SSR compatibility.

**⚠️ IMPORTANT: Cannot Create Signals Inside Islands During SSR**

The `signal()` function itself is treated as a hook and will break SSR when called inside island components:

```typescript
// ❌ ERROR: "Hook can only be invoked from render methods"
export default function MyIsland() {
  const count = signal(0); // BREAKS SSR - signal() is a hook!
  return <div>{count}</div>;
}
```

**✅ SOLUTION 1: Use useState for Island-Local State (Recommended)**
```typescript
import { useState } from "preact/hooks";

export default function MyIsland({ initialValue = 0 }) {
  // ✅ useState is SSR-safe in islands
  const [count, setCount] = useState(initialValue);
  
  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

**✅ SOLUTION 2: Define Signals Globally (For Shared State)**
```typescript
// lib/store.ts - Define once at module level
import { signal } from "@preact/signals";

export const theme = signal<'light' | 'dark'>('light');

// islands/ThemeToggle.tsx - Use useState, sync with global signal
import { useState, useEffect } from "preact/hooks";
import { theme, setTheme } from "@/lib/store.ts";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  
  // Sync with global signal on client
  useEffect(() => {
    setIsDark(theme.value === 'dark');
    return theme.subscribe(t => setIsDark(t === 'dark'));
  }, []);
  
  const toggle = () => {
    setTheme(isDark ? 'light' : 'dark');
    setIsDark(!isDark);
  };
  
  return <button onClick={toggle}>{isDark ? '🌙' : '☀️'}</button>;
}
```

**❌ WRONG - Accessing global signal .value in render body**:
```typescript
import { theme } from "@/lib/store.ts";

export default function MyIsland() {
  // ❌ ERROR: Accessing .value during SSR
  const isDark = theme.value; // DON'T DO THIS
  
  return <div>{isDark ? 'dark' : 'light'}</div>; // WILL BREAK SSR
}
```

**Key Rules for Signals in Fresh 2**:
1. **Never call `signal()` inside islands** - use `useState` instead
2. **Define global signals at module level** - in separate store files
3. **Sync global signals via useState + useEffect** - for islands that need them
4. **Access .value only in JSX or event handlers** - not in render body
5. **Use useState for island-local state** - it's SSR-safe
4. **Never access .value in render body**: Before return statement
5. **Don't mix useState with signals**: Use signals only

---

## API Client Patterns

### Pattern: `API_CLIENT`

Reusable API client with auth headers.

```typescript
// frontend/lib/api.ts
const API_BASE = "http://localhost:3000/api";

function getHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };
}

export async function fetchResources(cursor?: string) {
  const url = `${API_BASE}/resources${cursor ? `?cursor=${cursor}` : ""}`;
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export async function createResource(data: CreateResource) {
  const res = await fetch(`${API_BASE}/resources`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create");
  return res.json();
}
```

---

## Component Patterns

### Pattern: `CARD_COMPONENT`

Reusable card for displaying resources.

```typescript
// frontend/components/ResourceCard.tsx
interface Props {
  resource: { id: string; name: string; description: string };
}

export function ResourceCard({ resource }: Props) {
  return (
    <div class="p-4 border rounded-lg shadow hover:shadow-md transition">
      <h3 class="text-xl font-semibold">{resource.name}</h3>
      <p class="text-gray-600 mt-2">{resource.description}</p>
      <a href={`/resources/${resource.id}`} class="text-blue-600 mt-4 inline-block">
        View →
      </a>
    </div>
  );
}
```

---

### Pattern: `LOADING_STATE`

Loading indicators.

```typescript
export function LoadingSpinner() {
  return (
    <div class="flex justify-center items-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div class="animate-pulse">
      <div class="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div class="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  );
}
```

---

### Pattern: `ERROR_DISPLAY`

Error message components.

```typescript
export function ErrorMessage({ message }: { message: string }) {
  return (
    <div class="p-4 bg-red-50 text-red-800 rounded-lg" role="alert">
      <p class="font-medium">Error</p>
      <p class="text-sm mt-1">{message}</p>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div class="text-center p-12 text-gray-500">
      <p class="text-lg">{message}</p>
    </div>
  );
}
```

---

## Design System Integration

Use existing design system components from `frontend/components/design-system/`:

```typescript
import { Button } from "@/components/design-system/Button.tsx";
import { Card } from "@/components/design-system/Card.tsx";
import { Input } from "@/components/design-system/Input.tsx";
import { Modal } from "@/components/design-system/Modal.tsx";

// Use in your UI
<Card>
  <Input label="Name" value={name} onChange={setName} />
  <Button variant="primary">Submit</Button>
</Card>
```

---

## Token Savings Summary

| Pattern | Saves per Usage | How |
|---------|-----------------|-----|
| List route template | ~500-700 tokens | Complete page vs from scratch |
| Detail route template | ~300-400 tokens | Complete page vs from scratch |
| Form island template | ~600-800 tokens | Form + validation + API |
| API client pattern | ~200-300 tokens | Reuse vs redeclare |
| Design system components | ~100 tokens/component | Import vs custom |
| **Total per CRUD UI** | **~1700-2300 tokens** | **Per feature** |

---

## Best Practices

✅ **Use design system** - Import from `components/design-system/`
✅ **Server-render first** - Use routes, add islands only when needed
✅ **Reference API spec** - Match backend data structures
✅ **Signals for state** - Not useState (Fresh/Preact, not React)
✅ **Fresh 2 handlers** - Single `(ctx)` argument, access `ctx.req` for request
✅ **Signals in JSX** - Pass directly `{signal}`, access `.value` only in expressions
✅ **Guard browser APIs** - Use `IS_BROWSER` for localStorage/sessionStorage
✅ **Accessibility** - ARIA labels, semantic HTML, keyboard nav

❌ **Don't use React hooks** - Use Preact Signals
❌ **Don't use old handlers** - `(req, ctx)` is Fresh 1, use `(ctx)` for Fresh 2
❌ **Don't access signal.value in render** - Causes SSR errors, use in JSX instead
❌ **Don't mix useState with signals** - Anti-pattern, use signals only
❌ **Don't make everything an island** - Server-render when possible
❌ **Don't duplicate API client** - Reuse api.ts
❌ **Don't skip design system** - Use existing components
