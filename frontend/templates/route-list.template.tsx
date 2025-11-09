/**
 * CRUD List Route Template (Fresh + Preact)
 *
 * Token savings: ~500-700 tokens vs writing from scratch
 *
 * Instructions:
 * 1. Copy to frontend/routes/[resources]/index.tsx
 * 2. Replace [Resource], [resource], [resources]
 * 3. Update types to match your data model
 * 4. Customize card component or create separate component file
 * 5. Add filters/search if needed
 */

import { Handlers, PageProps } from "$fresh/server.ts";

// TODO: Import types from feature data models
// import type { Resource } from "@/types/index.ts";

// TODO: Define type
type Resource = {
  id: string,
  name: string,
  // Add other fields
  createdAt: string,
  updatedAt: string,
};

interface Data {
  resources: Resource[],
  cursor: string | null,
  error?: string;
}

const API_BASE = "/api";

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    try {
      // Get pagination cursor from query params
      const url = new URL(req.url);
      const cursor = url.searchParams.get("cursor");
      const limit = url.searchParams.get("limit") || "10";

      // Fetch from backend
      const res = await fetch(
        `${API_BASE}/[resources]?limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`,
        {
          headers: {
            // TODO: Add auth if required
            // "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch [resources]");
      }

      const data = await res.json();

      return ctx.render({
        [resources]: data.data || [],
        cursor: data.cursor || null,
      });
    } catch (error) {
      console.error("[Resources] fetch error:", error);
      return ctx.render({
        [resources]: [],
        cursor: null,
        error: "Failed to load [resources]",
      });
    }
  },
};

export default function [Resource]sPage({ data }: PageProps<Data>) {
  return (
    <div class="min-h-screen bg-gray-50">
      {/* Header */}
      <header class="bg-white shadow-sm">
        <div class="container mx-auto px-4 py-6">
          <div class="flex justify-between items-center">
            <h1 class="text-3xl font-bold text-gray-900">[Resources]</h1>
            <a
              href="/[resources]/create"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              + Create [Resource]
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main class="container mx-auto px-4 py-8">
        {/* Error State */}
        {data.error && (
          <div class="p-4 bg-red-50 text-red-800 rounded-lg mb-6" role="alert">
            {data.error}
          </div>
        )}

        {/* Empty State */}
        {!data.error && data.[resources].length === 0 && (
          <div class="text-center py-12">
            <p class="text-gray-500 text-lg mb-4">No [resources] yet</p>
            <a
              href="/[resources]/create"
              class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Create your first [resource]
            </a>
          </div>
        )}

        {/* Grid of [Resources] */}
        {data.[resources].length > 0 && (
          <div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.[resources].map(([resource]) => (
                <[Resource]Card key={[resource].id} [resource]={[resource]} />
              ))}
            </div>

            {/* Pagination */}
            {data.cursor && (
              <div class="mt-8 flex justify-center">
                <a
                  href={`?cursor=${data.cursor}`}
                  class="px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Load More →
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * [Resource] Card Component
 * TODO: Move to separate file (frontend/components/[Resource]Card.tsx)
 */
function [Resource]Card({ [resource] }: { [resource]: [Resource] }) {
  return (
    <div class="bg-white rounded-lg shadow-sm hover:shadow-md transition p-6">
      <h3 class="text-xl font-semibold text-gray-900 mb-2">
        {[resource].name}
      </h3>

      {/* TODO: Add other fields */}
      <p class="text-sm text-gray-500 mb-4">
        {new Date([resource].createdAt).toLocaleDateString()}
      </p>

      <div class="flex gap-2">
        <a
          href={`/[resources]/${[resource].id}`}
          class="flex-1 text-center px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition"
        >
          View Details
        </a>
        <a
          href={`/[resources]/${[resource].id}/edit`}
          class="flex-1 text-center px-4 py-2 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition"
        >
          Edit
        </a>
      </div>
    </div>
  );
}
