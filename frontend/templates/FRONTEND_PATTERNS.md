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

**Structure**:
```typescript
// frontend/routes/resources/index.tsx
import { Handlers, PageProps } from "$fresh/server.ts";

interface Data {
  resources: Resource[];
  cursor: string | null;
}

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    // Fetch from backend
    const url = new URL(req.url);
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

**Structure**:
```typescript
// frontend/routes/resources/[id].tsx
import { Handlers, PageProps } from "$fresh/server.ts";

interface Data {
  resource: Resource | null;
}

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
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

**Structure**:
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

  return <form onSubmit={handleSubmit}>{ /* ... */ }</form>;
}
```

---

### Pattern: `STATE_MANAGEMENT`

Global state with Preact Signals.

```typescript
// frontend/lib/store.ts
import { signal, computed } from "@preact/signals";

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
  localStorage.setItem("token", data.token);
}
```

---

## API Client Patterns

### Pattern: `API_CLIENT`

Reusable API client with auth headers.

```typescript
// frontend/lib/api.ts
const API_BASE = "http://localhost:8000/api/v1";

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
✅ **Accessibility** - ARIA labels, semantic HTML, keyboard nav

❌ **Don't use React hooks** - Use Preact Signals
❌ **Don't make everything an island** - Server-render when possible
❌ **Don't duplicate API client** - Reuse api.ts
❌ **Don't skip design system** - Use existing components
