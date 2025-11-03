/**
 * Admin Data Sync Routes
 * Endpoints for managing markdown-to-KV data synchronization
 */

import { Context, Hono } from 'hono';
import { fromFileUrl } from 'jsr:@std/path';
import { requireAdmin } from '../../lib/admin-auth.ts';
import { getKv } from '../../lib/kv.ts';
import { MarkdownSyncService } from '../../lib/markdown-sync/core.ts';
import { getParserRegistry } from '../../lib/markdown-sync/parsers/index.ts';
import { getValidatorRegistry } from '../../lib/markdown-sync/validators/index.ts';

const dataSyncRouter = new Hono();
const kv = await getKv();

// All routes require admin role
dataSyncRouter.use('*', requireAdmin());

// Data directory path (use fromFileUrl for cross-platform compatibility)
const DATA_DIR = fromFileUrl(new URL('../../../data', import.meta.url));

// Load sync configuration
const loadSyncConfig = async () => {
  const configPath = new URL('../../../data/sync-config.json', import.meta.url);
  const configText = await Deno.readTextFile(configPath);
  return JSON.parse(configText);
};

/**
 * GET /api/admin/data-sync/config
 * Get current sync configuration
 */
dataSyncRouter.get('/config', async (c: Context) => {
  try {
    const config = await loadSyncConfig();
    
    return c.json({
      success: true,
      data: {
        models: Object.keys(config.models || {}),
        config: config,
      },
    });
  } catch (error) {
    console.error('Failed to load sync config:', error);
    return c.json({
      success: false,
      error: 'Failed to load sync configuration',
    }, 500);
  }
});

/**
 * POST /api/admin/data-sync/validate
 * Validate markdown files without syncing
 */
dataSyncRouter.post('/validate', async (c: Context) => {
  try {
    const body = await c.req.json();
    const model = body.model; // Optional: validate specific model

    const config = await loadSyncConfig();
    const service = new MarkdownSyncService(
      kv,
      config,
      getParserRegistry(config),
      getValidatorRegistry()
    );

    const modelFilter = model ? [model] : undefined;
    const result = await service.validate(DATA_DIR, { models: modelFilter });

    // Count total files validated
    const modelsToValidate = modelFilter || Object.keys(config.models);
    let totalFiles = 0;
    for (const modelName of modelsToValidate) {
      const modelPath = `${DATA_DIR}/${modelName}`;
      try {
        for await (const entry of Deno.readDir(modelPath)) {
          if (entry.isFile && entry.name.endsWith('.md')) {
            totalFiles++;
          }
        }
      } catch {
        // Directory doesn't exist or can't be read
        continue;
      }
    }

    // Transform errors to match frontend expectations
    const formattedErrors = result.errors.map(err => ({
      file: `${err.model}/${err.file}`,
      error: err.errors.join(', '),
    }));

    return c.json({
      success: result.valid,
      data: {
        filesValidated: totalFiles,
        errors: formattedErrors,
        summary: result.valid ? 'All files are valid!' : `${result.errors.length} file(s) have errors`,
      },
    });
  } catch (error) {
    console.error('Validation failed:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    }, 500);
  }
});

/**
 * POST /api/admin/data-sync/preview
 * Preview changes without applying them (dry run)
 */
dataSyncRouter.post('/preview', async (c: Context) => {
  try {
    const body = await c.req.json();
    const model = body.model; // Optional: preview specific model

    const config = await loadSyncConfig();
    const service = new MarkdownSyncService(
      kv,
      config,
      getParserRegistry(config),
      getValidatorRegistry()
    );

    const modelFilter = model ? [model] : undefined;
    const result = await service.sync(DATA_DIR, { 
      models: modelFilter,
      dryRun: true, // Always dry run for preview
      verbose: false,
    });

    // Build detailed changes list with actual data
    const changes: Array<{ 
      file: string; 
      action: string; 
      id: string;
      data?: any;
      reason?: string;
    }> = [];

    for (const modelResult of result.models) {
      const modelConfig = config.models[modelResult.model];
      const parserRegistry = getParserRegistry(config);
      const parser = parserRegistry.get(modelConfig.parser) || 
                     parserRegistry.get('default');

      // Read and parse created files
      for (const id of modelResult.created) {
        const filePath = `${DATA_DIR}/${modelResult.model}/${id}.md`;
        try {
          const content = await Deno.readTextFile(filePath);
          const parsed = parser ? await parser.parse(content, id) : null;
          changes.push({ 
            file: `${modelResult.model}/${id}.md`, 
            action: 'create',
            id,
            data: parsed,
          });
        } catch (err) {
          changes.push({ 
            file: `${modelResult.model}/${id}.md`, 
            action: 'create',
            id,
            reason: `Error reading file: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      }

      // Read and parse updated files
      for (const id of modelResult.updated) {
        const filePath = `${DATA_DIR}/${modelResult.model}/${id}.md`;
        try {
          const content = await Deno.readTextFile(filePath);
          const parsed = parser ? await parser.parse(content, id) : null;
          changes.push({ 
            file: `${modelResult.model}/${id}.md`, 
            action: 'update',
            id,
            data: parsed,
          });
        } catch (err) {
          changes.push({ 
            file: `${modelResult.model}/${id}.md`, 
            action: 'update',
            id,
            reason: `Error reading file: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      }

      // Deleted files (no data to show)
      for (const id of modelResult.deleted) {
        changes.push({ 
          file: `${modelResult.model}/${id}.md`, 
          action: 'delete',
          id,
          reason: 'File removed from source',
        });
      }
    }

    return c.json({
      success: result.totalErrors === 0,
      data: {
        created: result.totalCreated,
        updated: result.totalUpdated,
        deleted: result.totalDeleted,
        skipped: result.totalSkipped,
        errors: result.models.flatMap(m => m.errors.map(e => ({
          file: `${m.model}/${e.file}`,
          error: e.error,
        }))),
        summary: `Preview: ${result.totalCreated} created, ${result.totalUpdated} updated, ${result.totalDeleted} deleted, ${result.totalSkipped} skipped`,
        changes,
      },
    });
  } catch (error) {
    console.error('Preview failed:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Preview failed',
    }, 500);
  }
});

/**
 * POST /api/admin/data-sync/deploy
 * Execute sync to update production database
 */
dataSyncRouter.post('/deploy', async (c: Context) => {
  try {
    const body = await c.req.json();
    const model = body.model; // Optional: deploy specific model
    const force = body.force === true; // Force sync even without changes

    const config = await loadSyncConfig();
    const service = new MarkdownSyncService(
      kv,
      config,
      getParserRegistry(config),
      getValidatorRegistry()
    );

    const modelFilter = model ? [model] : undefined;

    // First validate
    const validationResult = await service.validate(DATA_DIR, { models: modelFilter });
    if (!validationResult.valid) {
      const formattedErrors = validationResult.errors.map(err => ({
        file: `${err.model}/${err.file}`,
        error: err.errors.join(', '),
      }));
      
      return c.json({
        success: false,
        error: 'Validation failed. Fix errors before deploying.',
        data: {
          errors: formattedErrors,
          summary: `${validationResult.errors.length} file(s) have errors`,
        },
      }, 400);
    }

    // Execute sync
    const result = await service.sync(DATA_DIR, { 
      models: modelFilter,
      force,
      dryRun: false, // Actual deployment
      verbose: false,
    });

    // Log deployment to audit trail
    const userId = c.get('user')?.sub;
    const deploymentLog = {
      timestamp: new Date().toISOString(),
      userId,
      model: model || 'all',
      result: {
        created: result.totalCreated,
        updated: result.totalUpdated,
        deleted: result.totalDeleted,
        skipped: result.totalSkipped,
        errors: result.totalErrors,
      },
    };

    console.log('Deployment executed:', deploymentLog);

    // Format errors for frontend
    const formattedErrors = result.models.flatMap(m => 
      m.errors.map(e => ({
        file: `${m.model}/${e.file}`,
        error: e.error,
      }))
    );

    return c.json({
      success: result.totalErrors === 0,
      data: {
        created: result.totalCreated,
        updated: result.totalUpdated,
        deleted: result.totalDeleted,
        skipped: result.totalSkipped,
        errors: formattedErrors,
        summary: `Deployed: ${result.totalCreated} created, ${result.totalUpdated} updated, ${result.totalDeleted} deleted`,
        deploymentLog,
      },
    });
  } catch (error) {
    console.error('Deployment failed:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Deployment failed',
    }, 500);
  }
});

/**
 * GET /api/admin/data-sync/history
 * Get sync history from KV storage
 */
dataSyncRouter.get('/history', async (c: Context) => {
  try {
    const query = c.req.query();
    const limit = parseInt(query.limit || '50');

    const history: any[] = [];
    const entries = kv.list({ prefix: ['sync_history'] }, { limit, reverse: true });

    for await (const entry of entries) {
      history.push({
        key: entry.key,
        value: entry.value,
        versionstamp: entry.versionstamp,
      });
    }

    return c.json({
      success: true,
      data: {
        history,
        count: history.length,
      },
    });
  } catch (error) {
    console.error('Failed to fetch history:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch sync history',
    }, 500);
  }
});

export default dataSyncRouter;
