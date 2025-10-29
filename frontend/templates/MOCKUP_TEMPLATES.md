# Mockup Layout Templates

Quick reference for common mockup patterns. Use these as starting points when creating UI mockups.

---

## Layout 1: Centered Card

**Use for:** Login forms, simple displays, modals

```tsx
<div class="min-h-screen bg-gray-50 flex items-center justify-center">
  <div class="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
    <h1 class="text-2xl font-bold mb-4">Title</h1>
    {/* Content */}
  </div>
</div>
```

---

## Layout 2: Dashboard with Sidebar

**Use for:** Admin panels, settings pages

```tsx
<div class="flex min-h-screen">
  {/* Sidebar */}
  <aside class="w-64 bg-gray-800 text-white p-4">
    <nav>
      <a href="#" class="block py-2 px-4 hover:bg-gray-700 rounded">
        Dashboard
      </a>
    </nav>
  </aside>

  {/* Main Content */}
  <main class="flex-1 p-6 bg-gray-50">
    {/* Content */}
  </main>
</div>
```

---

## Layout 3: Grid of Cards

**Use for:** Product listings, portfolios, galleries

```tsx
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {mockItems.map((item) => (
    <div key={item.id} class="bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-semibold">{item.title}</h3>
      <p class="text-gray-600">{item.description}</p>
    </div>
  ))}
</div>
```

---

## Layout 4: Form

**Use for:** Contact forms, user input

```tsx
<form class="space-y-4">
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">
      Name
    </label>
    <input
      type="text"
      class="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
      placeholder="Enter name"
    />
  </div>

  <button
    type="submit"
    class="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
  >
    Submit (Mockup)
  </button>
</form>
```

---

## Layout 5: Data Table

**Use for:** Lists, data displays, admin tables

```tsx
<table class="w-full bg-white shadow rounded-lg overflow-hidden">
  <thead class="bg-gray-100">
    <tr>
      <th class="px-6 py-3 text-left text-sm font-semibold">Name</th>
      <th class="px-6 py-3 text-left text-sm font-semibold">Status</th>
    </tr>
  </thead>
  <tbody>
    {mockData.map((item, idx) => (
      <tr key={idx} class="border-t border-gray-200">
        <td class="px-6 py-4">{item.name}</td>
        <td class="px-6 py-4">{item.status}</td>
      </tr>
    ))}
  </tbody>
</table>
```

---

## Common Tailwind Classes

```css
/* Layout */
.container, .max-w-7xl, .mx-auto, .flex, .grid, .gap-4

/* Typography */
.text-xl, .font-bold, .text-gray-700

/* Colors */
.bg-white, .bg-gray-50, .bg-blue-500, .text-blue-600

/* Spacing */
.p-4, .px-6, .py-3, .space-y-4

/* Effects */
.rounded, .shadow, .hover:bg-blue-600
```

---

## Component Snippets

**Avatar:**
```tsx
<img
  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`}
  alt={name}
  class="w-12 h-12 rounded-full"
/>
```

**Badge:**
```tsx
<span class="inline-block px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
  Status
</span>
```

**Alert:**
```tsx
<div class="bg-blue-50 border-l-4 border-blue-500 p-4">
  <p class="text-blue-700">Informational message</p>
</div>
```

---

For complete examples, see the design system at `frontend/components/design-system/`.
