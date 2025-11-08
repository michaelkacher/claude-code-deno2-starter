/**
 * CRUD Service Template (Deno KV)
 *
 * Use this template for services with standard CRUD operations.
 * Complete implementation with Deno KV, secondary indexes, and pagination.
 *
 * Token savings: ~600-800 tokens vs writing from scratch
 *
 * Instructions:
 * 1. Replace [Resource] with your resource name (e.g., User, Task, Workout)
 * 2. Replace [resource] with lowercase version (e.g., user, task, workout)
 * 3. Replace [resources] with plural (e.g., users, tasks, workouts)
 * 4. Update type imports
 * 5. Customize validation logic
 * 6. Add/remove secondary indexes as needed
 * 7. Delete methods that don't apply
 */

import { ValidationError, NotFoundError, ConflictError } from '../lib/errors.ts';

// TODO: Import types from feature data models or shared/types
// import type { [Resource], Create[Resource], Update[Resource] } from '../types/index.ts';

// TODO: Define types if not imported
type [Resource] = {
  id: string;
  // Add resource fields
  createdAt: string;
  updatedAt: string;
};

type Create[Resource] = Omit<[Resource], 'id' | 'createdAt' | 'updatedAt'>;
type Update[Resource] = Partial<Create[Resource]>;

interface PaginationOptions {
  limit?: number;
  cursor?: string;
}

interface PaginatedResult<T> {
  data: T[];
  cursor: string | null;
}

/**
 * [Resource] Service - CRUD operations with Deno KV
 */
export class [Resource]Service {
  constructor(private kv: Deno.Kv) {}

  // ==========================================================================
  // CREATE
  // ==========================================================================

  /**
   * Create a new [resource]
   */
  async create(input: Create[Resource]): Promise<[Resource]> {
    // Validate input
    this.validateCreate(input);

    // TODO: Check for duplicates using secondary index (if applicable)
    // Example: check unique email
    // const existingIdEntry = await this.kv.get<string>([
    //   '[resources]_by_email',
    //   input.email,
    // ]);
    // if (existingIdEntry.value) {
    //   throw new ConflictError('[Resource] with this email already exists');
    // }

    // Create [resource]
    const [resource]: [Resource] = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to KV with atomic operation (includes secondary indexes)
    const result = await this.kv
      .atomic()
      .set(['[resources]', [resource].id], [resource])
      // TODO: Add secondary indexes
      // .set(['[resources]_by_field', input.field], [resource].id)
      .commit();

    if (!result.ok) {
      throw new Error('Failed to create [resource]');
    }

    return [resource];
  }

  /**
   * Validate create input
   */
  private validateCreate(input: Create[Resource]): void {
    // TODO: Add custom validation logic
    // Examples:
    // if (!input.name || input.name.length === 0) {
    //   throw new ValidationError('Name is required');
    // }
    // if (input.name.length > 100) {
    //   throw new ValidationError('Name must be 100 characters or less');
    // }
  }

  // ==========================================================================
  // READ
  // ==========================================================================

  /**
   * Find [resource] by ID
   */
  async findById(id: string): Promise<[Resource] | null> {
    const entry = await this.kv.get<[Resource]>(['[resources]', id]);
    return entry.value;
  }

  /**
   * Get [resource] by ID (throws if not found)
   */
  async getById(id: string): Promise<[Resource]> {
    const [resource] = await this.findById(id);
    if (![resource]) {
      throw new NotFoundError('[Resource] not found');
    }
    return [resource];
  }

  /**
   * Find [resource] by secondary index (e.g., email, username)
   * TODO: Customize field name and update method name
   */
  async findByField(field: string): Promise<[Resource] | null> {
    // Get ID from secondary index
    const idEntry = await this.kv.get<string>(['[resources]_by_field', field]);
    if (!idEntry.value) return null;

    // Get [resource] by ID
    const [resource]Entry = await this.kv.get<[Resource]>(['[resources]', idEntry.value]);
    return [resource]Entry.value;
  }

  /**
   * List all [resources] with pagination
   */
  async findAll(options: PaginationOptions = {}): Promise<PaginatedResult<[Resource]>> {
    const limit = options.limit || 10;
    const [resources]: [Resource][] = [];

    const entries = this.kv.list<[Resource]>({
      prefix: ['[resources]'],
      limit: limit + 1, // Request 1 extra to detect next page
      cursor: options.cursor,
    });

    let nextCursor: string | null = null;
    let count = 0;

    for await (const entry of entries) {
      if (count < limit) {
        [resources].push(entry.value);
        count++;
      } else {
        nextCursor = entry.cursor;
        break;
      }
    }

    return {
      data: [resources],
      cursor: nextCursor,
    };
  }

  /**
   * Count total [resources]
   * Note: This can be expensive for large datasets
   */
  async count(): Promise<number> {
    let count = 0;
    const entries = this.kv.list({ prefix: ['[resources]'] });

    for await (const _ of entries) {
      count++;
    }

    return count;
  }

  // ==========================================================================
  // UPDATE
  // ==========================================================================

  /**
   * Update [resource]
   */
  async update(id: string, updates: Update[Resource]): Promise<[Resource] | null> {
    // Get existing [resource]
    const existing = await this.findById(id);
    if (!existing) return null;

    // Validate updates
    this.validateUpdate(updates);

    // TODO: If updating unique field, check for conflicts
    // if (updates.email && updates.email !== existing.email) {
    //   const existingIdEntry = await this.kv.get<string>([
    //     '[resources]_by_email',
    //     updates.email,
    //   ]);
    //   if (existingIdEntry.value && existingIdEntry.value !== id) {
    //     throw new ConflictError('[Resource] with this email already exists');
    //   }
    // }

    // Create updated [resource]
    const updated: [Resource] = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    };

    // Update in KV (atomic if updating indexes)
    const operation = this.kv.atomic().set(['[resources]', id], updated);

    // TODO: Update secondary indexes if unique field changed
    // if (updates.field && updates.field !== existing.field) {
    //   operation
    //     .delete(['[resources]_by_field', existing.field])
    //     .set(['[resources]_by_field', updates.field], id);
    // }

    const result = await operation.commit();

    if (!result.ok) {
      throw new Error('Failed to update [resource]');
    }

    return updated;
  }

  /**
   * Validate update input
   */
  private validateUpdate(updates: Update[Resource]): void {
    // TODO: Add custom validation logic
    // Examples:
    // if (updates.name !== undefined && updates.name.length === 0) {
    //   throw new ValidationError('Name cannot be empty');
    // }
    // if (updates.name && updates.name.length > 100) {
    //   throw new ValidationError('Name must be 100 characters or less');
    // }
  }

  // ==========================================================================
  // DELETE
  // ==========================================================================

  /**
   * Delete [resource]
   */
  async delete(id: string): Promise<boolean> {
    // Get [resource] to access indexed fields
    const [resource] = await this.findById(id);
    if (![resource]) return false;

    // Delete from KV with atomic operation (includes secondary indexes)
    const operation = this.kv
      .atomic()
      .delete(['[resources]', id]);

    // TODO: Delete secondary indexes
    // operation.delete(['[resources]_by_field', [resource].field]);

    const result = await operation.commit();
    return result.ok;
  }

  /**
   * Soft delete [resource] (marks as deleted instead of removing)
   * TODO: Uncomment if soft delete is needed
   */
  // async softDelete(id: string): Promise<[Resource] | null> {
  //   return this.update(id, { status: 'deleted' } as Update[Resource]);
  // }

  // ==========================================================================
  // CUSTOM BUSINESS LOGIC (Add below)
  // ==========================================================================

  /**
   * TODO: Add custom business logic methods
   * Examples:
   * - Complex queries
   * - Calculations
   * - Status transitions
   * - Relationships
   * - Aggregations
   */
}
