/**
 * Parser Registry
 * 
 * Central registry of all available markdown parsers
 * Add custom parsers here to make them available to the sync engine
 */

import type { MarkdownParser } from '../core.ts';
import { DefaultMarkdownParser } from './default.ts';
import { createNestedParser, type NestedParserConfig } from './nested.ts';

/**
 * Get registry of all available parsers
 * 
 * Usage:
 * const parsers = getParserRegistry();
 * const parser = parsers.get('default');
 * 
 * For configured parsers, pass the config:
 * const parsers = getParserRegistry(config);
 */
export function getParserRegistry(config?: any): Map<string, MarkdownParser> {
  const registry = new Map<string, MarkdownParser>();

  // Default parser - handles simple frontmatter + body
  registry.set('default', new DefaultMarkdownParser());

  // Add more static custom parsers here if needed
  // registry.set('my-parser', new MyCustomParser());

  // Register configured parsers from sync-config.json
  if (config?.models) {
    for (const [modelName, modelConfig] of Object.entries(config.models)) {
      const mc = modelConfig as any;
      
      // If parser is 'nested' and has parserConfig, create configured parser
      if (mc.parser === 'nested' && mc.parserConfig) {
        const parser = createNestedParser(mc.parserConfig as NestedParserConfig);
        
        // Register with model name so core service can find it
        // Core service lookup order: modelName → parser name → 'default'
        registry.set(modelName, parser);
      }
    }
  }

  return registry;
}
