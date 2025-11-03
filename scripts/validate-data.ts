#!/usr/bin/env -S deno run --allow-read --allow-env

/**
 * Generic Markdown Data Validation CLI
 * 
 * Validates markdown files without syncing to database
 * Perfect for pre-commit hooks and CI/CD pipelines
 * 
 * Usage:
 *   deno task validate-data [options]
 */

import { parseArgs } from 'jsr:@std/cli@^1.0.0/parse-args';
import { MarkdownSyncService } from '../backend/lib/markdown-sync/core.ts';
import { getParserRegistry } from '../backend/lib/markdown-sync/parsers/index.ts';
import { getValidatorRegistry } from '../backend/lib/markdown-sync/validators/index.ts';

const args = parseArgs(Deno.args, {
  boolean: ['verbose', 'help'],
  string: ['model'],
  alias: {
    v: 'verbose',
    m: 'model',
    h: 'help',
  },
});

if (args.help) {
  console.log(`
Generic Markdown Data Validation

Validates markdown files without syncing to database.
Useful for pre-commit hooks and CI/CD validation.

Usage:
  deno task validate-data [options]

Options:
  -m, --model        Validate specific model(s) only (comma-separated)
  -v, --verbose      Show detailed output
  -h, --help         Show this help message

Examples:
  # Validate all models
  deno task validate-data

  # Validate specific model
  deno task validate-data --model workout-categories

  # Validate multiple models
  deno task validate-data --model workout-categories,training-templates

Exit Codes:
  0 - All validations passed
  1 - Validation errors found

Use in CI/CD:
  # GitHub Actions
  - run: deno task validate-data
  
  # Pre-commit hook
  deno task validate-data || exit 1
  `);
  Deno.exit(0);
}

const DATA_DIR = './data';
const CONFIG_FILE = './data/sync-config.json';

async function main() {
  try {
    // Load configuration
    const configText = await Deno.readTextFile(CONFIG_FILE);
    const config = JSON.parse(configText);

    if (!config.models || Object.keys(config.models).length === 0) {
      console.error('❌ No models defined in sync-config.json');
      Deno.exit(1);
    }

    // Create in-memory KV for validation (not used, but required by service)
    const kv = await Deno.openKv(':memory:');

    // Initialize sync service
    const parsers = getParserRegistry(config);
    const validators = getValidatorRegistry();
    const service = new MarkdownSyncService(kv, config, parsers, validators);

    // Determine models to validate
    const modelFilter = args.model ? args.model.split(',') : undefined;

    console.log('🔍 Validating markdown files...\n');

    if (modelFilter) {
      console.log(`   Models: ${modelFilter.join(', ')}\n`);
    }

    // Validate
    const result = await service.validate(DATA_DIR, { models: modelFilter });

    await kv.close();

    if (result.valid) {
      console.log('✅ All markdown files are valid!\n');
      
      if (args.verbose) {
        const modelsChecked = modelFilter || Object.keys(config.models);
        console.log(`   Models checked: ${modelsChecked.length}`);
        modelsChecked.forEach(model => console.log(`     • ${model}`));
        console.log('');
      }
      
      Deno.exit(0);
    } else {
      console.error('❌ Validation errors found:\n');

      // Group errors by model
      const errorsByModel = new Map<string, typeof result.errors>();
      for (const error of result.errors) {
        if (!errorsByModel.has(error.model)) {
          errorsByModel.set(error.model, []);
        }
        errorsByModel.get(error.model)!.push(error);
      }

      // Display errors by model
      for (const [model, errors] of errorsByModel) {
        console.error(`  📦 ${model}:`);
        for (const error of errors) {
          console.error(`     ${error.file}:`);
          for (const msg of error.errors) {
            console.error(`       • ${msg}`);
          }
          console.error('');
        }
      }

      console.error(`  Total errors: ${result.errors.length}\n`);
      console.error('💡 Fix validation errors before committing\n');

      Deno.exit(1);
    }
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
