/**
 * Generic Markdown Sync Engine
 * 
 * Convention-based system that syncs markdown files to Deno KV
 * Works with any data model through configuration
 */

import { z } from 'zod';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Sync configuration for a data model
 */
export interface ModelConfig {
  kvPrefix: string;              // KV key prefix (e.g., 'workout_category')
  typeName: string;              // TypeScript type name
  typeFile: string;              // Type definition file path
  parser: string;                // Parser name ('default' or custom)
  validator?: string;            // Zod schema name for validation
  options?: {
    preserveIds?: boolean;       // Preserve existing IDs on update
    softDelete?: boolean;        // Mark as deleted instead of removing
    timestampFields?: {          // Auto-manage timestamp fields
      created?: string;          // Field name for creation time
      updated?: string;          // Field name for update time
    };
  };
}

/**
 * Overall sync configuration
 */
export interface SyncConfig {
  models: Record<string, ModelConfig>;
}

/**
 * Sync options
 */
export interface SyncOptions {
  dryRun?: boolean;              // Preview changes without applying
  force?: boolean;               // Overwrite all + delete missing
  verbose?: boolean;             // Detailed output
  models?: string[];             // Only sync specific models
}

/**
 * Sync result for a single model
 */
export interface ModelSyncResult {
  model: string;
  created: string[];
  updated: string[];
  deleted: string[];
  skipped: string[];
  errors: Array<{ file: string; error: string }>;
}

/**
 * Overall sync result
 */
export interface SyncResult {
  models: ModelSyncResult[];
  totalCreated: number;
  totalUpdated: number;
  totalDeleted: number;
  totalSkipped: number;
  totalErrors: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    model: string;
    file: string;
    errors: string[];
  }>;
}

/**
 * Markdown parser interface
 */
export interface MarkdownParser {
  parse(content: string, recordId: string): Promise<Record<string, unknown>>;
}

// ============================================================================
// Generic Markdown Sync Service
// ============================================================================

/**
 * Generic markdown sync service
 * Works with any data model through convention-based configuration
 */
export class MarkdownSyncService {
  private config: SyncConfig;
  private parsers: Map<string, MarkdownParser>;
  private validators: Map<string, z.ZodSchema>;

  constructor(
    private kv: Deno.Kv,
    config: SyncConfig,
    parsers: Map<string, MarkdownParser>,
    validators: Map<string, z.ZodSchema>,
  ) {
    this.config = config;
    this.parsers = parsers;
    this.validators = validators;
  }

  /**
   * Sync all models or specific models
   */
  async sync(
    dataDir: string,
    options: SyncOptions = {},
  ): Promise<SyncResult> {
    const result: SyncResult = {
      models: [],
      totalCreated: 0,
      totalUpdated: 0,
      totalDeleted: 0,
      totalSkipped: 0,
      totalErrors: 0,
    };

    // Determine which models to sync
    const modelsToSync = options.models || Object.keys(this.config.models);

    for (const modelName of modelsToSync) {
      const modelConfig = this.config.models[modelName];
      if (!modelConfig) {
        console.warn(`⚠️  Model "${modelName}" not found in config, skipping`);
        continue;
      }

      const modelPath = `${dataDir}/${modelName}`;

      // Check if directory exists
      try {
        await Deno.stat(modelPath);
      } catch {
        console.warn(`⚠️  Directory not found: ${modelPath}, skipping`);
        continue;
      }

      const modelResult = await this.syncModel(
        modelName,
        modelPath,
        modelConfig,
        options,
      );

      result.models.push(modelResult);
      result.totalCreated += modelResult.created.length;
      result.totalUpdated += modelResult.updated.length;
      result.totalDeleted += modelResult.deleted.length;
      result.totalSkipped += modelResult.skipped.length;
      result.totalErrors += modelResult.errors.length;
    }

    // Log sync history
    if (!options.dryRun && result.models.length > 0) {
      await this.logSyncHistory(result);
    }

    return result;
  }

  /**
   * Sync a single model
   */
  private async syncModel(
    modelName: string,
    modelPath: string,
    modelConfig: ModelConfig,
    options: SyncOptions,
  ): Promise<ModelSyncResult> {
    const result: ModelSyncResult = {
      model: modelName,
      created: [],
      updated: [],
      deleted: [],
      skipped: [],
      errors: [],
    };

    // Get parser - try model-specific first (for configured parsers), then by parser name, then default
    const parser = this.parsers.get(modelName) ||
      this.parsers.get(modelConfig.parser) ||
      this.parsers.get('default');
    if (!parser) {
      throw new Error(
        `Parser "${modelConfig.parser}" not found for model "${modelName}" and no default parser available`,
      );
    }

    // Get validator
    const validator = modelConfig.validator
      ? this.validators.get(modelConfig.validator)
      : undefined;

    // Read all markdown files
    const files: string[] = [];
    for await (const entry of Deno.readDir(modelPath)) {
      if (entry.isFile && entry.name.endsWith('.md')) {
        files.push(entry.name);
      }
    }

    // Process each file
    for (const filename of files) {
      const filePath = `${modelPath}/${filename}`;
      const recordId = filename.replace('.md', '');

      try {
        // Parse markdown
        const content = await Deno.readTextFile(filePath);
        const parsed = await parser.parse(content, recordId);

        // Validate
        if (validator) {
          const validation = validator.safeParse(parsed);
          if (!validation.success) {
            result.errors.push({
              file: filename,
              error: `Validation failed: ${
                validation.error.errors.map((e) =>
                  `${e.path.join('.')}: ${e.message}`
                ).join(', ')
              }`,
            });
            continue;
          }
        }

        // Check if record exists
        const kvKey = [modelConfig.kvPrefix, recordId];
        const existing = await this.kv.get(kvKey);

        if (existing.value && !options.force) {
          // Check if content changed
          const hasChanges = this.hasChanges(
            existing.value as Record<string, unknown>,
            parsed,
          );

          if (!hasChanges) {
            result.skipped.push(recordId);
            continue;
          }

          // Update
          if (!options.dryRun) {
            await this.updateRecord(
              kvKey,
              existing.value as Record<string, unknown>,
              parsed,
              modelConfig,
            );
          }
          result.updated.push(recordId);
        } else {
          // Create
          if (!options.dryRun) {
            await this.createRecord(kvKey, parsed, modelConfig);
          }
          result.created.push(recordId);
        }
      } catch (error) {
        result.errors.push({
          file: filename,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Handle deletions
    if (options.force) {
      const markdownIds = files.map((f) => f.replace('.md', ''));
      const dbIds = await this.getModelRecordIds(modelConfig.kvPrefix);

      for (const dbId of dbIds) {
        if (!markdownIds.includes(dbId)) {
          if (!options.dryRun) {
            await this.deleteRecord([modelConfig.kvPrefix, dbId], modelConfig);
          }
          result.deleted.push(dbId);
        }
      }
    }

    return result;
  }

  /**
   * Create a new record
   */
  private async createRecord(
    kvKey: Deno.KvKey,
    data: Record<string, unknown>,
    config: ModelConfig,
  ): Promise<void> {
    const now = new Date().toISOString();

    // Add timestamps if configured
    if (config.options?.timestampFields) {
      if (config.options.timestampFields.created) {
        data[config.options.timestampFields.created] = now;
      }
      if (config.options.timestampFields.updated) {
        data[config.options.timestampFields.updated] = now;
      }
    }

    await this.kv.set(kvKey, data);
  }

  /**
   * Update an existing record
   */
  private async updateRecord(
    kvKey: Deno.KvKey,
    existing: Record<string, unknown>,
    updated: Record<string, unknown>,
    config: ModelConfig,
  ): Promise<void> {
    // Preserve creation timestamp if configured
    if (config.options?.timestampFields?.created) {
      const createdField = config.options.timestampFields.created;
      if (existing[createdField]) {
        updated[createdField] = existing[createdField];
      }
    }

    // Update timestamp if configured
    if (config.options?.timestampFields?.updated) {
      updated[config.options.timestampFields.updated] = new Date()
        .toISOString();
    }

    await this.kv.set(kvKey, updated);
  }

  /**
   * Delete a record
   */
  private async deleteRecord(
    kvKey: Deno.KvKey,
    config: ModelConfig,
  ): Promise<void> {
    if (config.options?.softDelete) {
      // Soft delete: mark as deleted
      const existing = await this.kv.get(kvKey);
      if (existing.value) {
        const updated = existing.value as Record<string, unknown>;
        updated.deleted = true;
        updated.deletedAt = new Date().toISOString();
        await this.kv.set(kvKey, updated);
      }
    } else {
      // Hard delete
      await this.kv.delete(kvKey);
    }
  }

  /**
   * Check if data has changes
   */
  private hasChanges(
    existing: Record<string, unknown>,
    updated: Record<string, unknown>,
  ): boolean {
    // Deep comparison (excluding timestamp fields)
    const excludeFields = [
      'createdAt',
      'updatedAt',
      'created_at',
      'updated_at',
    ];

    for (const key in updated) {
      if (excludeFields.includes(key)) continue;

      if (
        JSON.stringify(existing[key]) !== JSON.stringify(updated[key])
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get all record IDs for a model
   */
  private async getModelRecordIds(kvPrefix: string): Promise<string[]> {
    const ids: string[] = [];
    const entries = this.kv.list({ prefix: [kvPrefix] });

    for await (const entry of entries) {
      const id = entry.key[1] as string;
      ids.push(id);
    }

    return ids;
  }

  /**
   * Log sync history
   */
  private async logSyncHistory(result: SyncResult): Promise<void> {
    const historyEntry = {
      timestamp: new Date().toISOString(),
      totalCreated: result.totalCreated,
      totalUpdated: result.totalUpdated,
      totalDeleted: result.totalDeleted,
      totalErrors: result.totalErrors,
      models: result.models.map((m) => ({
        name: m.model,
        created: m.created.length,
        updated: m.updated.length,
        deleted: m.deleted.length,
        errors: m.errors.length,
      })),
    };

    await this.kv.set(
      ['sync_history', 'markdown_sync', Date.now()],
      historyEntry,
    );
  }

  /**
   * Validate markdown files without syncing
   */
  async validate(
    dataDir: string,
    options: { models?: string[] } = {},
  ): Promise<ValidationResult> {
    const errors: Array<{
      model: string;
      file: string;
      errors: string[];
    }> = [];
    const modelsToValidate = options.models || Object.keys(this.config.models);

    for (const modelName of modelsToValidate) {
      const modelConfig = this.config.models[modelName];
      if (!modelConfig) continue;

      const modelPath = `${dataDir}/${modelName}`;

      try {
        await Deno.stat(modelPath);
      } catch {
        continue;
      }

      // Get parser - try model-specific first (for configured parsers), then by parser name, then default
      const parser = this.parsers.get(modelName) ||
        this.parsers.get(modelConfig.parser) ||
        this.parsers.get('default');
      if (!parser) continue;

      const validator = modelConfig.validator
        ? this.validators.get(modelConfig.validator)
        : undefined;

      for await (const entry of Deno.readDir(modelPath)) {
        if (!entry.isFile || !entry.name.endsWith('.md')) continue;

        const filePath = `${modelPath}/${entry.name}`;
        const recordId = entry.name.replace('.md', '');
        const fileErrors: string[] = [];

        try {
          const content = await Deno.readTextFile(filePath);
          const parsed = await parser.parse(content, recordId);

          if (validator) {
            const validation = validator.safeParse(parsed);
            if (!validation.success) {
              validation.error.errors.forEach((err) => {
                fileErrors.push(`${err.path.join('.')}: ${err.message}`);
              });
            }
          }
        } catch (error) {
          fileErrors.push(
            `Parse error: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }

        if (fileErrors.length > 0) {
          errors.push({
            model: modelName,
            file: entry.name,
            errors: fileErrors,
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
