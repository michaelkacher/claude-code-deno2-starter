#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-net --unstable-kv

/**
 * Generic Markdown Data Sync CLI
 * 
 * Syncs markdown files to Deno KV for any data model
 * Uses convention-based configuration
 * 
 * Usage:
 *   deno task sync-data [options]
 */

import { parseArgs } from 'jsr:@std/cli@^1.0.0/parse-args';
import { MarkdownSyncService } from '../backend/lib/markdown-sync/core.ts';
import { getParserRegistry } from '../backend/lib/markdown-sync/parsers/index.ts';
import { getValidatorRegistry } from '../backend/lib/markdown-sync/validators/index.ts';

const args = parseArgs(Deno.args, {
  boolean: ['dry-run', 'force', 'verbose', 'production', 'help'],
  string: ['kv-url', 'model'],
  alias: {
    d: 'dry-run',
    f: 'force',
    v: 'verbose',
    p: 'production',
    m: 'model',
    h: 'help',
  },
});

if (args.help) {
  console.log(`
Generic Markdown Data Sync

Syncs markdown files to Deno KV database for any data model.
Uses convention: data/{model-name}/{record-id}.md → KV: [prefix, id]

Usage:
  deno task sync-data [options]

Options:
  -d, --dry-run      Preview changes without applying
  -f, --force        Overwrite existing + delete missing records
  -v, --verbose      Show detailed output
  -m, --model        Sync specific model(s) only (comma-separated)
  -p, --production   Sync to production database
      --kv-url       Explicit Deno KV URL for production
  -h, --help         Show this help message

Examples:
  # Validate and preview all models
  deno task sync-data --dry-run

  # Sync specific model to local DB
  deno task sync-data --model workout-categories

  # Sync multiple models
  deno task sync-data --model workout-categories,training-templates

  # Force sync (delete removed records)
  deno task sync-data --force

  # Sync to production
  deno task sync-data --production --kv-url="\$KV_URL"

Convention:
  Folder structure defines models:
    data/workout-categories/vertical-jump.md
    data/training-templates/beginner.md
  
  Configuration in data/sync-config.json maps:
    Folder name → KV prefix → Parser → Validator
  `);
  Deno.exit(0);
}

const DATA_DIR = './data';
const CONFIG_FILE = './data/sync-config.json';

async function main() {
  try {
    // Load configuration
    console.log(`📖 Loading configuration from ${CONFIG_FILE}...`);
    const configText = await Deno.readTextFile(CONFIG_FILE);
    const config = JSON.parse(configText);

    if (!config.models || Object.keys(config.models).length === 0) {
      console.error('❌ No models defined in sync-config.json');
      Deno.exit(1);
    }

    console.log(
      `   Found ${Object.keys(config.models).length} model(s) configured\n`,
    );

    // Connect to database
    let kv: Deno.Kv;
    if (args.production || args['kv-url']) {
      const kvUrl = args['kv-url'] || Deno.env.get('KV_URL');

      if (!kvUrl) {
        console.error(
          '❌ Production sync requires --kv-url or KV_URL env variable',
        );
        Deno.exit(1);
      }

      console.log('🔗 Connecting to production database...');
      kv = await Deno.openKv(kvUrl);
    } else {
      console.log('🔗 Connecting to local development database...');
      kv = await Deno.openKv('./data/local.db');
    }

    console.log('✅ Connected\n');

    // Initialize sync service
    const parsers = getParserRegistry(config);
    const validators = getValidatorRegistry();
    const service = new MarkdownSyncService(kv, config, parsers, validators);

    // Determine models to sync
    const modelFilter = args.model ? args.model.split(',') : undefined;

    if (modelFilter) {
      console.log(`📦 Syncing models: ${modelFilter.join(', ')}\n`);
    } else {
      console.log(`📦 Syncing all models\n`);
    }

    // Validate first
    console.log('🔍 Validating markdown files...');
    const validation = await service.validate(DATA_DIR, { models: modelFilter });

    if (!validation.valid) {
      console.error('\n❌ Validation failed:\n');
      for (const error of validation.errors) {
        console.error(`  [${error.model}] ${error.file}:`);
        for (const msg of error.errors) {
          console.error(`    • ${msg}`);
        }
      }
      console.error('\n💡 Fix validation errors before syncing\n');
      await kv.close();
      Deno.exit(1);
    }

    console.log('✅ Validation passed\n');

    // Sync
    if (args['dry-run']) {
      console.log('🔍 DRY RUN - No changes will be made\n');
    }

    const startTime = Date.now();
    const result = await service.sync(DATA_DIR, {
      dryRun: args['dry-run'],
      force: args.force,
      verbose: args.verbose,
      models: modelFilter,
    });
    const duration = Date.now() - startTime;

    // Display results
    console.log('\n📊 Sync Results:\n');

    if (result.models.length === 0) {
      console.log('  ⚠️  No models to sync (check folder structure and config)\n');
    }

    for (const modelResult of result.models) {
      console.log(`  📦 ${modelResult.model}`);

      if (modelResult.created.length > 0) {
        console.log(`     ✅ Created: ${modelResult.created.length}`);
        if (args.verbose) {
          modelResult.created.forEach((id) => console.log(`        • ${id}`));
        }
      }

      if (modelResult.updated.length > 0) {
        console.log(`     🔄 Updated: ${modelResult.updated.length}`);
        if (args.verbose) {
          modelResult.updated.forEach((id) => console.log(`        • ${id}`));
        }
      }

      if (modelResult.skipped.length > 0) {
        console.log(`     ⏭️  Skipped: ${modelResult.skipped.length}`);
        if (args.verbose) {
          modelResult.skipped.forEach((id) => console.log(`        • ${id}`));
        }
      }

      if (args.force && modelResult.deleted.length > 0) {
        console.log(`     🗑️  Deleted: ${modelResult.deleted.length}`);
        if (args.verbose) {
          modelResult.deleted.forEach((id) => console.log(`        • ${id}`));
        }
      }

      if (modelResult.errors.length > 0) {
        console.log(`     ❌ Errors: ${modelResult.errors.length}`);
        modelResult.errors.forEach((e) => {
          console.log(`        • ${e.file}: ${e.error}`);
        });
      }

      console.log('');
    }

    // Summary
    console.log('  📈 Summary:');
    console.log(
      `     • ${result.totalCreated} created, ${result.totalUpdated} updated, ${result.totalDeleted} deleted, ${result.totalSkipped} skipped`,
    );
    console.log(`     • ${result.totalErrors} errors`);
    console.log(`     • Completed in ${duration}ms\n`);

    if (args['dry-run']) {
      console.log('💡 Run without --dry-run to apply changes\n');
    } else {
      console.log('✅ Sync complete!\n');
    }

    await kv.close();
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    if (args.verbose && error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    Deno.exit(1);
  }
}

main();
