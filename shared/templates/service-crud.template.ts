/**
 * CRUD Service Template (Repository Pattern + WebSocket)
 *
 * Modern service template following the app's architecture:
 * - Static methods wrapping repository calls
 * - WebSocket broadcasting for real-time updates
 * - Proper separation: Service → Repository → Deno KV
 * - Integration with channel-based WebSocket system
 *
 * Token savings: ~600-800 tokens vs writing from scratch
 *
 * Instructions:
 * 1. Replace [Resource] with your resource name (e.g., Post, Task, Product)
 * 2. Replace [resource] with lowercase version (e.g., post, task, product)
 * 3. Replace [resources] with plural (e.g., posts, tasks, products)
 * 4. Update type imports from your feature's data models
 * 5. Customize validation and business logic
 * 6. Add/remove WebSocket broadcasts as needed
 * 7. Update broadcast channel name if using custom channels
 */

import { [Resource]Repository } from '../repositories/index.ts';
import type {
  Create[Resource]Request,
  [Resource]Data,
} from '../types/[resources].ts';

/**
 * [Resource] Service
 * Thin wrapper around [Resource]Repository with WebSocket broadcasting
 * 
 * Architecture:
 * - Service methods are static (stateless)
 * - Repository handles all KV operations
 * - WebSocket broadcasts notify connected clients of changes
 */
export class [Resource]Service {
  private static repo = new [Resource]Repository();

  // ==========================================================================
  // CREATE
  // ==========================================================================

  /**
   * Create a new [resource]
   * Broadcasts to WebSocket clients for real-time updates
   */
  static async create(
    data: Create[Resource]Request,
  ): Promise<[Resource]Data> {
    // Validate input (optional - can also be done in repository)
    this.validateCreate(data);

    // Create via repository
    const [resource] = await this.repo.create(
      // TODO: Add repository method parameters
      // Example: data.userId, data.title, data.content
    );

    // Broadcast to WebSocket clients for real-time updates
    try {
      // Option A: Broadcast to specific user
      const { notifyUser } = await import('../lib/notification-websocket.ts');
      notifyUser(data.userId, [resource]);

      // Option B: Broadcast to custom channel (for features like jobs, analytics)
      // const { sendToUser } = await import('../lib/notification-websocket.ts');
      // sendToUser(data.userId, {
      //   type: '[resource]_created',
      //   [resource]: [resource],
      // });

      // Option C: Broadcast to all connected clients (admin features)
      // const { broadcast } = await import('../lib/notification-websocket.ts');
      // broadcast({
      //   type: '[resource]_created',
      //   [resource]: [resource],
      // });
    } catch (wsError) {
      // WebSocket broadcast is not critical, just log if it fails
      console.debug('WebSocket broadcast failed (non-critical):', wsError);
    }

    return [resource];
  }

  /**
   * Validate create input
   */
  private static validateCreate(data: Create[Resource]Request): void {
    // TODO: Add custom validation logic
    // Examples:
    // if (!data.title || data.title.trim().length === 0) {
    //   throw new Error('Title is required');
    // }
    // if (data.title.length > 200) {
    //   throw new Error('Title must be 200 characters or less');
    // }
  }

  // ==========================================================================
  // READ
  // ==========================================================================

  /**
   * Get [resource] by ID
   */
  static async getById(
    userId: string,
    [resource]Id: string,
  ): Promise<[Resource]Data | null> {
    return await this.repo.findById(userId, [resource]Id);
  }

  /**
   * Get all [resources] for a user
   */
  static async getUserResources(
    userId: string,
    options: { limit?: number; offset?: number } = {},
  ): Promise<[Resource]Data[]> {
    const result = await this.repo.listUser[Resource]s(userId, {
      limit: options.limit || 50,
      cursor: options.offset ? String(options.offset) : undefined,
    });
    return result.items;
  }

  /**
   * Get count of [resources] for a user (optional)
   */
  static async getCount(userId: string): Promise<number> {
    return await this.repo.getCount(userId);
  }

  // ==========================================================================
  // UPDATE
  // ==========================================================================

  /**
   * Update [resource]
   * Broadcasts to WebSocket clients for real-time updates
   */
  static async update(
    userId: string,
    [resource]Id: string,
    updates: Partial<[Resource]Data>,
  ): Promise<[Resource]Data | null> {
    const [resource] = await this.repo.update(userId, [resource]Id, updates);

    // Broadcast update to WebSocket clients
    if ([resource]) {
      try {
        const { sendToUser } = await import('../lib/notification-websocket.ts');
        sendToUser(userId, {
          type: '[resource]_update',
          [resource]: [resource],
        });
      } catch (wsError) {
        console.debug('WebSocket broadcast failed (non-critical):', wsError);
      }
    }

    return [resource];
  }

  // ==========================================================================
  // DELETE
  // ==========================================================================

  /**
   * Delete [resource]
   * Broadcasts to WebSocket clients for real-time updates
   */
  static async delete(
    userId: string,
    [resource]Id: string,
  ): Promise<boolean> {
    const deleted = await this.repo.delete[Resource](userId, [resource]Id);

    // Broadcast deletion to WebSocket clients
    if (deleted) {
      try {
        const { sendToUser } = await import('../lib/notification-websocket.ts');
        sendToUser(userId, {
          type: '[resource]_deleted',
          [resource]Id: [resource]Id,
        });
      } catch (wsError) {
        console.debug('WebSocket broadcast failed (non-critical):', wsError);
      }
    }

    return deleted;
  }

  /**
   * Delete all [resources] for a user (useful for cleanup/testing)
   */
  static async deleteAllForUser(userId: string): Promise<number> {
    let count = 0;
    const result = await this.repo.listUser[Resource]s(userId, { limit: 1000 });
    
    for (const [resource] of result.items) {
      const deleted = await this.delete(userId, [resource].id);
      if (deleted) count++;
    }

    return count;
  }

  // ==========================================================================
  // CUSTOM BUSINESS LOGIC (Add below)
  // ==========================================================================

  /**
   * TODO: Add custom business logic methods
   * 
   * Examples:
   * - Complex queries with filters
   * - Status transitions (e.g., publish, archive)
   * - Calculations or aggregations
   * - Relationships between resources
   * - Batch operations
   * 
   * Pattern:
   * 1. Call repository method(s)
   * 2. Apply business logic
   * 3. Broadcast via WebSocket if needed
   * 4. Return result
   */

  /**
   * Example: Publish a [resource]
   */
  // static async publish(
  //   userId: string,
  //   [resource]Id: string,
  // ): Promise<[Resource]Data | null> {
  //   // Get existing [resource]
  //   const [resource] = await this.getById(userId, [resource]Id);
  //   if (![resource]) return null;
  //
  //   // Business logic: check if publishable
  //   if ([resource].status !== 'draft') {
  //     throw new Error('[Resource] is not in draft status');
  //   }
  //
  //   // Update status via repository
  //   const published = await this.repo.update(userId, [resource]Id, {
  //     status: 'published',
  //     publishedAt: new Date().toISOString(),
  //   });
  //
  //   // Broadcast publication event
  //   if (published) {
  //     try {
  //       const { sendToUser } = await import('../lib/notification-websocket.ts');
  //       sendToUser(userId, {
  //         type: '[resource]_published',
  //         [resource]: published,
  //       });
  //     } catch (wsError) {
  //       console.debug('WebSocket broadcast failed (non-critical):', wsError);
  //     }
  //   }
  //
  //   return published;
  // }
}
